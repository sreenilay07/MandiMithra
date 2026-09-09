const express = require('express');
const User = require('../models/User');
const asyncWrapper = require('../utils/asyncWrapper');
const { sendSuccess } = require('../utils/responseHandler');
const { BadRequestError, NotFoundError } = require('../utils/customErrors');
const { protect, requireRole } = require('../middleware/auth.middleware');
const { ROLES } = require('../constants/roles');

const router = express.Router();

router.use(protect);

/**
 * @route GET /api/v1/users
 * @desc Get all users (Super Admin only)
 */
router.get('/', requireRole(ROLES.SUPER_ADMIN), asyncWrapper(async (req, res) => {
  const { role, districtId, centreId, status } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (districtId) filter.districtId = districtId;
  if (centreId) filter.centreId = centreId;
  if (status) filter.status = status;

  const users = await User.find(filter)
    .populate('districtId', 'name code')
    .populate('centreId', 'name code')
    .sort({ createdAt: -1 });

  return sendSuccess(res, 'Users fetched successfully', users);
}));

/**
 * @route POST /api/v1/users
 * @desc Create staff/administrative user (Super Admin only)
 */
router.post('/', requireRole(ROLES.SUPER_ADMIN), asyncWrapper(async (req, res) => {
  const { fullName, phoneNumber, email, role, districtId, centreId, language } = req.body;

  let existing = await User.findOne({ phoneNumber });
  if (existing) {
    throw new BadRequestError('User with this phone number already exists.');
  }

  const user = new User({
    fullName,
    phoneNumber,
    email,
    role,
    districtId: districtId || null,
    centreId: centreId || null,
    language: language || 'en',
    isPhoneVerified: true
  });

  await user.save();
  return sendSuccess(res, 'Staff user created successfully', user, 201);
}));

/**
 * @route PATCH /api/v1/users/:id
 * @desc Update user details / role / status (Super Admin only)
 */
router.patch('/:id', requireRole(ROLES.SUPER_ADMIN), asyncWrapper(async (req, res) => {
  const { fullName, email, role, status, districtId, centreId, language } = req.body;

  const user = await User.findById(req.params.id);
  if (!user) {
    throw new NotFoundError('User not found.');
  }

  if (fullName !== undefined) user.fullName = fullName;
  if (email !== undefined) user.email = email;
  if (role !== undefined) user.role = role;
  if (status !== undefined) user.status = status;
  if (districtId !== undefined) user.districtId = districtId;
  if (centreId !== undefined) user.centreId = centreId;
  if (language !== undefined) user.language = language;

  await user.save();
  return sendSuccess(res, 'User updated successfully', user);
}));

module.exports = router;
