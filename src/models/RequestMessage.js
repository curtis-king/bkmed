const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RequestMessage = sequelize.define('RequestMessage', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  request_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  sender_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  tableName: 'request_messages',
});

module.exports = RequestMessage;
