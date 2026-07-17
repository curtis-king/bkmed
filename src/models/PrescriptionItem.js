const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PrescriptionItem = sequelize.define('PrescriptionItem', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  prescription_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  medication_name: {
    type: DataTypes.STRING(255),
  },
  dosage: {
    type: DataTypes.STRING(255),
  },
  duration: {
    type: DataTypes.STRING(255),
  },
}, {
  timestamps: false,
  tableName: 'prescription_items',
});

module.exports = PrescriptionItem;
