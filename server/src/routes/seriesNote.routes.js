const express = require('express');
const router = express.Router({ mergeParams: true });
const ctrl = require('../controllers/seriesNote.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

const canManageContent = authorize('superadmin', 'admin', 'content_manager');

// ── Public routes ──────────────────────────────────────────────
router.get('/public', ctrl.publicListNotes);
router.get('/:noteId', ctrl.getNote);

// ── Admin routes ───────────────────────────────────────────────
router.get('/',             protect, canManageContent, ctrl.adminListNotes);
router.post('/',            protect, canManageContent, ctrl.noteUploadMiddleware, ctrl.createNote);
router.put('/:noteId',      protect, canManageContent, ctrl.noteUploadMiddleware, ctrl.updateNote);
router.delete('/:noteId',   protect, authorize('superadmin', 'admin'), ctrl.deleteNote);
router.patch('/:noteId/toggle', protect, canManageContent, ctrl.toggleNoteStatus);

module.exports = router;

