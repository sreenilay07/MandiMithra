const mongoose = require('mongoose');
const { STAGE_STATUS } = require('../constants/stages');

const procurementStageSchema = new mongoose.Schema(
  {
    procurementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Procurement',
      required: true,
      index: true
    },
    stageNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 7
    },
    stageName: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: Object.values(STAGE_STATUS),
      default: STAGE_STATUS.PENDING
    },
    startedAt: {
      type: Date,
      default: null
    },
    completedAt: {
      type: Date,
      default: null
    },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    remarks: {
      type: String,
      default: ''
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

procurementStageSchema.index({ procurementId: 1, stageNumber: 1 }, { unique: true });

module.exports = mongoose.model('ProcurementStage', procurementStageSchema);
