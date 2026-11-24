const express = require('express');
const router = express.Router();
const student = require('../controllers/student.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

router.use(protect, authorize('student'));

router.get('/dashboard', student.getDashboard);
router.get('/my-tests', student.getMyTests);
router.get('/results', student.getMyResults);
router.get('/results/:id', student.getResult);
router.get('/leaderboard', student.getLeaderboard);
router.get('/courses', student.getMyCourses);
router.get('/courses/available', student.getAvailableCourses);
router.post('/courses/:courseId/request', student.requestCourseEnrollment);
router.post('/courses/toggle-progress', student.toggleLessonProgress);
router.get('/live-classes', student.getMyLiveClasses);
router.get('/id-card', student.getIdCard);
router.patch('/update-institute', student.updateInstitute);

// Certificate routes
const certificate = require('../controllers/certificate.controller');
router.get('/certificates', certificate.getStudentCertificates);
router.post('/certificates/request', certificate.requestCertificate);

module.exports = router;
