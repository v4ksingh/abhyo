/**
 * Central models registry — sets up all Sequelize associations
 */

const User = require('./User.model');
const Institute = require('./Institute.model');
const Waitlist = require('./Waitlist.model');
const EmailLog = require('./EmailLog.model');
const Batch = require('./Batch.model');
const Question = require('./Question.model');
const Test = require('./Test.model');
const Result = require('./Result.model');
const Payment = require('./Payment.model');
const Notification = require('./Notification.model');
const ExamSeries = require('./ExamSeries.model');
const VideoSeries = require('./VideoSeries.model');
const SeriesVideo = require('./SeriesVideo.model');
const LiveClass = require('./LiveClass.model');
const { BatchTest, BatchStudent } = require('./BatchTest.model');

// CMS Models
const Page = require('./Page.model');
const BlogPost = require('./BlogPost.model');
const ContactMessage = require('./ContactMessage.model');
const SiteSettings = require('./SiteSettings.model');

const Plan = require('./Plan.model');
const Coupon = require('./Coupon.model');
const Category = require('./Category.model');
const Subject = require('./Subject.model');
const SeriesNote = require('./SeriesNote.model');
const Course = require('./Course.model');
const CourseModule = require('./CourseModule.model');
const Lesson = require('./Lesson.model');
const CourseMaterial = require('./CourseMaterial.model');
const { Assignment, AssignmentSubmission } = require('./Assignment.model');
const LessonProgress = require('./LessonProgress.model');
const Attendance = require('./Attendance.model');
const CourseQA = require('./CourseQA.model');
const { CourseQuiz, CourseQuizQuestion, CourseQuizAttempt } = require('./CourseQuiz.model');
const Review = require('./Review.model');
const CertificateRequest = require('./CertificateRequest.model');
const EnrollmentRequest = require('./EnrollmentRequest.model');

// Accounts Models
const FeeStructure = require('./FeeStructure.model');
const StudentFee = require('./StudentFee.model');
const Expense = require('./Expense.model');

// HR Models
const { Department, Designation, Staff, LeaveType, LeaveRequest, Payroll, StaffAttendance, TeacherRating } = require('./HR.model');

// eBook Model
const EBook = require('./EBook.model');

// GovernmentJob Model
const GovernmentJob = require('./GovernmentJob.model');

// ─────────────────────── Associations ─────────────────────────

// User ↔ Institute
Institute.hasMany(User, { foreignKey: 'instituteId', as: 'students' });
User.belongsTo(Institute, { foreignKey: 'instituteId', as: 'institute' });

// Institute owner (1 user owns 1 institute)
User.hasOne(Institute, { foreignKey: 'ownerId', as: 'ownedInstitute' });
Institute.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

// Batch ↔ Institute
Institute.hasMany(Batch, { foreignKey: 'instituteId', as: 'batches' });
Batch.belongsTo(Institute, { foreignKey: 'instituteId', as: 'institute' });

// Batch ↔ Students (many-to-many via BatchStudent)
Batch.belongsToMany(User, { through: BatchStudent, foreignKey: 'batchId', otherKey: 'userId', as: 'students' });
User.belongsToMany(Batch, { through: BatchStudent, foreignKey: 'userId', otherKey: 'batchId', as: 'batches' });

// Batch ↔ Tests (many-to-many via BatchTest)
Batch.belongsToMany(Test, { through: BatchTest, foreignKey: 'batchId', otherKey: 'testId', as: 'tests' });
Test.belongsToMany(Batch, { through: BatchTest, foreignKey: 'testId', otherKey: 'batchId', as: 'batches' });

// Junction model associations (for direct querying)
BatchTest.belongsTo(Batch, { foreignKey: 'batchId', as: 'batch' });
BatchTest.belongsTo(Test, { foreignKey: 'testId', as: 'test' });
BatchStudent.belongsTo(Batch, { foreignKey: 'batchId', as: 'batch' });
BatchStudent.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Test creator
User.hasMany(Test, { foreignKey: 'createdBy', as: 'createdTests' });
Test.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// ExamSeries ↔ Tests (one series has many tests)
ExamSeries.hasMany(Test, { foreignKey: 'seriesId', as: 'tests' });
Test.belongsTo(ExamSeries, { foreignKey: 'seriesId', as: 'series' });

