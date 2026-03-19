const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Role = sequelize.define('Role', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.ENUM('sales', 'manager', 'admin'),
    allowNull: false,
    unique: true,
    comment: 'sales=Level1, manager=Level2, admin=Level3',
  },
  name_ar: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Arabic name for the role',
  },
  level: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '1=Sales, 2=Manager, 3=Admin',
  },
  permissions: {
    type: DataTypes.JSON,
    defaultValue: {},
  },
  description: {
    type: DataTypes.TEXT,
  },
}, {
  tableName: 'roles',
});

module.exports = Role;

