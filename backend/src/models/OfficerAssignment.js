const mongoose = require('mongoose');
const { ASSIGNMENT_STATUS } = require('../constants/status');

const officerAssignmentSchema = new mongoose.Schema(
  {
    officerId: {
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
    counterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Counter',
      default: null
    },
    assignedDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    status: {
      type: String,
      enum: Object.values(ASSIGNMENT_STATUS),
      default: ASSIGNMENT_STATUS.ACTIVE
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

officerAssignmentSchema.index({ officerId: 1, assignedDate: 1, status: 1 });

module.exports = mongoose.model('OfficerAssignment', officerAssignmentSchema);
