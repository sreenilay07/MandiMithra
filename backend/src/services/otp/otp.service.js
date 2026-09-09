const bcrypt = require('bcryptjs');
const env = require('../../config/env');
const DevelopmentOTPProvider = require('./providers/development.provider');
const ProductionSMSProvider = require('./providers/sms.provider');
const { BadRequestError } = require('../../utils/customErrors');

class OTPService {
  constructor() {
    if (env.OTP_MODE === 'production') {
      this.provider = new ProductionSMSProvider();
    } else {
      this.provider = new DevelopmentOTPProvider();
    }
  }

  generateOTP() {
    if (env.OTP_MODE === 'development') {
      return env.DEV_OTP || '123456';
    }
    // Generate 6 digit numeric code
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendOTP(user) {
    const otp = this.generateOTP();
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(otp, salt);

    const expiresAt = new Date(Date.now() + env.OTP_EXPIRY_MINUTES * 60 * 1000);

    user.otpHash = otpHash;
    user.otpExpiresAt = expiresAt;
    user.otpAttempts = 0;
    await user.save();

    const result = await this.provider.sendOTP(user.phoneNumber, otp);
    return {
      phoneNumber: user.phoneNumber,
      expiresAt,
      mode: env.OTP_MODE,
      devOtp: env.OTP_MODE === 'development' ? otp : undefined,
      message: result.message
    };
  }

  async verifyOTP(user, enteredOtp) {
    if (!user.otpHash || !user.otpExpiresAt) {
      throw new BadRequestError('No OTP request found. Please request a new OTP.', 'NO_OTP_FOUND');
    }

    if (new Date() > new Date(user.otpExpiresAt)) {
      throw new BadRequestError('OTP has expired. Please request a new OTP.', 'OTP_EXPIRED');
    }

    if (user.otpAttempts >= 5) {
      throw new BadRequestError('Maximum OTP verification attempts exceeded. Please request a new OTP.', 'OTP_MAX_ATTEMPTS');
    }

    const isMatch = await bcrypt.compare(enteredOtp, user.otpHash);

    if (!isMatch) {
      user.otpAttempts += 1;
      await user.save();
      throw new BadRequestError('Invalid OTP code. Please try again.', 'INVALID_OTP');
    }

    // Invalidate OTP on successful verification
    user.otpHash = undefined;
    user.otpExpiresAt = undefined;
    user.otpAttempts = 0;
    user.isPhoneVerified = true;
    user.lastLoginAt = new Date();
    await user.save();

    return true;
  }
}

module.exports = new OTPService();
