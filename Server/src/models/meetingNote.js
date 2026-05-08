const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MeetingNote = sequelize.define('MeetingNote', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  meetingId: { type: DataTypes.INTEGER, allowNull: false },
  authorId: { type: DataTypes.INTEGER, allowNull: false },
  note: { type: DataTypes.TEXT, allowNull: false },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE
});

module.exports = MeetingNote;
