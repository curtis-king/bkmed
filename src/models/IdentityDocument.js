const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const IdentityDocument = sequelize.define('IdentityDocument', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  document_type: {
    type: DataTypes.STRING(50),
  },
  document_number: {
    type: DataTypes.STRING(100),
    unique: true,
  },
  front_file: {
    type: DataTypes.STRING(255),
  },
  back_file: {
    type: DataTypes.STRING(255),
  },
  selfie_file: {
    type: DataTypes.STRING(255),
  },
  rejection_reason: {
    type: DataTypes.TEXT,
  },
  forgery_check_status: {
    type: DataTypes.ENUM('PENDING_FORGERY_CHECK', 'PASSED', 'FAILED'),
    defaultValue: 'PENDING_FORGERY_CHECK',
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'),
    defaultValue: 'PENDING',
  },
}, {
  tableName: 'identity_documents',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = IdentityDocument;
