const express = require('express');
const authController = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const { authRateLimiter } = require('../middleware/rateLimiter.middleware');

const router = express.Router();

/**
 * @route POST /api/auth/register/farmer
 * @desc Farmer registration (auto-APPROVED)
 */
router.post('/register/farmer', authRateLimiter, authController.registerFarmer);

/**
 * @route POST /api/auth/register (legacy alias)
 * @desc Legacy farmer registration endpoint
 */
router.post('/register', authRateLimiter, authController.registerFarmer);

/**
 * @route POST /api/auth/register/staff
 * @desc Staff registration request (PENDING, approval required)
 */
router.post('/register/staff', authRateLimiter, authController.registerStaff);

/**
 * @route POST /api/auth/login
 * @desc Login endpoint checking status, credentials, and role
 */
router.post('/login', authRateLimiter, authController.login);

/**
 * @route POST /api/auth/send-otp
 * @desc Request OTP for login / verification
 */
router.post('/send-otp', authRateLimiter, authController.sendOtp);

/**
 * @route POST /api/auth/verify-otp
 * @desc Verify OTP and return JWT access tokens
 */
router.post('/verify-otp', authRateLimiter, authController.verifyOtp);

/**
 * @route GET /api/auth/me
 * @desc Get currently authenticated user profile
 */
router.get('/me', protect, authController.getMe);

module.exports = router;
