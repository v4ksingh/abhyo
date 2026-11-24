const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/examSeries.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

const canManageContent = authorize('superadmin', 'admin', 'content_manager');

// ── Admin routes (MUST come before /:slug to avoid conflicts) ──
router.get('/admin/all',          protect, canManageContent, ctrl.adminListSeries);
router.post('/admin/upload',      protect, canManageContent, upload.single('file'), ctrl.uploadFile);
router.post('/admin/create',      protect, canManageContent, ctrl.createSeries);
router.post('/webhook',           protect, canManageContent, ctrl.createSeries);
router.put('/admin/:id',          protect, canManageContent, ctrl.updateSeries);
router.delete('/admin/:id',       protect, authorize('superadmin', 'admin'), ctrl.deleteSeries);
router.post('/admin/:id/assign-tests', protect, canManageContent, ctrl.assignTests);
router.get('/admin/:id/tests',    protect, canManageContent, ctrl.getSeriesTests);

// ── Public routes (after admin to avoid slug clash) ──────────
router.get('/',      ctrl.listSeries);
router.get('/:slug', ctrl.getSeriesBySlug);

module.exports = router;
