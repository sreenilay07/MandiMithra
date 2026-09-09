const mongoose = require('mongoose');

const centreCapacitySchema = new mongoose.Schema(
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
    capacityPerHour: {
      type: Number,
      required: true,
      default: 2000 // kg/hour/counter
    },
    totalCounters: {
      type: Number,
      default: 2
    },
    activeCounters: {
      type: Number,
      default: 1
    },
    effectiveDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE'
    }
  },
  {
    timestamps: true
  }
);

centreCapacitySchema.index({ centreId: 1, cropId: 1, status: 1 });

module.exports = mongoose.model('CentreCapacity', centreCapacitySchema);
