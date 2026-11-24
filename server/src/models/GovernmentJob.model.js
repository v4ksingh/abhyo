const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const parseJsonField = (val, defaultVal) => {
  if (typeof val === 'string') {
    try {
      return JSON.parse(val);
    } catch {
      return defaultVal;
    }
  }
  return val || defaultVal;
};

const GovernmentJob = sequelize.define('GovernmentJob', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },

  // Basic Information
  title: {
    type: DataTypes.STRING(300),
    allowNull: false,
    comment: 'Recruitment Title (e.g. LIC HFL Apprentice Recruitment 2026)',
  },
  shortName: {
    type: DataTypes.STRING(150),
    allowNull: true,
    comment: 'Short Name / Acronym (e.g. LIC HFL 2026)',
  },
  slug: {
    type: DataTypes.STRING(300),
    allowNull: false,
    unique: true,
    comment: 'SEO friendly unique URL slug',
  },
  tagline: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Short summary or USP',
  },
  organization: {
    type: DataTypes.STRING(250),
    allowNull: false,
    comment: 'Hiring Department / Body (e.g. Staff Selection Commission, Indian Railways)',
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: 'General',
    comment: 'Recruitment Category: SSC, Railway, Banking, Defence, State PSC, Apprenticeship, etc.',
  },
  subcategory: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  jobLevel: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'Central',
    comment: 'Central (All India) or State',
  },
  state: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'State name for state-level vacancies (e.g. Bihar, Uttar Pradesh, Delhi)',
  },
  description: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
    comment: 'Detailed job description and overview',
  },

  // Vacancy Information
  totalVacancies: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    comment: 'Total vacancy count',
  },
  vacancyDetails: {
    type: DataTypes.JSON,
    defaultValue: [],
    get() {
      return parseJsonField(this.getDataValue('vacancyDetails'), []);
    },
    comment: 'Array of { postName, vacancies, reservationBreakdown, payScale, ... }',
  },

  // Eligibility
  qualification: {
    type: DataTypes.JSON,
    defaultValue: [],
    get() {
      return parseJsonField(this.getDataValue('qualification'), []);
    },
    comment: 'Array of required qualifications (e.g. ["10th Pass", "Graduation in Any Stream"])',
  },
  eligibilityDetails: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Detailed criteria (experience, physical standards, nationality, etc.)',
  },
  ageLimit: {
    type: DataTypes.JSON,
    defaultValue: {},
    get() {
      return parseJsonField(this.getDataValue('ageLimit'), {});
    },
    comment: 'Object with minimum, maximum, calculationDate, relaxationDetails',
  },

  // Salary
  salary: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Salary or Pay Scale representation (e.g. ₹14,150 - ₹16,650 per month)',
  },
  salaryDetails: {
    type: DataTypes.JSON,
    defaultValue: [],
    get() {
      return parseJsonField(this.getDataValue('salaryDetails'), []);
    },
  },

  // Application Information
  applicationMode: {
    type: DataTypes.STRING(50),
    defaultValue: 'Online',
    comment: 'Online, Offline, or Both',
  },
  applicationStartDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  applicationLastDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  applicationFee: {
    type: DataTypes.JSON,
    defaultValue: [],
    get() {
      return parseJsonField(this.getDataValue('applicationFee'), []);
    },
    comment: 'Array of { category, fee, paymentMode }',
  },
  howToApply: {
    type: DataTypes.JSON,
    defaultValue: [],
    get() {
      return parseJsonField(this.getDataValue('howToApply'), []);
    },
    comment: 'Step-by-step application guidance strings or objects',
  },
  requiredDocuments: {
    type: DataTypes.JSON,
    defaultValue: [],
    get() {
      return parseJsonField(this.getDataValue('requiredDocuments'), []);
    },
    comment: 'List of documents needed for application',
  },

  // Selection Process & Exam Pattern
  selectionProcess: {
    type: DataTypes.JSON,
    defaultValue: [],
    get() {
      return parseJsonField(this.getDataValue('selectionProcess'), []);
    },
    comment: 'Array of selection stages { stage, description }',
  },
  examPattern: {
    type: DataTypes.JSON,
    defaultValue: [],
    get() {
      return parseJsonField(this.getDataValue('examPattern'), []);
    },
    comment: 'Array of exam papers/patterns { paper, subject, questions, marks, time }',
  },
  importantDates: {
    type: DataTypes.JSON,
    defaultValue: [],
    get() {
      return parseJsonField(this.getDataValue('importantDates'), []);
    },
    comment: 'Array of { event, date }',
  },

  // Important Links
  officialNotificationUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  officialWebsite: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  applyLink: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  source: {
    type: DataTypes.STRING(100),
    defaultValue: 'FreeJobAlert',
  },
  sourceUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Original source recruitment page URL used for duplicate detection',
  },

  // AI and Verification Information
  aiExtracted: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Flag indicating whether this entry was extracted by AI workflow',
  },
  extractedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  verificationStatus: {
    type: DataTypes.STRING(50),
    defaultValue: 'pending',
    comment: 'pending | verified | unverified | failed',
  },
  reviewRequired: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Enforces human review before public publication',
  },
  dataWarnings: {
    type: DataTypes.JSON,
    defaultValue: [],
    get() {
      return parseJsonField(this.getDataValue('dataWarnings'), []);
    },
  },
  validationStatus: {
    type: DataTypes.STRING(50),
    defaultValue: 'passed',
    comment: 'passed | warnings | failed',
  },
  validationErrors: {
    type: DataTypes.JSON,
    defaultValue: [],
    get() {
      return parseJsonField(this.getDataValue('validationErrors'), []);
    },
  },
  validationWarnings: {
    type: DataTypes.JSON,
    defaultValue: [],
    get() {
      return parseJsonField(this.getDataValue('validationWarnings'), []);
    },
  },

  // Publishing Information
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'pending_review',
    comment: 'pending_review | approved | published | rejected | unpublished',
  },
  isFeatured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  publishedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  publishedBy: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  reviewedBy: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  reviewedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  rejectionReason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  adminNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  thumbnailImage: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'URL of generated thumbnail poster image (1200x630 PNG)',
  },
}, {
  tableName: 'government_jobs',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['slug'] },
    { fields: ['status'] },
    { fields: ['category'] },
    { fields: ['applicationLastDate'] },
    { fields: ['organization'] },
    { fields: ['sourceUrl'] },
    { fields: ['isFeatured'] },
    { fields: ['reviewRequired'] },
  ],
});

module.exports = GovernmentJob;
