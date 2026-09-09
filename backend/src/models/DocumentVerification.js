const mongoose = require('mongoose');

const documentVerificationSchema = new mongoose.Schema(
  {
    procurementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Procurement',
      required: true,
      unique: true,
      index: true
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true
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
      required: true
    },
    // Mock Aadhaar Details
    aadhaarReference: {
      type: String,
      default: '' // Masked string e.g. XXXX-XXXX-1234
    },
    aadhaarName: {
      type: String,
      default: ''
    },
    aadhaarStatus: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'FAILED'],
      default: 'PENDING'
    },
    aadhaarVerifiedAt: {
      type: Date,
      default: null
    },

    // Bank Account Details
    accountHolderName: {
      type: String,
      default: ''
    },
    bankName: {
      type: String,
      default: ''
    },
    accountNumberMasked: {
      type: String,
      default: '' // Masked e.g. XXXX-XXXX-4521
    },
    ifscCode: {
      type: String,
      default: ''
    },
    accountType: {
      type: String,
      enum: ['SAVINGS', 'CURRENT'],
      default: 'SAVINGS'
    },
    bankStatus: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'REJECTED'],
      default: 'PENDING'
    },

    // Passbook Details
    passbookStatus: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'REJECTED'],
      default: 'PENDING'
    },
    passbookRemarks: {
      type: String,
      default: ''
    },

    // Land Record Details (Optional)
    landRecordStatus: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'REJECTED', 'NOT_APPLICABLE'],
      default: 'VERIFIED'
    },
    landRecordRemarks: {
      type: String,
      default: ''
    },

    // Overall Status
    overallStatus: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'REJECTED'],
      default: 'PENDING'
    },

    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    verifiedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('DocumentVerification', documentVerificationSchema);
