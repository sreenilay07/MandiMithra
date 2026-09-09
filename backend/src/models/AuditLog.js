const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    role: {
      type: String,
      default: 'ANONYMOUS'
    },
    actorRole: {
      type: String,
      default: ''
    },
    action: {
      type: String,
      required: true,
      index: true
    },
    entity: {
      type: String,
      default: 'GENERAL'
    },
    targetType: {
      type: String,
      default: ''
    },
    entityId: {
      type: String,
      default: null
    },
    targetId: {
      type: String,
      default: null
    },
    centreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProcurementCentre',
      default: null
    },
    districtId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'District',
      default: null
    },
    ipAddress: {
      type: String,
      default: ''
    },
    userAgent: {
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

auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
