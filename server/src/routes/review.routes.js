const express = require('express');
const router = express.Router();
const {
  getCourseReviews,
  getMyReview,
  submitReview,
  deleteReview,
  toggleHelpful,
  replyToReview,
  moderateReview,
  getInstituteReviews,
} = require('../controllers/review.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

// ── Public routes ──
router.get('/course/:courseId', getCourseReviews);

// ── Authenticated routes ──
router.get('/course/:courseId/my', protect, getMyReview);
router.post('/course/:courseId', protect, submitReview);
router.delete('/:id', protect, deleteReview);
router.post('/:id/helpful', protect, toggleHelpful);

// ── Institute/Admin routes ──
router.post('/:id/reply', protect, authorize('institute', 'admin', 'instructor'), replyToReview);
router.patch('/:id/moderate', protect, authorize('institute', 'admin'), moderateReview);
router.get('/institute/:instituteId', protect, authorize('institute', 'admin'), getInstituteReviews);

module.exports = router;
