const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subject.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

router.get('/public', subjectController.getActiveSubjects);

router.use(protect);
router.use(authorize('superadmin', 'institute'));

router.get('/', subjectController.getSubjects);
router.post('/', subjectController.createSubject);
router.put('/:id', subjectController.updateSubject);
router.delete('/:id', subjectController.deleteSubject);

module.exports = router;
