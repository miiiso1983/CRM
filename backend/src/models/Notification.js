const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  title_ar: {
    type: DataTypes.STRING(255),
    comment: 'Arabic title',
  },
  body: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  body_ar: {
    type: DataTypes.TEXT,
    comment: 'Arabic body',
  },
  type: {
    type: DataTypes.ENUM(
      'follow_up_reminder',
      'meeting_reminder',
      'lead_transferred',
      'lead_status_changed',
      'new_lead_assigned',
      'system'
    ),
    allowNull: false,
  },
  reference_type: {
    type: DataTypes.STRING(50),
    comment: 'lead, meeting, activity',
  },
  reference_id: {
    type: DataTypes.INTEGER,
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  push_sent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  scheduled_at: {
    type: DataTypes.DATE,
    comment: 'When to send the notification',
  },
  data: {
    type: DataTypes.JSON,
    defaultValue: {},
  },
}, {
  tableName: 'notifications',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['is_read'] },
    { fields: ['type'] },
    { fields: ['scheduled_at'] },
  ],
});

module.exports = Notification;

