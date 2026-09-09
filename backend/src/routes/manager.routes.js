const express = require('express');
const Token = require('../models/Token');
const Procurement = require('../models/Procurement');
const ProcurementCentre = require('../models/ProcurementCentre');
const Counter = require('../models/Counter');
const asyncWrapper = require('../utils/asyncWrapper');
const { sendSuccess } = require('../utils/responseHandler');
const { BadRequestError } = require('../utils/customErrors');
const { protect, requireRole, authorizeCentre } = require('../middleware/auth.middleware');
const { ROLES } = require('../constants/roles');

const router = express.Router();

router.use(protect);

/**
 * @route GET /api/v1/manager/dashboard
 * @desc Get Centre Manager operational dashboard metrics
 */
router.get('/dashboard', requireRole(ROLES.CENTRE_MANAGER, ROLES.SUPER_ADMIN), asyncWrapper(async (req, res) => {
  const centreId = req.query.centreId || req.user.centreId;
  if (!centreId) {
    throw new BadRequestError('Centre ID must be specified for manager dashboard.');
  }

  const centre = await ProcurementCentre.findById(centreId);
  if (!centre) {
    throw new BadRequestError('Procurement centre not found.');
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const tokens = await Token.find({
    centreId,
    createdAt: { $gte: startOfDay }
  });

  const procurements = await Procurement.find({
    centreId,
    createdAt: { $gte: startOfDay }
  });

  const counters = await Counter.find({ centreId });
  const openCounters = counters.filter(c => c.status === 'OPEN').length;

  let totalExpectedQuantity = 0;
  let totalActualQuantity = 0;

  procurements.forEach(p => {
    totalExpectedQuantity += (p.expectedQuantity || 0);
    if (p.actualQuantity) totalActualQuantity += p.actualQuantity;
  });

  // Calculate average processing duration for completed procurements
  const completedProcurements = procurements.filter(p => p.status === 'COMPLETED' && p.arrivalTime && p.completionTime);
  let totalProcessingMinutes = 0;
  completedProcurements.forEach(p => {
    const mins = Math.round((new Date(p.completionTime) - new Date(p.arrivalTime)) / (1000 * 60));
    totalProcessingMinutes += Math.max(1, mins);
  });
  const avgProcessingTimeMinutes = completedProcurements.length > 0 ? Math.round(totalProcessingMinutes / completedProcurements.length) : 25;

  return sendSuccess(res, 'Manager dashboard metrics retrieved', {
    centre: {
      _id: centre._id,
      name: centre.name,
      code: centre.code,
      capacityPerHour: centre.defaultCapacity
    },
    metrics: {
      totalFarmersToday: tokens.length,
      waitingFarmers: tokens.filter(t => t.status === 'WAITING').length,
      arrivedFarmers: tokens.filter(t => t.status === 'ARRIVED').length,
      inProgress: tokens.filter(t => t.status === 'IN_PROGRESS').length,
      completed: tokens.filter(t => t.status === 'COMPLETED').length,
      cancelled: tokens.filter(t => t.status === 'CANCELLED').length,
      activeCounters: openCounters > 0 ? openCounters : (centre.activeCounters || 1),
      totalCounters: counters.length > 0 ? counters.length : (centre.totalCounters || 2),
      totalQuantityExpectedKG: totalExpectedQuantity,
      totalQuantityProcessedKG: totalActualQuantity,
      avgProcessingTimeMinutes
    }
  });
}));

/**
 * @route GET /api/v1/manager/analytics/:centreId
 * @desc Get centre hourly performance analytics
 */
router.get('/analytics/:centreId', requireRole(ROLES.CENTRE_MANAGER, ROLES.SUPER_ADMIN, ROLES.DISTRICT_OFFICER), authorizeCentre, asyncWrapper(async (req, res) => {
  const { centreId } = req.params;

  const procurements = await Procurement.find({ centreId }).populate('cropId', 'name unit');

  const cropBreakdown = {};
  procurements.forEach(p => {
    const cropName = p.cropId?.name || 'Paddy';
    if (!cropBreakdown[cropName]) {
      cropBreakdown[cropName] = { count: 0, totalKg: 0 };
    }
    cropBreakdown[cropName].count += 1;
    cropBreakdown[cropName].totalKg += (p.actualQuantity || p.expectedQuantity || 0);
  });

  return sendSuccess(res, 'Centre analytics retrieved', {
    centreId,
    totalProcurements: procurements.length,
    cropBreakdown
  });
}));

module.exports = router;
