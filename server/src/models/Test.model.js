const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Test = sequelize.define('Test', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  title: { type: DataTypes.STRING(300), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  // Test type: mock | pyp | daily_quiz | sectional
  type: {
    type: DataTypes.ENUM('mock', 'pyp', 'daily_quiz', 'sectional'),
    defaultValue: 'mock',
  },
  category: {
    type: DataTypes.STRING(255),
    defaultValue: 'Custom',
  },
  subCategory: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  language: { type: DataTypes.ENUM('en', 'hi', 'bilingual'), defaultValue: 'en' },
  // PYP-specific fields
  examName: { type: DataTypes.STRING(150), allowNull: true, comment: 'e.g. UPSC CSE Prelims' },
  year: { type: DataTypes.INTEGER, allowNull: true, comment: 'e.g. 2023' },
  shift: { type: DataTypes.STRING(50), allowNull: true, comment: 'e.g. Shift 1, Morning' },
  cutoffMarks: { type: DataTypes.FLOAT, allowNull: true, comment: 'Official cutoff' },
  expectedCutoff: { type: DataTypes.FLOAT, allowNull: true, comment: 'Expected cutoff for analysis' },
  difficultyTag: { type: DataTypes.ENUM('easy', 'medium', 'hard'), allowNull: true },
  duration: { type: DataTypes.INTEGER, allowNull: false, comment: 'Minutes' },
  totalMarks: { type: DataTypes.FLOAT, defaultValue: 0 },
  passingMarks: { type: DataTypes.FLOAT, defaultValue: 0 },
  totalQuestions: { type: DataTypes.INTEGER, defaultValue: 0 },
  // Sections stored as JSON [{name, questions:[questionId,...], duration}]
  sections: {
    type: DataTypes.JSON,
    defaultValue: [],
    get() {
      const rawValue = this.getDataValue('sections');
      if (typeof rawValue === 'string') {
        try { return JSON.parse(rawValue); } catch (e) { return []; }
      }
      return rawValue || [];
    }
  },
  // Question IDs (flat list for non-sectioned tests)
  questionIds: {
    type: DataTypes.JSON,
    defaultValue: [],
    get() {
      const rawValue = this.getDataValue('questionIds');
      if (typeof rawValue === 'string') {
        try { return JSON.parse(rawValue); } catch (e) { return []; }
      }
      return rawValue || [];
    }
  },
  // Negative marking
  negativeMarkingEnabled: { type: DataTypes.BOOLEAN, defaultValue: false },
  negativeMarkingValue: { type: DataTypes.FLOAT, defaultValue: 0.25 },
  // Settings
  isFree: { type: DataTypes.BOOLEAN, defaultValue: true },
  price: { type: DataTypes.FLOAT, defaultValue: 0 },
  shuffleQuestions: { type: DataTypes.BOOLEAN, defaultValue: false },
  shuffleOptions: { type: DataTypes.BOOLEAN, defaultValue: false },
  showResultImmediately: { type: DataTypes.BOOLEAN, defaultValue: true },
  allowReview: { type: DataTypes.BOOLEAN, defaultValue: true },
  isDailyQuiz: { type: DataTypes.BOOLEAN, defaultValue: false },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  tags: {
    type: DataTypes.JSON,
    defaultValue: [],
    get() {
      const rawValue = this.getDataValue('tags');
      if (typeof rawValue === 'string') {
        try { return JSON.parse(rawValue); } catch (e) { return []; }
      }
      return rawValue || [];
    }
  },
  // Stats
  totalAttempts: { type: DataTypes.INTEGER, defaultValue: 0 },
  avgScore: { type: DataTypes.FLOAT, defaultValue: 0 },
  avgAccuracy: { type: DataTypes.FLOAT, defaultValue: 0 },
  // Scheduling
  scheduledAt: { type: DataTypes.DATE, allowNull: true },
  expiresAt: { type: DataTypes.DATE, allowNull: true },
  // FK
  createdBy: { type: DataTypes.UUID, allowNull: true },
  seriesId:  { type: DataTypes.UUID, allowNull: true, comment: 'Optional link to ExamSeries' },
  courseId:  { type: DataTypes.UUID, allowNull: true },
  moduleId:  { type: DataTypes.UUID, allowNull: true },
}, {
  tableName: 'tests',
});

module.exports = Test;

