const { Meeting, Lead, User, LeadActivity } = require('../models');
const { paginate, paginateResponse, successResponse, errorResponse } = require('../utils/helpers');
const { createNotification } = require('./notificationsController');
const { getRoleKey } = require('../utils/roles');
const { Op } = require('sequelize');

// @GET /api/meetings
const getMeetings = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, date_from, date_to } = req.query;
    const { limit: lim, offset } = paginate(page, limit);
    const user = req.user;
    const where = {};
    const roleKey = getRoleKey(user);

    if (roleKey === 'manager') {
      where.scheduled_by = user.id;
    } else if (roleKey === 'sales') {
      // Sales can see meetings for their leads
      const salesLeads = await Lead.findAll({ where: { assigned_to: user.id }, attributes: ['id'] });
      where.lead_id = { [Op.in]: salesLeads.map(l => l.id) };
    }

    if (status) where.status = status;
    if (date_from || date_to) {
      where.meeting_date = {};
      if (date_from) where.meeting_date[Op.gte] = new Date(date_from);
      if (date_to) where.meeting_date[Op.lte] = new Date(date_to + 'T23:59:59');
    }

    const { count, rows } = await Meeting.findAndCountAll({
      where,
      include: [
        { model: Lead, as: 'lead', attributes: ['id', 'name', 'phone', 'company_name', 'status'] },
        { model: User, as: 'scheduler', attributes: ['id', 'name'] },
      ],
      order: [['meeting_date', 'ASC']],
      limit: lim, offset,
    });

    return res.json({ success: true, ...paginateResponse(rows, page, lim, count) });
  } catch (error) {
    next(error);
  }
};

// @POST /api/meetings
const createMeeting = async (req, res, next) => {
  try {
    const { lead_id, title, description, meeting_date, location, meeting_type, attendees } = req.body;

    if (!lead_id || !title || !meeting_date) {
      return errorResponse(res, 'العميل، العنوان، وتاريخ الاجتماع مطلوبة', 400);
    }

    const lead = await Lead.findByPk(lead_id);
    if (!lead) return errorResponse(res, 'العميل غير موجود', 404);

    const meeting = await Meeting.create({
      lead_id, title, description, meeting_date, location, meeting_type,
      attendees: attendees || [], scheduled_by: req.user.id,
    });

    await lead.update({ meeting_date, status: 'negotiating' });

    await LeadActivity.create({
      lead_id, user_id: req.user.id, type: 'meeting',
      description: `تم جدولة اجتماع: ${title} في ${new Date(meeting_date).toLocaleString('ar-SA')}`,
      scheduled_at: meeting_date,
    });

    // Notify attendees
    if (attendees && attendees.length > 0) {
      for (const attendeeId of attendees) {
        await createNotification({
          user_id: attendeeId,
          title: 'دعوة اجتماع جديد',
          title_ar: 'دعوة اجتماع جديد',
          body: `اجتماع: ${title} - ${new Date(meeting_date).toLocaleString('ar-SA')}`,
          body_ar: `اجتماع: ${title} - ${new Date(meeting_date).toLocaleString('ar-SA')}`,
          type: 'meeting_reminder',
          reference_type: 'meeting',
          reference_id: meeting.id,
        });
      }
    }

    return successResponse(res, { data: meeting }, 'تم جدولة الاجتماع بنجاح', 201);
  } catch (error) {
    next(error);
  }
};

// @PUT /api/meetings/:id
const updateMeeting = async (req, res, next) => {
  try {
    const meeting = await Meeting.findByPk(req.params.id);
    if (!meeting) return errorResponse(res, 'الاجتماع غير موجود', 404);

    if (meeting.scheduled_by !== req.user.id && getRoleKey(req.user) !== 'admin') {
      return errorResponse(res, 'ليس لديك صلاحية تعديل هذا الاجتماع', 403);
    }

    await meeting.update(req.body);

    if (req.body.outcome) {
      await LeadActivity.create({
        lead_id: meeting.lead_id, user_id: req.user.id, type: 'meeting',
        description: `نتيجة الاجتماع: ${req.body.outcome}`,
      });
    }

    return successResponse(res, { data: meeting }, 'تم تحديث الاجتماع بنجاح');
  } catch (error) {
    next(error);
  }
};

// @GET /api/meetings/calendar
const getCalendarEvents = async (req, res, next) => {
  try {
    const { start, end } = req.query;
    const user = req.user;
    const where = {};

    if (getRoleKey(user) === 'manager') where.scheduled_by = user.id;

    if (start && end) {
      where.meeting_date = { [Op.between]: [new Date(start), new Date(end)] };
    }

    const meetings = await Meeting.findAll({
      where,
      include: [{ model: Lead, as: 'lead', attributes: ['id', 'name', 'phone'] }],
    });

    const events = meetings.map(m => ({
      id: m.id,
      title: m.title,
      start: m.meeting_date,
      end: m.meeting_date,
      type: 'meeting',
      status: m.status,
      lead: m.lead,
      location: m.location,
    }));

    return successResponse(res, { data: events });
  } catch (error) {
    next(error);
  }
};

// @DELETE /api/meetings/:id
const deleteMeeting = async (req, res, next) => {
  try {
    const meeting = await Meeting.findByPk(req.params.id);
    if (!meeting) return errorResponse(res, 'الاجتماع غير موجود', 404);
    await meeting.destroy();
    return successResponse(res, {}, 'تم حذف الاجتماع');
  } catch (error) {
    next(error);
  }
};

module.exports = { getMeetings, createMeeting, updateMeeting, getCalendarEvents, deleteMeeting };

