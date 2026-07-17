const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MedicalRequest = sequelize.define('MedicalRequest', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  request_number: {
    type: DataTypes.STRING(50),
    unique: true,
  },
  created_by: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  beneficiary_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
  },
  dependent_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
  },
  medecin_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
  },
  service_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  incident_type: {
    type: DataTypes.STRING(100),
  },
  reason: {
    type: DataTypes.STRING(255),
  },
  description: {
    type: DataTypes.TEXT,
  },
  address: {
    type: DataTypes.TEXT,
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 7),
  },
  longitude: {
    type: DataTypes.DECIMAL(10, 7),
  },
  admin_note: {
    type: DataTypes.TEXT,
  },
  status: {
    type: DataTypes.ENUM('SUBMITTED', 'APPROVED', 'REJECTED', 'SUSPENDED', 'ASSIGNED', 'ON_ROUTE', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'),
    defaultValue: 'SUBMITTED',
  },
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  tableName: 'medical_requests',
});

module.exports = MedicalRequest;
