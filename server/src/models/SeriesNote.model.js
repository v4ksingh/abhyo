const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SeriesNote = sequelize.define('SeriesNote', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },

  // Which exam series this note belongs to
  seriesId: { type: DataTypes.UUID, allowNull: false },

  // Note info
  title:       { type: DataTypes.STRING(300), allowNull: false },
  subject:     { type: DataTypes.STRING(200), allowNull: false, comment: 'e.g. Mathematics, History, GK' },
  description: { type: DataTypes.TEXT, allowNull: true, comment: 'Short summary of the note' },
  content:     { type: DataTypes.TEXT('long'), allowNull: true, comment: 'Full HTML/rich content of the note' },

  // Media / file
  fileUrl:     { type: DataTypes.STRING(500), allowNull: true, comment: 'Uploaded PDF or file URL' },
  fileType:    {
    type: DataTypes.ENUM('pdf', 'doc', 'image', 'link', 'none'),
    defaultValue: 'none',
    allowNull: false,
  },
  externalLink: { type: DataTypes.STRING(500), allowNull: true, comment: 'External resource URL' },
  thumbnail:    { type: DataTypes.STRING(500), allowNull: true, comment: 'Thumbnail image URL' },

  // Access control
  isFree:     { type: DataTypes.BOOLEAN, defaultValue: true },
  isActive:   { type: DataTypes.BOOLEAN, defaultValue: true },

  // Ordering within a subject
  sortOrder:  { type: DataTypes.INTEGER, defaultValue: 0 },

  // Who created it
  createdBy:  { type: DataTypes.UUID, allowNull: true },
}, {
  tableName: 'series_notes',
  indexes: [
    { fields: ['seriesId'] },
    { fields: ['subject'] },
    { fields: ['isActive'] },
    { fields: ['seriesId', 'subject'] },
  ],
});

module.exports = SeriesNote;
