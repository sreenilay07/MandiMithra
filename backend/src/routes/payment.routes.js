const express = require('express');
const Payment = require('../models/Payment');
const asyncWrapper = require('../utils/asyncWrapper');
const { sendSuccess } = require('../utils/responseHandler');
const { NotFoundError } = require('../utils/customErrors');
const { protect, requireRole } = require('../middleware/auth.middleware');
const { ROLES } = require('../constants/roles');

const router = express.Router();

router.use(protect);

/**
 * @route GET /api/v1/payments/:procurementId
 * @desc Get payment details for a specific procurement
 */
router.get('/procurement/:procurementId', asyncWrapper(async (req, res) => {
  const payment = await Payment.findOne({ procurementId: req.params.procurementId })
    .populate('farmerId', 'fullName phoneNumber')
    .populate('procurementId');

  if (!payment) {
    throw new NotFoundError('Payment record not found for this procurement.');
  }

  return sendSuccess(res, 'Payment details retrieved', payment);
}));

/**
 * @route GET /api/v1/farmers/me/payments
 * @desc Get all payments for authenticated farmer
 */
router.get('/my-payments', requireRole(ROLES.FARMER), asyncWrapper(async (req, res) => {
  const payments = await Payment.find({ farmerId: req.user._id })
    .populate('procurementId')
    .sort({ createdAt: -1 });

  return sendSuccess(res, 'Farmer payment records retrieved', payments);
}));

module.exports = router;
