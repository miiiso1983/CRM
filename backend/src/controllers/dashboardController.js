const { Op, fn, col, literal } = require('sequelize');
const { sequelize } = require('../config/database');
const { Lead, User, Meeting, LeadActivity, Notification } = require('../models');
const { successResponse } = require('../utils/helpers');

// @GET /api/dashboard
const getDashboard = async (req, res, next) => {
  try {
    const user = req.user;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
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
      where: { ...where, created_at: { [Op.between]: [startOfMonth, endOfMonth] } },
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
      where: { ...where, follow_up_date: new Date().toISOString().split('T')[0] },
    });

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
            AND l.created_at BETWEEN :startOfMonth AND :endOfMonth
          GROUP BY u.id, u.name
          ORDER BY total_leads DESC
          LIMIT 10
        `, {
          replacements: { startOfMonth, endOfMonth },
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
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const count = await Lead.count({ where: { ...where, created_at: { [Op.between]: [start, end] } } });
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

