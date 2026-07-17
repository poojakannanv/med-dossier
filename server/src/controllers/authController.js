const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { logAudit } = require('../services/auditService');
const { sendWelcomeEmail } = require('../services/emailService');

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ message: 'An account with that email already exists' });
  }

  const user = await User.create({ name, email, password, role });

  await logAudit({
    entityType: 'user',
    entityId: user._id,
    action: 'register',
    userId: user._id,
    after: { name: user.name, email: user.email, role: user.role },
    summary: `${user.name} registered with role ${user.role}`,
  });

  // Fire and forget, must not block registration.
  sendWelcomeEmail(user).catch(() => {});

  res.status(201).json({
    token: signToken(user),
    user: user.toSafeObject(),
  });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  if (!user.isActive) {
    return res.status(403).json({ message: 'Account has been deactivated. Contact an administrator.' });
  }

  await logAudit({
    entityType: 'user',
    entityId: user._id,
    action: 'login',
    userId: user._id,
    summary: `${user.name} logged in`,
  });

  res.json({
    token: signToken(user),
    user: user.toSafeObject(),
  });
});

// GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  res.json({ user: req.user.toSafeObject() });
});

module.exports = { register, login, getMe };
