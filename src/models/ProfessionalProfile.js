const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProfessionalProfile = sequelize.define('ProfessionalProfile', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  profession_type: {
    type: DataTypes.STRING(100),
  },
  organization_name: {
    type: DataTypes.STRING(255),
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'),
    defaultValue: 'PENDING',
  },
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = ProfessionalProfile;
