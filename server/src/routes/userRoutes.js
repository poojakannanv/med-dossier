const express = require('express');
const { body } = require('express-validator');
const {
  listUsers,
  listAssignableUsers,
  createUser,
  changeRole,
  changeStatus,
} = require('../controllers/userController');
const { verifyToken, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { ROLES } = require('../models/User');

const router = express.Router();

router.use(verifyToken);

// Available to all authenticated users (populates owner dropdowns).
router.get('/assignable', listAssignableUsers);

// Everything below is admin only.
router.use(requireRole('admin'));

router.get('/', listUsers);

router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
    body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('role').isIn(ROLES).withMessage(`Role must be one of: ${ROLES.join(', ')}`),
  ],
  validate,
  createUser
);

router.patch(
  '/:id/role',
  [body('role').isIn(ROLES).withMessage(`Role must be one of: ${ROLES.join(', ')}`)],
  validate,
  changeRole
);

router.patch(
  '/:id/status',
  [body('isActive').isBoolean().withMessage('isActive must be true or false')],
  validate,
  changeStatus
);

module.exports = router;
