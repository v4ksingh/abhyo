const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const OlympiadCertificate = sequelize.define('OlympiadCertificate', {
  id:            { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  certificateId: { type: DataTypes.STRING(30), allowNull: false, unique: true }, // short human-readable ID for QR
  certificateUrl:{ type: DataTypes.STRING(500), allowNull: true }, // path to PDF
  issuedAt:      { type: DataTypes.DATE, defaultValue: DataTypes.NOW },

  // Snapshot data at time of issuance
  studentName:   { type: DataTypes.STRING(150), allowNull: true },
  olympiadTitle: { type: DataTypes.STRING(200), allowNull: true },
  subjectName:   { type: DataTypes.STRING(100), allowNull: true },
  className:     { type: DataTypes.STRING(30), allowNull: true },
  grade:         { type: DataTypes.STRING(30), allowNull: true },
  nationalRank:  { type: DataTypes.INTEGER, allowNull: true },
  obtainedMarks: { type: DataTypes.FLOAT, allowNull: true },
  totalMarks:    { type: DataTypes.FLOAT, allowNull: true },
  examDate:      { type: DataTypes.DATEONLY, allowNull: true },

  // FKs
  olympiadId:     { type: DataTypes.UUID, allowNull: false },
  userId:         { type: DataTypes.UUID, allowNull: false },
  resultId:       { type: DataTypes.UUID, allowNull: false },
  registrationId: { type: DataTypes.UUID, allowNull: false },
}, {
  tableName: 'olympiad_certificates',
  indexes: [
    { fields: ['certificateId'] },
    { fields: ['olympiadId'] },
    { fields: ['userId'] },
    { unique: true, fields: ['olympiadId', 'userId'] },
  ],
});

module.exports = OlympiadCertificate;
