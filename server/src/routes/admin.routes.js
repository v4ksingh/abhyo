const express = require('express');
const router = express.Router();
const admin = require('../controllers/admin.controller');
const { protect, authorize, authorizeStaff, authorizeAdmin } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');
const WaitlistController = require('../controllers/WaitlistController');
const EmailController = require('../controllers/EmailController');

// All admin routes require authentication + at least staff-level role
router.use(protect, authorizeStaff);

// Dashboard — admin & above
router.get('/dashboard', authorizeAdmin, admin.getDashboard);
router.get('/settings', authorize('superadmin'), admin.getSettings);
router.put('/settings', authorize('superadmin'), admin.updateSettings);
router.post('/settings/test-email', authorize('superadmin'), admin.testEmail);
router.get('/settings/email-templates', authorize('superadmin'), admin.getEmailTemplates);
router.post('/settings/send-sample-email', authorize('superadmin'), admin.sendSampleEmail);
router.get('/settings/sitemap', authorizeAdmin, admin.getSitemapInfo);
router.post('/settings/sitemap/recreate', authorizeAdmin, admin.recreateSitemap);

// Cache Operations — superadmin only
router.get('/cache-status', authorize('superadmin'), admin.getCacheStatus);
router.post('/cache-warm', authorize('superadmin'), admin.triggerCacheWarm);
router.post('/cache-clear', authorize('superadmin'), admin.clearCache);

// Revenue — accountant + admin + superadmin
router.get('/revenue', authorize('superadmin', 'admin', 'accountant'), admin.getRevenue);
router.get('/transactions', authorize('superadmin', 'admin', 'accountant'), admin.getTransactions);

// Notifications — admin + superadmin
router.post('/broadcast', authorizeAdmin, admin.broadcastNotification);

// Waitlist
router.get('/waitlist', authorizeAdmin, WaitlistController.getWaitlist);
router.delete('/waitlist/:id', authorizeAdmin, WaitlistController.deleteWaitlistEntry);

// Broadcast Emails
router.post('/emails/broadcast', authorizeAdmin, EmailController.sendBroadcastEmail);
router.get('/emails/logs', authorizeAdmin, EmailController.getEmailLogs);

// Users — admin + superadmin
router.get('/users', authorizeAdmin, admin.getUsers);
router.patch('/users/:id/toggle-active', authorizeAdmin, admin.toggleUserActive);
router.delete('/users/:id', authorize('superadmin'), admin.deleteUser);
router.post('/users/:id/notify', authorizeAdmin, admin.notifyUser);

// Staff Management — superadmin only
router.get('/staff', authorize('superadmin'), admin.getStaff);
router.post('/staff', authorize('superadmin'), admin.createStaff);
router.put('/staff/:id', authorize('superadmin'), admin.updateStaff);
router.delete('/staff/:id', authorize('superadmin'), admin.deleteStaff);

// Institutes — admin + superadmin
router.get('/institutes', authorizeAdmin, admin.getInstitutes);
router.patch('/institutes/:id/approve', authorizeAdmin, admin.approveInstitute);
router.patch('/institutes/:id/reject', authorizeAdmin, admin.rejectInstitute);
router.put('/institutes/:id/subscription', authorize('superadmin'), admin.updateSubscription);
router.patch('/institutes/:id/toggle-landing', authorizeAdmin, admin.toggleInstituteLanding);
router.patch('/institutes/:id/toggle-featured', authorizeAdmin, admin.toggleInstituteFeatured);
router.put('/institutes/:id/landing', upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'banner', maxCount: 1 }]), authorizeAdmin, admin.updateInstituteLanding);

module.exports = router;
// Trigger restart
