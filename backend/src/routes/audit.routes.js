const express = require('express');
const AuditLog = require('../models/AuditLog');
const asyncWrapper = require('../utils/asyncWrapper');
const { sendSuccess } = require('../utils/responseHandler');
const { protect, requireRole } = require('../middleware/auth.middleware');
const { ROLES } = require('../constants/roles');

const router = express.Router();

router.use(protect);

/**
 * @route GET /api/v1/audit-logs
 * @desc Get immutable audit logs (Super Admin & District Officer)
 */
router.get('/', requireRole(ROLES.SUPER_ADMIN, ROLES.DISTRICT_OFFICER), asyncWrapper(async (req, res) => {
  const { action, entity, userId, limit = 100 } = req.query;
  const filter = {};
  if (action) filter.action = action;
  if (entity) filter.entity = entity;
  if (userId) filter.userId = userId;

  const logs = await AuditLog.find(filter)
    .populate('userId', 'fullName phoneNumber role')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit, 10));

  return sendSuccess(res, 'Audit logs retrieved', logs);
}));

module.exports = router;