// ExamSeries creator
User.hasMany(ExamSeries, { foreignKey: 'createdBy', as: 'createdSeries' });
ExamSeries.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// ExamSeries ↔ SeriesNotes
ExamSeries.hasMany(SeriesNote, { foreignKey: 'seriesId', as: 'notes' });
SeriesNote.belongsTo(ExamSeries, { foreignKey: 'seriesId', as: 'series' });

// SeriesNote creator
User.hasMany(SeriesNote, { foreignKey: 'createdBy', as: 'createdNotes' });
SeriesNote.belongsTo(User, { foreignKey: 'createdBy', as: 'noteCreator' });

// VideoSeries ↔ SeriesVideo
VideoSeries.hasMany(SeriesVideo, { foreignKey: 'videoSeriesId', as: 'videos', onDelete: 'CASCADE' });
SeriesVideo.belongsTo(VideoSeries, { foreignKey: 'videoSeriesId', as: 'series' });

// VideoSeries creator
User.hasMany(VideoSeries, { foreignKey: 'createdBy', as: 'createdVideoSeries' });
VideoSeries.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });


// Question creator
User.hasMany(Question, { foreignKey: 'createdBy', as: 'createdQuestions' });
Question.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// Result ↔ User, Test, Institute, Batch
User.hasMany(Result, { foreignKey: 'userId', as: 'results' });
Result.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Test.hasMany(Result, { foreignKey: 'testId', as: 'results' });
Result.belongsTo(Test, { foreignKey: 'testId', as: 'test' });

Institute.hasMany(Result, { foreignKey: 'instituteId', as: 'results' });
Result.belongsTo(Institute, { foreignKey: 'instituteId', as: 'institute' });

// Payment ↔ User, Institute, Test
User.hasMany(Payment, { foreignKey: 'userId', as: 'payments' });
Payment.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Institute.hasMany(Payment, { foreignKey: 'instituteId', as: 'payments' });
Payment.belongsTo(Institute, { foreignKey: 'instituteId', as: 'institute' });

Test.hasMany(Payment, { foreignKey: 'testId', as: 'payments' });
Payment.belongsTo(Test, { foreignKey: 'testId', as: 'test' });

// Notification ↔ User
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Question ↔ Category
Category.hasMany(Question, { foreignKey: 'categoryId', as: 'questions' });
Question.belongsTo(Category, { foreignKey: 'categoryId', as: 'categoryModel' });

// Category ↔ SubCategory
Category.hasMany(Category, { as: 'subCategories', foreignKey: 'parentId' });
Category.belongsTo(Category, { as: 'parentCategory', foreignKey: 'parentId' });

// Email Log
EmailLog.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
User.hasMany(EmailLog, { foreignKey: 'senderId', as: 'sentEmails' });

EmailLog.belongsTo(Institute, { foreignKey: 'instituteId', as: 'institute' });
Institute.hasMany(EmailLog, { foreignKey: 'instituteId', as: 'emailLogs' });

// Question ↔ Subject
Subject.hasMany(Question, { foreignKey: 'subjectId', as: 'questions' });
Question.belongsTo(Subject, { foreignKey: 'subjectId', as: 'subjectModel' });

// ── Offline Accounts System Associations ──
Institute.hasMany(FeeStructure, { foreignKey: 'instituteId', as: 'feeStructures' });
FeeStructure.belongsTo(Institute, { foreignKey: 'instituteId', as: 'institute' });

User.hasMany(StudentFee, { foreignKey: 'studentId', as: 'fees' });
StudentFee.belongsTo(User, { foreignKey: 'studentId', as: 'student' });

Institute.hasMany(StudentFee, { foreignKey: 'instituteId', as: 'studentFees' });
StudentFee.belongsTo(Institute, { foreignKey: 'instituteId', as: 'institute' });

Institute.hasMany(Expense, { foreignKey: 'instituteId', as: 'expenses' });
Expense.belongsTo(Institute, { foreignKey: 'instituteId', as: 'institute' });

