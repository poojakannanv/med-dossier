const AuditLog = require('../models/AuditLog');

/**
 * Records an audit log entry. Called from controllers on every create, update,
 * delete, upload and auth event. Deliberately fire-and-forget: an audit write
 * failure must never break the user-facing operation, so errors are logged
 * and swallowed.
 *
 * @param {Object} params
 * @param {string} params.entityType  user | product | submission | module | document
 * @param {string|Object} params.entityId  ObjectId of the affected entity
 * @param {string} params.action  create | update | delete | upload | download | login | register
 * @param {string|Object} params.userId  ObjectId of the acting user
 * @param {Object|null} [params.before]  snapshot before the change
 * @param {Object|null} [params.after]  snapshot after the change
 * @param {string} [params.summary]  short human-readable description
 */
const logAudit = async ({ entityType, entityId, action, userId, before = null, after = null, summary = '' }) => {
  try {
    await AuditLog.create({
      entityType,
      entityId,
      action,
      userId,
      changes: { before, after },
      summary,
    });
  } catch (err) {
    console.error(`[audit] failed to write audit entry: ${err.message}`);
  }
};

// Strips noisy fields from snapshots stored in the audit trail.
const snapshot = (doc, omit = ['password', '__v']) => {
  if (!doc) return null;
  const plain = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
  omit.forEach((key) => delete plain[key]);
  return plain;
};

module.exports = { logAudit, snapshot };
