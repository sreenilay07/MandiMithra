const express = require('express');
const Procurement = require('../models/Procurement');
const Booking = require('../models/Booking');
const Token = require('../models/Token');
const asyncWrapper = require('../utils/asyncWrapper');
const { sendSuccess } = require('../utils/responseHandler');
const { NotFoundError, BadRequestError, ForbiddenError } = require('../utils/customErrors');
const { protect, requireRole } = require('../middleware/auth.middleware');
const { ROLES } = require('../constants/roles');
const { PROCUREMENT_STATUS, TOKEN_STATUS } = require('../constants/status');
const qrService = require('../services/qr/qr.service');
const queueService = require('../services/queue/queue.service');
const socketHandler = require('../socket/socket.handler');

const router = express.Router();

router.use(protect);

/**
 * @route POST /api/v1/qr/generate/:bookingId
 * @desc Generate QR code payload for a booking
 */
router.post('/generate/:bookingId', asyncWrapper(async (req, res) => {
  const booking = await Booking.findById(req.params.bookingId);
  if (!booking) {
    throw new NotFoundError('Booking record not found.');
  }

  let procurement = await Procurement.findOne({ bookingId: booking._id });
  let tokenId = booking.tokenId || (procurement ? procurement.tokenId : null);

  const qrResult = qrService.generateQRPayload({
    bookingId: booking._id,
    procurementId: procurement ? procurement._id : null,
    tokenId,
    farmerId: booking.farmerId,
    centreId: booking.centreId,
    type: 'ARRIVAL'
  });

  return sendSuccess(res, 'Farmer procurement QR generated', qrResult);
}));

/**
 * @route GET /api/v1/qr/procurement/:id
 * @desc Generate cryptographic QR code payload for arrival or stage
 */
router.get('/procurement/:id', asyncWrapper(async (req, res) => {
  const { stageNumber, type } = req.query;

  const procurement = await Procurement.findById(req.params.id);
  if (!procurement) {
    throw new NotFoundError('Procurement not found.');
  }

  const qrResult = qrService.generateQRPayload({
    procurementId: procurement._id,
    bookingId: procurement.bookingId,
    tokenId: procurement.tokenId,
    farmerId: procurement.farmerId,
    centreId: procurement.centreId,
    stageNumber: stageNumber ? parseInt(stageNumber, 10) : 0,
    type: type || 'ARRIVAL'
  });

  return sendSuccess(res, 'QR code string generated', qrResult);
}));

/**
 * @route POST /api/v1/qr/scan
 * @desc Operator scans farmer QR, validates centre & token, marks farmer ARRIVED, updates queue live
 */
router.post('/scan', requireRole(ROLES.CENTER_OPERATOR, ROLES.CENTER_MANAGER, ROLES.SUPER_ADMIN), asyncWrapper(async (req, res) => {
  const { qrData, tokenString } = req.body;
  const rawQr = qrData || tokenString;

  if (!rawQr) {
    throw new BadRequestError('QR code data or token string is required.');
  }

  const payload = qrService.verifyQRData(rawQr);

  // Resolve procurement/booking by IDs present in payload or referenceId
  let procurement = null;
  let booking = null;

  if (payload.pId) {
    procurement = await Procurement.findById(payload.pId);
  }

  if (!procurement && payload.bId) {
    procurement = await Procurement.findOne({ bookingId: payload.bId });
    if (!procurement) {
      booking = await Booking.findById(payload.bId);
    }
  }

  if (!procurement && payload.tId) {
    procurement = await Procurement.findOne({ tokenId: payload.tId });
  }

  if (!procurement && payload.referenceId) {
    // Search by Token tokenNumber or bookingId or procurementId
    const token = await Token.findOne({ tokenNumber: payload.referenceId.toUpperCase() });
    if (token) {
      procurement = await Procurement.findOne({ tokenId: token._id });
    }
    if (!procurement) {
      procurement = await Procurement.findOne({ bookingId: payload.referenceId });
    }
    if (!procurement && payload.referenceId.match(/^[0-9a-fA-F]{24}$/)) {
      procurement = await Procurement.findById(payload.referenceId);
    }
  }

  if (!procurement) {
    throw new NotFoundError('No matching procurement or booking found for scanned QR token.');
  }

  booking = await Booking.findById(procurement.bookingId);

  // Validate Operator Centre authorization (Must belong to same centre unless SUPER_ADMIN)
  if (req.user.role !== ROLES.SUPER_ADMIN && req.user.centreId?.toString() !== procurement.centreId.toString()) {
    throw new ForbiddenError('Operator does not belong to the procurement centre matching this token.');
  }

  const isAlreadyArrived = procurement.status === PROCUREMENT_STATUS.ARRIVED || procurement.status === PROCUREMENT_STATUS.IN_PROGRESS;

  if (procurement.status === PROCUREMENT_STATUS.COMPLETED) {
    throw new BadRequestError('This procurement has already been completed.');
  }

  if (procurement.status === PROCUREMENT_STATUS.CANCELLED) {
    throw new BadRequestError('This booking/procurement has been cancelled.');
  }

  if (!isAlreadyArrived) {
    procurement.status = PROCUREMENT_STATUS.ARRIVED;
    procurement.arrivalTime = new Date();
    await procurement.save();

    const token = await Token.findById(procurement.tokenId);
    if (token) {
      token.status = TOKEN_STATUS.ARRIVED;
      await token.save();
    }
  }

  // Recalculate centre queue
  await queueService.recalculateQueue(procurement.centreId);

  // Emit Real-time Socket.IO events to rooms: centre:{centreId}, farmer:{farmerId}, booking:{bookingId}
  const eventData = {
    procurementId: procurement._id,
    bookingId: procurement.bookingId,
    farmerId: procurement.farmerId,
    centreId: procurement.centreId,
    status: procurement.status,
    arrivalTime: procurement.arrivalTime,
    isAlreadyArrived,
    timestamp: new Date()
  };

  socketHandler.emitCentreEvent(procurement.centreId, 'farmer.arrival.verified', eventData);
  socketHandler.emitCentreEvent(procurement.centreId, 'queue.updated', { centreId: procurement.centreId });
  socketHandler.emitFarmerEvent(procurement.farmerId, 'qr.verified', eventData);
  socketHandler.emitFarmerEvent(procurement.farmerId, 'farmer.status.updated', eventData);

  const populated = await Procurement.findById(procurement._id)
    .populate('farmerId', 'fullName phoneNumber')
    .populate('cropId', 'name unit')
    .populate('centreId', 'name code')
    .populate('tokenId', 'tokenNumber queuePosition status');

  return sendSuccess(res, isAlreadyArrived ? 'Farmer already marked arrived' : '✓ Farmer arrival verified successfully!', {
    procurement: populated,
    booking,
    isAlreadyArrived
  });
}));

module.exports = router;
