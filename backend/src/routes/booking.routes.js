const express = require('express');
const Booking = require('../models/Booking');
const Token = require('../models/Token');
const Procurement = require('../models/Procurement');
const ProcurementStage = require('../models/ProcurementStage');
const ProcurementCentre = require('../models/ProcurementCentre');
const Crop = require('../models/Crop');
const asyncWrapper = require('../utils/asyncWrapper');
const { sendSuccess } = require('../utils/responseHandler');
const { BadRequestError, NotFoundError } = require('../utils/customErrors');
const { protect, requireRole } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { createBookingSchema } = require('../validators/schemas');
const { ROLES } = require('../constants/roles');
const { BOOKING_STATUS, TOKEN_STATUS } = require('../constants/status');
const { PROCUREMENT_STAGES } = require('../constants/stages');
const queueService = require('../services/queue/queue.service');
const qrService = require('../services/qr/qr.service');

const router = express.Router();

router.use(protect);

/**
 * @route POST /api/v1/bookings
 * @desc Book a procurement slot & generate Token + Procurement + 7 Stages
 */
router.post('/', requireRole(ROLES.FARMER), validate(createBookingSchema), asyncWrapper(async (req, res) => {
  const { centreId, cropId, expectedQuantity, preferredDate, preferredTimeSlot } = req.body;

  const centre = await ProcurementCentre.findById(centreId);
  if (!centre || centre.status !== 'ACTIVE') {
    throw new BadRequestError('Procurement centre is not active or invalid.');
  }

  const crop = await Crop.findById(cropId);
  if (!crop || crop.status !== 'ACTIVE') {
    throw new BadRequestError('Selected crop is invalid or not active.');
  }

  // Check for existing active booking for farmer on preferred date
  const bookingDate = new Date(preferredDate);
  const startOfDay = new Date(bookingDate.setHours(0, 0, 0, 0));
  const endOfDay = new Date(bookingDate.setHours(23, 59, 59, 999));

  const existingBooking = await Booking.findOne({
    farmerId: req.user._id,
    preferredDate: { $gte: startOfDay, $lte: endOfDay },
    status: { $in: [BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED] }
  });

  if (existingBooking) {
    throw new BadRequestError('You already have an active procurement slot booked for this date.', 'DUPLICATE_BOOKING');
  }

  const dateStr = startOfDay.toISOString().slice(0, 10).replace(/-/g, '');
  const refCode = `BK-${centre.code}-${dateStr}-${Math.floor(1000 + Math.random() * 9000)}`;

  const booking = new Booking({
    farmerId: req.user._id,
    centreId,
    cropId,
    expectedQuantity,
    preferredDate: startOfDay,
    preferredTimeSlot: preferredTimeSlot || '09:00 AM - 12:00 PM',
    status: BOOKING_STATUS.CONFIRMED,
    bookingReference: refCode
  });

  await booking.save();

  // Safely determine token number sequence per centre/date
  const countToday = await Token.countDocuments({
    centreId,
    createdAt: { $gte: startOfDay, $lte: endOfDay }
  });

  const tokenSeq = String(countToday + 1).padStart(3, '0');
  const tokenNumber = `${centre.code}-${crop.code}-${dateStr}-${tokenSeq}`;

  const token = new Token({
    tokenNumber,
    bookingId: booking._id,
    farmerId: req.user._id,
    centreId,
    cropId,
    expectedQuantity,
    status: TOKEN_STATUS.WAITING,
    travelTimeMinutes: 30
  });

  await token.save();

  // Create Procurement entry
  const procurement = new Procurement({
    bookingId: booking._id,
    tokenId: token._id,
    farmerId: req.user._id,
    centreId,
    cropId,
    expectedQuantity,
    status: 'NOT_STARTED'
  });

  await procurement.save();

  // Initialize the 7 Procurement Stages
  const stageDocs = PROCUREMENT_STAGES.map(stg => ({
    procurementId: procurement._id,
    stageNumber: stg.stageNumber,
    stageName: stg.stageName,
    status: 'PENDING'
  }));

  await ProcurementStage.insertMany(stageDocs);

  // Recalculate queue for centre immediately
  await queueService.recalculateQueue(centreId);

  // Generate Arrival QR
  const qrPayload = qrService.generateQRPayload({
    procurementId: procurement._id,
    tokenId: token._id,
    farmerId: req.user._id,
    centreId,
    type: 'ARRIVAL'
  });

  return sendSuccess(res, 'Procurement slot booked successfully. Token generated.', {
    booking,
    token: {
      _id: token._id,
      tokenNumber: token.tokenNumber,
      expectedQuantity: token.expectedQuantity,
      status: token.status
    },
    arrivalQR: qrPayload.qrData
  }, 201);
}));

/**
 * @route GET /api/v1/bookings/me
 * @desc Get all bookings for authenticated farmer
 */
router.get('/me', requireRole(ROLES.FARMER), asyncWrapper(async (req, res) => {
  const bookings = await Booking.find({ farmerId: req.user._id })
    .populate('centreId', 'name code address village')
    .populate('cropId', 'name unit')
    .sort({ createdAt: -1 });

  return sendSuccess(res, 'Bookings retrieved', bookings);
}));

/**
 * @route GET /api/v1/bookings/:id
 * @desc Get specific booking details
 */
router.get('/:id', asyncWrapper(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('centreId')
    .populate('cropId')
    .populate('farmerId', 'fullName phoneNumber');

  if (!booking) {
    throw new NotFoundError('Booking not found.');
  }

  const token = await Token.findOne({ bookingId: booking._id });
  return sendSuccess(res, 'Booking retrieved', { booking, token });
}));

/**
 * @route PATCH /api/v1/bookings/:id/cancel
 * @desc Cancel a booking and update queue
 */
router.patch('/:id/cancel', asyncWrapper(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    throw new NotFoundError('Booking not found.');
  }

  if (req.user.role === ROLES.FARMER && booking.farmerId.toString() !== req.user._id.toString()) {
    throw new BadRequestError('You cannot cancel another farmer\'s booking.');
  }

  if (booking.status === BOOKING_STATUS.COMPLETED || booking.status === BOOKING_STATUS.CANCELLED) {
    throw new BadRequestError(`Cannot cancel booking with status '${booking.status}'.`);
  }

  booking.status = BOOKING_STATUS.CANCELLED;
  await booking.save();

  const token = await Token.findOne({ bookingId: booking._id });
  if (token) {
    token.status = TOKEN_STATUS.CANCELLED;
    await token.save();
  }

  const procurement = await Procurement.findOne({ bookingId: booking._id });
  if (procurement) {
    procurement.status = 'CANCELLED';
    await procurement.save();
  }

  // Recalculate queue immediately
  await queueService.recalculateQueue(booking.centreId);

  return sendSuccess(res, 'Booking cancelled successfully. Queue updated.', { booking });
}));

module.exports = router;
