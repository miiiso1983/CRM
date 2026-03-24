const jwt = require('jsonwebtoken');
const { User, Role } = require('../models');
const { getRoleKey, getRoleLevel } = require('../utils/roles');

const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'غير مصرح. يرجى تسجيل الدخول',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id, {
      include: [{ model: Role, as: 'role' }],
    });

    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'المستخدم غير موجود أو غير نشط',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'رمز التحقق غير صالح',
    });
  }
};

// Role-based access control
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح لك بهذا الإجراء',
      });
    }

    const userRole = getRoleKey(req.user);

    if (!roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `الدور ${req.user.role.name_ar || userRole} غير مصرح له بهذا الإجراء`,
      });
    }

    next();
  };
};

// Level-based access (minimum level required)
const minLevel = (level) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ success: false, message: 'غير مصرح' });
    }

    if (getRoleLevel(req.user) < level) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك الصلاحية الكافية لهذا الإجراء',
      });
    }

    next();
  };
};

module.exports = { protect, authorize, minLevel };

