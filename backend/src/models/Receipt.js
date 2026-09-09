const mongoose = require('mongoose');

const receiptSchema = new mongoose.Schema(
  {
    receiptNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    procurementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Procurement',
      required: true,
      unique: true
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true
    },
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    farmerName: {
      type: String,
      required: true
    },
    tokenNumber: {
      type: String,
      required: true
    },
    centreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProcurementCentre',
      required: true
    },
    centreName: {
      type: String,
      required: true
    },
    districtName: {
      type: String,
      default: ''
    },
    cropName: {
      type: String,
      required: true
    },
    registeredQuantity: {
      type: Number,
      required: true
    },
    actualWeight: {
      type: Number,
      required: true
    },
    quantityInQuintal: {
      type: Number,
      required: true
    },
    appliedPrice: {
      type: Number,
      required: true
    },
    priceUnit: {
      type: String,
      default: 'Per Quintal'
    },
    grossAmount: {
      type: Number,
      required: true
    },
    paymentStatus: {
      type: String,
      enum: ['PROCESSING', 'COMPLETED'],
      default: 'PROCESSING'
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    completedAt: {
      type: Date,
      default: Date.now
    },
    stagesCompleted: [
      {
        stageNumber: Number,
        stageName: String,
        completedAt: Date
      }
    ]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Receipt', receiptSchema);
