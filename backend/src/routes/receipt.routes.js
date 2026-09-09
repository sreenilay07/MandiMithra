const express = require('express');
const Receipt = require('../models/Receipt');
const asyncWrapper = require('../utils/asyncWrapper');
const { sendSuccess } = require('../utils/responseHandler');
const { NotFoundError, ForbiddenError } = require('../utils/customErrors');
const { protect } = require('../middleware/auth.middleware');
const { ROLES } = require('../constants/roles');

const router = express.Router();

router.use(protect);

/**
 * @route GET /api/v1/receipts/booking/:bookingId
 * @desc Get receipt by booking ID
 */
router.get('/booking/:bookingId', asyncWrapper(async (req, res) => {
  const receipt = await Receipt.findOne({ bookingId: req.params.bookingId });

  if (!receipt) {
    throw new NotFoundError('Procurement receipt not found for this booking.');
  }

  // Permission check for farmers
  if (req.user.role === ROLES.FARMER && receipt.farmerId.toString() !== req.user._id.toString()) {
    throw new ForbiddenError('You can only view your own procurement receipts.');
  }

  return sendSuccess(res, 'Receipt retrieved successfully', receipt);
}));

/**
 * @route GET /api/v1/receipts/:id
 * @desc Get receipt by receipt ID
 */
router.get('/:id', asyncWrapper(async (req, res) => {
  const receipt = await Receipt.findById(req.params.id);

  if (!receipt) {
    throw new NotFoundError('Procurement receipt not found.');
  }

  if (req.user.role === ROLES.FARMER && receipt.farmerId.toString() !== req.user._id.toString()) {
    throw new ForbiddenError('You can only view your own procurement receipts.');
  }

  return sendSuccess(res, 'Receipt retrieved successfully', receipt);
}));

/**
 * @route GET /api/v1/receipts/:id/download
 * @desc Download or view print-friendly receipt HTML
 */
router.get('/:id/download', asyncWrapper(async (req, res) => {
  const receipt = await Receipt.findById(req.params.id);

  if (!receipt) {
    throw new NotFoundError('Procurement receipt not found.');
  }

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>MandiMithra Procurement Receipt - ${receipt.receiptNumber}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; padding: 20px; color: #1e293b; }
    .receipt-card { max-width: 650px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { text-align: center; border-bottom: 2px solid #047857; padding-bottom: 15px; margin-bottom: 20px; }
    .header h1 { margin: 0; font-size: 24px; color: #047857; text-transform: uppercase; letter-spacing: 1px; }
    .header p { margin: 4px 0 0; color: #475569; font-size: 14px; font-weight: 500; }
    .badge { display: inline-block; background: #dcfce7; color: #15803d; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; margin-top: 8px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; font-size: 14px; }
    .label { color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
    .val { font-weight: 600; color: #0f172a; margin-top: 2px; }
    .table-container { margin: 20px 0; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
    table { width: 100%; border-collapse: collapse; text-align: left; font-size: 14px; }
    th { background: #f1f5f9; padding: 10px 14px; color: #334155; font-size: 12px; text-transform: uppercase; }
    td { padding: 12px 14px; border-top: 1px solid #e2e8f0; }
    .total-row { background: #ecfdf5; font-weight: 700; color: #047857; }
    .stages-list { margin-top: 20px; padding: 15px; background: #f8fafc; border-radius: 8px; }
    .stages-list h3 { margin: 0 0 10px; font-size: 14px; color: #334155; }
    .stage-item { font-size: 13px; color: #166534; display: inline-block; margin-right: 15px; margin-bottom: 5px; }
    .footer { text-align: center; margin-top: 25px; font-size: 12px; color: #94a3b8; border-top: 1px dashed #cbd5e1; padding-top: 15px; }
    @media print {
      body { background: white; padding: 0; }
      .receipt-card { border: none; box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="receipt-card">
    <div class="header">
      <h1>MANDIMITRA</h1>
      <p>Saath Kisan Ka, Har Kadam Par — Government Digital Procurement Record</p>
      <div class="badge">OFFICIAL RECEIPT</div>
    </div>

    <div class="grid">
      <div>
        <div class="label">Receipt Number</div>
        <div class="val">${receipt.receiptNumber}</div>
      </div>
      <div>
        <div class="label">Date & Time</div>
        <div class="val">${new Date(receipt.completedAt).toLocaleString('en-IN')}</div>
      </div>
      <div>
        <div class="label">Farmer Name</div>
        <div class="val">${receipt.farmerName}</div>
      </div>
      <div>
        <div class="label">Token Number</div>
        <div class="val">${receipt.tokenNumber}</div>
      </div>
      <div>
        <div class="label">Procurement Centre</div>
        <div class="val">${receipt.centreName}</div>
      </div>
      <div>
        <div class="label">District</div>
        <div class="val">${receipt.districtName || 'Government Procurement District'}</div>
      </div>
    </div>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Crop</th>
            <th>Registered Qty</th>
            <th>Actual Weight</th>
            <th>Applied Price</th>
            <th>Gross Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>${receipt.cropName}</strong></td>
            <td>${receipt.registeredQuantity} KG</td>
            <td>${receipt.actualWeight} KG (${receipt.quantityInQuintal} Quintal)</td>
            <td>₹${receipt.appliedPrice.toLocaleString('en-IN')} / Quintal</td>
            <td><strong>₹${receipt.grossAmount.toLocaleString('en-IN')}</strong></td>
          </tr>
          <tr class="total-row">
            <td colspan="4" style="text-align: right;">TOTAL GROSS VALUE:</td>
            <td>₹${receipt.grossAmount.toLocaleString('en-IN')}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="grid">
      <div>
        <div class="label">Payment Status</div>
        <div class="val" style="color: #0284c7;">✓ ${receipt.paymentStatus}</div>
      </div>
      <div>
        <div class="label">Verification Authority</div>
        <div class="val">Centre Operator / Officer</div>
      </div>
    </div>

    <div class="stages-list">
      <h3>Verified 7 Procurement Workflow Stages</h3>
      ${(receipt.stagesCompleted || []).map(s => `<span class="stage-item">✓ Stage ${s.stageNumber}: ${s.stageName}</span>`).join('')}
    </div>

    <div class="footer">
      This is an authentic digital procurement receipt issued by MandiMithra Platform.<br/>
      "Saath Kisan Ka, Har Kadam Par"
    </div>
  </div>
  <script>
    // Auto trigger print dialog if query parameter ?print=true is present
    if (new URLSearchParams(window.location.search).get('print') === 'true') {
      window.print();
    }
  </script>
</body>
</html>
  `;

  res.setHeader('Content-Type', 'text/html');
  return res.send(html);
}));

module.exports = router;
