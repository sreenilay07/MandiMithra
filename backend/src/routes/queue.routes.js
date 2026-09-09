const express = require('express');
const Token = require('../models/Token');
const ProcurementCentre = require('../models/ProcurementCentre');
const asyncWrapper = require('../utils/asyncWrapper');
const { sendSuccess } = require('../utils/responseHandler');
const { NotFoundError } = require('../utils/customErrors');
const { protect } = require('../middleware/auth.middleware');
const queueService = require('../services/queue/queue.service');
const { TOKEN_STATUS } = require('../constants/status');

const router = express.Router();

router.use(protect);

/**
 * @route GET /api/v1/queue/:centreId
 * @desc Get centre queue status
 */
router.get('/:centreId', asyncWrapper(async (req, res) => {
  const { centreId } = req.params;

  const centre = await ProcurementCentre.findById(centreId);
  if (!centre) {
    throw new NotFoundError('Procurement centre not found.');
  }

  // Recalculate queue metrics
  const capacityInfo = await queueService.getCentreEffectiveCapacity(centreId);
  await queueService.recalculateQueue(centreId);

  const activeTokens = await Token.find({
    centreId,
    status: { $in: [TOKEN_STATUS.WAITING, TOKEN_STATUS.CALLED, TOKEN_STATUS.ARRIVED, TOKEN_STATUS.IN_PROGRESS] }
  })
    .populate('cropId', 'name unit')
    .populate('farmerId', 'fullName phoneNumber')
    .sort({ queuePosition: 1, createdAt: 1 });

  const formattedQueue = activeTokens.map(token => {
    const isOwner = req.user._id.toString() === token.farmerId._id.toString();
    const isStaff = ['SUPER_ADMIN', 'DISTRICT_OFFICER', 'CENTRE_MANAGER', 'PROCUREMENT_OFFICER'].includes(req.user.role);

    return {
      tokenId: token._id,
      tokenNumber: token.tokenNumber,
      farmerName: (isOwner || isStaff) ? token.farmerId.fullName : `Farmer ${token.tokenNumber.slice(-3)}`,
      crop: token.cropId?.name,
      expectedQuantity: token.expectedQuantity,
      position: token.queuePosition,
      status: token.status,
      estimatedWaitingMinutes: token.estimatedWaitingMinutes,
      estimatedTurnTime: token.estimatedTurnTime,
      recommendedDepartureTime: token.recommendedDepartureTime
    };
  });

  return sendSuccess(res, 'Centre queue retrieved', {
    centre: {
      _id: centre._id,
      name: centre.name,
      code: centre.code,
      activeCounters: capacityInfo.activeCounters,
      capacityPerHour: capacityInfo.capacityPerHour,
      effectiveCapacity: capacityInfo.effectiveCapacity
    },
    activeCount: activeTokens.length,
    queue: formattedQueue
  });
}));

/**
 * @route POST /api/v1/queue/recalculate/:centreId
 * @desc Manually trigger queue recalculation for a centre
 */
router.post('/recalculate/:centreId', asyncWrapper(async (req, res) => {
  const { centreId } = req.params;
  const result = await queueService.recalculateQueue(centreId);
  return sendSuccess(res, 'Queue recalculated successfully', result);
}));

module.exports = router;
