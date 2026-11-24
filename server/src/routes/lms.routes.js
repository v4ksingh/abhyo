const express = require('express');
const router = express.Router();
const lms = require('../controllers/lms.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

const upload = require('../middlewares/upload.middleware');

// Protect all routes
router.use(protect);

// Institute & Instructor routes
router.get('/instructors', authorize('institute'), lms.getInstructors);
router.post('/courses', authorize('institute'), upload.single('thumbnailFile'), lms.createCourse);
router.get('/courses', authorize('institute', 'instructor'), lms.getCourses);
router.put('/courses/:id', authorize('institute', 'instructor'), upload.single('thumbnailFile'), lms.updateCourse);
router.delete('/courses/:id', authorize('institute'), lms.deleteCourse);
router.get('/courses/:id', authorize('institute', 'student', 'instructor'), lms.getCourseDetails);
router.post('/courses/:courseId/modules', authorize('institute', 'instructor'), lms.addModule);
router.post('/courses/:courseId/lessons', authorize('institute', 'instructor'), lms.addLesson);
router.post('/courses/:courseId/quizzes', authorize('institute', 'instructor'), lms.addQuiz);
router.post('/courses/:courseId/materials', authorize('institute', 'instructor'), upload.single('file'), lms.addMaterial);
router.post('/courses/:id/assign-batch', authorize('institute'), lms.assignToBatch);
// Attendance
router.get('/courses/:id/students', authorize('institute', 'instructor'), lms.getCourseStudents);
router.post('/attendance', authorize('institute', 'instructor'), lms.markAttendance);
router.get('/attendance', authorize('institute', 'instructor', 'student'), lms.getAttendance);

// Course Enrollment Requests
router.get('/enrollment-requests', authorize('institute'), lms.getEnrollmentRequests);
router.put('/enrollment-requests/:id/approve', authorize('institute'), lms.approveEnrollmentRequest);

// Q&A
router.get('/courses/:courseId/qa', authorize('institute', 'instructor', 'student'), lms.getCourseQA);
router.post('/courses/:courseId/qa', authorize('student'), lms.askQuestion);
router.put('/qa/:id/answer', authorize('institute', 'instructor'), lms.answerQuestion);
router.patch('/qa/:id/pin', authorize('institute', 'instructor'), lms.togglePinQuestion);
router.delete('/qa/:id', authorize('institute', 'instructor'), lms.deleteQuestion);

// ── Course Quizzes (custom quiz builder) ──────────────────────
const quiz = require('../controllers/quiz.controller');

// Quiz management (institute/instructor)
router.post('/courses/:courseId/course-quizzes', authorize('institute', 'instructor'), quiz.createQuiz);
router.get('/courses/:courseId/course-quizzes', authorize('institute', 'instructor', 'student'), quiz.getQuizzes);
router.get('/course-quizzes/:id', authorize('institute', 'instructor', 'student'), quiz.getQuiz);
router.put('/course-quizzes/:id', authorize('institute', 'instructor'), quiz.updateQuiz);
router.delete('/course-quizzes/:id', authorize('institute', 'instructor'), quiz.deleteQuiz);

// Question management
router.post('/course-quizzes/:quizId/questions', authorize('institute', 'instructor'), quiz.addQuestion);
router.put('/course-quizzes/:quizId/questions/:questionId', authorize('institute', 'instructor'), quiz.updateQuestion);
router.delete('/course-quizzes/:quizId/questions/:questionId', authorize('institute', 'instructor'), quiz.deleteQuestion);

// Student: take quiz
router.post('/course-quizzes/:quizId/attempt', authorize('student'), quiz.submitAttempt);
router.get('/course-quizzes/:quizId/my-attempts', authorize('student'), quiz.getMyAttempts);

// Analytics (institute/instructor)
router.get('/course-quizzes/:quizId/analytics', authorize('institute', 'instructor'), quiz.getQuizAnalytics);

module.exports = router;