// ── LMS System Associations ──

// Institute ↔ Course
Institute.hasMany(Course, { foreignKey: 'instituteId', as: 'lmsCourses' });
Course.belongsTo(Institute, { foreignKey: 'instituteId', as: 'institute' });

// Course Creator
User.hasMany(Course, { foreignKey: 'createdBy', as: 'createdCourses' });
Course.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// Course Assigned Instructor
User.hasMany(Course, { foreignKey: 'instructorId', as: 'assignedCourses' });
Course.belongsTo(User, { foreignKey: 'instructorId', as: 'assignedInstructor' });

// Course ↔ Module
Course.hasMany(CourseModule, { foreignKey: 'courseId', as: 'modules' });
CourseModule.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

// Module ↔ Lesson
CourseModule.hasMany(Lesson, { foreignKey: 'moduleId', as: 'lessons' });
Lesson.belongsTo(CourseModule, { foreignKey: 'moduleId', as: 'module' });

CourseModule.hasMany(Test, { foreignKey: 'moduleId', as: 'quizzes' });
Test.belongsTo(CourseModule, { foreignKey: 'moduleId', as: 'module' });

// Course ↔ Lesson (Direct link for easy fetching)
Course.hasMany(Lesson, { foreignKey: 'courseId', as: 'allLessons' });
Lesson.belongsTo(Course, { foreignKey: 'courseId', as: 'courseData' });

// Material ↔ Lesson/Course
Lesson.hasMany(CourseMaterial, { foreignKey: 'lessonId', as: 'materials' });
CourseMaterial.belongsTo(Lesson, { foreignKey: 'lessonId', as: 'lesson' });

Course.hasMany(CourseMaterial, { foreignKey: 'courseId', as: 'allMaterials' });
CourseMaterial.belongsTo(Course, { foreignKey: 'courseId', as: 'courseData' });

// Batch ↔ Course (One batch focuses on one course usually)
Course.hasMany(Batch, { foreignKey: 'courseId', as: 'enrolledBatches' });
Batch.belongsTo(Course, { foreignKey: 'courseId', as: 'enrolledCourse' });

// Assignment ↔ Batch, Course, Institute
Institute.hasMany(Assignment, { foreignKey: 'instituteId', as: 'assignments' });
Assignment.belongsTo(Institute, { foreignKey: 'instituteId', as: 'institute' });

Course.hasMany(Assignment, { foreignKey: 'courseId', as: 'assignments' });
Assignment.belongsTo(Course, { foreignKey: 'courseId', as: 'courseData' });

Batch.hasMany(Assignment, { foreignKey: 'batchId', as: 'assignments' });
Assignment.belongsTo(Batch, { foreignKey: 'batchId', as: 'batch' });

// Assignment ↔ Submission
Assignment.hasMany(AssignmentSubmission, { foreignKey: 'assignmentId', as: 'submissions' });
AssignmentSubmission.belongsTo(Assignment, { foreignKey: 'assignmentId', as: 'assignment' });

// Progress ↔ Lesson/User
Lesson.hasMany(LessonProgress, { foreignKey: 'lessonId', as: 'progressRecords' });
LessonProgress.belongsTo(Lesson, { foreignKey: 'lessonId', as: 'parentLesson' });
User.hasMany(LessonProgress, { foreignKey: 'userId', as: 'completedLessons' });
LessonProgress.belongsTo(User, { foreignKey: 'userId', as: 'student' });

User.hasMany(AssignmentSubmission, { foreignKey: 'studentId', as: 'submissions' });
AssignmentSubmission.belongsTo(User, { foreignKey: 'studentId', as: 'student' });

// Attendance Associations
User.hasMany(Attendance, { foreignKey: 'studentId', as: 'attendanceRecords' });
Attendance.belongsTo(User, { foreignKey: 'studentId', as: 'student' });

Batch.hasMany(Attendance, { foreignKey: 'batchId', as: 'attendanceRecords' });
Attendance.belongsTo(Batch, { foreignKey: 'batchId', as: 'batch' });

Course.hasMany(Attendance, { foreignKey: 'courseId', as: 'attendanceRecords' });
Attendance.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

