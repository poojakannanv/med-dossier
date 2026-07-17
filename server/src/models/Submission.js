const mongoose = require('mongoose');
const { CTD_MODULES } = require('../utils/ctdModules');

const AUTHORITIES = ['MHRA', 'EMA', 'FDA', 'other'];
const SUBMISSION_TYPES = ['new', 'variation', 'renewal'];
const SUBMISSION_STATUSES = ['draft', 'in-review', 'submitted', 'approved', 'rejected'];
const MODULE_STATUSES = ['not-started', 'draft', 'in-review', 'approved'];

const documentVersionSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    size: { type: Number, required: true },
    mimeType: { type: String, default: '' },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    uploadedAt: { type: Date, default: Date.now },
    version: { type: Number, required: true },
    isCurrent: { type: Boolean, default: false },
  },
  { _id: true }
);

const moduleSchema = new mongoose.Schema(
  {
    code: { type: String, required: true },
    title: { type: String, required: true },
    status: {
      type: String,
      enum: MODULE_STATUSES,
      default: 'not-started',
    },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    documents: [documentVersionSchema],
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const submissionSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product is required'],
    },
    regulatoryAuthority: {
      type: String,
      enum: AUTHORITIES,
      required: [true, 'Regulatory authority is required'],
    },
    submissionType: {
      type: String,
      enum: SUBMISSION_TYPES,
      required: [true, 'Submission type is required'],
    },
    targetDate: {
      type: Date,
      required: [true, 'Target date is required'],
    },
    status: {
      type: String,
      enum: SUBMISSION_STATUSES,
      default: 'draft',
    },
    modules: [moduleSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

submissionSchema.index({ productId: 1 });
submissionSchema.index({ status: 1 });
submissionSchema.index({ targetDate: 1 });

// Percentage of modules approved.
submissionSchema.methods.progress = function () {
  if (!this.modules || this.modules.length === 0) return 0;
  const approved = this.modules.filter((m) => m.status === 'approved').length;
  return Math.round((approved / this.modules.length) * 100);
};

// Build the default CTD module checklist for a new submission.
submissionSchema.statics.defaultModules = function () {
  return CTD_MODULES.map((m) => ({
    code: m.code,
    title: m.title,
    status: 'not-started',
    owner: null,
    documents: [],
  }));
};

const Submission = mongoose.model('Submission', submissionSchema);

module.exports = Submission;
module.exports.AUTHORITIES = AUTHORITIES;
module.exports.SUBMISSION_TYPES = SUBMISSION_TYPES;
module.exports.SUBMISSION_STATUSES = SUBMISSION_STATUSES;
module.exports.MODULE_STATUSES = MODULE_STATUSES;
