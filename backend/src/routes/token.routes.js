const express = require('express');
const Token = require('../models/Token');
const asyncWrapper = require('../utils/asyncWrapper');
const { sendSuccess } = require('../utils/responseHandler');
const { NotFoundError } = require('../utils/customErrors');
const { protect, requireRole } = require('../middleware/auth.middleware');
const { ROLES } = require('../constants/roles');

const router = express.Router();

router.use(protect);

/**
 * @route GET /api/v1/tokens/:tokenId
 * @desc Get token details by ID
 */
router.get('/:tokenId', asyncWrapper(async (req, res) => {
  const token = await Token.findById(req.params.tokenId)
    .populate('centreId', 'name code address village')
    .populate('cropId', 'name unit')
    .populate('farmerId', 'fullName phoneNumber');

  if (!token) {
    throw new NotFoundError('Token not found.');
  }

  return sendSuccess(res, 'Token retrieved', token);
}));

module.exports = router;
