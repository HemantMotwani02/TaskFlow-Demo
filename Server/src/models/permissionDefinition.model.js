const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class PermissionDefinition extends Model {}

PermissionDefinition.init({
  permission_definition_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  key: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  module: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'PermissionDefinition',
  tableName: 'permission_definitions',
  timestamps: true,
  underscored: true
});

module.exports = PermissionDefinition;
