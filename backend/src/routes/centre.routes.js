const express = require('express');
const ProcurementCentre = require('../models/ProcurementCentre');
const CentreCapacity = require('../models/CentreCapacity');
const asyncWrapper = require('../utils/asyncWrapper');
const { sendSuccess } = require('../utils/responseHandler');
const { NotFoundError, BadRequestError } = require('../utils/customErrors');
const { protect, requireRole } = require('../middleware/auth.middleware');
const { ROLES } = require('../constants/roles');
const queueService = require('../services/queue/queue.service');

const router = express.Router();

/**
 * @route GET /api/v1/centres/list
 * @desc Get all procurement centres with optional filters (Public)
 */
router.get('/list', asyncWrapper(async (req, res) => {
  const { districtId, status, cropId } = req.query;
  const filter = {};
  if (districtId) filter.districtId = districtId;
  if (status) filter.status = status;
  if (cropId) filter.supportedCrops = cropId;

  const centres = await ProcurementCentre.find(filter)
    .populate('districtId', 'name code state')
    .populate('supportedCrops', 'name code unit')
    .sort({ name: 1 });

  return sendSuccess(res, 'Procurement centres retrieved', centres);
}));

router.use(protect);

/**
 * @route GET /api/v1/centres
 * @desc Get all procurement centres with optional filters
 */
router.get('/', asyncWrapper(async (req, res) => {
  const { districtId, status, cropId } = req.query;
  let filterDistrictId = districtId;
  if (req.user.role === ROLES.DISTRICT_OFFICER || req.user.role === ROLES.DISTRICT_ADMIN) {
    filterDistrictId = req.user.districtId;
  }

  const filter = {};
  if (filterDistrictId) filter.districtId = filterDistrictId;
  if (status) filter.status = status;
  if (cropId) filter.supportedCrops = cropId;

  const centres = await ProcurementCentre.find(filter)
    .populate('districtId', 'name code state')
    .populate('supportedCrops', 'name code unit')
    .sort({ name: 1 });

  return sendSuccess(res, 'Procurement centres retrieved', centres);
}));

/**
 * @route GET /api/v1/centres/:id
 * @desc Get procurement centre details
 */
router.get('/:id', asyncWrapper(async (req, res) => {
  const centre = await ProcurementCentre.findById(req.params.id)
    .populate('districtId')
    .populate('supportedCrops');

  if (!centre) {
    throw new NotFoundError('Procurement centre not found.');
  }

  const capacities = await CentreCapacity.find({ centreId: centre._id }).populate('cropId', 'name code');

  return sendSuccess(res, 'Centre details retrieved', { centre, capacities });
}));

/**
 * @route POST /api/v1/centres
 * @desc Create new procurement centre (Super Admin / District Officer)
 */
router.post('/', requireRole(ROLES.SUPER_ADMIN, ROLES.DISTRICT_OFFICER), asyncWrapper(async (req, res) => {
  const { name, code, address, village, latitude, longitude, contactNumber, workingHours, defaultCapacity, totalCounters, supportedCrops } = req.body;
  let { districtId } = req.body;

  if (req.user.role === ROLES.DISTRICT_OFFICER || req.user.role === ROLES.DISTRICT_ADMIN) {
    districtId = req.user.districtId;
  }

  if (!districtId) {
    throw new BadRequestError('District ID is required.');
  }

  const existing = await ProcurementCentre.findOne({ code });
  if (existing) {
    throw new BadRequestError('Procurement centre with this code already exists.');
  }

  const centre = new ProcurementCentre({
    name,
    code,
    districtId,
    address,
    village,
    latitude,
    longitude,
    contactNumber,
    workingHours: workingHours || { openingTime: '08:00', closingTime: '18:00' },
    defaultCapacity: defaultCapacity || 2000,
    totalCounters: totalCounters || 2,
    activeCounters: 1,
    supportedCrops: supportedCrops || []
  });

  await centre.save();
  return sendSuccess(res, 'Procurement centre created successfully', centre, 201);
}));

/**
 * @route PATCH /api/v1/centres/:id
 * @desc Update centre details / capacity (Centre Manager / Super Admin)
 */
router.patch('/:id', requireRole(ROLES.CENTRE_MANAGER, ROLES.SUPER_ADMIN, ROLES.DISTRICT_OFFICER), asyncWrapper(async (req, res) => {
  const centre = await ProcurementCentre.findById(req.params.id);
  if (!centre) {
    throw new NotFoundError('Procurement centre not found.');
  }

  const allowedUpdates = ['name', 'address', 'workingHours', 'defaultCapacity', 'activeCounters', 'totalCounters', 'status', 'absencePolicy'];
  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      centre[field] = req.body[field];
    }
  });

  await centre.save();

  // Recalculate queue if capacity or counters changed
  await queueService.recalculateQueue(centre._id);

  return sendSuccess(res, 'Procurement centre updated successfully', centre);
}));

module.exports = router;
