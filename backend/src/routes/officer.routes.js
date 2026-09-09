const express = require('express');
const User = require('../models/User');
const OfficerAssignment = require('../models/OfficerAssignment');
const Token = require('../models/Token');
const Procurement = require('../models/Procurement');
const Counter = require('../models/Counter');
const asyncWrapper = require('../utils/asyncWrapper');
const { sendSuccess } = require('../utils/responseHandler');
const { NotFoundError, BadRequestError } = require('../utils/customErrors');
const { protect, requireRole } = require('../middleware/auth.middleware');
const { ROLES } = require('../constants/roles');

const router = express.Router();

/**
 * @route GET /api/v1/centres/:id/officers
 * @desc Get all officers assigned to a procurement centre
 */
router.get('/centres/:id/officers', protect, requireRole(ROLES.CENTRE_MANAGER, ROLES.SUPER_ADMIN, ROLES.DISTRICT_OFFICER), asyncWrapper(async (req, res) => {
  const assignments = await OfficerAssignment.find({ centreId: req.params.id, status: 'ACTIVE' })
    .populate('officerId', 'fullName phoneNumber email role status')
    .populate('counterId', 'counterNumber status');

  return sendSuccess(res, 'Assigned officers retrieved', assignments);
}));

/**
 * @route POST /api/v1/centres/:id/officers/assign
 * @desc Assign procurement officer to centre & counter
 */
router.post('/centres/:id/officers/assign', protect, requireRole(ROLES.CENTRE_MANAGER, ROLES.SUPER_ADMIN), asyncWrapper(async (req, res) => {
  const { officerId, counterId } = req.body;
  const centreId = req.params.id;

  const officer = await User.findById(officerId);
  if (!officer || (officer.role !== ROLES.PROCUREMENT_OFFICER && officer.role !== 'CENTER_OPERATOR')) {
    throw new BadRequestError('User is not a valid Procurement Officer.');
  }

  // Deactivate previous active assignments for officer
  await OfficerAssignment.updateMany(
    { officerId, status: 'ACTIVE' },
    { status: 'INACTIVE' }
  );

  const assignment = new OfficerAssignment({
    officerId,
    centreId,
    counterId: counterId || null,
    assignedBy: req.user._id,
    status: 'ACTIVE'
  });

  await assignment.save();

  // Update User record's centreId reference
  officer.centreId = centreId;
  await officer.save();

  if (counterId) {
    await Counter.findByIdAndUpdate(counterId, { assignedOfficerId: officerId });
  }

  return sendSuccess(res, 'Officer assigned to centre successfully', assignment, 201);
}));

/**
 * @route GET /api/v1/officers/me/dashboard
 * @desc Procurement Officer's daily dashboard API
 */
router.get('/me/dashboard', protect, requireRole(ROLES.PROCUREMENT_OFFICER, 'CENTER_OPERATOR'), asyncWrapper(async (req, res) => {
  const centreId = req.user.centreId;
  if (!centreId) {
    throw new BadRequestError('Officer is not currently assigned to any procurement centre.');
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const todayTokens = await Token.find({
    centreId,
    createdAt: { $gte: startOfDay, $lte: endOfDay }
  })
    .populate('farmerId', 'fullName phoneNumber')
    .populate('cropId', 'name unit')
    .sort({ queuePosition: 1 });

  const counter = await Counter.findOne({ assignedOfficerId: req.user._id, centreId });

  const stats = {
    totalFarmersToday: todayTokens.length,
    waiting: todayTokens.filter(t => t.status === 'WAITING').length,
    arrived: todayTokens.filter(t => t.status === 'ARRIVED').length,
    inProgress: todayTokens.filter(t => t.status === 'IN_PROGRESS').length,
    completed: todayTokens.filter(t => t.status === 'COMPLETED').length
  };

  return sendSuccess(res, 'Officer dashboard data retrieved', {
    assignedCentreId: centreId,
    assignedCounter: counter ? {
      counterId: counter._id,
      counterNumber: counter.counterNumber,
      status: counter.status
    } : null,
    stats,
    todayQueue: todayTokens
  });
}));

module.exports = router;
