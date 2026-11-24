const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const OlympiadExamSession = sequelize.define('OlympiadExamSession', {
  id:             { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },

  // Lifecycle
  startedAt:   { type: DataTypes.DATE, allowNull: true },
  submittedAt: { type: DataTypes.DATE, allowNull: true },
  status: {
    type: DataTypes.ENUM('not_started', 'in_progress', 'submitted', 'auto_submitted', 'disqualified'),
    defaultValue: 'not_started',
  },

  // Proctoring
  tabSwitchCount:         { type: DataTypes.INTEGER, defaultValue: 0 },
  fullScreenViolations:   { type: DataTypes.INTEGER, defaultValue: 0 },

  // Auto-save: serialised answers { questionId: 'A' }
  answers: {
    type: DataTypes.JSON, allowNull: true, defaultValue: {},
    get() {
      const v = this.getDataValue('answers');
      if (typeof v === 'string') { try { return JSON.parse(v); } catch { return {}; } }
      return v || {};
    },
  },

  // Marked for review: array of questionIds
  markedForReview: {
    type: DataTypes.JSON, allowNull: true, defaultValue: [],
    get() {
      const v = this.getDataValue('markedForReview');
      if (typeof v === 'string') { try { return JSON.parse(v); } catch { return []; } }
      return v || [];
    },
  },

  // The ordered list of question IDs presented to this student (shuffled)
  questionOrder: {
    type: DataTypes.JSON, allowNull: true, defaultValue: [],
    get() {
      const v = this.getDataValue('questionOrder');
      if (typeof v === 'string') { try { return JSON.parse(v); } catch { return []; } }
      return v || [];
    },
  },

  // FKs
  olympiadId:      { type: DataTypes.UUID, allowNull: false },
  userId:          { type: DataTypes.UUID, allowNull: false },
  registrationId:  { type: DataTypes.UUID, allowNull: false },
}, {
  tableName: 'olympiad_exam_sessions',
  indexes: [
    { fields: ['olympiadId'] },
    { fields: ['userId'] },
    { unique: true, fields: ['olympiadId', 'userId'] },
    { fields: ['status'] },
  ],
});

module.exports = OlympiadExamSession;
