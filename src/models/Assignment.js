const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Assignment = sequelize.define('Assignment', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  request_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  agent_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  assigned_at: {
    type: DataTypes.DATE,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  timestamps: false,
  tableName: 'assignments',
});

module.exports = Assignment;