Institute.hasMany(Attendance, { foreignKey: 'instituteId', as: 'attendanceRecords' });
Attendance.belongsTo(Institute, { foreignKey: 'instituteId', as: 'institute' });

User.hasMany(Attendance, { foreignKey: 'markedBy', as: 'markedAttendance' });
Attendance.belongsTo(User, { foreignKey: 'markedBy', as: 'marker' });

// ── Course Q&A Associations ──
Course.hasMany(CourseQA, { foreignKey: 'courseId', as: 'questions' });
CourseQA.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

Institute.hasMany(CourseQA, { foreignKey: 'instituteId', as: 'courseQuestions' });
CourseQA.belongsTo(Institute, { foreignKey: 'instituteId', as: 'institute' });

User.hasMany(CourseQA, { foreignKey: 'askedById', as: 'askedQuestions' });
CourseQA.belongsTo(User, { foreignKey: 'askedById', as: 'askedBy' });

User.hasMany(CourseQA, { foreignKey: 'answeredById', as: 'answeredQuestions' });
CourseQA.belongsTo(User, { foreignKey: 'answeredById', as: 'answeredBy' });

// ── Course Quiz Associations ──
Course.hasMany(CourseQuiz, { foreignKey: 'courseId', as: 'courseQuizzes' });
CourseQuiz.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

CourseModule.hasMany(CourseQuiz, { foreignKey: 'moduleId', as: 'moduleQuizzes' });
CourseQuiz.belongsTo(CourseModule, { foreignKey: 'moduleId', as: 'module' });

Lesson.hasMany(CourseQuiz, { foreignKey: 'lessonId', as: 'lessonQuizzes' });
CourseQuiz.belongsTo(Lesson, { foreignKey: 'lessonId', as: 'lesson' });

CourseQuiz.hasMany(CourseQuizQuestion, { foreignKey: 'quizId', as: 'questions', onDelete: 'CASCADE' });
CourseQuizQuestion.belongsTo(CourseQuiz, { foreignKey: 'quizId', as: 'quiz' });

CourseQuiz.hasMany(CourseQuizAttempt, { foreignKey: 'quizId', as: 'attempts', onDelete: 'CASCADE' });
CourseQuizAttempt.belongsTo(CourseQuiz, { foreignKey: 'quizId', as: 'quiz' });

User.hasMany(CourseQuizAttempt, { foreignKey: 'userId', as: 'quizAttempts' });
CourseQuizAttempt.belongsTo(User, { foreignKey: 'userId', as: 'student' });

// ── Live Class Associations ──
Institute.hasMany(LiveClass, { foreignKey: 'instituteId', as: 'liveClasses' });
LiveClass.belongsTo(Institute, { foreignKey: 'instituteId', as: 'institute' });

Batch.hasMany(LiveClass, { foreignKey: 'batchId', as: 'batchLiveClasses' });
LiveClass.belongsTo(Batch, { foreignKey: 'batchId', as: 'batch' });

User.hasMany(LiveClass, { foreignKey: 'hostId', as: 'hostedLiveClasses' });
LiveClass.belongsTo(User, { foreignKey: 'hostId', as: 'host' });

// ── Review Associations ──
Course.hasMany(Review, { foreignKey: 'courseId', as: 'reviews', onDelete: 'CASCADE' });
Review.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

User.hasMany(Review, { foreignKey: 'userId', as: 'reviews' });
Review.belongsTo(User, { foreignKey: 'userId', as: 'reviewer' });

Institute.hasMany(Review, { foreignKey: 'instituteId', as: 'reviews' });
Review.belongsTo(Institute, { foreignKey: 'instituteId', as: 'institute' });

User.hasMany(Review, { foreignKey: 'repliedById', as: 'reviewReplies' });
Review.belongsTo(User, { foreignKey: 'repliedById', as: 'repliedBy' });

// ── CertificateRequest Associations ──
CertificateRequest.belongsTo(User, { foreignKey: 'studentId', as: 'student' });
User.hasMany(CertificateRequest, { foreignKey: 'studentId', as: 'certificateRequests' });

