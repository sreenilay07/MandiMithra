const mongoose = require('mongoose');
const { PAYMENT_STATUS } = require('../constants/status');

const paymentSchema = new mongoose.Schema(
  {
    procurementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Procurement',
      required: true,
      unique: true,
      index: true
    },
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    amount: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING
    },
    referenceNumber: {
      type: String,
      required: true,
      unique: true
    },
    paymentInitiatedAt: {
      type: Date,
      default: Date.now
    },
    paymentCompletedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Payment', paymentSchema);
