const express = require('express');
const router = express.Router();
const controller = require('../controllers/cms.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

// Public routes
router.get('/pages', controller.getPages);
router.get('/pages/:slug', controller.getPage);

router.get('/blog', controller.getBlogPosts);
router.get('/blog/:slug', controller.getBlogPost);

router.get('/settings', controller.getSettings);
router.post('/contact', controller.submitContact);

// Protected Admin Routes
router.use(protect);
router.use(authorize('superadmin', 'admin', 'content_manager'));

router.post('/pages', controller.savePage);

router.post('/blog', controller.saveBlogPost);
router.delete('/blog/:id', controller.deleteBlogPost);

router.get('/contact', controller.getContactMessages);
router.put('/contact/:id/status', controller.updateContactMessageStatus);

router.post('/settings', controller.saveSettings);

module.exports = router;
