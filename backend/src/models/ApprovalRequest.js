const mongoose = require('mongoose');

const approvalRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    requestedRole: {
      type: String,
      enum: ['CENTER_OPERATOR', 'CENTER_MANAGER', 'DISTRICT_ADMIN', 'PROCUREMENT_OFFICER', 'DISTRICT_OFFICER'],
      required: true
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    districtId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'District',
      default: null,
      index: true
    },
    centreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProcurementCentre',
      default: null,
      index: true
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
      index: true
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    reviewedAt: {
      type: Date,
      default: null
    },
    rejectionReason: {
      type: String,
      default: ''
    },
    remarks: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('ApprovalRequest', approvalRequestSchema);
