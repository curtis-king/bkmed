const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Departement = sequelize.define('Departement', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  pays_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  tableName: 'departements',
});

module.exports = Departement;
