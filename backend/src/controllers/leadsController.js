const { Op } = require('sequelize');
const { Lead, User, LeadActivity, Meeting, Role } = require('../models');
const { paginate, paginateResponse, formatPhone, successResponse, errorResponse } = require('../utils/helpers');
const { createNotification } = require('./notificationsController');

// @GET /api/leads
const getLeads = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, status, priority, date_from, date_to } = req.query;
    const { limit: lim, offset } = paginate(page, limit);
    const user = req.user;
    const whereClause = {};

    // Role-based filtering
    if (user.role.name === 'sales') {
      whereClause.assigned_to = user.id;
    } else if (user.role.name === 'manager') {
      whereClause.manager_id = user.id;
    }
    // admin sees all

    if (search) {
      whereClause[Op.or] = [
        { phone: { [Op.like]: `%${search}%` } },
        { name: { [Op.like]: `%${search}%` } },
        { company_name: { [Op.like]: `%${search}%` } },
      ];
    }

    if (status) whereClause.status = status;
    if (priority) whereClause.priority = priority;
    if (date_from || date_to) {
      whereClause.created_at = {};
      if (date_from) whereClause.created_at[Op.gte] = new Date(date_from);
      if (date_to) whereClause.created_at[Op.lte] = new Date(date_to + 'T23:59:59');
    }

    const { count, rows } = await Lead.findAndCountAll({
      where: whereClause,
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'leadManager', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'creator', attributes: ['id', 'name'] },
      ],
      order: [['created_at', 'DESC']],
      limit: lim,
      offset,
    });

    return res.json({ success: true, ...paginateResponse(rows, page, lim, count) });
  } catch (error) {
    next(error);
  }
};

// @GET /api/leads/search-phone
const searchByPhone = async (req, res, next) => {
  try {
    const { phone } = req.query;
    if (!phone) return errorResponse(res, 'رقم الهاتف مطلوب', 400);

    const formattedPhone = formatPhone(phone);
    const lead = await Lead.findOne({
      where: { phone: { [Op.like]: `%${formattedPhone}%` } },
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'name'] },
        { model: User, as: 'creator', attributes: ['id', 'name'] },
        {
          model: LeadActivity,
          as: 'activities',
          include: [{ model: User, as: 'user', attributes: ['id', 'name'] }],
          order: [['created_at', 'DESC']],
          limit: 20,
        },
        { model: Meeting, as: 'meetings', order: [['meeting_date', 'DESC']] },
      ],
    });

    if (!lead) {
      return res.json({ success: true, found: false, message: 'لا يوجد سجل لهذا الرقم' });
    }

    return res.json({ success: true, found: true, data: lead });
  } catch (error) {
    next(error);
  }
};

// @POST /api/leads
const createLead = async (req, res, next) => {
  try {
    const { phone, name, company_name, email, notes, source, priority, follow_up_date, first_contact_date } = req.body;

    if (!phone || !name) return errorResponse(res, 'رقم الهاتف والاسم مطلوبان', 400);

    const formattedPhone = formatPhone(phone);
    const existing = await Lead.findOne({ where: { phone: formattedPhone } });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'رقم الهاتف مسجل مسبقاً في النظام',
        existing_lead: { id: existing.id, name: existing.name, status: existing.status },
      });
    }

    const lead = await Lead.create({
      phone: formattedPhone, name, company_name, email, notes, source, priority,
      follow_up_date, first_contact_date: first_contact_date || new Date(),
      assigned_to: req.user.id, created_by: req.user.id, status: 'new', current_level: 1,
    });

    await LeadActivity.create({
      lead_id: lead.id, user_id: req.user.id,
      type: 'note', description: `تم إنشاء Lead جديد: ${name}`,
    });

    return successResponse(res, { data: lead }, 'تم إضافة العميل المحتمل بنجاح', 201);
  } catch (error) {
    next(error);
  }
};

// @PUT /api/leads/:id
const updateLead = async (req, res, next) => {
  try {
    const lead = await Lead.findByPk(req.params.id);
    if (!lead) return errorResponse(res, 'العميل غير موجود', 404);

    const user = req.user;
    if (user.role.name === 'sales' && lead.assigned_to !== user.id) {
      return errorResponse(res, 'ليس لديك صلاحية تعديل هذا العميل', 403);
    }

    const oldStatus = lead.status;
    await lead.update(req.body);

    if (req.body.status && req.body.status !== oldStatus) {
      await LeadActivity.create({
        lead_id: lead.id, user_id: user.id, type: 'status_change',
        description: `تغيير الحالة من ${oldStatus} إلى ${req.body.status}`,
        old_status: oldStatus, new_status: req.body.status,
      });
    }

    return successResponse(res, { data: lead }, 'تم تحديث البيانات بنجاح');
  } catch (error) {
    next(error);
  }
};

// @POST /api/leads/:id/transfer
const transferLead = async (req, res, next) => {
  try {
    const lead = await Lead.findByPk(req.params.id);
    if (!lead) return errorResponse(res, 'العميل غير موجود', 404);

    const { manager_id } = req.body;
    const manager = await User.findOne({
      where: { id: manager_id },
      include: [{ model: Role, as: 'role', where: { name: 'manager' } }],
    });

    if (!manager) return errorResponse(res, 'المدير غير موجود', 404);

    await lead.update({ manager_id, current_level: 2, transferred_at: new Date(), status: 'interested' });

    await LeadActivity.create({
      lead_id: lead.id, user_id: req.user.id, type: 'transfer',
      description: `تم تحويل العميل إلى المدير: ${manager.name}`,
    });

    await createNotification({
      user_id: manager_id, title: 'عميل جديد محول إليك',
      title_ar: 'عميل جديد محول إليك',
      body: `تم تحويل العميل ${lead.name} (${lead.phone}) إليك للمتابعة`,
      body_ar: `تم تحويل العميل ${lead.name} (${lead.phone}) إليك للمتابعة`,
      type: 'lead_transferred', reference_type: 'lead', reference_id: lead.id,
    });

    return successResponse(res, { data: lead }, 'تم تحويل العميل بنجاح');
  } catch (error) {
    next(error);
  }
};

// @POST /api/leads/:id/activities
const addActivity = async (req, res, next) => {
  try {
    const { type, description, call_result, call_duration } = req.body;
    const lead = await Lead.findByPk(req.params.id);
    if (!lead) return errorResponse(res, 'العميل غير موجود', 404);

    const activity = await LeadActivity.create({
      lead_id: lead.id, user_id: req.user.id,
      type, description, call_result, call_duration,
    });

    if (type === 'call') {
      await lead.update({ status: 'contacted' });
    }

    return successResponse(res, { data: activity }, 'تم تسجيل النشاط بنجاح', 201);
  } catch (error) {
    next(error);
  }
};

// @GET /api/leads/:id
const getLead = async (req, res, next) => {
  try {
    const lead = await Lead.findByPk(req.params.id, {
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'leadManager', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'creator', attributes: ['id', 'name'] },
        { model: LeadActivity, as: 'activities', include: [{ model: User, as: 'user', attributes: ['id', 'name'] }], order: [['created_at', 'DESC']] },
        { model: Meeting, as: 'meetings', order: [['meeting_date', 'DESC']] },
      ],
    });
    if (!lead) return errorResponse(res, 'العميل غير موجود', 404);
    return successResponse(res, { data: lead });
  } catch (error) {
    next(error);
  }
};

module.exports = { getLeads, searchByPhone, createLead, updateLead, transferLead, addActivity, getLead };

