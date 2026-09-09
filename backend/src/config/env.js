const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/agriflow',
  JWT_SECRET: process.env.JWT_SECRET || 'agriflow_super_secret_jwt_key_2026_sih',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'agriflow_refresh_super_secret_key_2026',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  OTP_MODE: process.env.OTP_MODE || 'development',
  DEV_OTP: process.env.DEV_OTP || '123456',
  OTP_EXPIRY_MINUTES: parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10),
  OTP_RESEND_SECONDS: parseInt(process.env.OTP_RESEND_SECONDS || '60', 10),
  MAP_PROVIDER: process.env.MAP_PROVIDER || 'mock',
  GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY || '',
  DEFAULT_LANGUAGE: process.env.DEFAULT_LANGUAGE || 'en',
  QUEUE_SAFETY_BUFFER_MINUTES: parseInt(process.env.QUEUE_SAFETY_BUFFER_MINUTES || '10', 10)
};
