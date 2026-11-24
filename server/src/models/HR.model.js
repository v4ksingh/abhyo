const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// ─── Department ───────────────────────────────────────────────────
const Department = sequelize.define('Department', {
  id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  instituteId: { type: DataTypes.UUID, allowNull: false },
  name:        { type: DataTypes.STRING(100), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
}, { tableName: 'hr_departments' });

// ─── Designation ──────────────────────────────────────────────────
const Designation = sequelize.define('Designation', {
  id:            { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  instituteId:   { type: DataTypes.UUID, allowNull: false },
  departmentId:  { type: DataTypes.UUID, allowNull: true },
  name:          { type: DataTypes.STRING(100), allowNull: false },
  description:   { type: DataTypes.TEXT, allowNull: true },
}, { tableName: 'hr_designations' });

// ─── Staff ────────────────────────────────────────────────────────
const Staff = sequelize.define('Staff', {
  id:            { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  instituteId:   { type: DataTypes.UUID, allowNull: false },
  userId:        { type: DataTypes.UUID, allowNull: true },          // linked user account
  departmentId:  { type: DataTypes.UUID, allowNull: true },
  designationId: { type: DataTypes.UUID, allowNull: true },
  name:          { type: DataTypes.STRING(100), allowNull: false },
  email:         { type: DataTypes.STRING(150), allowNull: true },
  mobile:        { type: DataTypes.STRING(15), allowNull: true },
  gender:        { type: DataTypes.ENUM('Male', 'Female', 'Other'), allowNull: true },
  dob:           { type: DataTypes.DATEONLY, allowNull: true },
  joiningDate:   { type: DataTypes.DATEONLY, allowNull: true },
  salary:        { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  address:       { type: DataTypes.TEXT, allowNull: true },
  avatar:        { type: DataTypes.STRING(500), allowNull: true },
  employeeCode:  { type: DataTypes.STRING(50), allowNull: true },
  isActive:      { type: DataTypes.BOOLEAN, defaultValue: true },
  isDisabled:    { type: DataTypes.BOOLEAN, defaultValue: false },
  qualification: { type: DataTypes.STRING(200), allowNull: true },
  experience:    { type: DataTypes.STRING(100), allowNull: true },
  subjects:      { type: DataTypes.TEXT, allowNull: true },          // JSON array of subjects taught
  bankAccount:   { type: DataTypes.STRING(50), allowNull: true },
  ifscCode:      { type: DataTypes.STRING(20), allowNull: true },
}, { tableName: 'hr_staff' });

// ─── Leave Type ───────────────────────────────────────────────────
const LeaveType = sequelize.define('LeaveType', {
  id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  instituteId: { type: DataTypes.UUID, allowNull: false },
  name:        { type: DataTypes.STRING(100), allowNull: false },
  totalDays:   { type: DataTypes.INTEGER, defaultValue: 12 },
  isPaid:      { type: DataTypes.BOOLEAN, defaultValue: true },
  description: { type: DataTypes.TEXT, allowNull: true },
}, { tableName: 'hr_leave_types' });

// ─── Leave Request ────────────────────────────────────────────────
const LeaveRequest = sequelize.define('LeaveRequest', {
  id:           { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  instituteId:  { type: DataTypes.UUID, allowNull: false },
  staffId:      { type: DataTypes.UUID, allowNull: false },
  leaveTypeId:  { type: DataTypes.UUID, allowNull: false },
  startDate:    { type: DataTypes.DATEONLY, allowNull: false },
  endDate:      { type: DataTypes.DATEONLY, allowNull: false },
  days:         { type: DataTypes.INTEGER, defaultValue: 1 },
  reason:       { type: DataTypes.TEXT, allowNull: true },
  status:       { type: DataTypes.ENUM('pending', 'approved', 'rejected'), defaultValue: 'pending' },
  reviewedBy:   { type: DataTypes.UUID, allowNull: true },
  reviewNote:   { type: DataTypes.TEXT, allowNull: true },
}, { tableName: 'hr_leave_requests' });

// ─── Payroll ──────────────────────────────────────────────────────
const Payroll = sequelize.define('Payroll', {
  id:             { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  instituteId:    { type: DataTypes.UUID, allowNull: false },
  staffId:        { type: DataTypes.UUID, allowNull: false },
  month:          { type: DataTypes.INTEGER, allowNull: false },         // 1-12
  year:           { type: DataTypes.INTEGER, allowNull: false },
  basicSalary:    { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  allowances:     { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  deductions:     { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  leaveDed:       { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },  // deduction for leaves
  netSalary:      { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  daysWorked:     { type: DataTypes.INTEGER, defaultValue: 0 },
  status:         { type: DataTypes.ENUM('pending', 'paid'), defaultValue: 'pending' },
  paidAt:         { type: DataTypes.DATE, allowNull: true },
  remarks:        { type: DataTypes.TEXT, allowNull: true },
}, { tableName: 'hr_payroll' });

// ─── Staff Attendance ─────────────────────────────────────────────
const StaffAttendance = sequelize.define('StaffAttendance', {
  id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  instituteId: { type: DataTypes.UUID, allowNull: false },
  staffId:     { type: DataTypes.UUID, allowNull: false },
  date:        { type: DataTypes.DATEONLY, allowNull: false },
  status:      { type: DataTypes.ENUM('present', 'absent', 'half_day', 'on_leave'), defaultValue: 'present' },
  checkIn:     { type: DataTypes.TIME, allowNull: true },
  checkOut:    { type: DataTypes.TIME, allowNull: true },
  note:        { type: DataTypes.STRING(255), allowNull: true },
}, { tableName: 'hr_staff_attendance', indexes: [{ fields: ['staffId', 'date'], unique: true }] });

// ─── Teacher Rating ───────────────────────────────────────────────
const TeacherRating = sequelize.define('TeacherRating', {
  id:           { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  instituteId:  { type: DataTypes.UUID, allowNull: false },
  staffId:      { type: DataTypes.UUID, allowNull: false },
  ratedBy:      { type: DataTypes.UUID, allowNull: false },             // admin who rated
  month:        { type: DataTypes.INTEGER, allowNull: false },
  year:         { type: DataTypes.INTEGER, allowNull: false },
  punctuality:  { type: DataTypes.INTEGER, defaultValue: 5 },           // 1-10
  teaching:     { type: DataTypes.INTEGER, defaultValue: 5 },           // 1-10
  discipline:   { type: DataTypes.INTEGER, defaultValue: 5 },           // 1-10
  communication:{ type: DataTypes.INTEGER, defaultValue: 5 },           // 1-10
  overall:      { type: DataTypes.DECIMAL(4,2), defaultValue: 5 },
  feedback:     { type: DataTypes.TEXT, allowNull: true },
}, { tableName: 'hr_teacher_ratings' });

module.exports = { Department, Designation, Staff, LeaveType, LeaveRequest, Payroll, StaffAttendance, TeacherRating };
