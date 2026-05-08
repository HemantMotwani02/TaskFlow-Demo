const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class Meeting extends Model {}

Meeting.init({
  meeting_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  type: { type: DataTypes.ENUM('in-person', 'online'), allowNull: false },
  scheduled_at: { type: DataTypes.DATE, allowNull: false },
  status: { type: DataTypes.ENUM('scheduled', 'started', 'completed', 'discarded'), allowNull: false, defaultValue: 'scheduled' },
  start_time: { type: DataTypes.STRING },
  end_time: { type: DataTypes.STRING },
  participants: { type: DataTypes.TEXT },
  organizer_id: { type: DataTypes.INTEGER, allowNull: false },
  created_at: DataTypes.DATE,
  updated_at: DataTypes.DATE
}, {
  sequelize,
  modelName: 'Meeting',
  tableName: 'meetings',
  timestamps: true,
  underscored: true
});

module.exports = Meeting;
