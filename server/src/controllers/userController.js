const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { logAudit } = require('../services/auditService');
const { sendWelcomeEmail } = require('../services/emailService');

// GET /api/users  (admin only)
const listUsers = asyncHandler(async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json({ users: users.map((u) => u.toSafeObject()) });
});

// GET /api/users/assignable
// Lightweight list for module owner dropdowns. Any authenticated user.
const listAssignableUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ isActive: true }).select('name email role').sort({ name: 1 });
  res.json({ users });
});

// POST /api/users  (admin only)
const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ message: 'An account with that email already exists' });
  }

  const user = await User.create({ name, email, password, role });

  await logAudit({
    entityType: 'user',
    entityId: user._id,
    action: 'create',
    userId: req.user._id,
    after: { name: user.name, email: user.email, role: user.role },
    summary: `User ${user.name} created by admin with role ${user.role}`,
  });

  sendWelcomeEmail(user).catch(() => {});

  res.status(201).json({ user: user.toSafeObject() });
});

// PATCH /api/users/:id/role  (admin only)
const changeRole = asyncHandler(async (req, res) => {
  const { role } = req.body;

  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  if (String(user._id) === String(req.user._id)) {
    return res.status(400).json({ message: 'You cannot change your own role' });
  }

  const before = { role: user.role };
  user.role = role;
  await user.save();

  await logAudit({
    entityType: 'user',
    entityId: user._id,
    action: 'update',
    userId: req.user._id,
    before,
    after: { role: user.role },
    summary: `Role of ${user.name} changed from ${before.role} to ${role}`,
  });

  res.json({ user: user.toSafeObject() });
});

// PATCH /api/users/:id/status  (admin only)  body: { isActive: boolean }
const changeStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;

  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  if (String(user._id) === String(req.user._id)) {
    return res.status(400).json({ message: 'You cannot deactivate your own account' });
  }

  const before = { isActive: user.isActive };
  user.isActive = Boolean(isActive);
  await user.save();

  await logAudit({
    entityType: 'user',
    entityId: user._id,
    action: 'update',
    userId: req.user._id,
    before,
    after: { isActive: user.isActive },
    summary: `${user.name} ${user.isActive ? 'reactivated' : 'deactivated'}`,
  });

  res.json({ user: user.toSafeObject() });
});

module.exports = { listUsers, listAssignableUsers, createUser, changeRole, changeStatus };
