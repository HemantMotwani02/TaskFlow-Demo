const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class PermissionGroupItem extends Model {}

PermissionGroupItem.init({
  permission_group_item_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  permission_group_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  permission_definition_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'PermissionGroupItem',
  tableName: 'permission_group_items',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['permission_group_id', 'permission_definition_id']
    }
  ]
});

module.exports = PermissionGroupItem;
