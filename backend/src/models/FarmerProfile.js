const mongoose = require('mongoose');

const farmerProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    farmerId: {
      type: String,
      unique: true,
      required: true,
      index: true
    },
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true
    },
    address: {
      type: String,
      default: ''
    },
    village: {
      type: String,
      default: 'N/A',
      trim: true
    },
    mandal: {
      type: String,
      default: 'N/A',
      trim: true
    },
    district: {
      type: String,
      default: 'N/A',
      trim: true
    },
    state: {
      type: String,
      default: 'N/A',
      trim: true
    },
    pincode: {
      type: String,
      default: '500000',
      trim: true
    },
    aadhaarLast4: {
      type: String,
      default: 'XXXX-XXXX-0000',
      trim: true
    },
    bankAccountLast4: {
      type: String,
      default: 'XXXXXX0000',
      trim: true
    },
    landPassbookReference: {
      type: String,
      default: 'PASS-DEFAULT',
      trim: true
    },
    preferredLanguage: {
      type: String,
      enum: ['en', 'te', 'hi'],
      default: 'en'
    },
    location: {
      latitude: {
        type: Number,
        default: 17.385043
      },
      longitude: {
        type: Number,
        default: 78.486671
      }
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('FarmerProfile', farmerProfileSchema);
