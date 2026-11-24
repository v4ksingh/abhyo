const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

// Public — no auth needed
router.get('/public', categoryController.getActiveCategories);

router.use(protect);

// Read categories — all content roles need this to manage tests/questions
router.get('/', authorize('superadmin', 'admin', 'content_manager', 'teacher', 'institute'), categoryController.getCategories);

// Write operations — content_manager & above (not teacher, not institute)
router.post('/',    authorize('superadmin', 'admin', 'content_manager'), categoryController.createCategory);
router.put('/:id',  authorize('superadmin', 'admin', 'content_manager'), categoryController.updateCategory);
router.delete('/:id', authorize('superadmin', 'admin'), categoryController.deleteCategory);

module.exports = router;
