const jwt = require('jsonwebtoken');
const { User } = require('../models');

// All platform-side staff roles (not students/institutes)
const STAFF_ROLES = ['superadmin', 'admin', 'accountant', 'content_manager', 'teacher'];

exports.STAFF_ROLES = STAFF_ROLES;

exports.protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized — No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findByPk(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Unauthorized — User not found or inactive' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Authorize by explicit role list
exports.authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: `Access denied — Required: ${roles.join(', ')}` });
  }
  next();
};

// Authorize any staff member (all admin-type roles)
exports.authorizeStaff = (req, res, next) => {
  if (!STAFF_ROLES.includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied — Staff access required' });
  }
  next();
};

// Authorize superadmin OR admin roles only
exports.authorizeAdmin = (req, res, next) => {
  if (!['superadmin', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied — Admin access required' });
  }
  next();
};

exports.optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findByPk(decoded.id);
    }
  } catch (err) {}
  next();
};
