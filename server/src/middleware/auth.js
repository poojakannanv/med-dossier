const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verifies the Bearer token and attaches the user document to req.user.
const verifyToken = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorised, no token provided' });
    }
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Not authorised, user no longer exists' });
    }
    if (!user.isActive) {
      return res.status(403).json({ message: 'Account has been deactivated' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Not authorised, token invalid or expired' });
  }
};

// Restricts a route to one or more roles. Usage: requireRole('admin') or requireRole('regulatory', 'admin').
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authorised' });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      message: `Access denied. Requires one of the following roles: ${roles.join(', ')}`,
    });
  }
  next();
};

module.exports = { verifyToken, requireRole };
