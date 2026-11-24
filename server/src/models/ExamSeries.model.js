const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ExamSeries = sequelize.define('ExamSeries', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },

  // Core info
  title:       { type: DataTypes.STRING(300), allowNull: false },
  slug:        { type: DataTypes.STRING(200), allowNull: false, unique: true, comment: 'URL slug e.g. nda-2026' },
  examName:    { type: DataTypes.STRING(200), allowNull: false, comment: 'e.g. NDA 2026' },
  tagline:     { type: DataTypes.STRING(400), allowNull: true, comment: 'Short marketing tagline' },
  description: { type: DataTypes.TEXT, allowNull: true },
  category: {
    type: DataTypes.STRING(100),
    defaultValue: 'Custom',
  },
  subCategory: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },

  // Exam-specific metadata (stored as JSON for flexibility)
  examDetails: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'organizer, applicationDate, examDate, resultDate, vacancy, website',
    get() {
      const v = this.getDataValue('examDetails');
      if (typeof v === 'string') { try { return JSON.parse(v); } catch { return {}; } }
      return v || {};
    },
  },
  eligibility: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Array of {label, value} pairs',
    get() {
      const v = this.getDataValue('eligibility');
      if (typeof v === 'string') { try { return JSON.parse(v); } catch { return []; } }
      return v || [];
    },
  },
  syllabus: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Array of {subject, topics:[]}',
    get() {
      const v = this.getDataValue('syllabus');
      if (typeof v === 'string') { try { return JSON.parse(v); } catch { return []; } }
      return v || [];
    },
  },
  examPattern: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Array of {paper, subject, questions, marks, time, negativeMarking}',
    get() {
      const v = this.getDataValue('examPattern');
      if (typeof v === 'string') { try { return JSON.parse(v); } catch { return []; } }
      return v || [];
    },
  },
  importantDates: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Array of {event, date}',
    get() {
      const v = this.getDataValue('importantDates');
      if (typeof v === 'string') { try { return JSON.parse(v); } catch { return []; } }
      return v || [];
    },
  },
  highlights: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Array of highlight strings shown as USP badges',
    get() {
      const v = this.getDataValue('highlights');
      if (typeof v === 'string') { try { return JSON.parse(v); } catch { return []; } }
      return v || [];
    },
  },
  faqs: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Array of {question, answer}',
    get() {
      const v = this.getDataValue('faqs');
      if (typeof v === 'string') { try { return JSON.parse(v); } catch { return []; } }
      return v || [];
    },
  },
  selectionProcess: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Array of {stage, description}',
    get() {
      const v = this.getDataValue('selectionProcess');
      if (typeof v === 'string') { try { return JSON.parse(v); } catch { return []; } }
      return v || [];
    },
  },
  salaryDetails: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Array of {label, value} e.g. Pay Level / Level-6',
    get() {
      const v = this.getDataValue('salaryDetails');
      if (typeof v === 'string') { try { return JSON.parse(v); } catch { return []; } }
      return v || [];
    },
  },
  howToApply: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Array of step strings',
    get() {
      const v = this.getDataValue('howToApply');
      if (typeof v === 'string') { try { return JSON.parse(v); } catch { return []; } }
      return v || [];
    },
  },
  importantLinks: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Array of {label, url}',
    get() {
      const v = this.getDataValue('importantLinks');
      if (typeof v === 'string') { try { return JSON.parse(v); } catch { return []; } }
      return v || [];
    },
  },

  // Media
  bannerImage: { type: DataTypes.STRING(500), allowNull: true },
  thumbnailImage: { type: DataTypes.STRING(500), allowNull: true },

  // Pricing
  isFree:  { type: DataTypes.BOOLEAN, defaultValue: true },
  price:   { type: DataTypes.FLOAT,   defaultValue: 0 },

  // Status
  isActive:  { type: DataTypes.BOOLEAN, defaultValue: true },
  isFeatured: { type: DataTypes.BOOLEAN, defaultValue: false },

  // Stats (denormalized for performance)
  totalTests:    { type: DataTypes.INTEGER, defaultValue: 0 },
  totalStudents: { type: DataTypes.INTEGER, defaultValue: 0 },

  // FK
  createdBy: { type: DataTypes.UUID, allowNull: true },
}, {
  tableName: 'exam_series',
  indexes: [
    { unique: true, fields: ['slug'] },
    { fields: ['isActive'] },
  ],
});

module.exports = ExamSeries;
