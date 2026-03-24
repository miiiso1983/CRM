const { Op } = require('sequelize');
const { Lead, User, LeadActivity, Meeting, Role } = require('../models');
const { paginate, paginateResponse, formatPhone, successResponse, errorResponse } = require('../utils/helpers');
const { getRoleKey } = require('../utils/roles');
const { createNotification } = require('./notificationsController');

// @GET /api/leads
const getLeads = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, status, priority, date_from, date_to } = req.query;
    const { limit: lim, offset } = paginate(page, limit);
    const user = req.user;
    const whereClause = {};
    const roleKey = getRoleKey(user);

    // Role-based filtering
    if (roleKey === 'sales') {
      whereClause.assigned_to = user.id;
    } else if (roleKey === 'manager') {
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
    const { phone, name, company_name, email, position, notes, source, priority, follow_up_date, first_contact_date } = req.body;

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
      phone: formattedPhone, name, company_name, email, position, notes, source, priority,
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
    if (getRoleKey(user) === 'sales' && lead.assigned_to !== user.id) {
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
      include: [{ model: Role, as: 'role', where: { level: 2 } }],
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

// @POST /api/leads/bulk-upload
const bulkCreateLeads = async (req, res, next) => {
  try {
    if (!req.file) return errorResponse(res, 'يرجى رفع ملف CSV أو Excel', 400);

    const XLSX = require('xlsx');
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });

    if (!rows.length) return errorResponse(res, 'الملف فارغ', 400);

    // Map common column names (Arabic & English)
    const colMap = {
      'phone': 'phone', 'هاتف': 'phone', 'رقم الهاتف': 'phone', 'الهاتف': 'phone', 'mobile': 'phone', 'الجوال': 'phone',
      'name': 'name', 'الاسم': 'name', 'اسم': 'name', 'الاسم الكامل': 'name', 'full name': 'name',
      'company': 'company_name', 'company_name': 'company_name', 'الشركة': 'company_name', 'اسم الشركة': 'company_name',
      'email': 'email', 'البريد': 'email', 'الإيميل': 'email', 'البريد الإلكتروني': 'email',
      'notes': 'notes', 'ملاحظات': 'notes', 'note': 'notes',
      'source': 'source', 'المصدر': 'source',
      'priority': 'priority', 'الأولوية': 'priority',
      'position': 'position', 'المنصب': 'position', 'الوظيفة': 'position', 'المسمى الوظيفي': 'position',
    };

    const results = { created: 0, duplicates: 0, errors: 0, details: [] };

    for (let i = 0; i < rows.length; i++) {
      const raw = rows[i];
      const mapped = {};

      // Map columns
      for (const [key, val] of Object.entries(raw)) {
        const normalizedKey = key.trim().toLowerCase();
        const mappedKey = colMap[normalizedKey];
        if (mappedKey) mapped[mappedKey] = String(val).trim();
      }

      // Validate required fields
      if (!mapped.phone || !mapped.name) {
        results.errors++;
        results.details.push({ row: i + 2, phone: mapped.phone || '', name: mapped.name || '', status: 'error', message: 'الاسم ورقم الهاتف مطلوبان' });
        continue;
      }

      try {
        const formattedPhone = formatPhone(mapped.phone);
        const existing = await Lead.findOne({ where: { phone: formattedPhone } });

        if (existing) {
          results.duplicates++;
          results.details.push({ row: i + 2, phone: formattedPhone, name: mapped.name, status: 'duplicate', message: `مسجل مسبقاً (${existing.name})` });
          continue;
        }

        const validPriorities = ['low', 'medium', 'high'];
        const priority = validPriorities.includes(mapped.priority) ? mapped.priority : 'medium';

        await Lead.create({
          phone: formattedPhone,
          name: mapped.name,
          company_name: mapped.company_name || null,
          email: mapped.email || null,
          position: mapped.position || null,
          notes: mapped.notes || null,
          source: mapped.source || 'bulk_upload',
          priority,
          assigned_to: req.user.id,
          created_by: req.user.id,
          status: 'new',
          current_level: 1,
          first_contact_date: new Date(),
        });

        results.created++;
        results.details.push({ row: i + 2, phone: formattedPhone, name: mapped.name, status: 'created', message: 'تم الإضافة' });
      } catch (err) {
        results.errors++;
        results.details.push({ row: i + 2, phone: mapped.phone, name: mapped.name, status: 'error', message: err.message });
      }
    }

    return successResponse(res, { results }, `تم رفع ${results.created} عميل، ${results.duplicates} مكرر، ${results.errors} أخطاء`);
  } catch (error) {
    next(error);
  }
};

module.exports = { getLeads, searchByPhone, createLead, updateLead, transferLead, addActivity, getLead, bulkCreateLeads };

