const AuditLog = require('../models/AuditLog');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/audit?page=1&limit=20&entityType=&action=  (admin only)
const listAuditLogs = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const { entityType, action } = req.query;

  const filter = {};
  if (entityType) filter.entityType = entityType;
  if (action) filter.action = action;

  const total = await AuditLog.countDocuments(filter);
  const logs = await AuditLog.find(filter)
    .populate('userId', 'name email role')
    .sort({ timestamp: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  res.json({
    logs,
    page,
    pages: Math.ceil(total / limit) || 1,
    total,
  });
});

// GET /api/audit/recent?limit=10&entityType=&entityId=
// Powers the activity feed on the dashboard, product and submission pages.
// Available to any authenticated user.
const recentActivity = asyncHandler(async (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
  const { entityType, entityId } = req.query;

  const filter = {};
  if (entityType) filter.entityType = entityType;
  if (entityId) filter.entityId = entityId;

  const logs = await AuditLog.find(filter)
    .populate('userId', 'name role')
    .sort({ timestamp: -1 })
    .limit(limit)
    .select('entityType entityId action userId timestamp summary');

  res.json({ logs });
});

module.exports = { listAuditLogs, recentActivity };
