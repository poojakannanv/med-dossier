const path = require('path');
const fs = require('fs');
const Submission = require('../models/Submission');
const asyncHandler = require('../utils/asyncHandler');
const { logAudit } = require('../services/auditService');
const { UPLOAD_DIR } = require('../middleware/upload');

const POPULATE = [
  { path: 'productId', select: 'productName' },
  { path: 'modules.owner', select: 'name email role' },
  { path: 'modules.documents.uploadedBy', select: 'name email' },
];

const findSubmissionAndModule = async (submissionId, moduleId) => {
  const submission = await Submission.findById(submissionId);
  if (!submission) return { error: { status: 404, message: 'Submission not found' } };
  const module = submission.modules.id(moduleId);
  if (!module) return { error: { status: 404, message: 'Module not found on this submission' } };
  return { submission, module };
};

// POST /api/submissions/:id/modules/:moduleId/documents  (multipart, field name "file")
// Each upload becomes the next version and is marked current.
const uploadDocument = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file provided. Use multipart form field "file".' });
  }

  const { submission, module, error } = await findSubmissionAndModule(req.params.id, req.params.moduleId);
  if (error) {
    // Remove the orphaned file multer already wrote to disk.
    fs.unlink(req.file.path, () => {});
    return res.status(error.status).json({ message: error.message });
  }

  const nextVersion = module.documents.reduce((max, d) => Math.max(max, d.version), 0) + 1;

  module.documents.forEach((d) => {
    d.isCurrent = false;
  });
  module.documents.push({
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
    mimeType: req.file.mimetype,
    uploadedBy: req.user._id,
    uploadedAt: new Date(),
    version: nextVersion,
    isCurrent: true,
  });
  module.updatedAt = new Date();

  // First upload nudges a not-started module into draft.
  if (module.status === 'not-started') {
    module.status = 'draft';
  }

  await submission.save();

  const savedDoc = module.documents[module.documents.length - 1];

  await logAudit({
    entityType: 'document',
    entityId: savedDoc._id,
    action: 'upload',
    userId: req.user._id,
    after: { originalName: savedDoc.originalName, version: savedDoc.version, module: module.code },
    summary: `Version ${nextVersion} of "${req.file.originalname}" uploaded to module ${module.code}`,
  });

  const populated = await Submission.findById(submission._id).populate(POPULATE);
  res.status(201).json({ submission: populated });
});

// GET /api/submissions/:id/modules/:moduleId/documents/:documentId/download
const downloadDocument = asyncHandler(async (req, res) => {
  const { module, error } = await findSubmissionAndModule(req.params.id, req.params.moduleId);
  if (error) {
    return res.status(error.status).json({ message: error.message });
  }

  const document = module.documents.id(req.params.documentId);
  if (!document) {
    return res.status(404).json({ message: 'Document version not found' });
  }

  const filePath = path.join(UPLOAD_DIR, document.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(410).json({ message: 'File no longer exists on the server' });
  }

  res.download(filePath, document.originalName);
});

// PATCH /api/submissions/:id/modules/:moduleId/documents/:documentId/current
const markVersionCurrent = asyncHandler(async (req, res) => {
  const { submission, module, error } = await findSubmissionAndModule(req.params.id, req.params.moduleId);
  if (error) {
    return res.status(error.status).json({ message: error.message });
  }

  const document = module.documents.id(req.params.documentId);
  if (!document) {
    return res.status(404).json({ message: 'Document version not found' });
  }

  const previousCurrent = module.documents.find((d) => d.isCurrent);
  module.documents.forEach((d) => {
    d.isCurrent = String(d._id) === String(document._id);
  });
  module.updatedAt = new Date();
  await submission.save();

  await logAudit({
    entityType: 'document',
    entityId: document._id,
    action: 'update',
    userId: req.user._id,
    before: previousCurrent ? { currentVersion: previousCurrent.version } : null,
    after: { currentVersion: document.version },
    summary: `Version ${document.version} of "${document.originalName}" marked current on module ${module.code}`,
  });

  const populated = await Submission.findById(submission._id).populate(POPULATE);
  res.json({ submission: populated });
});

module.exports = { uploadDocument, downloadDocument, markVersionCurrent };
