const express = require('express');
const router = express.Router();
const question = require('../controllers/question.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

// Questions — superadmin, admin, content_manager, teacher can all manage questions
const canManageContent = authorize('superadmin', 'admin', 'content_manager', 'teacher');

router.use(protect, canManageContent);

router.get('/subjects', question.getSubjects);
router.get('/', question.getQuestions);
router.post('/', question.createQuestion);
router.post('/import-csv', upload.single('file'), question.importCSV);
router.post('/upload-image', upload.single('image'), question.uploadImage);
router.put('/:id', question.updateQuestion);
router.delete('/:id', question.deleteQuestion);

module.exports = router;

