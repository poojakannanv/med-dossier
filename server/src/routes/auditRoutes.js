const express = require('express');
const { listAuditLogs, recentActivity } = require('../controllers/auditController');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(verifyToken);

// Activity feed for dashboard and detail pages (any authenticated user).
router.get('/recent', recentActivity);

// Full audit log viewer (admin only).
router.get('/', requireRole('admin'), listAuditLogs);

module.exports = router;
