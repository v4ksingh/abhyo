const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/governmentJobs.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');
const { verifyWebhookApiKey } = require('../middlewares/webhookAuth.middleware');

const canManageJobs = authorize('superadmin', 'admin', 'content_manager');
const canDeleteJobs = authorize('superadmin', 'admin');

// ── 1. N8N Webhook Endpoint ─────────────────────────────────────────────────
// Dedicated authentication via x-api-key header matching process.env.N8N_API_KEY
router.post('/webhook', verifyWebhookApiKey, ctrl.webhookImportJobs);

// ── 2. Admin Management Endpoints ───────────────────────────────────────────
router.get('/admin/stats',           protect, canManageJobs, ctrl.adminGetStats);
router.get('/admin',                 protect, canManageJobs, ctrl.adminGetJobs);
router.get('/admin/:id',             protect, canManageJobs, ctrl.adminGetJobById);
router.put('/admin/:id',             protect, canManageJobs, ctrl.adminUpdateJob);
router.patch('/admin/:id/approve',   protect, canManageJobs, ctrl.adminApproveJob);
router.patch('/admin/:id/reject',    protect, canManageJobs, ctrl.adminRejectJob);
router.patch('/admin/:id/publish',   protect, canManageJobs, ctrl.adminPublishJob);
router.patch('/admin/:id/unpublish', protect, canManageJobs, ctrl.adminUnpublishJob);
router.patch('/admin/:id/feature',   protect, canManageJobs, ctrl.adminToggleFeature);
router.post('/admin/:id/generate-thumbnail', protect, canManageJobs, ctrl.adminGenerateThumbnail);
router.delete('/admin/:id',          protect, canDeleteJobs, ctrl.adminDeleteJob);

// ── 3. Public Endpoints (Live Published Jobs Only) ──────────────────────────
router.get('/categories/summary',    ctrl.publicGetCategories);
router.get('/',                      ctrl.publicGetJobs);
router.get('/:slug',                 ctrl.publicGetJobBySlug);

module.exports = router;
