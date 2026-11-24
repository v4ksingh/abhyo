const express = require('express');
const router = express.Router();
const test = require('../controllers/test.controller');
const { protect, authorize, optionalAuth } = require('../middlewares/auth.middleware');

// Public routes
router.get('/category-stats', optionalAuth, test.getCategoryStats);
router.get('/', optionalAuth, test.getTests);
router.get('/:id', optionalAuth, test.getTest);
router.get('/:id/leaderboard', test.getLeaderboard);

// Admin, content_manager can manage tests
router.post('/', protect, authorize('superadmin', 'admin', 'content_manager'), test.createTest);
router.put('/:id', protect, authorize('superadmin', 'admin', 'content_manager'), test.updateTest);
router.delete('/:id', protect, authorize('superadmin', 'admin', 'content_manager'), test.deleteTest);

// Student actions
router.get('/:id/start', protect, authorize('student'), test.startTest);
router.post('/:id/submit', protect, authorize('student'), test.submitTest);

module.exports = router;

