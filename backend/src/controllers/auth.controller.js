const authService = require('../services/auth.service');
const otpService = require('../services/otp/otp.service');
const User = require('../models/User');
const FarmerProfile = require('../models/FarmerProfile');
const asyncWrapper = require('../utils/asyncWrapper');
const { sendSuccess } = require('../utils/responseHandler');
const { BadRequestError } = require('../utils/customErrors');

class AuthController {
  registerFarmer = asyncWrapper(async (req, res) => {
    const result = await authService.registerFarmer(req.body);
    return sendSuccess(res, 'Farmer registered and authorized successfully.', result, 201);
  });

  registerStaff = asyncWrapper(async (req, res) => {
    const result = await authService.registerStaff(req.body);
    return sendSuccess(res, 'Staff registration request submitted successfully. Pending approval.', result, 201);
  });

  login = asyncWrapper(async (req, res) => {
    const result = await authService.login(req.body);
    return sendSuccess(res, 'Login successful.', result, 200);
  });

  sendOtp = asyncWrapper(async (req, res) => {
    const { phoneNumber } = req.body;
    const user = await User.findOne({ phoneNumber });
    if (!user) {
      throw new BadRequestError('No account found with this phone number. Please register first.', 'USER_NOT_FOUND');
    }
    const otpResult = await otpService.sendOTP(user);
    return sendSuccess(res, 'OTP sent successfully.', { phoneNumber: user.phoneNumber, otpInfo: otpResult });
  });

  verifyOtp = asyncWrapper(async (req, res) => {
    const { phoneNumber, otp } = req.body;
    const user = await User.findOne({ phoneNumber }).select('+otpHash +otpExpiresAt +otpAttempts');
    if (!user) {
      throw new BadRequestError('User not found.', 'USER_NOT_FOUND');
    }
    await otpService.verifyOTP(user, otp);
    const tokens = authService.generateTokens(user);
    const profile = await FarmerProfile.findOne({ userId: user._id });

    return sendSuccess(res, 'OTP verified successfully.', {
      user: {
        _id: user._id,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        role: user.role,
        status: user.status,
        language: user.language,
        districtId: user.districtId,
        centreId: user.centreId,
        farmerProfile: profile
      },
      tokens
    });
  });

  getMe = asyncWrapper(async (req, res) => {
    const profile = req.user.role === 'FARMER' ? await FarmerProfile.findOne({ userId: req.user._id }) : null;
    return sendSuccess(res, 'User profile retrieved', {
      user: req.user,
      farmerProfile: profile
    });
  });
}

module.exports = new AuthController();
