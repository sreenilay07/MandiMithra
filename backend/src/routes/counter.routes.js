const express = require('express');
const Counter = require('../models/Counter');
const ProcurementCentre = require('../models/ProcurementCentre');
const asyncWrapper = require('../utils/asyncWrapper');
const { sendSuccess } = require('../utils/responseHandler');
const { NotFoundError, BadRequestError } = require('../utils/customErrors');
const { protect, requireRole } = require('../middleware/auth.middleware');
const { ROLES } = require('../constants/roles');
const { COUNTER_STATUS } = require('../constants/status');
const queueService = require('../services/queue/queue.service');
const socketHandler = require('../socket/socket.handler');

const router = express.Router();

/**
 * @route GET /api/v1/centres/:id/counters
 * @desc Get all counters for a procurement centre
 */
router.get('/centres/:id/counters', protect, asyncWrapper(async (req, res) => {
  const counters = await Counter.find({ centreId: req.params.id })
    .populate('assignedOfficerId', 'fullName phoneNumber')
    .sort({ counterNumber: 1 });

  return sendSuccess(res, 'Counters retrieved', counters);
}));

/**
 * @route POST /api/v1/centres/:id/counters
 * @desc Create new counter for a centre (Centre Manager / Admin)
 */
router.post('/centres/:id/counters', protect, requireRole(ROLES.CENTRE_MANAGER, ROLES.SUPER_ADMIN), asyncWrapper(async (req, res) => {
  const { counterNumber, capacityPerHour } = req.body;
  const centreId = req.params.id;

  const existing = await Counter.findOne({ centreId, counterNumber });
  if (existing) {
    throw new BadRequestError(`Counter number ${counterNumber} already exists at this centre.`);
  }

  const counter = new Counter({
    centreId,
    counterNumber,
    capacityPerHour: capacityPerHour || 2000,
    status: COUNTER_STATUS.CLOSED
  });

  await counter.save();

  // Update total counters count in centre
  const total = await Counter.countDocuments({ centreId });
  await ProcurementCentre.findByIdAndUpdate(centreId, { totalCounters: total });

  return sendSuccess(res, 'Counter created successfully', counter, 201);
}));

/**
 * @route POST /api/v1/counters/:id/open
 * @desc Open counter & automatically recalculate queue estimates
 */
router.post('/counters/:id/open', protect, requireRole(ROLES.CENTRE_MANAGER, ROLES.SUPER_ADMIN, ROLES.PROCUREMENT_OFFICER, 'CENTER_OPERATOR'), asyncWrapper(async (req, res) => {
  const counter = await Counter.findById(req.params.id);
  if (!counter) {
    throw new NotFoundError('Counter not found.');
  }

  counter.status = COUNTER_STATUS.OPEN;
  counter.openedAt = new Date();
  await counter.save();

  // Update active counter count in procurement centre
  const openCount = await Counter.countDocuments({ centreId: counter.centreId, status: COUNTER_STATUS.OPEN });
  await ProcurementCentre.findByIdAndUpdate(counter.centreId, { activeCounters: openCount });

  // Recalculate queue
  await queueService.recalculateQueue(counter.centreId);

  socketHandler.emitCentreEvent(counter.centreId, 'counter:opened', {
    counterId: counter._id,
    counterNumber: counter.counterNumber,
    activeCounters: openCount
  });

  return sendSuccess(res, `Counter #${counter.counterNumber} opened. Queue recalculated.`, { counter, activeCounters: openCount });
}));

/**
 * @route POST /api/v1/counters/:id/close
 * @desc Close counter & automatically recalculate queue estimates
 */
router.post('/counters/:id/close', protect, requireRole(ROLES.CENTRE_MANAGER, ROLES.SUPER_ADMIN, ROLES.PROCUREMENT_OFFICER, 'CENTER_OPERATOR'), asyncWrapper(async (req, res) => {
  const counter = await Counter.findById(req.params.id);
  if (!counter) {
    throw new NotFoundError('Counter not found.');
  }

  counter.status = COUNTER_STATUS.CLOSED;
  counter.closedAt = new Date();
  await counter.save();

  const openCount = await Counter.countDocuments({ centreId: counter.centreId, status: COUNTER_STATUS.OPEN });
  await ProcurementCentre.findByIdAndUpdate(counter.centreId, { activeCounters: Math.max(1, openCount) });

  // Recalculate queue
  await queueService.recalculateQueue(counter.centreId);

  socketHandler.emitCentreEvent(counter.centreId, 'counter:closed', {
    counterId: counter._id,
    counterNumber: counter.counterNumber,
    activeCounters: Math.max(1, openCount)
  });

  return sendSuccess(res, `Counter #${counter.counterNumber} closed. Queue recalculated.`, { counter, activeCounters: openCount });
}));

module.exports = router;
