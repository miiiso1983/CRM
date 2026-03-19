const { sequelize } = require('../config/database');
const Role = require('./Role');
const User = require('./User');
const Lead = require('./Lead');
const LeadActivity = require('./LeadActivity');
const Meeting = require('./Meeting');
const Notification = require('./Notification');

// ===================== ASSOCIATIONS =====================

// Role <-> User
Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });

// User self-reference (manager)
User.hasMany(User, { foreignKey: 'manager_id', as: 'subordinates' });
User.belongsTo(User, { foreignKey: 'manager_id', as: 'manager' });

// User -> Created Leads
User.hasMany(Lead, { foreignKey: 'created_by', as: 'createdLeads' });
Lead.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// User -> Assigned Leads
User.hasMany(Lead, { foreignKey: 'assigned_to', as: 'assignedLeads' });
Lead.belongsTo(User, { foreignKey: 'assigned_to', as: 'assignee' });

// Manager -> Leads
User.hasMany(Lead, { foreignKey: 'manager_id', as: 'managedLeads' });
Lead.belongsTo(User, { foreignKey: 'manager_id', as: 'leadManager' });

// Lead -> Activities
Lead.hasMany(LeadActivity, { foreignKey: 'lead_id', as: 'activities' });
LeadActivity.belongsTo(Lead, { foreignKey: 'lead_id', as: 'lead' });

// User -> Activities
User.hasMany(LeadActivity, { foreignKey: 'user_id', as: 'activities' });
LeadActivity.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Lead -> Meetings
Lead.hasMany(Meeting, { foreignKey: 'lead_id', as: 'meetings' });
Meeting.belongsTo(Lead, { foreignKey: 'lead_id', as: 'lead' });

// User -> Scheduled Meetings
User.hasMany(Meeting, { foreignKey: 'scheduled_by', as: 'scheduledMeetings' });
Meeting.belongsTo(User, { foreignKey: 'scheduled_by', as: 'scheduler' });

// User -> Notifications
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = {
  sequelize,
  Role,
  User,
  Lead,
  LeadActivity,
  Meeting,
  Notification,
};

