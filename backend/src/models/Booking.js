const mongoose = require('mongoose');
const { BOOKING_STATUS } = require('../constants/status');

const bookingSchema = new mongoose.Schema(
  {
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
      required: [true, 'Expected quantity is required'],
      min: [1, 'Quantity must be greater than 0']
    },
    preferredDate: {
      type: Date,
      required: true,
      index: true
    },
    preferredTimeSlot: {
      type: String,
      default: '09:00 AM - 12:00 PM'
    },
    status: {
      type: String,
      enum: Object.values(BOOKING_STATUS),
      default: BOOKING_STATUS.PENDING,
      index: true
    },
    bookingReference: {
      type: String,
      required: true,
      unique: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

bookingSchema.index({ centreId: 1, preferredDate: 1, status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
