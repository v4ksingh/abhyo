const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const OlympiadChapter = sequelize.define('OlympiadChapter', {
  id:        { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name:      { type: DataTypes.STRING(200), allowNull: false },
  orderIndex:{ type: DataTypes.INTEGER, defaultValue: 0 },
  isActive:  { type: DataTypes.BOOLEAN, defaultValue: true },
  // FKs set in index.js
  subjectId: { type: DataTypes.UUID, allowNull: false },
  classId:   { type: DataTypes.UUID, allowNull: false },
}, {
  tableName: 'olympiad_chapters',
  indexes: [
    { fields: ['subjectId'] },
    { fields: ['classId'] },
    { unique: true, fields: ['name', 'subjectId', 'classId'] },
  ],
});

module.exports = OlympiadChapter;
