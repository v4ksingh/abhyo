const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const OlympiadStudyMaterial = sequelize.define('OlympiadStudyMaterial', {
  id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  title:       { type: DataTypes.STRING(300), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  type:        { type: DataTypes.ENUM('pdf', 'video', 'notes', 'practice', 'syllabus'), allowNull: false, defaultValue: 'pdf' },
  fileUrl:     { type: DataTypes.STRING(1000), allowNull: true },   // for PDFs / uploads
  videoUrl:    { type: DataTypes.STRING(1000), allowNull: true },   // YouTube / drive link
  externalUrl: { type: DataTypes.STRING(1000), allowNull: true },   // any external link
  classLevel:  { type: DataTypes.INTEGER, allowNull: true },        // null = all classes
  orderIndex:  { type: DataTypes.INTEGER, defaultValue: 0 },
  isActive:    { type: DataTypes.BOOLEAN, defaultValue: true },
  isFree:      { type: DataTypes.BOOLEAN, defaultValue: true },     // free vs registered-only
  // FKs set in index.js
  subjectId:   { type: DataTypes.UUID, allowNull: false },
  chapterId:   { type: DataTypes.UUID, allowNull: true },           // optional chapter grouping
  createdBy:   { type: DataTypes.UUID, allowNull: true },
}, {
  tableName: 'olympiad_study_materials',
  indexes: [
    { fields: ['subjectId'] },
    { fields: ['classLevel'] },
    { fields: ['type'] },
    { fields: ['isActive'] },
  ],
});

module.exports = OlympiadStudyMaterial;
