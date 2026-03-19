const { Notification } = require('../models');
const { successResponse } = require('../utils/helpers');

// Helper function to create a notification
const createNotification = async ({ user_id, title, title_ar, body, body_ar, type, reference_type, reference_id, data = {} }) => {
  try {
    const notification = await Notification.create({
      user_id, title, title_ar, body, body_ar,
      type, reference_type, reference_id, data,
    });

    // Emit via Socket.io if available
    if (global.io) {
      global.io.to(`user_${user_id}`).emit('notification', {
        id: notification.id, title, title_ar, body, body_ar, type,
        reference_type, reference_id, created_at: notification.created_at,
      });
    }

    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error.message);
  }
};

// @GET /api/notifications
const getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await Notification.findAndCountAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    const unreadCount = await Notification.count({
      where: { user_id: req.user.id, is_read: false },
    });

    return res.json({
      success: true,
      data: rows,
      unread_count: unreadCount,
      pagination: {
        total: count, page: parseInt(page),
        limit: parseInt(limit), totalPages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @PUT /api/notifications/mark-read
const markAllRead = async (req, res, next) => {
  try {
    await Notification.update(
      { is_read: true },
      { where: { user_id: req.user.id, is_read: false } }
    );
    return successResponse(res, {}, 'تم تحديد جميع الإشعارات كمقروءة');
  } catch (error) {
    next(error);
  }
};

// @PUT /api/notifications/:id/read
const markRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      where: { id: req.params.id, user_id: req.user.id },
    });

    if (!notification) return res.status(404).json({ success: false, message: 'الإشعار غير موجود' });

    await notification.update({ is_read: true });
    return successResponse(res, { data: notification }, 'تم تحديث الإشعار');
  } catch (error) {
    next(error);
  }
};

// @DELETE /api/notifications/clear
const clearNotifications = async (req, res, next) => {
  try {
    await Notification.destroy({ where: { user_id: req.user.id, is_read: true } });
    return successResponse(res, {}, 'تم مسح الإشعارات المقروءة');
  } catch (error) {
    next(error);
  }
};

module.exports = { createNotification, getNotifications, markAllRead, markRead, clearNotifications };

