const mongoose = require('mongoose');

const centrePricingSchema = new mongoose.Schema(
  {
    centreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProcurementCentre',
      required: true,
      index: true
    },
    cropId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Crop',
      required: true,
      index: true
    },
    cropName: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: [true, 'Procurement price is required'],
      min: [0, 'Price cannot be negative']
    },
    unit: {
      type: String,
      default: 'Per Quintal'
    },
    effectiveFrom: {
      type: Date,
      default: Date.now
    },
    effectiveTo: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
      index: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Index to help query active price quickly
centrePricingSchema.index({ centreId: 1, cropId: 1, status: 1 });

module.exports = mongoose.model('CentrePricing', centrePricingSchema);
