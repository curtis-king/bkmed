const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProfessionalVerification = sequelize.define('ProfessionalVerification', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  professional_profile_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  document_file: {
    type: DataTypes.STRING(255),
  },
  reference_number: {
    type: DataTypes.STRING(100),
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED'),
    defaultValue: 'PENDING',
  },
  rejection_reason: {
    type: DataTypes.TEXT,
  },
}, {
  timestamps: false,
  tableName: 'professional_verifications',
});

module.exports = ProfessionalVerification;
