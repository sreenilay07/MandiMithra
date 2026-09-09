const express = require('express');
const DocumentVerification = require('../models/DocumentVerification');
const Procurement = require('../models/Procurement');
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
 * Helper to mask Aadhaar number safely
 */
function maskAadhaar(num) {
  if (!num) return 'XXXX-XXXX-1234';
  const clean = num.replace(/\D/g, '');
  if (clean.length < 4) return 'XXXX-XXXX-1234';
  const last4 = clean.slice(-4);
  return `XXXX-XXXX-${last4}`;
}

/**
 * Helper to mask Bank Account number safely
 */
function maskBankAccount(num) {
  if (!num) return 'XXXX-XXXX-4521';
  const clean = num.replace(/\D/g, '');
  if (clean.length < 4) return 'XXXX-XXXX-4521';
  const last4 = clean.slice(-4);
  return `XXXX-XXXX-${last4}`;
}

/**
 * @route POST /api/v1/documents/mock-aadhaar-verify
 * @desc Deterministic Mock Aadhaar Verification for Hackathon Demo
 */
router.post('/mock-aadhaar-verify', asyncWrapper(async (req, res) => {
  const { aadhaarNumber, name } = req.body;

  if (!aadhaarNumber) {
    throw new BadRequestError('Aadhaar number or reference is required for verification.');
  }

  const clean = aadhaarNumber.replace(/\D/g, '');
  // Deterministic mock test: if number ends in 0000 or contains fail, simulate failure for demo
  const isFailedDemo = clean.endsWith('0000') || aadhaarNumber.toLowerCase().includes('fail');

  const masked = maskAadhaar(aadhaarNumber);

  if (isFailedDemo) {
    return sendSuccess(res, 'Mock Aadhaar Verification Result', {
      status: 'FAILED',
      nameMatch: false,
      maskedAadhaar: masked,
      verificationReference: `MOCK-AADHAAR-ERR-${Date.now().toString().slice(-6)}`,
      verifiedAt: new Date(),
      disclaimer: 'Demo verification — not connected to UIDAI.',
      message: '✗ Aadhaar Verification Failed (Demo)'
    });
  }

  return sendSuccess(res, 'Mock Aadhaar Verification Result', {
    status: 'VERIFIED',
    nameMatch: true,
    maskedAadhaar: masked,
    nameProvided: name || 'Verified Farmer',
    verificationReference: `MOCK-AADHAAR-REF-${Date.now().toString().slice(-6)}`,
    verifiedAt: new Date(),
    disclaimer: 'Demo verification — not connected to UIDAI.',
    message: '✓ Aadhaar Verified (Demo)'
  });
}));

/**
 * @route GET /api/v1/documents/procurement/:procurementId
 * @desc Get document verification status for a procurement
 */
router.get('/procurement/:procurementId', asyncWrapper(async (req, res) => {
  const { procurementId } = req.params;
  let docVerification = await DocumentVerification.findOne({ procurementId })
    .populate('verifiedBy', 'fullName role');

  if (!docVerification) {
    const procurement = await Procurement.findById(procurementId);
    if (!procurement) {
      throw new NotFoundError('Procurement record not found.');
    }
    // Return empty default state
    return sendSuccess(res, 'Document verification record empty', {
      procurementId,
      bookingId: procurement.bookingId,
      farmerId: procurement.farmerId,
      centreId: procurement.centreId,
      aadhaarStatus: 'PENDING',
      bankStatus: 'PENDING',
      passbookStatus: 'PENDING',
      overallStatus: 'PENDING'
    });
  }

  return sendSuccess(res, 'Document verification details retrieved', docVerification);
}));

/**
 * @route POST /api/v1/documents/procurement/:procurementId
 * @desc Save and verify documents for procurement (Center Operator)
 */
router.post('/procurement/:procurementId', requireRole(ROLES.CENTER_OPERATOR, ROLES.CENTER_MANAGER, ROLES.SUPER_ADMIN), asyncWrapper(async (req, res) => {
  const { procurementId } = req.params;
  const {
    aadhaarReference,
    aadhaarName,
    aadhaarStatus,
    accountHolderName,
    bankName,
    accountNumber,
    confirmAccountNumber,
    ifscCode,
    accountType,
    bankStatus,
    passbookStatus,
    passbookRemarks,
    landRecordStatus,
    landRecordRemarks
  } = req.body;

  const procurement = await Procurement.findById(procurementId);
  if (!procurement) {
    throw new NotFoundError('Procurement record not found.');
  }

  if (accountNumber && confirmAccountNumber && accountNumber !== confirmAccountNumber) {
    throw new BadRequestError('Bank account numbers do not match.');
  }

  let doc = await DocumentVerification.findOne({ procurementId });
  if (!doc) {
    doc = new DocumentVerification({
      procurementId: procurement._id,
      bookingId: procurement.bookingId,
      farmerId: procurement.farmerId,
      centreId: procurement.centreId
    });
  }

  if (aadhaarReference) doc.aadhaarReference = maskAadhaar(aadhaarReference);
  if (aadhaarName) doc.aadhaarName = aadhaarName;
  if (aadhaarStatus) {
    doc.aadhaarStatus = aadhaarStatus;
    if (aadhaarStatus === 'VERIFIED') doc.aadhaarVerifiedAt = new Date();
  }

  if (accountHolderName) doc.accountHolderName = accountHolderName;
  if (bankName) doc.bankName = bankName;
  if (accountNumber) doc.accountNumberMasked = maskBankAccount(accountNumber);
  if (ifscCode) doc.ifscCode = ifscCode.toUpperCase();
  if (accountType) doc.accountType = accountType;
  if (bankStatus) doc.bankStatus = bankStatus;

  if (passbookStatus) doc.passbookStatus = passbookStatus;
  if (passbookRemarks) doc.passbookRemarks = passbookRemarks;

  if (landRecordStatus) doc.landRecordStatus = landRecordStatus;
  if (landRecordRemarks) doc.landRecordRemarks = landRecordRemarks;

  // Determine overall verification status
  const isAadhaarOk = doc.aadhaarStatus === 'VERIFIED';
  const isBankOk = doc.bankStatus === 'VERIFIED';
  const isPassbookOk = doc.passbookStatus === 'VERIFIED';

  if (isAadhaarOk && isBankOk && isPassbookOk) {
    doc.overallStatus = 'VERIFIED';
    doc.verifiedBy = req.user._id;
    doc.verifiedAt = new Date();
  } else if (doc.aadhaarStatus === 'FAILED' || doc.bankStatus === 'REJECTED' || doc.passbookStatus === 'REJECTED') {
    doc.overallStatus = 'REJECTED';
  } else {
    doc.overallStatus = 'PENDING';
  }

  await doc.save();

  // Audit Logging
  await AuditLog.create({
    userId: req.user._id,
    action: 'DOCUMENTS_VERIFIED',
    details: `Updated document verification for procurement ${procurementId}. Overall status: ${doc.overallStatus}`,
    ipAddress: req.ip || ''
  });

  // Socket Event to Farmer & Centre
  socketHandler.emitFarmerEvent(procurement.farmerId, 'documents.verified', {
    procurementId,
    overallStatus: doc.overallStatus,
    aadhaarStatus: doc.aadhaarStatus,
    bankStatus: doc.bankStatus,
    passbookStatus: doc.passbookStatus
  });

  return sendSuccess(res, 'Document verification saved successfully', doc);
}));

module.exports = router;
