const env = require('../../../config/env');
const logger = require('../../../utils/logger');

class DevelopmentOTPProvider {
  async sendOTP(phoneNumber, otp) {
    logger.info(`[DEV OTP PROVIDER] Mobile: ${phoneNumber} | Code: ${otp}`);
    return {
      success: true,
      message: `OTP sent in development mode to ${phoneNumber}`,
      devOtp: env.DEV_OTP || otp
    };
  }
}

module.exports = DevelopmentOTPProvider;