CertificateRequest.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });
Course.hasMany(CertificateRequest, { foreignKey: 'courseId', as: 'certificateRequests' });

CertificateRequest.belongsTo(Institute, { foreignKey: 'instituteId', as: 'institute' });
Institute.hasMany(CertificateRequest, { foreignKey: 'instituteId', as: 'certificateRequests' });

// ── EnrollmentRequest Associations ──
EnrollmentRequest.belongsTo(User, { foreignKey: 'studentId', as: 'student' });
User.hasMany(EnrollmentRequest, { foreignKey: 'studentId', as: 'enrollmentRequests' });

EnrollmentRequest.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });
Course.hasMany(EnrollmentRequest, { foreignKey: 'courseId', as: 'enrollmentRequests' });

EnrollmentRequest.belongsTo(Institute, { foreignKey: 'instituteId', as: 'institute' });
Institute.hasMany(EnrollmentRequest, { foreignKey: 'instituteId', as: 'enrollmentRequests' });

// ── HR Associations ──
Department.hasMany(Designation, { foreignKey: 'departmentId', as: 'designations' });
Designation.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });

Department.hasMany(Staff, { foreignKey: 'departmentId', as: 'staffMembers' });
Staff.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });

Designation.hasMany(Staff, { foreignKey: 'designationId', as: 'staffMembers' });
Staff.belongsTo(Designation, { foreignKey: 'designationId', as: 'designation' });

Staff.hasMany(LeaveRequest, { foreignKey: 'staffId', as: 'leaveRequests' });
LeaveRequest.belongsTo(Staff, { foreignKey: 'staffId', as: 'staff' });

LeaveType.hasMany(LeaveRequest, { foreignKey: 'leaveTypeId', as: 'requests' });
LeaveRequest.belongsTo(LeaveType, { foreignKey: 'leaveTypeId', as: 'leaveType' });

Staff.hasMany(Payroll, { foreignKey: 'staffId', as: 'payrollRecords' });
Payroll.belongsTo(Staff, { foreignKey: 'staffId', as: 'staff' });

Staff.hasMany(StaffAttendance, { foreignKey: 'staffId', as: 'attendance' });
StaffAttendance.belongsTo(Staff, { foreignKey: 'staffId', as: 'staff' });

Staff.hasMany(TeacherRating, { foreignKey: 'staffId', as: 'ratings' });
TeacherRating.belongsTo(Staff, { foreignKey: 'staffId', as: 'staff' });

// GovernmentJob ↔ User (publisher & reviewer)
User.hasMany(GovernmentJob, { foreignKey: 'publishedBy', as: 'publishedJobs' });
GovernmentJob.belongsTo(User, { foreignKey: 'publishedBy', as: 'publisher' });
User.hasMany(GovernmentJob, { foreignKey: 'reviewedBy', as: 'reviewedJobs' });
GovernmentJob.belongsTo(User, { foreignKey: 'reviewedBy', as: 'reviewer' });

// ─────────────────────── Exports ─────────────────────────────

module.exports = {
  User,
  Institute,
  Waitlist,
  EmailLog,
  Batch,
  Question,
  Test,
  Result,
  Payment,
  Notification,
  ExamSeries,
  GovernmentJob,
  BatchTest,
  BatchStudent,
  Page,
  BlogPost,
  ContactMessage,
  SiteSettings,
  Plan,
  Coupon,
  Category,
  Subject,
  SeriesNote,
  FeeStructure,
  StudentFee,
  Expense,
  Course,
  CourseModule,
  Lesson,
  CourseMaterial,
  Assignment,
  AssignmentSubmission,
  LessonProgress,
  Attendance,
  CourseQA,
  CourseQuiz,
  CourseQuizQuestion,
  CourseQuizAttempt,
  LiveClass,
  VideoSeries,
  SeriesVideo,
  Review,
  // HR
  Department,
  Designation,
  Staff,
  LeaveType,
  LeaveRequest,
  Payroll,
  StaffAttendance,
  TeacherRating,
  CertificateRequest,
  EnrollmentRequest,
};

