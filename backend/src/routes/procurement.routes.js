const express = require('express');
const Procurement = require('../models/Procurement');
const ProcurementStage = require('../models/ProcurementStage');
const Token = require('../models/Token');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');
const DocumentVerification = require('../models/DocumentVerification');
const CentrePricing = require('../models/CentrePricing');
const Receipt = require('../models/Receipt');
const ProcurementCentre = require('../models/ProcurementCentre');
const Crop = require('../models/Crop');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const asyncWrapper = require('../utils/asyncWrapper');
const { sendSuccess } = require('../utils/responseHandler');
const { NotFoundError, BadRequestError, ForbiddenError } = require('../utils/customErrors');
const { protect, requireRole } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { completeStageSchema } = require('../validators/schemas');
const { ROLES } = require('../constants/roles');
const { TOKEN_STATUS, BOOKING_STATUS, PROCUREMENT_STATUS } = require('../constants/status');
const { STAGE_STATUS } = require('../constants/stages');
const queueService = require('../services/queue/queue.service');
const qrService = require('../services/qr/qr.service');
const socketHandler = require('../socket/socket.handler');

const router = express.Router();

router.use(protect);

/**
 * @route GET /api/v1/procurements/:id
 * @desc Get procurement details with stages and farmer info
 */
router.get('/:id', asyncWrapper(async (req, res) => {
  const procurement = await Procurement.findById(req.params.id)
    .populate('farmerId', 'fullName phoneNumber')
    .populate('centreId', 'name code')
    .populate('cropId', 'name unit')
    .populate('tokenId', 'tokenNumber queuePosition status');

  if (!procurement) {
    throw new NotFoundError('Procurement record not found.');
  }

  const stages = await ProcurementStage.find({ procurementId: procurement._id }).sort({ stageNumber: 1 });
  const payment = await Payment.findOne({ procurementId: procurement._id });
  const receipt = await Receipt.findOne({ procurementId: procurement._id });
  const documentVerification = await DocumentVerification.findOne({ procurementId: procurement._id });

  return sendSuccess(res, 'Procurement record retrieved', {
    procurement,
    stages,
    payment,
    receipt,
    documentVerification
  });
}));

/**
 * @route POST /api/v1/procurements/:id/arrival
 * @desc Officer scans Arrival QR to mark farmer ARRIVED at centre
 */
router.post('/:id/arrival', requireRole(ROLES.CENTER_OPERATOR, ROLES.CENTER_MANAGER, ROLES.SUPER_ADMIN), asyncWrapper(async (req, res) => {
  const { qrData } = req.body;
  if (!qrData) {
    throw new BadRequestError('QR code string payload is required');
  }

  const payload = qrService.verifyQRData(qrData);
  const procurement = await Procurement.findById(req.params.id);

  if (!procurement) {
    throw new NotFoundError('Procurement record not found.');
  }

  if (req.user.role !== ROLES.SUPER_ADMIN && procurement.centreId.toString() !== req.user.centreId?.toString()) {
    throw new ForbiddenError('Officer does not belong to the procurement centre matching this token.');
  }

  if (procurement.status === 'COMPLETED' || procurement.status === 'CANCELLED') {
    throw new BadRequestError(`Cannot mark arrival for procurement with status '${procurement.status}'.`);
  }

  procurement.status = PROCUREMENT_STATUS.ARRIVED;
  procurement.arrivalTime = new Date();
  await procurement.save();

  const token = await Token.findById(procurement.tokenId);
  if (token) {
    token.status = TOKEN_STATUS.ARRIVED;
    await token.save();
  }

  // Recalculate queue
  await queueService.recalculateQueue(procurement.centreId);

  // Real-time Socket.IO notification
  socketHandler.emitFarmerEvent(procurement.farmerId, 'farmer.arrival.verified', {
    procurementId: procurement._id,
    arrivalTime: procurement.arrivalTime
  });
  socketHandler.emitCentreEvent(procurement.centreId, 'queue.updated', { centreId: procurement.centreId });

  return sendSuccess(res, 'Farmer arrival verified successfully.', { procurement, token });
}));

/**
 * @route GET /api/v1/procurements/:id/stages
 * @desc Get all 7 stages for a procurement workflow
 */
router.get('/:id/stages', asyncWrapper(async (req, res) => {
  const stages = await ProcurementStage.find({ procurementId: req.params.id }).sort({ stageNumber: 1 });
  return sendSuccess(res, 'Procurement stages retrieved', stages);
}));

/**
 * @route POST /api/v1/procurements/:id/stages/:stageId/complete
 * @desc Officer completes assigned procurement stage with sequential verification
 */
