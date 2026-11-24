const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LiveClass = sequelize.define('LiveClass', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  title: { type: DataTypes.STRING, allowNull: false },
  topic: { type: DataTypes.STRING, allowNull: true },
  meetingUrl: { type: DataTypes.STRING, allowNull: false },
  meetingPlatform: { type: DataTypes.STRING, defaultValue: 'Google Meet' },
  meetingPassword: { type: DataTypes.STRING, allowNull: true },
  
  scheduledAt: { type: DataTypes.DATE, allowNull: false },
  duration: { type: DataTypes.INTEGER, defaultValue: 60, comment: 'duration in minutes' },
  
  status: { type: DataTypes.ENUM('scheduled', 'live', 'completed', 'cancelled'), defaultValue: 'scheduled' },
  recordingUrl: { type: DataTypes.STRING, allowNull: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  tags: { type: DataTypes.STRING, allowNull: true },
  maxStudents: { type: DataTypes.INTEGER, allowNull: true },
  isRecorded: { type: DataTypes.BOOLEAN, defaultValue: false },
  attendanceCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  notes: { type: DataTypes.TEXT, allowNull: true },

  // Foreign keys
  instituteId: { type: DataTypes.UUID, allowNull: false },
  batchId: { type: DataTypes.UUID, allowNull: true },
  hostId: { type: DataTypes.UUID, allowNull: false },
}, {
  tableName: 'live_classes',
  timestamps: true,
});

module.exports = LiveClass;
