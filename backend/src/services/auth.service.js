const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const FarmerProfile = require('../models/FarmerProfile');
const ProcurementCentre = require('../models/ProcurementCentre');
const District = require('../models/District');
const ApprovalRequest = require('../models/ApprovalRequest');
const otpService = require('./otp/otp.service');
const { BadRequestError, ForbiddenError, ConflictError, NotFoundError, UnauthorizedError } = require('../utils/customErrors');
const { ROLES } = require('../constants/roles');

class AuthService {
  generateTokens(user) {
    const payload = {
      userId: user._id,
      role: user.role,
      phoneNumber: user.phoneNumber,
      centreId: user.centreId,
      districtId: user.districtId
    };

    const accessToken = jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
    const refreshToken = jwt.sign({ userId: user._id }, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN });

    return { accessToken, refreshToken };
  }

  async registerFarmer(data) {
    const {
      fullName,
      phone,
      phoneNumber = phone,
      email,
      password,
      preferredLanguage = 'en',
      state = '',
      district = '',
      districtId,
      village = '',
      mandal = '',
      pincode = '',
      farmerId: providedFarmerId,
      aadhaarLast4 = '',
      bankAccountLast4 = '',
      landPassbookReference = '',
      latitude,
      longitude
    } = data;

    if (!phoneNumber) {
      throw new BadRequestError('Phone number is required for farmer registration.');
    }

    let user = await User.findOne({ phoneNumber });
    if (user && user.status === 'APPROVED' && user.password) {
      throw new ConflictError('A registered farmer account with this phone number already exists.');
    }

    if (!user) {
      user = new User({
        fullName: fullName || 'Farmer User',
        phoneNumber,
        email: email || '',
        password: password || null,
        role: ROLES.FARMER,
        language: preferredLanguage,
        state,
        district,
        districtId: districtId || null,
        status: 'APPROVED',
        isPhoneVerified: true
      });
    } else {
      user.fullName = fullName || user.fullName;
      user.language = preferredLanguage || user.language;
      user.status = 'APPROVED';
      user.isPhoneVerified = true;
      if (password) user.password = password;
    }

    await user.save();

    const farmerId = providedFarmerId || `FARM-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    let profile = await FarmerProfile.findOne({ userId: user._id });
    if (!profile) {
      profile = new FarmerProfile({
        userId: user._id,
        farmerId,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        village,
        mandal,
        district,
        state,
        pincode,
        aadhaarLast4: aadhaarLast4 ? `XXXX-XXXX-${aadhaarLast4.slice(-4)}` : 'XXXX-XXXX-0000',
        bankAccountLast4: bankAccountLast4 ? `XXXXXX${bankAccountLast4.slice(-4)}` : 'XXXXXX0000',
        landPassbookReference,
        preferredLanguage,
        location: {
          latitude: latitude || 17.385043,
          longitude: longitude || 78.486671
        }
      });
      await profile.save();
    }

    const otpResult = await otpService.sendOTP(user);
    const tokens = this.generateTokens(user);

    return {
      user: {
        _id: user._id,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        role: user.role,
        status: user.status,
        language: user.language,
        farmerProfile: profile
      },
      otpInfo: otpResult,
      tokens
    };
  }

  async registerStaff(data) {
    const {
      fullName,
      phone,
      phoneNumber = phone,
      email,
      password,
      requestedRole,
      state = '',
      district = '',
      districtId: providedDistrictId,
      centreId: providedCentreId,
      employeeId = '',
      preferredLanguage = 'en'
    } = data;

    if (!phoneNumber) {
      throw new BadRequestError('Phone number is required.');
    }
    if (!password) {
      throw new BadRequestError('Password is required for staff registration.');
    }
    if (!requestedRole) {
      throw new BadRequestError('Requested role is required.');
    }

    const normalizedRole = requestedRole.toUpperCase();

    // PUBLIC SIGNUP FOR SUPER_ADMIN IS STRICTLY FORBIDDEN
    if (normalizedRole === 'SUPER_ADMIN') {
      throw new BadRequestError('Super Admin accounts cannot be created via public registration.', 'SUPER_ADMIN_SIGNUP_FORBIDDEN');
    }

    if (!['CENTER_OPERATOR', 'CENTER_MANAGER', 'DISTRICT_ADMIN', 'PROCUREMENT_OFFICER', 'DISTRICT_OFFICER'].includes(normalizedRole)) {
      throw new BadRequestError(`Invalid staff role: ${requestedRole}. Allowed roles: CENTER_OPERATOR, CENTER_MANAGER, DISTRICT_ADMIN.`);
    }

    let districtId = providedDistrictId || null;
    let centreId = providedCentreId || null;

    // VALIDATION RULES BY ROLE
    if (['CENTER_OPERATOR', 'PROCUREMENT_OFFICER', 'CENTER_MANAGER'].includes(normalizedRole)) {
      if (!centreId) {
        throw new BadRequestError(`centreId is mandatory for ${normalizedRole} registration.`);
      }
      const centre = await ProcurementCentre.findById(centreId);
      if (!centre) {
        throw new NotFoundError('Specified procurement centre does not exist.');
      }

      if (districtId && centre.districtId && centre.districtId.toString() !== districtId.toString()) {
        throw new BadRequestError('Specified procurement centre does not belong to the selected district.');
      }
      districtId = centre.districtId;
    }

    if (['DISTRICT_ADMIN', 'DISTRICT_OFFICER'].includes(normalizedRole)) {
      if (centreId) {
        throw new BadRequestError('District Administrator registration must not include a centreId.', 'INVALID_DISTRICT_ADMIN_REGISTRATION');
      }
      if (!districtId && district) {
        const distObj = await District.findOne({ name: new RegExp(district, 'i') });
        if (distObj) districtId = distObj._id;
      }
      if (!districtId) {
        throw new BadRequestError('districtId or valid district name is mandatory for District Admin registration.');
      }
    }

    // Check if phone or email already registered
    const existingUser = await User.findOne({ phoneNumber });
    if (existingUser) {
      throw new ConflictError('An account with this phone number already exists.');
    }

    const mappedRole = (normalizedRole === 'PROCUREMENT_OFFICER') ? 'CENTER_OPERATOR' :
                       (normalizedRole === 'DISTRICT_OFFICER') ? 'DISTRICT_ADMIN' : normalizedRole;

    const user = new User({
      fullName,
      phoneNumber,
      email: email || '',
      password,
      role: mappedRole,
      language: preferredLanguage,
      state,
      district,
      districtId,
      centreId,
      employeeId,
      status: 'PENDING',
      isPhoneVerified: false
    });

    await user.save();

    // Create ApprovalRequest record
    const approvalRequest = new ApprovalRequest({
      userId: user._id,
      requestedRole: mappedRole,
      requestedBy: user._id,
      districtId,
      centreId,
      status: 'PENDING'
    });
    await approvalRequest.save();

    const tokens = this.generateTokens(user);

    return {
      message: 'Your registration request has been submitted and is pending administrative approval.',
      userId: user._id,
      user: {
        _id: user._id,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        email: user.email,
        role: user.role,
        status: user.status,
        language: user.language,
        districtId: user.districtId,
        centreId: user.centreId,
      },
      tokens,
      status: 'PENDING',
      requestedRole: mappedRole,
      approvalRequestId: approvalRequest._id
    };
  }

  async login(credentials) {
    const { phone, phoneNumber = phone, email, password, otp } = credentials;

    const query = {};
    if (phoneNumber) query.phoneNumber = phoneNumber;
    else if (email) query.email = email.toLowerCase();
    else throw new BadRequestError('Please provide phone number or email for login.');

    const user = await User.findOne(query).select('+password +otpHash +otpExpiresAt');
    if (!user) {
      throw new BadRequestError('No account found matching provided credentials.', 'USER_NOT_FOUND');
    }

    // Check Password or OTP
    if (password) {
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        throw new UnauthorizedError('Invalid login credentials.');
      }
    } else if (otp) {
      await otpService.verifyOTP(user, otp);
    } else {
      throw new BadRequestError('Password or OTP code is required for login.');
    }

    // CHECK ACCOUNT STATUS
    if (user.status === 'PENDING') {
      throw new ForbiddenError('Your staff registration request is pending approval.', 'ACCOUNT_PENDING_APPROVAL');
    }
    if (user.status === 'REJECTED') {
      throw new ForbiddenError('Your staff registration request has been rejected.', 'ACCOUNT_REJECTED');
    }
    if (user.status === 'SUSPENDED') {
      throw new ForbiddenError('Your account has been suspended.', 'ACCOUNT_SUSPENDED');
    }

    user.lastLoginAt = new Date();
    await user.save();

    const tokens = this.generateTokens(user);
    const profile = user.role === ROLES.FARMER ? await FarmerProfile.findOne({ userId: user._id }) : null;

    return {
      user: {
        _id: user._id,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        email: user.email,
        role: user.role,
        status: user.status,
        language: user.language,
        districtId: user.districtId,
        centreId: user.centreId,
        farmerProfile: profile
      },
      tokens
    };
  }
}

module.exports = new AuthService();
