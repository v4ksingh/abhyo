const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Lesson = sequelize.define('Lesson', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  title: { type: DataTypes.STRING(255), allowNull: false },
  content: { type: DataTypes.TEXT, allowNull: true },
  videoUrl: { type: DataTypes.STRING(500), allowNull: true },
  videoType: { type: DataTypes.ENUM('youtube', 'vimeo', 'external', 'upload'), defaultValue: 'youtube' },
  duration: { type: DataTypes.INTEGER, defaultValue: 0 }, // in minutes
  type: { type: DataTypes.ENUM('video', 'note'), defaultValue: 'video' },
  order: { type: DataTypes.INTEGER, defaultValue: 0 },
  isFree: { type: DataTypes.BOOLEAN, defaultValue: false },
  moduleId: { type: DataTypes.UUID, allowNull: false },
  courseId: { type: DataTypes.UUID, allowNull: false },
}, {
  tableName: 'lessons',
});

module.exports = Lesson;
