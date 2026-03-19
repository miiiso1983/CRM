const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Lead = sequelize.define('Lead', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    comment: 'Unique mobile number - core identifier',
  },
  name: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  company_name: {
    type: DataTypes.STRING(200),
  },
  email: {
    type: DataTypes.STRING(150),
    validate: { isEmail: true },
  },
  status: {
    type: DataTypes.ENUM(
      'new',           // جديد
      'contacted',     // تم الاتصال
      'follow_up',     // متابعة
      'interested',    // مهتم
      'not_interested',// غير مهتم
      'negotiating',   // قيد التفاوض
      'qualified',     // مرشح للتعاقد
      'contracted',    // تم التعاقد
      'rejected'       // مرفوض
    ),
    defaultValue: 'new',
  },
  current_level: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: '1=Sales, 2=Manager, 3=Admin',
  },
  first_contact_date: {
    type: DataTypes.DATEONLY,
  },
  follow_up_date: {
    type: DataTypes.DATEONLY,
    comment: 'Next follow-up date set by Level 1',
  },
  meeting_date: {
    type: DataTypes.DATE,
    comment: 'Meeting date set by Level 2',
  },
  notes: {
    type: DataTypes.TEXT,
  },
  source: {
    type: DataTypes.STRING(100),
    comment: 'Lead source: social_media, referral, website, etc.',
  },
  assigned_to: {
    type: DataTypes.INTEGER,
    comment: 'Assigned sales user (Level 1)',
  },
  manager_id: {
    type: DataTypes.INTEGER,
    comment: 'Assigned manager (Level 2)',
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  transferred_at: {
    type: DataTypes.DATE,
    comment: 'When lead was transferred to Level 2',
  },
  contracted_value: {
    type: DataTypes.DECIMAL(15, 2),
    comment: 'Contract value if contracted',
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high'),
    defaultValue: 'medium',
  },
}, {
  tableName: 'leads',
  indexes: [
    { fields: ['phone'] },
    { fields: ['status'] },
    { fields: ['assigned_to'] },
    { fields: ['follow_up_date'] },
  ],
});

module.exports = Lead;

