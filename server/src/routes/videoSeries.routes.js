const express = require('express');
const router = express.Router();
const videoSeriesController = require('../controllers/videoSeries.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

const canManageVideo = authorize('superadmin', 'admin', 'content_manager', 'institute', 'instructor');

// Admin routes — MUST come before public /:slug wildcard
router.get('/admin/list',   protect, canManageVideo, videoSeriesController.adminListSeries);
router.post('/admin/create', protect, canManageVideo, videoSeriesController.createSeries);
router.put('/admin/:id',    protect, canManageVideo, videoSeriesController.updateSeries);
router.delete('/admin/:id', protect, authorize('superadmin', 'admin'), videoSeriesController.deleteSeries);

router.get('/admin/:id/videos',                 protect, canManageVideo, videoSeriesController.getSeriesVideos);
router.post('/admin/:id/videos',                protect, canManageVideo, videoSeriesController.addVideo);
router.put('/admin/:id/videos/:videoId',        protect, canManageVideo, videoSeriesController.updateVideo);
router.delete('/admin/:id/videos/:videoId',     protect, canManageVideo, videoSeriesController.deleteVideo);

// Public routes
router.get('/', videoSeriesController.listSeries);
router.get('/:slug', videoSeriesController.getSeriesBySlug);

module.exports = router;

