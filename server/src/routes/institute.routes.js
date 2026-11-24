const express = require('express');
const router = express.Router();
const institute = require('../controllers/institute.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');
const { getMyInstituteReviews, getInstituteReviewStats, replyToReview, moderateReview } = require('../controllers/review.controller');

router.use(protect, authorize('institute'));

router.get('/dashboard', institute.getDashboard);
router.get('/profile', institute.getProfile);
router.put('/profile', upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'banner', maxCount: 1 }]), institute.updateProfile);
router.post('/upload', upload.single('image'), institute.uploadImage);
router.get('/invite-link', institute.getInviteLink);

router.get('/batches', institute.getBatches);
router.post('/batches', institute.createBatch);
// Removed updateBatch as it wasn't implemented
router.post('/batches/:batchId/assign-test', institute.assignTestToBatch);
router.post('/batches/:batchId/assign-students', institute.assignStudentsToBatch);
router.get('/students', institute.getStudents);
router.post('/students/add', institute.addStudent);
router.post('/students/bulk-upload', upload.single('file'), institute.bulkUploadStudents);
router.get('/students/:studentId/performance', institute.getStudentPerformance);
router.get('/students/:studentId/id-card', institute.getStudentIdCard);
router.post('/students/:studentId/toggle-access', institute.toggleStudentAccess);
router.get('/students-access', institute.getStudentsWithAccess);
router.get('/students/pending', institute.getPendingStudents);
router.post('/students/approve', institute.approveStudent);

const liveclass = require('../controllers/liveclass.controller');

router.post('/announcements', institute.sendAnnouncement);

// ── Live Classes ──
router.get('/live-classes', liveclass.getLiveClasses);
router.get('/live-classes/analytics', liveclass.getAnalytics);
router.post('/live-classes', liveclass.createLiveClass);
router.put('/live-classes/:id', liveclass.updateLiveClass);
router.patch('/live-classes/:id/status', liveclass.updateStatus);
router.delete('/live-classes/:id', liveclass.deleteLiveClass);
// Subscription management
router.get('/subscription', institute.getSubscription);
router.post('/subscription/upgrade', institute.upgradeSubscription);
router.post('/subscription/verify', institute.verifyInstituteSubscription);

// Analytics
router.get('/analytics', institute.getAnalytics);

// Reviews (secure, institute-owned)
router.get('/reviews', getMyInstituteReviews);
router.get('/reviews/stats', getInstituteReviewStats);
router.post('/reviews/:id/reply', replyToReview);
router.patch('/reviews/:id/moderate', moderateReview);

// Certificates
const certificate = require('../controllers/certificate.controller');
router.get('/certificates', certificate.getInstituteCertificates);
router.put('/certificates/:id', upload.single('certificateFile'), certificate.updateCertificateStatus);

module.exports = router;

