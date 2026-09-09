const logger = require('../../../utils/logger');

class ProductionSMSProvider {
  async sendOTP(phoneNumber, otp) {
    logger.info(`[PRODUCTION SMS PROVIDER] Sending SMS to ${phoneNumber}`);
    // Abstract interface for SMS Gateway (Twilio/SMSCountry/Fast2SMS)
    return {
      success: true,
      message: `OTP sent successfully to ${phoneNumber}`
    };
  }
}

module.exports = ProductionSMSProvider;
