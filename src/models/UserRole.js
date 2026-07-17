const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserRole = sequelize.define('UserRole', {
  user_id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
  },
  role_id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
  },
}, {
  timestamps: false,
  tableName: 'user_roles',
});

module.exports = UserRole;
