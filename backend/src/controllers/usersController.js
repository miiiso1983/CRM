const { User, Role, Lead } = require('../models');
const { successResponse, errorResponse, paginate, paginateResponse } = require('../utils/helpers');
const { Op } = require('sequelize');

// @GET /api/users
const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, role, is_active, manager_id } = req.query;
    const { limit: lim, offset } = paginate(page, limit);
    const where = {};

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

    const includeRole = { model: Role, as: 'role' };
    if (role) includeRole.where = { name: role };

    if (is_active !== undefined) where.is_active = is_active === 'true';
    if (manager_id) where.manager_id = manager_id;

    const { count, rows } = await User.findAndCountAll({
      where,
      include: [
        includeRole,
        { model: User, as: 'manager', attributes: ['id', 'name'] },
      ],
      order: [['created_at', 'DESC']],
      limit: lim, offset,
    });

    return res.json({ success: true, ...paginateResponse(rows, page, lim, count) });
  } catch (error) {
    next(error);
  }
};

// @POST /api/users
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, phone, role_id, manager_id } = req.body;

    if (!name || !email || !password || !role_id) {
      return errorResponse(res, 'الاسم، البريد الإلكتروني، كلمة المرور، والدور مطلوبة', 400);
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) return errorResponse(res, 'البريد الإلكتروني مسجل مسبقاً', 409);

    const user = await User.create({ name, email, password, phone, role_id, manager_id });

    const userWithRole = await User.findByPk(user.id, {
      include: [{ model: Role, as: 'role' }],
    });

    return successResponse(res, { data: userWithRole }, 'تم إنشاء المستخدم بنجاح', 201);
  } catch (error) {
    next(error);
  }
};

// @GET /api/users/:id
const getUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, {
      include: [
        { model: Role, as: 'role' },
        { model: User, as: 'manager', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'subordinates', attributes: ['id', 'name', 'email'] },
      ],
    });
    if (!user) return errorResponse(res, 'المستخدم غير موجود', 404);
    return successResponse(res, { data: user });
  } catch (error) {
    next(error);
  }
};

// @PUT /api/users/:id
const updateUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return errorResponse(res, 'المستخدم غير موجود', 404);

    const { password, ...updateData } = req.body;
    if (password) updateData.password = password;

    await user.update(updateData);
    const updated = await User.findByPk(user.id, { include: [{ model: Role, as: 'role' }] });
    return successResponse(res, { data: updated }, 'تم تحديث المستخدم بنجاح');
  } catch (error) {
    next(error);
  }
};

// @DELETE /api/users/:id
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return errorResponse(res, 'المستخدم غير موجود', 404);

    if (req.user.id === user.id) return errorResponse(res, 'لا يمكنك حذف حسابك الخاص', 400);

    await user.update({ is_active: false });
    return successResponse(res, {}, 'تم تعطيل المستخدم بنجاح');
  } catch (error) {
    next(error);
  }
};

// @GET /api/users/managers
const getManagers = async (req, res, next) => {
  try {
    const managerRole = await Role.findOne({ where: { name: 'manager' } });
    if (!managerRole) return successResponse(res, { data: [] });

    const managers = await User.findAll({
      where: { role_id: managerRole.id, is_active: true },
      attributes: ['id', 'name', 'email', 'phone'],
    });

    return successResponse(res, { data: managers });
  } catch (error) {
    next(error);
  }
};

module.exports = { getUsers, createUser, getUser, updateUser, deleteUser, getManagers };

