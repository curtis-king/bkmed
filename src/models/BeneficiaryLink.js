const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BeneficiaryLink = sequelize.define('BeneficiaryLink', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  responsible_user_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  beneficiary_user_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  relationship_type: {
    type: DataTypes.STRING(50),
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  timestamps: false,
  tableName: 'beneficiary_links',
});

module.exports = BeneficiaryLink;
