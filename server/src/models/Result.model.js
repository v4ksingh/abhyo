const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Result = sequelize.define('Result', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  // Score
  score: { type: DataTypes.FLOAT, defaultValue: 0 },
  totalMarks: { type: DataTypes.FLOAT, defaultValue: 0 },
  correctAnswers: { type: DataTypes.INTEGER, defaultValue: 0 },
  wrongAnswers: { type: DataTypes.INTEGER, defaultValue: 0 },
  skippedAnswers: { type: DataTypes.INTEGER, defaultValue: 0 },
  accuracy: { type: DataTypes.FLOAT, defaultValue: 0 },
  // Time
  timeTaken: { type: DataTypes.INTEGER, defaultValue: 0, comment: 'Seconds' },
  startedAt: { type: DataTypes.DATE, allowNull: true },
  submittedAt: { type: DataTypes.DATE, allowNull: true },
  // Status
  status: {
    type: DataTypes.ENUM('in-progress', 'completed', 'auto-submitted', 'abandoned'),
    defaultValue: 'in-progress',
  },
  // Responses: [{questionId, selectedOption, isCorrect, marksEarned, timeTaken}]
  responses: {
    type: DataTypes.JSON,
    defaultValue: [],
    get() {
      const rawValue = this.getDataValue('responses');
      if (typeof rawValue === 'string') {
        try { return JSON.parse(rawValue); } catch (e) { return []; }
      }
      return rawValue || [];
    }
  },
  // Analytics
  subjectPerformance: {
    type: DataTypes.JSON,
    defaultValue: [],
    get() {
      const rawValue = this.getDataValue('subjectPerformance');
      if (typeof rawValue === 'string') {
        try { return JSON.parse(rawValue); } catch (e) { return []; }
      }
      return rawValue || [];
    }
  },
  // Rankings
  globalRank: { type: DataTypes.INTEGER, allowNull: true },
  instituteRank: { type: DataTypes.INTEGER, allowNull: true },
  globalPercentile: { type: DataTypes.FLOAT, allowNull: true },
  totalParticipants: { type: DataTypes.INTEGER, defaultValue: 0 },
  // FKs
  userId: { type: DataTypes.UUID, allowNull: false },
  testId: { type: DataTypes.UUID, allowNull: false },
  instituteId: { type: DataTypes.UUID, allowNull: true },
  batchId: { type: DataTypes.UUID, allowNull: true },
}, {
  tableName: 'results',
  indexes: [
    { fields: ['userId'] },
    { fields: ['testId'] },
    { fields: ['instituteId'] },
    { fields: ['status'] },
    { fields: ['globalRank'] },
  ],
});

module.exports = Result;