// ─────────────────────── Olympiad Models ──────────────────────────
const OlympiadSubject      = require('./OlympiadSubject.model');
const OlympiadClass        = require('./OlympiadClass.model');
const OlympiadChapter      = require('./OlympiadChapter.model');
const OlympiadTopic        = require('./OlympiadTopic.model');
const OlympiadQuestion     = require('./OlympiadQuestion.model');
const Olympiad             = require('./Olympiad.model');
const OlympiadRegistration = require('./OlympiadRegistration.model');
const OlympiadExamSession  = require('./OlympiadExamSession.model');
const OlympiadResult       = require('./OlympiadResult.model');
const OlympiadCertificate  = require('./OlympiadCertificate.model');
const OlympiadStudyMaterial = require('./OlympiadStudyMaterial.model');

// ── Olympiad Associations ────────────────────────────────────────

// Subject → Chapters
OlympiadSubject.hasMany(OlympiadChapter, { foreignKey: 'subjectId', as: 'chapters' });
OlympiadChapter.belongsTo(OlympiadSubject, { foreignKey: 'subjectId', as: 'subject' });

// Class → Chapters
OlympiadClass.hasMany(OlympiadChapter, { foreignKey: 'classId', as: 'chapters' });
OlympiadChapter.belongsTo(OlympiadClass, { foreignKey: 'classId', as: 'class' });

// Chapter → Topics
OlympiadChapter.hasMany(OlympiadTopic, { foreignKey: 'chapterId', as: 'topics' });
OlympiadTopic.belongsTo(OlympiadChapter, { foreignKey: 'chapterId', as: 'chapter' });

// Subject → Topics
OlympiadSubject.hasMany(OlympiadTopic, { foreignKey: 'subjectId', as: 'topics' });
OlympiadTopic.belongsTo(OlympiadSubject, { foreignKey: 'subjectId', as: 'subject' });

// Class → Topics
OlympiadClass.hasMany(OlympiadTopic, { foreignKey: 'classId', as: 'topics' });
OlympiadTopic.belongsTo(OlympiadClass, { foreignKey: 'classId', as: 'class' });

// Subject → Questions
OlympiadSubject.hasMany(OlympiadQuestion, { foreignKey: 'subjectId', as: 'questions' });
OlympiadQuestion.belongsTo(OlympiadSubject, { foreignKey: 'subjectId', as: 'subject' });

// Class → Questions
OlympiadClass.hasMany(OlympiadQuestion, { foreignKey: 'classId', as: 'questions' });
OlympiadQuestion.belongsTo(OlympiadClass, { foreignKey: 'classId', as: 'class' });

// Chapter → Questions
OlympiadChapter.hasMany(OlympiadQuestion, { foreignKey: 'chapterId', as: 'questions' });
OlympiadQuestion.belongsTo(OlympiadChapter, { foreignKey: 'chapterId', as: 'chapter' });

// Topic → Questions
OlympiadTopic.hasMany(OlympiadQuestion, { foreignKey: 'topicId', as: 'questions' });
OlympiadQuestion.belongsTo(OlympiadTopic, { foreignKey: 'topicId', as: 'topic' });

// Subject → Olympiads
OlympiadSubject.hasMany(Olympiad, { foreignKey: 'subjectId', as: 'olympiads' });
Olympiad.belongsTo(OlympiadSubject, { foreignKey: 'subjectId', as: 'subject' });

// Olympiad → Registrations
Olympiad.hasMany(OlympiadRegistration, { foreignKey: 'olympiadId', as: 'registrations' });
OlympiadRegistration.belongsTo(Olympiad, { foreignKey: 'olympiadId', as: 'olympiad' });

// User → Registrations
User.hasMany(OlympiadRegistration, { foreignKey: 'userId', as: 'olympiadRegistrations' });
OlympiadRegistration.belongsTo(User, { foreignKey: 'userId', as: 'student' });

// Olympiad → ExamSessions
Olympiad.hasMany(OlympiadExamSession, { foreignKey: 'olympiadId', as: 'examSessions' });
OlympiadExamSession.belongsTo(Olympiad, { foreignKey: 'olympiadId', as: 'olympiad' });

