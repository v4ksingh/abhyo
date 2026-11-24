const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const OlympiadQuestion = sequelize.define('OlympiadQuestion', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },

  // Question content
  questionText: { type: DataTypes.TEXT, allowNull: false },
  image: { type: DataTypes.STRING(500), allowNull: true },

  // Options: [{label:'A', text:'...'}, {label:'B', text:'...'}, ...]
  options: {
    type: DataTypes.JSON, allowNull: false, defaultValue: [],
    get() {
      const v = this.getDataValue('options');
      if (typeof v === 'string') { try { return JSON.parse(v); } catch { return []; } }
      return v || [];
    },
  },

  // Correct answer label: 'A', 'B', 'C', or 'D'
  correctAnswer: { type: DataTypes.STRING(10), allowNull: false },

  // Explanation
  explanation: { type: DataTypes.TEXT, allowNull: true },
  explanationImage: { type: DataTypes.STRING(500), allowNull: true },

  // Meta
  difficulty: { type: DataTypes.ENUM('easy', 'medium', 'hard'), defaultValue: 'medium' },
  marks: { type: DataTypes.FLOAT, defaultValue: 1 },
  negativeMarks: { type: DataTypes.FLOAT, defaultValue: 0 },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },

  // Stats
  totalAttempts:   { type: DataTypes.INTEGER, defaultValue: 0 },
  correctAttempts: { type: DataTypes.INTEGER, defaultValue: 0 },

  // FKs
  subjectId:  { type: DataTypes.UUID, allowNull: false },
  classId:    { type: DataTypes.UUID, allowNull: false },
  chapterId:  { type: DataTypes.UUID, allowNull: true },
  topicId:    { type: DataTypes.UUID, allowNull: true },
  createdBy:  { type: DataTypes.UUID, allowNull: true },
}, {
  tableName: 'olympiad_questions',
  indexes: [
    { fields: ['subjectId'] },
    { fields: ['classId'] },
    { fields: ['chapterId'] },
    { fields: ['difficulty'] },
    { fields: ['isActive'] },
  ],
});

module.exports = OlympiadQuestion;
