const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LeadActivity = sequelize.define('LeadActivity', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  lead_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('call', 'meeting', 'note', 'status_change', 'transfer', 'follow_up'),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  old_status: {
    type: DataTypes.STRING(50),
  },
  new_status: {
    type: DataTypes.STRING(50),
  },
  call_duration: {
    type: DataTypes.INTEGER,
    comment: 'Call duration in seconds',
  },
  call_result: {
    type: DataTypes.ENUM('answered', 'no_answer', 'busy', 'callback_requested'),
    allowNull: true,
  },
  scheduled_at: {
    type: DataTypes.DATE,
    comment: 'For scheduled activities like meetings',
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Additional data like old/new values',
  },
}, {
  tableName: 'lead_activities',
  indexes: [
    { fields: ['lead_id'] },
    { fields: ['user_id'] },
    { fields: ['type'] },
    { fields: ['created_at'] },
  ],
});

module.exports = LeadActivity;

