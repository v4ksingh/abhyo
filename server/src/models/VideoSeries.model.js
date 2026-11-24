const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const VideoSeries = sequelize.define('VideoSeries', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  
  title: { type: DataTypes.STRING(300), allowNull: false },
  slug: { type: DataTypes.STRING(200), allowNull: false, unique: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  category: { type: DataTypes.STRING(100), defaultValue: 'General' },
  instructor: { type: DataTypes.STRING(200), allowNull: true },
  
  thumbnail: { type: DataTypes.STRING(500), allowNull: true },
  banner: { type: DataTypes.STRING(500), allowNull: true },

  isFree: { type: DataTypes.BOOLEAN, defaultValue: true },
  price: { type: DataTypes.FLOAT, defaultValue: 0 },
  
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  isFeatured: { type: DataTypes.BOOLEAN, defaultValue: false },

  totalVideos: { type: DataTypes.INTEGER, defaultValue: 0 },
  totalViews: { type: DataTypes.INTEGER, defaultValue: 0 },

  createdBy: { type: DataTypes.UUID, allowNull: true },
}, {
  tableName: 'video_series',
  indexes: [
    { unique: true, fields: ['slug'] },
    { fields: ['isActive'] },
  ],
});

module.exports = VideoSeries;
