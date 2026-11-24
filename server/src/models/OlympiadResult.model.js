const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const OlympiadResult = sequelize.define('OlympiadResult', {
  id:              { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },

  // Scores
  totalMarks:      { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
  obtainedMarks:   { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
  correctAnswers:  { type: DataTypes.INTEGER, defaultValue: 0 },
  wrongAnswers:    { type: DataTypes.INTEGER, defaultValue: 0 },
  skippedAnswers:  { type: DataTypes.INTEGER, defaultValue: 0 },
  accuracy:        { type: DataTypes.FLOAT, defaultValue: 0 },   // percentage
  timeTakenSeconds:{ type: DataTypes.INTEGER, defaultValue: 0 },

  // Percentile & Ranks
  percentile:    { type: DataTypes.FLOAT, defaultValue: 0 },
  nationalRank:  { type: DataTypes.INTEGER, allowNull: true },
  stateRank:     { type: DataTypes.INTEGER, allowNull: true },
  districtRank:  { type: DataTypes.INTEGER, allowNull: true },
  schoolRank:    { type: DataTypes.INTEGER, allowNull: true },
  classRank:     { type: DataTypes.INTEGER, allowNull: true },   // rank among same class

  // State/District from student profile at time of exam
  studentState:    { type: DataTypes.STRING(100), allowNull: true },
  studentDistrict: { type: DataTypes.STRING(100), allowNull: true },
  studentClass:    { type: DataTypes.INTEGER, allowNull: true },

  // Detailed answer map for review: [{qId, selected, correct, isCorrect}]
  answerReview: {
    type: DataTypes.JSON, allowNull: true, defaultValue: [],
    get() {
      const v = this.getDataValue('answerReview');
      if (typeof v === 'string') { try { return JSON.parse(v); } catch { return []; } }
      return v || [];
    },
  },

  // Publishing
  rankPublished: { type: DataTypes.BOOLEAN, defaultValue: false },

  // Grade/Award
  grade:    { type: DataTypes.STRING(10), allowNull: true },   // Gold, Silver, Bronze, Merit
  isPassed: { type: DataTypes.BOOLEAN, defaultValue: true },

  // FKs
  olympiadId:     { type: DataTypes.UUID, allowNull: false },
  userId:         { type: DataTypes.UUID, allowNull: false },
  registrationId: { type: DataTypes.UUID, allowNull: false },
  sessionId:      { type: DataTypes.UUID, allowNull: false },
}, {
  tableName: 'olympiad_results',
  indexes: [
    { fields: ['olympiadId'] },
    { fields: ['userId'] },
    { unique: true, fields: ['olympiadId', 'userId'] },
    { fields: ['nationalRank'] },
    { fields: ['rankPublished'] },
  ],
});

module.exports = OlympiadResult;