router.post('/:id/stages/:stageId/complete', requireRole(ROLES.CENTER_OPERATOR, ROLES.CENTER_MANAGER, ROLES.SUPER_ADMIN), validate(completeStageSchema), asyncWrapper(async (req, res) => {
  const { procurementId, stageId } = req.params;
  const { remarks, actualWeight, numberOfBags, lorryNumber, testResult, documentNotes, metadata } = req.body;

  const procurement = await Procurement.findById(procurementId);
  if (!procurement) {
    throw new NotFoundError('Procurement record not found.');
  }

  const targetStage = await ProcurementStage.findById(stageId);
  if (!targetStage) {
    throw new NotFoundError('Target procurement stage not found.');
  }

  if (targetStage.status === STAGE_STATUS.COMPLETED) {
    throw new BadRequestError(`Stage ${targetStage.stageNumber} (${targetStage.stageName}) is already completed.`);
  }

  // ENFORCE STRICT SEQUENTIAL STAGE ORDERING (Stage N requires Stage N-1 to be COMPLETED)
  if (targetStage.stageNumber > 1) {
    const prevStage = await ProcurementStage.findOne({
      procurementId,
      stageNumber: targetStage.stageNumber - 1
    });

    if (!prevStage || prevStage.status !== STAGE_STATUS.COMPLETED) {
      throw new BadRequestError(
        `Stage ${targetStage.stageNumber - 1} (${prevStage ? prevStage.stageName : 'Previous Stage'}) must be completed before Stage ${targetStage.stageNumber} (${targetStage.stageName}).`,
        'STAGE_ORDER_VIOLATION'
      );
    }
  }

  // STAGE 7 PREREQUISITE CHECK: Required documents must be verified
  if (targetStage.stageNumber === 7) {
    const docVer = await DocumentVerification.findOne({ procurementId });
    if (!docVer || docVer.overallStatus !== 'VERIFIED') {
      throw new BadRequestError(
        'Required document verification is incomplete. Please verify Aadhaar, Bank details, and Passbook before completing Documents Submission.',
        'DOCUMENTS_INCOMPLETE'
      );
    }
  }

  // Stage-specific metadata validations
  const stageMeta = metadata || {};
  if (targetStage.stageNumber === 1 && testResult) stageMeta.testResult = testResult;
  if (targetStage.stageNumber === 2 && numberOfBags) stageMeta.numberOfBags = numberOfBags;
  if (targetStage.stageNumber === 4 && numberOfBags) stageMeta.stitchedBags = numberOfBags;
  if (targetStage.stageNumber === 5) {
    if (!actualWeight && !stageMeta.actualWeight) {
      throw new BadRequestError('Actual measured weight (kg) must be recorded for Weight Stage 5.');
    }
    const weightVal = actualWeight || stageMeta.actualWeight;
    stageMeta.actualWeight = weightVal;
    procurement.actualQuantity = weightVal; // Record actual quantity on main procurement
  }
  if (targetStage.stageNumber === 6) {
    if (lorryNumber) {
      stageMeta.lorryNumber = lorryNumber;
      procurement.lorryNumber = lorryNumber;
    }
  }
  if (targetStage.stageNumber === 7 && documentNotes) stageMeta.documentNotes = documentNotes;

  // Mark stage completed
  targetStage.status = STAGE_STATUS.COMPLETED;
  targetStage.completedAt = new Date();
  targetStage.completedBy = req.user._id;
  targetStage.remarks = remarks || '';
  targetStage.metadata = stageMeta;
  await targetStage.save();

  procurement.status = PROCUREMENT_STATUS.IN_PROGRESS;
  await procurement.save();

  // Socket event for stage completion
  const stageUpdatePayload = {
    procurementId: procurement._id,
    bookingId: procurement.bookingId,
    farmerId: procurement.farmerId,
    stageNumber: targetStage.stageNumber,
    stageName: targetStage.stageName,
    status: 'COMPLETED',
    completedAt: targetStage.completedAt
  };

  socketHandler.emitFarmerEvent(procurement.farmerId, 'procurement.stage.updated', stageUpdatePayload);
  socketHandler.emitFarmerEvent(procurement.farmerId, 'stage:completed', stageUpdatePayload);
  socketHandler.emitCentreEvent(procurement.centreId, 'procurement.stage.updated', stageUpdatePayload);

  // Audit Logging
  await AuditLog.create({
    userId: req.user._id,
    action: 'STAGE_COMPLETED',
    details: `Completed Stage ${targetStage.stageNumber} (${targetStage.stageName}) for procurement ${procurementId}`,
    ipAddress: req.ip || ''
  });

  // CHECK FOR AUTOMATIC PROCUREMENT COMPLETION (IF STAGE 7 COMPLETED)
  let isProcurementFullyCompleted = false;
  let receiptRecord = null;

  if (targetStage.stageNumber === 7) {
    const allStages = await ProcurementStage.find({ procurementId });
    const completedCount = allStages.filter(s => s.status === STAGE_STATUS.COMPLETED).length;

    if (completedCount === 7) {
      isProcurementFullyCompleted = true;
      procurement.status = PROCUREMENT_STATUS.COMPLETED;
      procurement.completionTime = new Date();
      procurement.completedBy = req.user._id;
      await procurement.save();

      // Update Token and Booking
      const token = await Token.findById(procurement.tokenId);
      if (token) {
        token.status = TOKEN_STATUS.COMPLETED;
        await token.save();
      }

      const booking = await Booking.findById(procurement.bookingId);
      if (booking) {
        booking.status = BOOKING_STATUS.COMPLETED;
        await booking.save();
      }

      // FETCH APPLIED PRICE FROM CENTRE PRICING CONFIG
      const activePricing = await CentrePricing.findOne({
        centreId: procurement.centreId,
        cropId: procurement.cropId,
        status: 'ACTIVE'
      });

      const appliedPrice = activePricing ? activePricing.price : 2300;
      const priceUnit = activePricing ? activePricing.unit : 'Per Quintal';

      const finalWeight = procurement.actualQuantity || procurement.expectedQuantity || 1000;
      const quantityInQuintal = Number((finalWeight / 100).toFixed(2));
      const calculatedGrossAmount = Math.round(quantityInQuintal * appliedPrice);

      // Create or Update Payment Record
      let payment = await Payment.findOne({ procurementId: procurement._id });
      if (!payment) {
        payment = new Payment({
          procurementId: procurement._id,
          farmerId: procurement.farmerId,
          amount: calculatedGrossAmount,
          status: 'PROCESSING',
          referenceNumber: `PAY-${Date.now().toString().slice(-8)}`
        });
        await payment.save();
      }

      // GENERATE DIGITAL RECEIPT
      const farmerUser = await User.findById(procurement.farmerId);
      const centreObj = await ProcurementCentre.findById(procurement.centreId);
      const cropObj = await Crop.findById(procurement.cropId);
      const receiptNo = `MM-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;

      receiptRecord = await Receipt.findOne({ procurementId: procurement._id });
      if (!receiptRecord) {
        receiptRecord = new Receipt({
          receiptNumber: receiptNo,
          procurementId: procurement._id,
          bookingId: procurement.bookingId,
          farmerId: procurement.farmerId,
          farmerName: farmerUser ? farmerUser.fullName : 'Verified Farmer',
          tokenNumber: token ? token.tokenNumber : 'P-001',
          centreId: procurement.centreId,
          centreName: centreObj ? centreObj.name : 'Procurement Centre',
          districtName: centreObj ? centreObj.district : '',
          cropName: cropObj ? cropObj.name : 'Crop',
          registeredQuantity: procurement.expectedQuantity,
          actualWeight: finalWeight,
          quantityInQuintal,
          appliedPrice,
          priceUnit,
          grossAmount: calculatedGrossAmount,
          paymentStatus: 'PROCESSING',
          verifiedBy: req.user._id,
          completedAt: new Date(),
          stagesCompleted: allStages.map(s => ({
            stageNumber: s.stageNumber,
            stageName: s.stageName,
            completedAt: s.completedAt
          }))
        });
        await receiptRecord.save();
      }

      // Recalculate centre queue
      await queueService.recalculateQueue(procurement.centreId);

      // Create completion Notification for Farmer
      await Notification.create({
        userId: procurement.farmerId,
        type: 'PROCUREMENT_COMPLETED',
        title: 'Procurement Completed & Receipt Generated!',
        message: `Your produce procurement of ${finalWeight} KG is complete. Total amount ₹${calculatedGrossAmount.toLocaleString('en-IN')} (at ₹${appliedPrice}/quintal). Receipt number: ${receiptRecord.receiptNumber}`
      });

      // Emit real-time completion & receipt events
      const completionPayload = {
        procurementId: procurement._id,
        bookingId: procurement.bookingId,
        actualQuantity: finalWeight,
        quantityInQuintal,
        appliedPrice,
        grossAmount: calculatedGrossAmount,
        receiptId: receiptRecord._id,
        receiptNumber: receiptRecord.receiptNumber
      };

      socketHandler.emitFarmerEvent(procurement.farmerId, 'procurement.completed', completionPayload);
      socketHandler.emitFarmerEvent(procurement.farmerId, 'procurement:completed', completionPayload);
      socketHandler.emitFarmerEvent(procurement.farmerId, 'receipt.generated', completionPayload);
      socketHandler.emitCentreEvent(procurement.centreId, 'queue.updated', { centreId: procurement.centreId });
    }
  }

  return sendSuccess(res, `Stage ${targetStage.stageNumber} (${targetStage.stageName}) completed successfully.`, {
    stage: targetStage,
    procurementStatus: procurement.status,
    isProcurementFullyCompleted,
    receipt: receiptRecord
  });
}));

module.exports = router;
