const mongoose = require('mongoose');
const { PROCUREMENT_STATUS } = require('../constants/status');

const procurementSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      unique: true
    },
    tokenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Token',
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
    expectedQuantity: {
      type: Number,
      required: true
    },
    actualQuantity: {
      type: Number,
      default: null
    },
    status: {
      type: String,
      enum: Object.values(PROCUREMENT_STATUS),
      default: PROCUREMENT_STATUS.NOT_STARTED,
      index: true
    },
    arrivalTime: {
      type: Date,
      default: null
    },
    completionTime: {
      type: Date,
      default: null
    },
    lorryNumber: {
      type: String,
      default: ''
    },
    remarks: {
      type: String,
      default: ''
    },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Procurement', procurementSchema);
