const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Vehicle = sequelize.define('Vehicle', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
  },
  professional_profile_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
  },
  vehicle_type: {
    type: DataTypes.STRING(50),
  },
  registration_number: {
    type: DataTypes.STRING(100),
    unique: true,
  },
  brand: {
    type: DataTypes.STRING(100),
  },
  model: {
    type: DataTypes.STRING(100),
  },
  identity_document_path: {
    type: DataTypes.STRING(255),
  },
  supporting_document_path: {
    type: DataTypes.STRING(255),
  },
  driving_license_path: {
    type: DataTypes.STRING(255),
  },
  insurance_cert_path: {
    type: DataTypes.STRING(255),
  },
  registration_cert_path: {
    type: DataTypes.STRING(255),
  },
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  tableName: 'vehicles',
});

module.exports = Vehicle;
