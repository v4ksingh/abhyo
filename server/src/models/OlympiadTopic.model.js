const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const OlympiadTopic = sequelize.define('OlympiadTopic', {
  id:        { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name:      { type: DataTypes.STRING(200), allowNull: false },
  orderIndex:{ type: DataTypes.INTEGER, defaultValue: 0 },
  isActive:  { type: DataTypes.BOOLEAN, defaultValue: true },
  // FKs
  chapterId: { type: DataTypes.UUID, allowNull: false },
  subjectId: { type: DataTypes.UUID, allowNull: false },
  classId:   { type: DataTypes.UUID, allowNull: false },
}, {
  tableName: 'olympiad_topics',
  indexes: [
    { fields: ['chapterId'] },
    { fields: ['subjectId'] },
    { fields: ['classId'] },
  ],
});

module.exports = OlympiadTopic;
