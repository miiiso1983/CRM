const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING(20),
  },
  role_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  manager_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Direct manager (Level 2) for Level 1 users',
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  fcm_token: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Firebase Cloud Messaging token for push notifications',
  },
  avatar: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'users',
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    },
  },
});

User.prototype.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

User.prototype.toJSON = function() {
  const values = { ...this.get() };
  delete values.password;
  delete values.fcm_token;
  return values;
};

module.exports = User;