// User → ExamSessions
User.hasMany(OlympiadExamSession, { foreignKey: 'userId', as: 'olympiadSessions' });
OlympiadExamSession.belongsTo(User, { foreignKey: 'userId', as: 'student' });

// Registration → ExamSession
OlympiadRegistration.hasOne(OlympiadExamSession, { foreignKey: 'registrationId', as: 'examSession' });
OlympiadExamSession.belongsTo(OlympiadRegistration, { foreignKey: 'registrationId', as: 'registration' });

// Olympiad → Results
Olympiad.hasMany(OlympiadResult, { foreignKey: 'olympiadId', as: 'results' });
OlympiadResult.belongsTo(Olympiad, { foreignKey: 'olympiadId', as: 'olympiad' });

// User → Results
User.hasMany(OlympiadResult, { foreignKey: 'userId', as: 'olympiadResults' });
OlympiadResult.belongsTo(User, { foreignKey: 'userId', as: 'student' });

// Session → Result
OlympiadExamSession.hasOne(OlympiadResult, { foreignKey: 'sessionId', as: 'result' });
OlympiadResult.belongsTo(OlympiadExamSession, { foreignKey: 'sessionId', as: 'session' });

// Registration → Result
OlympiadRegistration.hasOne(OlympiadResult, { foreignKey: 'registrationId', as: 'result' });
OlympiadResult.belongsTo(OlympiadRegistration, { foreignKey: 'registrationId', as: 'registration' });

// Olympiad → Certificates
Olympiad.hasMany(OlympiadCertificate, { foreignKey: 'olympiadId', as: 'certificates' });
OlympiadCertificate.belongsTo(Olympiad, { foreignKey: 'olympiadId', as: 'olympiad' });

// User → Certificates
User.hasMany(OlympiadCertificate, { foreignKey: 'userId', as: 'olympiadCertificates' });
OlympiadCertificate.belongsTo(User, { foreignKey: 'userId', as: 'student' });

// Result → Certificate
OlympiadResult.hasOne(OlympiadCertificate, { foreignKey: 'resultId', as: 'certificate' });
OlympiadCertificate.belongsTo(OlympiadResult, { foreignKey: 'resultId', as: 'result' });

// Question creator
User.hasMany(OlympiadQuestion, { foreignKey: 'createdBy', as: 'createdOlympiadQuestions' });
OlympiadQuestion.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// Olympiad creator
User.hasMany(Olympiad, { foreignKey: 'createdBy', as: 'createdOlympiads' });
Olympiad.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// Subject → Study Materials
OlympiadSubject.hasMany(OlympiadStudyMaterial, { foreignKey: 'subjectId', as: 'studyMaterials' });
OlympiadStudyMaterial.belongsTo(OlympiadSubject, { foreignKey: 'subjectId', as: 'subject' });

// Chapter → Study Materials (optional)
OlympiadChapter.hasMany(OlympiadStudyMaterial, { foreignKey: 'chapterId', as: 'studyMaterials' });
OlympiadStudyMaterial.belongsTo(OlympiadChapter, { foreignKey: 'chapterId', as: 'chapter' });

// User (admin) → Study Materials
User.hasMany(OlympiadStudyMaterial, { foreignKey: 'createdBy', as: 'createdStudyMaterials' });
OlympiadStudyMaterial.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

module.exports.OlympiadSubject        = OlympiadSubject;
module.exports.OlympiadClass          = OlympiadClass;
module.exports.OlympiadChapter        = OlympiadChapter;
module.exports.OlympiadTopic          = OlympiadTopic;
module.exports.OlympiadQuestion       = OlympiadQuestion;
module.exports.Olympiad               = Olympiad;
module.exports.OlympiadRegistration   = OlympiadRegistration;
module.exports.OlympiadExamSession    = OlympiadExamSession;
module.exports.OlympiadResult         = OlympiadResult;
module.exports.OlympiadCertificate    = OlympiadCertificate;
module.exports.OlympiadStudyMaterial  = OlympiadStudyMaterial;

// eBook & GovernmentJob
module.exports.EBook = EBook;
module.exports.GovernmentJob = GovernmentJob;
