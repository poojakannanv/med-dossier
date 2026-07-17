const mongoose = require('mongoose');

const ENTITY_TYPES = ['user', 'product', 'submission', 'module', 'document'];
const ACTIONS = ['create', 'update', 'delete', 'upload', 'download', 'login', 'register'];

const auditLogSchema = new mongoose.Schema(
  {
    entityType: {
      type: String,
      enum: ENTITY_TYPES,
      required: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    action: {
      type: String,
      enum: ACTIONS,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    changes: {
      before: { type: mongoose.Schema.Types.Mixed, default: null },
      after: { type: mongoose.Schema.Types.Mixed, default: null },
    },
    summary: {
      type: String,
      default: '',
    },
  },
  { timestamps: false }
);

auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1, timestamp: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;
module.exports.ENTITY_TYPES = ENTITY_TYPES;
module.exports.ACTIONS = ACTIONS;
