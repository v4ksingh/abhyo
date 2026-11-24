const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Olympiad = sequelize.define('Olympiad', {
  id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  title:       { type: DataTypes.STRING(200), allowNull: false },
  slug:        { type: DataTypes.STRING(250), allowNull: false, unique: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  syllabusPdfUrl:       { type: DataTypes.STRING(1000), allowNull: true }, // admin uploaded syllabus PDF
  bannerImage:          { type: DataTypes.STRING(500), allowNull: true },
  tagline:              { type: DataTypes.STRING(300), allowNull: true },
  certificateTemplate:  { type: DataTypes.STRING(500), allowNull: true }, // custom certificate background image

  // Registration window
  registrationStartDate: { type: DataTypes.DATEONLY, allowNull: false },
  registrationEndDate:   { type: DataTypes.DATEONLY, allowNull: false },

  // Exam schedule
  examDate:            { type: DataTypes.DATEONLY, allowNull: false },
  examStartTime:       { type: DataTypes.STRING(10), allowNull: false, defaultValue: '10:00' }, // HH:MM
  examDurationMinutes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 60 },

  // Result
  resultDate: { type: DataTypes.DATEONLY, allowNull: true },

  // Eligibility — JSON array of class numbers e.g. [6,7,8,9,10,11,12]
  eligibleClasses: {
    type: DataTypes.JSON, allowNull: false, defaultValue: [6,7,8,9,10,11,12],
    get() {
      const v = this.getDataValue('eligibleClasses');
      if (typeof v === 'string') { try { return JSON.parse(v); } catch { return []; } }
      return v || [];
    },
  },

  // Exam config
  totalQuestions:  { type: DataTypes.INTEGER, allowNull: false, defaultValue: 40 },
  marksPerQuestion:{ type: DataTypes.FLOAT, allowNull: false, defaultValue: 1 },
  negativeMarks:   { type: DataTypes.FLOAT, defaultValue: 0 },
  passingMarks:    { type: DataTypes.FLOAT, defaultValue: 0 },

  // Fees
  registrationFee: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 150 },

  // Status
  status: {
    type: DataTypes.ENUM('draft', 'open', 'closed', 'ongoing', 'completed', 'cancelled'),
    defaultValue: 'draft',
  },

  // Prize/Award info (JSON)
  prizeDetails: {
    type: DataTypes.JSON, allowNull: true,
    get() {
      const v = this.getDataValue('prizeDetails');
      if (typeof v === 'string') { try { return JSON.parse(v); } catch { return null; } }
      return v;
    },
  },

  // Counters (cached)
  totalRegistrations: { type: DataTypes.INTEGER, defaultValue: 0 },

  // FK
  subjectId:  { type: DataTypes.UUID, allowNull: false },
  createdBy:  { type: DataTypes.UUID, allowNull: true },
}, {
  tableName: 'olympiads',
  indexes: [
    { fields: ['slug'] },
    { fields: ['status'] },
    { fields: ['subjectId'] },
    { fields: ['examDate'] },
  ],
});

module.exports = Olympiad;
