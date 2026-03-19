const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Meeting = sequelize.define('Meeting', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  lead_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  scheduled_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'User who scheduled the meeting (Level 2)',
  },
  attendees: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Array of user IDs attending the meeting',
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  meeting_date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  location: {
    type: DataTypes.STRING(255),
  },
  meeting_type: {
    type: DataTypes.ENUM('in_person', 'online', 'phone'),
    defaultValue: 'in_person',
  },
  status: {
    type: DataTypes.ENUM('scheduled', 'completed', 'cancelled', 'postponed'),
    defaultValue: 'scheduled',
  },
  outcome: {
    type: DataTypes.TEXT,
    comment: 'Meeting result/outcome notes',
  },
  next_action: {
    type: DataTypes.TEXT,
    comment: 'Next steps after meeting',
  },
  reminder_sent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'meetings',
  indexes: [
    { fields: ['lead_id'] },
    { fields: ['scheduled_by'] },
    { fields: ['meeting_date'] },
    { fields: ['status'] },
  ],
});

module.exports = Meeting;

