const mongoose = require('mongoose');
const { COUNTER_STATUS } = require('../constants/status');

const counterSchema = new mongoose.Schema(
  {
    centreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProcurementCentre',
      required: true,
      index: true
    },
    counterNumber: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: Object.values(COUNTER_STATUS),
      default: COUNTER_STATUS.CLOSED
    },
    assignedOfficerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    supportedCrops: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Crop'
      }
    ],
    capacityPerHour: {
      type: Number,
      default: 2000
    },
    openedAt: {
      type: Date,
      default: null
    },
    closedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

counterSchema.index({ centreId: 1, counterNumber: 1 }, { unique: true });

module.exports = mongoose.model('Counter', counterSchema);
