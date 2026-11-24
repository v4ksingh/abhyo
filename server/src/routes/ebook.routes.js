const express = require('express');
const router = express.Router();
const { protect, authorizeStaff, optionalAuth } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');
const ctrl = require('../controllers/ebook.controller');

// Multer fields for cover image + PDF
const ebookUpload = upload.fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'pdfFile',    maxCount: 1 },
]);

// ── Public routes ──────────────────────────────────────────────────
router.get('/public',             optionalAuth, ctrl.listPublic);
router.get('/public/:slug',       optionalAuth, ctrl.getBySlug);
router.get('/download/:id',       protect,      ctrl.download);
router.get('/my',                 protect,      ctrl.myEbooks);      // student: accessible ebooks
router.get('/has-purchased/:id',  protect,      ctrl.hasPurchased);  // check if user bought
router.post('/buy/:id',           protect,      ctrl.buyEbook);      // create Razorpay order
router.post('/verify-purchase',   protect,      ctrl.verifyEbookPurchase); // confirm payment


// ── Admin routes ───────────────────────────────────────────────────
router.get('/admin',           protect, authorizeStaff, ctrl.listAdmin);
router.get('/admin/stats',     protect, authorizeStaff, ctrl.getStats);
router.get('/admin/:id',       protect, authorizeStaff, ctrl.getOne);
router.post('/admin',          protect, authorizeStaff, ebookUpload, ctrl.create);
router.put('/admin/:id',       protect, authorizeStaff, ebookUpload, ctrl.update);
router.delete('/admin/:id',    protect, authorizeStaff, ctrl.remove);

module.exports = router;
