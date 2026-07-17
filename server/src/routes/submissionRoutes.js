const express = require('express');
const { body } = require('express-validator');
const {
  listSubmissions,
  getSubmission,
  createSubmission,
  updateSubmission,
  deleteSubmission,
  updateModuleStatus,
  assignModuleOwner,
  exportSubmissionPdf,
} = require('../controllers/submissionController');
const {
  uploadDocument,
  downloadDocument,
  markVersionCurrent,
} = require('../controllers/documentController');
const { verifyToken, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { upload } = require('../middleware/upload');
const {
  AUTHORITIES,
  SUBMISSION_TYPES,
  SUBMISSION_STATUSES,
  MODULE_STATUSES,
} = require('../models/Submission');

const router = express.Router();

router.use(verifyToken);

router.get('/', listSubmissions);
router.get('/:id', getSubmission);
router.get('/:id/export', exportSubmissionPdf);

router.post(
  '/',
  requireRole('regulatory', 'admin'),
  [
    body('productId').isMongoId().withMessage('A valid product id is required'),
    body('regulatoryAuthority').isIn(AUTHORITIES).withMessage(`Authority must be one of: ${AUTHORITIES.join(', ')}`),
    body('submissionType').isIn(SUBMISSION_TYPES).withMessage(`Type must be one of: ${SUBMISSION_TYPES.join(', ')}`),
    body('targetDate').isISO8601().withMessage('Target date must be a valid date'),
  ],
  validate,
  createSubmission
);

router.put(
  '/:id',
  requireRole('regulatory', 'admin'),
  [
    body('regulatoryAuthority').optional().isIn(AUTHORITIES),
    body('submissionType').optional().isIn(SUBMISSION_TYPES),
    body('targetDate').optional().isISO8601(),
    body('status').optional().isIn(SUBMISSION_STATUSES),
  ],
  validate,
  updateSubmission
);

router.delete('/:id', requireRole('regulatory', 'admin'), deleteSubmission);

// Module-level operations. Any authenticated team member can update status
// and upload documents; owner assignment is restricted to regulatory and admin.
router.patch(
  '/:id/modules/:moduleId/status',
  [body('status').isIn(MODULE_STATUSES).withMessage(`Status must be one of: ${MODULE_STATUSES.join(', ')}`)],
  validate,
  updateModuleStatus
);

router.patch(
  '/:id/modules/:moduleId/owner',
  requireRole('regulatory', 'admin'),
  [body('ownerId').optional({ values: 'null' }).isMongoId().withMessage('ownerId must be a valid user id')],
  validate,
  assignModuleOwner
);

// Documents
router.post('/:id/modules/:moduleId/documents', upload.single('file'), uploadDocument);
router.get('/:id/modules/:moduleId/documents/:documentId/download', downloadDocument);
router.patch('/:id/modules/:moduleId/documents/:documentId/current', markVersionCurrent);

module.exports = router;
