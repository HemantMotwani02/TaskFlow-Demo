const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class PermissionGroup extends Model {}

PermissionGroup.init({
  permission_group_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  is_default: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  is_system: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'PermissionGroup',
  tableName: 'permission_groups',
  timestamps: true,
  underscored: true
});

module.exports = PermissionGroup;
