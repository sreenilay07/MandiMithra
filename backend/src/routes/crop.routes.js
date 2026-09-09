const express = require('express');
const Crop = require('../models/Crop');
const asyncWrapper = require('../utils/asyncWrapper');
const { sendSuccess } = require('../utils/responseHandler');
const { NotFoundError, BadRequestError } = require('../utils/customErrors');
const { protect, requireRole } = require('../middleware/auth.middleware');
const { ROLES } = require('../constants/roles');

const router = express.Router();

router.use(protect);

/**
 * @route GET /api/v1/crops
 * @desc List all available crops
 */
router.get('/', asyncWrapper(async (req, res) => {
  const crops = await Crop.find({ status: 'ACTIVE' }).sort({ name: 1 });
  return sendSuccess(res, 'Crops retrieved', crops);
}));

/**
 * @route POST /api/v1/crops
 * @desc Create a crop (Super Admin)
 */
router.post('/', requireRole(ROLES.SUPER_ADMIN), asyncWrapper(async (req, res) => {
  const { name, code, localNames, unit, defaultProcessingCapacity, requiredDocuments } = req.body;

  const existing = await Crop.findOne({ code });
  if (existing) {
    throw new BadRequestError('Crop with this code already exists.');
  }

  const crop = new Crop({
    name,
    code,
    localNames: localNames || { en: name, te: name, hi: name },
    unit: unit || 'KG',
    defaultProcessingCapacity: defaultProcessingCapacity || 2000,
    requiredDocuments: requiredDocuments || ['Aadhaar', 'Bank Passbook', 'Land Passbook']
  });

  await crop.save();
  return sendSuccess(res, 'Crop created successfully', crop, 201);
}));

/**
 * @route PATCH /api/v1/crops/:id
 * @desc Update crop definition (Super Admin)
 */
router.patch('/:id', requireRole(ROLES.SUPER_ADMIN), asyncWrapper(async (req, res) => {
  const crop = await Crop.findById(req.params.id);
  if (!crop) {
    throw new NotFoundError('Crop not found.');
  }

  const fields = ['name', 'localNames', 'unit', 'defaultProcessingCapacity', 'requiredDocuments', 'status'];
  fields.forEach(f => {
    if (req.body[f] !== undefined) crop[f] = req.body[f];
  });

  await crop.save();
  return sendSuccess(res, 'Crop updated successfully', crop);
}));

module.exports = router;
