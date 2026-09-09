const mongoose = require('mongoose');
const { TOKEN_STATUS } = require('../constants/status');

const tokenSchema = new mongoose.Schema(
  {
    tokenNumber: {
      type: String,
      required: true,
      index: true
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      unique: true
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
    queuePosition: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: Object.values(TOKEN_STATUS),
      default: TOKEN_STATUS.WAITING,
      index: true
    },
    estimatedWaitingMinutes: {
      type: Number,
      default: 0
    },
    estimatedTurnTime: {
      type: Date,
      default: null
    },
    recommendedDepartureTime: {
      type: Date,
      default: null
    },
    travelTimeMinutes: {
      type: Number,
      default: 30
    }
  },
  {
    timestamps: true
  }
);

tokenSchema.index({ centreId: 1, createdAt: 1, status: 1 });
tokenSchema.index({ centreId: 1, tokenNumber: 1 }, { unique: true });

module.exports = mongoose.model('Token', tokenSchema);
