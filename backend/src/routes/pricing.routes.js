const express = require('express');
const CentrePricing = require('../models/CentrePricing');
const Crop = require('../models/Crop');
const ProcurementCentre = require('../models/ProcurementCentre');
const AuditLog = require('../models/AuditLog');
const asyncWrapper = require('../utils/asyncWrapper');
const { sendSuccess } = require('../utils/responseHandler');
const { NotFoundError, BadRequestError, ForbiddenError } = require('../utils/customErrors');
const { protect, requireRole } = require('../middleware/auth.middleware');
const { ROLES } = require('../constants/roles');
const socketHandler = require('../socket/socket.handler');

const router = express.Router();

router.use(protect);

/**
 * @route GET /api/v1/pricing/centre/:centreId
 * @desc Get current active procurement prices for a centre
 */
router.get('/centre/:centreId', asyncWrapper(async (req, res) => {
  const { centreId } = req.params;
  const activePrices = await CentrePricing.find({
    centreId,
    status: 'ACTIVE'
  }).populate('cropId', 'name nameTelugu nameHindi code category mspPrice');

  return sendSuccess(res, 'Active centre procurement prices retrieved', activePrices);
}));

/**
 * @route GET /api/v1/pricing/history/:centreId
 * @desc Get pricing history for a centre
 */
router.get('/history/:centreId', requireRole(ROLES.CENTER_MANAGER, ROLES.DISTRICT_ADMIN, ROLES.SUPER_ADMIN), asyncWrapper(async (req, res) => {
  const { centreId } = req.params;
  const history = await CentrePricing.find({ centreId })
    .populate('createdBy', 'fullName role')
    .populate('updatedBy', 'fullName role')
    .sort({ createdAt: -1 });

  return sendSuccess(res, 'Pricing history retrieved', history);
}));

/**
 * @route POST /api/v1/pricing
 * @desc Configure / update procurement price (Center Manager only)
 */
router.post('/', requireRole(ROLES.CENTER_MANAGER, ROLES.SUPER_ADMIN), asyncWrapper(async (req, res) => {
  const { centreId, cropId, cropName, price, unit, effectiveFrom } = req.body;

  if (!centreId || (!cropId && !cropName) || price === undefined) {
    throw new BadRequestError('Centre ID, Crop, and price are required.');
  }

  // Ensure Centre Manager can only edit their assigned centre
  if (req.user.role === ROLES.CENTER_MANAGER && req.user.centreId?.toString() !== centreId.toString()) {
    throw new ForbiddenError('You can only manage pricing for your assigned procurement centre.');
  }

  let targetCropName = cropName;
  if (cropId && !targetCropName) {
    const crop = await Crop.findById(cropId);
    if (crop) targetCropName = crop.name;
  }

  // Deactivate existing active prices for this centre + crop to avoid overlapping active prices
  await CentrePricing.updateMany(
    { centreId, cropId, status: 'ACTIVE' },
    { $set: { status: 'INACTIVE', effectiveTo: new Date(), updatedBy: req.user._id } }
  );

  const newPrice = new CentrePricing({
    centreId,
    cropId,
    cropName: targetCropName || 'Crop',
    price: Number(price),
    unit: unit || 'Per Quintal',
    effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : new Date(),
    status: 'ACTIVE',
    createdBy: req.user._id
  });

  await newPrice.save();

  // Audit Log
  await AuditLog.create({
    userId: req.user._id,
    action: 'PRICING_UPDATED',
    details: `Updated procurement price for ${targetCropName} to ₹${price} ${unit || 'Per Quintal'} at centre ${centreId}`,
    ipAddress: req.ip || ''
  });

  // Socket.IO Emit
  socketHandler.emitCentreEvent(centreId, 'pricing.updated', {
    centreId,
    cropId,
    cropName: targetCropName,
    price: newPrice.price,
    unit: newPrice.unit,
    effectiveFrom: newPrice.effectiveFrom,
    updatedAt: newPrice.updatedAt
  });

  return sendSuccess(res, 'Procurement price configured successfully', newPrice);
}));

/**
 * @route PATCH /api/v1/pricing/:id
 * @desc Update status or details of a pricing record
 */
router.patch('/:id', requireRole(ROLES.CENTER_MANAGER, ROLES.SUPER_ADMIN), asyncWrapper(async (req, res) => {
  const { price, status, unit } = req.body;
  const pricing = await CentrePricing.findById(req.params.id);

  if (!pricing) {
    throw new NotFoundError('Pricing record not found.');
  }

  if (req.user.role === ROLES.CENTER_MANAGER && req.user.centreId?.toString() !== pricing.centreId.toString()) {
    throw new ForbiddenError('Unauthorized to modify pricing for this centre.');
  }

  if (price !== undefined) pricing.price = Number(price);
  if (unit) pricing.unit = unit;
  if (status) {
    pricing.status = status;
    if (status === 'INACTIVE') pricing.effectiveTo = new Date();
  }
  pricing.updatedBy = req.user._id;

  await pricing.save();

  // Emit event
  socketHandler.emitCentreEvent(pricing.centreId, 'pricing.updated', {
    centreId: pricing.centreId,
    cropId: pricing.cropId,
    cropName: pricing.cropName,
    price: pricing.price,
    unit: pricing.unit,
    status: pricing.status,
    updatedAt: pricing.updatedAt
  });

  return sendSuccess(res, 'Pricing updated successfully', pricing);
}));

module.exports = router;
