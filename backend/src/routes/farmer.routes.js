const express = require('express');
const FarmerProfile = require('../models/FarmerProfile');
const Token = require('../models/Token');
const Procurement = require('../models/Procurement');
const ProcurementStage = require('../models/ProcurementStage');
const ProcurementCentre = require('../models/ProcurementCentre');
const asyncWrapper = require('../utils/asyncWrapper');
const { sendSuccess } = require('../utils/responseHandler');
const { NotFoundError } = require('../utils/customErrors');
const { protect, requireRole } = require('../middleware/auth.middleware');
const { ROLES } = require('../constants/roles');
const { TOKEN_STATUS } = require('../constants/status');
const queueService = require('../services/queue/queue.service');

const router = express.Router();

router.use(protect);

/**
 * @route GET /api/v1/farmers/me
 * @desc Get authenticated farmer profile
 */
router.get('/me', requireRole(ROLES.FARMER), asyncWrapper(async (req, res) => {
  const profile = await FarmerProfile.findOne({ userId: req.user._id });
  if (!profile) {
    throw new NotFoundError('Farmer profile not found.');
  }
  return sendSuccess(res, 'Farmer profile retrieved', profile);
}));

/**
 * @route PATCH /api/v1/farmers/me
 * @desc Update farmer profile details
 */
router.patch('/me', requireRole(ROLES.FARMER), asyncWrapper(async (req, res) => {
  const profile = await FarmerProfile.findOne({ userId: req.user._id });
  if (!profile) {
    throw new NotFoundError('Farmer profile not found.');
  }

  const allowedUpdates = ['address', 'village', 'mandal', 'district', 'state', 'pincode', 'preferredLanguage', 'location'];
  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      profile[field] = req.body[field];
    }
  });

  await profile.save();
  return sendSuccess(res, 'Profile updated successfully', profile);
}));

/**
 * @route GET /api/v1/farmers/me/queue
 * @desc Dedicated API for farmer to view queue position, waiting time, smart departure time, travel time, and stage progress
 */
router.get('/me/queue', requireRole(ROLES.FARMER), asyncWrapper(async (req, res) => {
  // Find active or latest token for farmer
  const token = await Token.findOne({
    farmerId: req.user._id,
    status: { $in: [TOKEN_STATUS.WAITING, TOKEN_STATUS.CALLED, TOKEN_STATUS.ARRIVED, TOKEN_STATUS.IN_PROGRESS] }
  })
    .populate('centreId')
    .populate('cropId', 'name unit')
    .populate('bookingId');

  if (!token) {
    return sendSuccess(res, 'No active queue token found.', {
      hasActiveToken: false
    });
  }

  // Recalculate centre queue to ensure real-time accuracy
  await queueService.recalculateQueue(token.centreId._id);
  const refreshedToken = await Token.findById(token._id).populate('centreId').populate('cropId');

  // Count farmers ahead and calculate quantity ahead
  const activeTokensAhead = await Token.find({
    centreId: token.centreId._id,
    status: TOKEN_STATUS.WAITING,
    queuePosition: { $lt: refreshedToken.queuePosition }
  });

  const farmersAheadCount = activeTokensAhead.length;
  const quantityAhead = activeTokensAhead.reduce((sum, t) => sum + (t.expectedQuantity || 0), 0);

  // Check procurement and 7 stages if arrived/in-progress
  let procurement = await Procurement.findOne({ tokenId: refreshedToken._id });
  let stages = [];
  let stageProgress = { currentStageNumber: 0, totalStages: 7, completedCount: 0 };

  if (procurement) {
    stages = await ProcurementStage.find({ procurementId: procurement._id }).sort({ stageNumber: 1 });
    const completedCount = stages.filter(s => s.status === 'COMPLETED').length;
    const currentInProg = stages.find(s => s.status === 'IN_PROGRESS' || s.status === 'PENDING');
    stageProgress = {
      currentStageNumber: currentInProg ? currentInProg.stageNumber : (completedCount === 7 ? 7 : 1),
      totalStages: 7,
      completedCount,
      currentStageName: currentInProg ? currentInProg.stageName : 'Procurement Completed'
    };
  }

  const centre = refreshedToken.centreId;
  const requiredDocs = centre.requiredDocuments || [
    { name: 'Aadhaar Card', required: true },
    { name: 'Bank Passbook', required: true },
    { name: 'Land Passbook', required: true }
  ];

  return sendSuccess(res, 'Farmer queue details retrieved', {
    hasActiveToken: true,
    myToken: {
      _id: refreshedToken._id,
      tokenNumber: refreshedToken.tokenNumber,
      status: refreshedToken.status,
      expectedQuantity: refreshedToken.expectedQuantity,
      cropName: refreshedToken.cropId?.name
    },
    queuePosition: refreshedToken.queuePosition,
    farmersAhead: farmersAheadCount,
    quantityAhead,
    estimatedWaitingMinutes: refreshedToken.estimatedWaitingMinutes,
    estimatedTurnTime: refreshedToken.estimatedTurnTime,
    travelTimeMinutes: refreshedToken.travelTimeMinutes || 30,
    recommendedDepartureTime: refreshedToken.recommendedDepartureTime,
    centre: {
      _id: centre._id,
      name: centre.name,
      code: centre.code,
      address: centre.address,
      latitude: centre.latitude,
      longitude: centre.longitude,
      activeCounters: centre.activeCounters
    },
    procurementStatus: procurement ? procurement.status : 'NOT_STARTED',
    stageProgress,
    stages,
    requiredDocuments: requiredDocs
  });
}));

module.exports = router;
