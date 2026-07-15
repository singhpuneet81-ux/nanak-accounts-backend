const { effectiveModules } = require('../config/modules');

function requireRole(...allowed) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    next();
  };
}

// Grants access when the user's effective module list includes the given module.
function requireModule(moduleKey) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    if (!effectiveModules(req.user).includes(moduleKey)) {
      return res.status(403).json({ success: false, message: 'You do not have access to this module' });
    }
    next();
  };
}

module.exports = { requireRole, requireModule };
