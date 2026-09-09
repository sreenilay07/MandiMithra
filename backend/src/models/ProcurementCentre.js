const mongoose = require('mongoose');
const { CENTRE_STATUS } = require('../constants/status');

const procurementCentreSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Centre name is required'],
      trim: true
    },
    code: {
      type: String,
      required: [true, 'Centre code is required'],
      unique: true,
      uppercase: true,
      trim: true
    },
    districtId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'District',
      required: true,
      index: true
    },
    address: {
      type: String,
      required: true
    },
    village: {
      type: String,
      required: true
    },
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    },
    contactNumber: {
      type: String,
      required: true
    },
    workingHours: {
      openingTime: {
        type: String,
        default: '08:00'
      },
      closingTime: {
        type: String,
        default: '18:00'
      }
    },
    status: {
      type: String,
      enum: Object.values(CENTRE_STATUS),
      default: CENTRE_STATUS.ACTIVE
    },
    defaultCapacity: {
      type: Number,
      default: 2000 // kg per hour per counter
    },
    activeCounters: {
      type: Number,
      default: 1,
      min: 0
    },
    totalCounters: {
      type: Number,
      default: 2,
      min: 1
    },
    supportedCrops: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Crop'
      }
    ],
    requiredDocuments: [
      {
        name: { type: String, required: true },
        description: { type: String, default: '' },
        required: { type: Boolean, default: true }
      }
    ],
    absencePolicy: {
      type: String,
      enum: ['SKIP', 'RESCHEDULE', 'RETAIN_POSITION'],
      default: 'SKIP'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('ProcurementCentre', procurementCentreSchema);
