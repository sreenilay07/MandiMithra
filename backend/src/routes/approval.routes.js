const express = require('express');
const approvalController = require('../controllers/approval.controller');
const { protect, authorizeRoles } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

/**
 * @route GET /api/approvals/centre-managers
 * @route GET /api/v1/approvals/centre-managers
 * @desc District Admin views pending Centre Manager registration requests in their district
 */
router.get('/centre-managers', authorizeRoles('DISTRICT_ADMIN', 'SUPER_ADMIN'), approvalController.getPendingCentreManagers);

/**
 * @route GET /api/approvals/centre-operators
 * @route GET /api/v1/approvals/centre-operators
 * @desc Centre Manager views pending Centre Operator registration requests for their centre
 */
router.get('/centre-operators', authorizeRoles('CENTER_MANAGER', 'SUPER_ADMIN'), approvalController.getPendingCentreOperators);

/**
 * @route GET /api/approvals/district-admins
 * @route GET /api/v1/approvals/district-admins
 * @desc Super Admin views pending District Admin registration requests
 */
router.get('/district-admins', authorizeRoles('SUPER_ADMIN'), approvalController.getPendingDistrictAdmins);

/**
 * @route PATCH /api/approvals/:id/approve
 * @route PATCH /api/v1/approvals/:id/approve
 * @desc Approve a pending staff registration request
 */
router.patch('/:id/approve', authorizeRoles('SUPER_ADMIN', 'DISTRICT_ADMIN', 'CENTER_MANAGER'), approvalController.approveRequest);

/**
 * @route PATCH /api/approvals/:id/reject
 * @route PATCH /api/v1/approvals/:id/reject
 * @desc Reject a pending staff registration request with reason
 */
router.patch('/:id/reject', authorizeRoles('SUPER_ADMIN', 'DISTRICT_ADMIN', 'CENTER_MANAGER'), approvalController.rejectRequest);

module.exports = router;
