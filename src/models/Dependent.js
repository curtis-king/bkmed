const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Dependent = sequelize.define('Dependent', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  linked_user_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
  },
  dossier_number: {
    type: DataTypes.STRING(50),
    unique: true,
  },
  first_name: {
    type: DataTypes.STRING(100),
  },
  last_name: {
    type: DataTypes.STRING(100),
  },
  birth_date: {
    type: DataTypes.DATEONLY,
  },
  gender: {
    type: DataTypes.ENUM('homme', 'femme'),
  },
  phone: {
    type: DataTypes.STRING(20),
  },
  relationship_type: {
    type: DataTypes.ENUM('ENFANT', 'CONJOINT', 'PARENT', 'AUTRE'),
  },
  blood_group: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  allergies: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  medical_history: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  tableName: 'dependents',
});

Dependent.belongsTo(require('./User'), { foreignKey: 'linked_user_id', as: 'linkedUser', constraints: false });
Dependent.belongsTo(require('./User'), { foreignKey: 'user_id', as: 'tutor', constraints: false });

module.exports = Dependent;
