const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Meeting = sequelize.define('Meeting', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  type: { type: DataTypes.ENUM('in-person', 'online'), allowNull: false },
  scheduledAt: { type: DataTypes.DATE, allowNull: false },
  organizerId: { type: DataTypes.INTEGER, allowNull: false },
  participants: { type: DataTypes.ARRAY(DataTypes.INTEGER), allowNull: false },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE
});

module.exports = Meeting;
