const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// ── CourseQuiz: A quiz attached to a course module ──
const CourseQuiz = sequelize.define('CourseQuiz', {
  id:           { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  courseId:     { type: DataTypes.UUID, allowNull: false },
  moduleId:     { type: DataTypes.UUID, allowNull: true },
  lessonId:     { type: DataTypes.UUID, allowNull: true },
  title:        { type: DataTypes.STRING(200), allowNull: false },
  description:  { type: DataTypes.TEXT, allowNull: true },
  timeLimit:    { type: DataTypes.INTEGER, allowNull: true, comment: 'In minutes, null = no limit' },
  passingScore: { type: DataTypes.INTEGER, defaultValue: 60, comment: 'Minimum % to pass' },
  shuffleQuestions: { type: DataTypes.BOOLEAN, defaultValue: false },
  showAnswers:  { type: DataTypes.BOOLEAN, defaultValue: true, comment: 'Show correct answers after attempt' },
  maxAttempts:  { type: DataTypes.INTEGER, allowNull: true, comment: 'null = unlimited' },
  isPublished:  { type: DataTypes.BOOLEAN, defaultValue: false },
  order:        { type: DataTypes.INTEGER, defaultValue: 0 },
}, { tableName: 'course_quizzes' });

// ── CourseQuizQuestion: Individual questions in a quiz ──
const CourseQuizQuestion = sequelize.define('CourseQuizQuestion', {
  id:            { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  quizId:        { type: DataTypes.UUID, allowNull: false },
  question:      { type: DataTypes.TEXT, allowNull: false },
  type:          { type: DataTypes.ENUM('mcq', 'true_false', 'short'), defaultValue: 'mcq' },
  options:       { type: DataTypes.JSON, allowNull: true, comment: 'Array of option strings for MCQ' },
  correctAnswer: { type: DataTypes.STRING(500), allowNull: false, comment: 'For MCQ: option index (0-3), T/F: true/false, short: text' },
  explanation:   { type: DataTypes.TEXT, allowNull: true },
  points:        { type: DataTypes.INTEGER, defaultValue: 1 },
  order:         { type: DataTypes.INTEGER, defaultValue: 0 },
}, { tableName: 'course_quiz_questions' });

// ── CourseQuizAttempt: Student attempts ──
const CourseQuizAttempt = sequelize.define('CourseQuizAttempt', {
  id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  quizId:      { type: DataTypes.UUID, allowNull: false },
  userId:      { type: DataTypes.UUID, allowNull: false },
  answers:     { type: DataTypes.JSON, allowNull: true, comment: 'Map of questionId → answer' },
  score:       { type: DataTypes.FLOAT, defaultValue: 0, comment: 'Percentage score' },
  totalPoints: { type: DataTypes.INTEGER, defaultValue: 0 },
  earnedPoints:{ type: DataTypes.INTEGER, defaultValue: 0 },
  passed:      { type: DataTypes.BOOLEAN, defaultValue: false },
  timeTaken:   { type: DataTypes.INTEGER, allowNull: true, comment: 'Seconds taken' },
  completedAt: { type: DataTypes.DATE, allowNull: true },
}, { tableName: 'course_quiz_attempts' });

module.exports = { CourseQuiz, CourseQuizQuestion, CourseQuizAttempt };
