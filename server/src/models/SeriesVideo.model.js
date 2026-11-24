const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SeriesVideo = sequelize.define('SeriesVideo', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  
  title: { type: DataTypes.STRING(255), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  
  videoUrl: { type: DataTypes.STRING(500), allowNull: true },
  videoType: { type: DataTypes.ENUM('youtube', 'vimeo', 'external', 'upload'), defaultValue: 'youtube' },
  duration: { type: DataTypes.INTEGER, defaultValue: 0 }, // in minutes
  
  order: { type: DataTypes.INTEGER, defaultValue: 0 },
  isFree: { type: DataTypes.BOOLEAN, defaultValue: false },
  
  videoSeriesId: { type: DataTypes.UUID, allowNull: false },
}, {
  tableName: 'series_videos',
});

module.exports = SeriesVideo;
