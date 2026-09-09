const rateLimit = require('express-rate-limit');

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // max 20 requests per IP for auth endpoints
  message: {
    success: false,
    message: 'Too many authentication requests from this IP, please try again later.',
    errorCode: 'TOO_MANY_REQUESTS'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300, // max 300 requests per 15 mins for general API
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    errorCode: 'TOO_MANY_REQUESTS'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  authRateLimiter,
  apiRateLimiter
};
