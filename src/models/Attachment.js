const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Attachment = sequelize.define('Attachment', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  entity_type: {
    type: DataTypes.STRING(100),
  },
  entity_id: {
    type: DataTypes.BIGINT,
  },
  file_path: {
    type: DataTypes.STRING(255),
  },
}, {
  timestamps: false,
  tableName: 'attachments',
});

module.exports = Attachment;
