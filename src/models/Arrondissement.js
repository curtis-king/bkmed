const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Arrondissement = sequelize.define('Arrondissement', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  departement_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  tableName: 'arrondissements',
});

module.exports = Arrondissement;
