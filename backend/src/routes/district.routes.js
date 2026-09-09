const express = require('express');
const District = require('../models/District');
const ProcurementCentre = require('../models/ProcurementCentre');
const Token = require('../models/Token');
const Procurement = require('../models/Procurement');
const Payment = require('../models/Payment');
const asyncWrapper = require('../utils/asyncWrapper');
const { sendSuccess } = require('../utils/responseHandler');
const { NotFoundError, BadRequestError } = require('../utils/customErrors');
const { protect, requireRole } = require('../middleware/auth.middleware');
const { ROLES } = require('../constants/roles');

const router = express.Router();

/**
 * @route GET /api/v1/district/list
 * @desc Get all active districts (Public/Authenticated)
 */
router.get('/list', asyncWrapper(async (req, res) => {
  const districts = await District.find({ status: { $ne: 'INACTIVE' } }).sort({ name: 1 });
  return sendSuccess(res, 'Districts retrieved successfully', districts);
}));

router.use(protect);

/**
 * @route GET /api/v1/district/dashboard
 * @desc Get aggregated district overview (District Officer & Super Admin)
 */
router.get('/dashboard', requireRole(ROLES.DISTRICT_OFFICER, ROLES.SUPER_ADMIN), asyncWrapper(async (req, res) => {
  const districtId = req.query.districtId || req.user.districtId;

  let queryCentre = {};
  if (districtId) {
    queryCentre.districtId = districtId;
  }

  const centres = await ProcurementCentre.find(queryCentre).populate('districtId', 'name code');
  const centreIds = centres.map(c => c._id);

  const { date, status, cropId } = req.query;
  const filterProc = { centreId: { $in: centreIds } };
  if (status) filterProc.status = status;
  if (cropId) filterProc.cropId = cropId;

  if (date) {
    const d = new Date(date);
    const startOfDay = new Date(d.setHours(0, 0, 0, 0));
    const endOfDay = new Date(d.setHours(23, 59, 59, 999));
    filterProc.createdAt = { $gte: startOfDay, $lte: endOfDay };
  }

  const procurements = await Procurement.find(filterProc).populate('centreId', 'name code');

  let totalExpectedQuantity = 0;
  let totalActualQuantity = 0;
  let completedCount = 0;
  let pendingCount = 0;

  procurements.forEach(p => {
    totalExpectedQuantity += (p.expectedQuantity || 0);
    if (p.actualQuantity) totalActualQuantity += p.actualQuantity;
    if (p.status === 'COMPLETED') completedCount += 1;
    else if (p.status !== 'CANCELLED') pendingCount += 1;
  });

  // Calculate total payments processed
  const payments = await Payment.find({ procurementId: { $in: procurements.map(p => p._id) } });
  const totalPaymentAmount = payments.reduce((sum, pay) => sum + (pay.amount || 0), 0);

  // Per-centre performance metrics
  const centrePerformance = centres.map(centre => {
    const centreProcs = procurements.filter(p => p.centreId?._id?.toString() === centre._id.toString());
    const cCompleted = centreProcs.filter(p => p.status === 'COMPLETED').length;
    const cPending = centreProcs.filter(p => p.status !== 'COMPLETED' && p.status !== 'CANCELLED').length;
    const cTotalQty = centreProcs.reduce((sum, p) => sum + (p.actualQuantity || p.expectedQuantity || 0), 0);

    return {
      centreId: centre._id,
      centreName: centre.name,
      code: centre.code,
      status: centre.status,
      activeCounters: centre.activeCounters,
      farmersProcessed: cCompleted,
      pending: cPending,
      quantityProcuredKG: cTotalQty
    };
  });

  return sendSuccess(res, 'District dashboard aggregation retrieved', {
    districtSummary: {
      totalCentres: centres.length,
      activeCentres: centres.filter(c => c.status === 'ACTIVE').length,
      totalFarmersProcured: completedCount,
      pendingFarmers: pendingCount,
      totalExpectedQuantityKG: totalExpectedQuantity,
      totalActualProcuredKG: totalActualQuantity,
      totalDisbursedPaymentAmountINR: totalPaymentAmount
    },
    centrePerformance
  });
}));

module.exports = router;
