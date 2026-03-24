const { Op, fn, col } = require('sequelize');
const { sequelize } = require('../config/database');
const { Lead, User, Meeting, LeadActivity } = require('../models');
const { successResponse } = require('../utils/helpers');

// @GET /api/dashboard
const getDashboard = async (req, res, next) => {
  try {
    const user = req.user;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const todayDate = now.toISOString().split('T')[0];
    const where = {};

    if (user.role.name === 'sales') where.assigned_to = user.id;
    else if (user.role.name === 'manager') where.manager_id = user.id;

    // Lead counts by status
    const leadStats = await Lead.findAll({
      where,
      attributes: ['status', [fn('COUNT', col('id')), 'count']],
      group: ['status'],
      raw: true,
    });

    const totalLeads = await Lead.count({ where });
    const thisMonthLeads = await Lead.count({
      where: { ...where, created_at: { [Op.gte]: startOfMonth, [Op.lt]: startOfNextMonth } },
    });

    const contracted = await Lead.count({ where: { ...where, status: 'contracted' } });
    const conversionRate = totalLeads > 0 ? ((contracted / totalLeads) * 100).toFixed(1) : 0;

    // Upcoming meetings
    const upcomingMeetings = await Meeting.findAll({
      where: {
        ...(user.role.name === 'manager' ? { scheduled_by: user.id } : {}),
        meeting_date: { [Op.gte]: now },
        status: 'scheduled',
      },
      include: [{ model: Lead, as: 'lead', attributes: ['id', 'name', 'phone'] }],
      order: [['meeting_date', 'ASC']],
      limit: 5,
    });

    // Follow-up reminders
    const todayFollowUps = await Lead.count({
      where: { ...where, follow_up_date: todayDate },
    });

    // Direct subordinates performance for managers/admins
    let subordinateStats = [];
    if (['manager', 'admin'].includes(user.role.name)) {
      const isManager = user.role.name === 'manager';
      const subordinateWhereClause = isManager
        ? `
          AND (
            u.manager_id = :managerId
            OR EXISTS (
              SELECT 1
              FROM leads manager_leads
              WHERE manager_leads.assigned_to = u.id
                AND manager_leads.manager_id = :managerId
            )
          )
        `
        : '';
      const callsManagerFilter = isManager ? 'AND l.manager_id = :managerId' : '';
      const leadsManagerFilter = isManager ? 'AND manager_id = :managerId' : '';
      const replacements = {
        todayDate,
        startOfMonth,
        startOfNextMonth,
        ...(isManager ? { managerId: user.id } : {}),
      };

      const [rows] = await sequelize.query(`
        SELECT
          u.id,
          u.name,
          COALESCE(c.calls_today, 0) AS calls_today,
          COALESCE(ls.interested_leads, 0) AS interested_leads,
          COALESCE(ls.new_leads_this_month, 0) AS new_leads_this_month,
          COALESCE(ls.contracted_leads, 0) AS contracted_leads,
          COALESCE(ls.follow_ups_due_today, 0) AS follow_ups_due_today,
          COALESCE(ls.total_assigned_leads, 0) AS total_assigned_leads
        FROM users u
        INNER JOIN roles r ON r.id = u.role_id AND r.name = 'sales'
        LEFT JOIN (
          SELECT
            la.user_id,
            COUNT(*) AS calls_today
          FROM lead_activities la
          INNER JOIN leads l ON l.id = la.lead_id
          WHERE la.type = 'call'
            AND DATE(la.created_at) = :todayDate
            ${callsManagerFilter}
          GROUP BY la.user_id
        ) c ON c.user_id = u.id
        LEFT JOIN (
          SELECT
            assigned_to,
            SUM(CASE WHEN status = 'interested' THEN 1 ELSE 0 END) AS interested_leads,
            SUM(CASE WHEN created_at >= :startOfMonth AND created_at < :startOfNextMonth THEN 1 ELSE 0 END) AS new_leads_this_month,
            SUM(CASE WHEN status = 'contracted' THEN 1 ELSE 0 END) AS contracted_leads,
            SUM(CASE WHEN follow_up_date = :todayDate THEN 1 ELSE 0 END) AS follow_ups_due_today,
            COUNT(*) AS total_assigned_leads
          FROM leads
          WHERE assigned_to IS NOT NULL
          ${leadsManagerFilter}
          GROUP BY assigned_to
        ) ls ON ls.assigned_to = u.id
        WHERE u.is_active = 1
        ${subordinateWhereClause}
        ORDER BY COALESCE(ls.total_assigned_leads, 0) DESC, u.name ASC
      `, { replacements });

      subordinateStats = rows.map((row) => ({
        id: Number(row.id),
        name: row.name,
        calls_today: Number(row.calls_today || 0),
        interested_leads: Number(row.interested_leads || 0),
        new_leads_this_month: Number(row.new_leads_this_month || 0),
        contracted_leads: Number(row.contracted_leads || 0),
        follow_ups_due_today: Number(row.follow_ups_due_today || 0),
        total_assigned_leads: Number(row.total_assigned_leads || 0),
      }));
    }

    // Recent activities
    const recentActivities = await LeadActivity.findAll({
      include: [
        { model: Lead, as: 'lead', attributes: ['id', 'name', 'phone'] },
        { model: User, as: 'user', attributes: ['id', 'name'] },
      ],
      where: user.role.name === 'sales' ? { user_id: user.id } : {},
      order: [['created_at', 'DESC']],
      limit: 10,
    });

    // For admin: team performance
    let teamPerformance = [];
    if (user.role.name === 'admin') {
      try {
        const [rows] = await sequelize.query(`
          SELECT u.id, u.name, COUNT(l.id) as total_leads
          FROM users u
          LEFT JOIN leads l ON l.assigned_to = u.id
            AND l.created_at >= :startOfMonth AND l.created_at < :startOfNextMonth
          GROUP BY u.id, u.name
          ORDER BY total_leads DESC
          LIMIT 10
        `, {
          replacements: { startOfMonth, startOfNextMonth },
        });
        teamPerformance = rows;
      } catch (e) {
        console.error('Team performance query error:', e.message);
        teamPerformance = [];
      }
    }

    // Monthly trend (last 6 months)
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const count = await Lead.count({ where: { ...where, created_at: { [Op.gte]: start, [Op.lt]: end } } });
      monthlyTrend.push({
        month: start.toLocaleString('ar-SA', { month: 'short', year: 'numeric' }),
        count,
      });
    }

    return successResponse(res, {
      data: {
        summary: {
          total_leads: totalLeads,
          this_month_leads: thisMonthLeads,
          contracted,
          conversion_rate: parseFloat(conversionRate),
          today_follow_ups: todayFollowUps,
          upcoming_meetings_count: upcomingMeetings.length,
        },
        lead_stats: leadStats,
        upcoming_meetings: upcomingMeetings,
        recent_activities: recentActivities,
        monthly_trend: monthlyTrend,
        subordinate_stats: subordinateStats,
        team_performance: teamPerformance,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @GET /api/dashboard/export
const exportLeads = async (req, res, next) => {
  try {
    const xlsx = require('xlsx');
    const user = req.user;
    const where = {};

    if (user.role.name === 'sales') where.assigned_to = user.id;
    else if (user.role.name === 'manager') where.manager_id = user.id;

    const leads = await Lead.findAll({
      where,
      include: [{ model: User, as: 'assignee', attributes: ['name'] }],
      raw: true,
    });

    const data = leads.map(l => ({
      'الاسم': l.name,
      'رقم الهاتف': l.phone,
      'اسم الشركة': l.company_name || '',
      'البريد الإلكتروني': l.email || '',
      'الحالة': l.status,
      'الأولوية': l.priority,
      'تاريخ أول اتصال': l.first_contact_date || '',
      'تاريخ المتابعة': l.follow_up_date || '',
      'المسؤول': l['assignee.name'] || '',
      'الملاحظات': l.notes || '',
      'تاريخ الإنشاء': l.created_at,
    }));

    const ws = xlsx.utils.json_to_sheet(data);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Leads');
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=leads_export.xlsx');
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboard, exportLeads };

