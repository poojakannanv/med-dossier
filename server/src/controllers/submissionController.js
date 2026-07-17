const Submission = require('../models/Submission');
const Product = require('../models/Product');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { logAudit, snapshot } = require('../services/auditService');
const { sendModuleAssignmentEmail } = require('../services/emailService');
const { buildSubmissionPdf } = require('../services/pdfService');

const POPULATE = [
  { path: 'productId', select: 'productName activeIngredient dosageForm strength manufacturer mah atcCode' },
  { path: 'createdBy', select: 'name email' },
  { path: 'modules.owner', select: 'name email role' },
  { path: 'modules.documents.uploadedBy', select: 'name email' },
];

const withProgress = (submission) => {
  const obj = submission.toObject();
  obj.progress = submission.progress();
  return obj;
};

// GET /api/submissions?status=&page=1&limit=10
const listSubmissions = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
  const { status } = req.query;

  const filter = {};
  if (status) filter.status = status;

  const total = await Submission.countDocuments(filter);
  const submissions = await Submission.find(filter)
    .populate(POPULATE)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  res.json({
    submissions: submissions.map(withProgress),
    page,
    pages: Math.ceil(total / limit) || 1,
    total,
  });
});

// GET /api/submissions/:id
const getSubmission = asyncHandler(async (req, res) => {
  const submission = await Submission.findById(req.params.id).populate(POPULATE);
  if (!submission) {
    return res.status(404).json({ message: 'Submission not found' });
  }
  res.json({ submission: withProgress(submission) });
});

// POST /api/submissions  (regulatory, admin)
// Auto-populates the CTD module checklist.
const createSubmission = asyncHandler(async (req, res) => {
  const { productId, regulatoryAuthority, submissionType, targetDate } = req.body;

  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  const submission = await Submission.create({
    productId,
    regulatoryAuthority,
    submissionType,
    targetDate,
    status: 'draft',
    modules: Submission.defaultModules(),
    createdBy: req.user._id,
  });

  await logAudit({
    entityType: 'submission',
    entityId: submission._id,
    action: 'create',
    userId: req.user._id,
    after: { productId, regulatoryAuthority, submissionType, targetDate, status: 'draft' },
    summary: `${regulatoryAuthority} ${submissionType} submission created for "${product.productName}"`,
  });

  const populated = await Submission.findById(submission._id).populate(POPULATE);
  res.status(201).json({ submission: withProgress(populated) });
});

// PUT /api/submissions/:id  (regulatory, admin)
const updateSubmission = asyncHandler(async (req, res) => {
  const submission = await Submission.findById(req.params.id);
  if (!submission) {
    return res.status(404).json({ message: 'Submission not found' });
  }

  const before = {
    regulatoryAuthority: submission.regulatoryAuthority,
    submissionType: submission.submissionType,
    targetDate: submission.targetDate,
    status: submission.status,
  };

  const fields = ['regulatoryAuthority', 'submissionType', 'targetDate', 'status'];
  fields.forEach((field) => {
    if (req.body[field] !== undefined) {
      submission[field] = req.body[field];
    }
  });

  await submission.save();

  await logAudit({
    entityType: 'submission',
    entityId: submission._id,
    action: 'update',
    userId: req.user._id,
    before,
    after: {
      regulatoryAuthority: submission.regulatoryAuthority,
      submissionType: submission.submissionType,
      targetDate: submission.targetDate,
      status: submission.status,
    },
    summary: `Submission updated (status: ${submission.status})`,
  });

  const populated = await Submission.findById(submission._id).populate(POPULATE);
  res.json({ submission: withProgress(populated) });
});

// DELETE /api/submissions/:id  (regulatory, admin)
const deleteSubmission = asyncHandler(async (req, res) => {
  const submission = await Submission.findById(req.params.id).populate('productId', 'productName');
  if (!submission) {
    return res.status(404).json({ message: 'Submission not found' });
  }

  const before = snapshot(submission);
  await submission.deleteOne();

  await logAudit({
    entityType: 'submission',
    entityId: req.params.id,
    action: 'delete',
    userId: req.user._id,
    before,
    summary: `Submission for "${submission.productId ? submission.productId.productName : 'unknown product'}" deleted`,
  });

  res.json({ message: 'Submission deleted' });
});

// PATCH /api/submissions/:id/modules/:moduleId/status
const updateModuleStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const submission = await Submission.findById(req.params.id);
  if (!submission) {
    return res.status(404).json({ message: 'Submission not found' });
  }
  const module = submission.modules.id(req.params.moduleId);
  if (!module) {
    return res.status(404).json({ message: 'Module not found on this submission' });
  }

  const before = { code: module.code, status: module.status };
  module.status = status;
  module.updatedAt = new Date();
  await submission.save();

  await logAudit({
    entityType: 'module',
    entityId: module._id,
    action: 'update',
    userId: req.user._id,
    before,
    after: { code: module.code, status: module.status },
    summary: `Module ${module.code} status changed from ${before.status} to ${status}`,
  });

  const populated = await Submission.findById(submission._id).populate(POPULATE);
  res.json({ submission: withProgress(populated) });
});

// PATCH /api/submissions/:id/modules/:moduleId/owner
const assignModuleOwner = asyncHandler(async (req, res) => {
  const { ownerId } = req.body;

  const submission = await Submission.findById(req.params.id).populate('productId', 'productName');
  if (!submission) {
    return res.status(404).json({ message: 'Submission not found' });
  }
  const module = submission.modules.id(req.params.moduleId);
  if (!module) {
    return res.status(404).json({ message: 'Module not found on this submission' });
  }

  let newOwner = null;
  if (ownerId) {
    newOwner = await User.findById(ownerId);
    if (!newOwner) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (!newOwner.isActive) {
      return res.status(400).json({ message: 'Cannot assign a deactivated user' });
    }
  }

  const before = { code: module.code, owner: module.owner };
  module.owner = newOwner ? newOwner._id : null;
  module.updatedAt = new Date();
  await submission.save();

  await logAudit({
    entityType: 'module',
    entityId: module._id,
    action: 'update',
    userId: req.user._id,
    before,
    after: { code: module.code, owner: module.owner },
    summary: newOwner
      ? `Module ${module.code} assigned to ${newOwner.name}`
      : `Module ${module.code} owner removed`,
  });

  if (newOwner) {
    const productName = submission.productId ? submission.productId.productName : 'Unknown product';
    sendModuleAssignmentEmail(newOwner, submission, module, productName).catch(() => {});
  }

  const populated = await Submission.findById(submission._id).populate(POPULATE);
  res.json({ submission: withProgress(populated) });
});

// GET /api/submissions/:id/export  (PDF)
const exportSubmissionPdf = asyncHandler(async (req, res) => {
  const submission = await Submission.findById(req.params.id).populate(POPULATE);
  if (!submission) {
    return res.status(404).json({ message: 'Submission not found' });
  }

  const productName = submission.productId ? submission.productId.productName : 'submission';
  const safeName = productName.replace(/[^a-zA-Z0-9-_]/g, '_');

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="meddossier-${safeName}-summary.pdf"`);

  buildSubmissionPdf(submission, res);
});

module.exports = {
  listSubmissions,
  getSubmission,
  createSubmission,
  updateSubmission,
  deleteSubmission,
  updateModuleStatus,
  assignModuleOwner,
  exportSubmissionPdf,
};
