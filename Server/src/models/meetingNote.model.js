const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class MeetingNote extends Model {}

MeetingNote.init({
  note_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  meeting_id: { type: DataTypes.INTEGER, allowNull: false },
  author_id: { type: DataTypes.INTEGER, allowNull: false },
  note: { type: DataTypes.TEXT, allowNull: false },
  created_at: DataTypes.DATE,
  updated_at: DataTypes.DATE
}, {
  sequelize,
  modelName: 'MeetingNote',
  tableName: 'meeting_notes',
  timestamps: true,
  underscored: true
});

module.exports = MeetingNote;
