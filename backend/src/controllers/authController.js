const { User, Role } = require('../models');
const { generateToken, successResponse, errorResponse } = require('../utils/helpers');

// @POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorResponse(res, 'البريد الإلكتروني وكلمة المرور مطلوبان', 400);
    }

    const user = await User.findOne({
      where: { email },
      include: [{ model: Role, as: 'role' }],
    });

    if (!user || !(await user.comparePassword(password))) {
      return errorResponse(res, 'البريد الإلكتروني أو كلمة المرور غير صحيحة', 401);
    }

    if (!user.is_active) {
      return errorResponse(res, 'حسابك غير نشط. تواصل مع المدير', 403);
    }

    await user.update({ last_login: new Date() });

    const token = generateToken(user.id);

    return successResponse(res, {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
        manager_id: user.manager_id,
      },
    }, 'تم تسجيل الدخول بنجاح');
  } catch (error) {
    next(error);
  }
};

// @GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [
        { model: Role, as: 'role' },
        { model: User, as: 'manager', attributes: ['id', 'name', 'email'] },
      ],
    });

    return successResponse(res, { user });
  } catch (error) {
    next(error);
  }
};

// @PUT /api/auth/update-fcm-token
const updateFCMToken = async (req, res, next) => {
  try {
    const { fcm_token } = req.body;

    await req.user.update({ fcm_token });

    return successResponse(res, {}, 'تم تحديث رمز الإشعارات');
  } catch (error) {
    next(error);
  }
};

// @PUT /api/auth/change-password
const changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return errorResponse(res, 'كلمة المرور الحالية والجديدة مطلوبتان', 400);
    }

    const user = await User.findByPk(req.user.id);
    const isMatch = await user.comparePassword(current_password);

    if (!isMatch) {
      return errorResponse(res, 'كلمة المرور الحالية غير صحيحة', 400);
    }

    if (new_password.length < 6) {
      return errorResponse(res, 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل', 400);
    }

    await user.update({ password: new_password });

    return successResponse(res, {}, 'تم تغيير كلمة المرور بنجاح');
  } catch (error) {
    next(error);
  }
};

module.exports = { login, getMe, updateFCMToken, changePassword };

