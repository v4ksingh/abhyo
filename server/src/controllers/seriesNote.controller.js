const { SeriesNote, ExamSeries } = require('../models');
const { Op } = require('sequelize');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ── Multer setup for note file uploads ───────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads/notes');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `note-${Date.now()}${ext}`);
  },
});
const noteUpload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only PDF, DOC, DOCX, and image files are allowed'));
  },
}).fields([
  { name: 'file', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]);

exports.noteUploadMiddleware = (req, res, next) => {
  noteUpload(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
};

// ── GET /exam-series/:seriesId/notes  (admin — list all notes) ──
exports.adminListNotes = async (req, res) => {
  try {
    const { seriesId } = req.params;
    const notes = await SeriesNote.findAll({
      where: { seriesId },
      order: [['subject', 'ASC'], ['sortOrder', 'ASC'], ['createdAt', 'ASC']],
    });

    // Group by subject for easy frontend rendering
    const grouped = {};
    notes.forEach(n => {
      if (!grouped[n.subject]) grouped[n.subject] = [];
      grouped[n.subject].push(n);
    });

    res.json({ success: true, data: notes, grouped });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── GET /exam-series/:seriesId/notes/public  (public — active notes only) ──
exports.publicListNotes = async (req, res) => {
  try {
    const { seriesId } = req.params;
    const notes = await SeriesNote.findAll({
      where: { seriesId, isActive: true },
      attributes: { exclude: ['content'] }, // exclude heavy content from list
      order: [['subject', 'ASC'], ['sortOrder', 'ASC'], ['createdAt', 'ASC']],
    });

    // Group by subject
    const grouped = {};
    notes.forEach(n => {
      if (!grouped[n.subject]) grouped[n.subject] = [];
      grouped[n.subject].push(n);
    });

    res.json({ success: true, data: notes, grouped });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── GET /exam-series/:seriesId/notes/:noteId  (get single note with content) ──
exports.getNote = async (req, res) => {
  try {
    const note = await SeriesNote.findOne({
      where: { id: req.params.noteId, seriesId: req.params.seriesId },
    });
    if (!note) return res.status(404).json({ error: 'Note not found' });
    res.json({ success: true, data: note });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── POST /admin/exam-series/:seriesId/notes  (create) ──
exports.createNote = async (req, res) => {
  try {
    const { seriesId } = req.params;

    const series = await ExamSeries.findByPk(seriesId);
    if (!series) return res.status(404).json({ error: 'Exam series not found' });

    const {
      title, subject, description, content,
      fileType, externalLink, isFree, isActive, sortOrder,
    } = req.body;

    if (!title || !subject) {
      return res.status(400).json({ error: 'title and subject are required' });
    }

    let fileUrl = null;
    let detectedFileType = fileType || 'none';
    let thumbnailUrl = null;

    if (req.files && req.files.file) {
      const fileObj = req.files.file[0];
      const ext = path.extname(fileObj.originalname).toLowerCase();
      fileUrl = `/uploads/notes/${fileObj.filename}`;
      if (['.pdf'].includes(ext)) detectedFileType = 'pdf';
      else if (['.doc', '.docx'].includes(ext)) detectedFileType = 'doc';
      else if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) detectedFileType = 'image';
    } else if (externalLink) {
      detectedFileType = 'link';
    }

    if (req.files && req.files.thumbnail) {
      thumbnailUrl = `/uploads/notes/${req.files.thumbnail[0].filename}`;
    }

    const note = await SeriesNote.create({
      seriesId,
      title,
      subject,
      description: description || null,
      content: content || null,
      fileUrl,
      fileType: detectedFileType,
      thumbnail: thumbnailUrl,
      externalLink: externalLink || null,
      isFree: isFree !== false && isFree !== 'false',
      isActive: isActive !== false && isActive !== 'false',
      sortOrder: parseInt(sortOrder) || 0,
      createdBy: req.user?.id,
    });

    res.status(201).json({ success: true, data: note });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── PUT /admin/exam-series/:seriesId/notes/:noteId  (update) ──
exports.updateNote = async (req, res) => {
  try {
    const note = await SeriesNote.findOne({
      where: { id: req.params.noteId, seriesId: req.params.seriesId },
    });
    if (!note) return res.status(404).json({ error: 'Note not found' });

    const allowed = ['title', 'subject', 'description', 'content', 'fileType', 'externalLink', 'isFree', 'isActive', 'sortOrder'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    if (req.files && req.files.file) {
      // Delete old file if exists
      if (note.fileUrl) {
        const oldPath = path.join(__dirname, '../../', note.fileUrl);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      const fileObj = req.files.file[0];
      const ext = path.extname(fileObj.originalname).toLowerCase();
      updates.fileUrl = `/uploads/notes/${fileObj.filename}`;
      if (['.pdf'].includes(ext)) updates.fileType = 'pdf';
      else if (['.doc', '.docx'].includes(ext)) updates.fileType = 'doc';
      else if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) updates.fileType = 'image';
    }

    if (req.files && req.files.thumbnail) {
      if (note.thumbnail) {
        const oldPath = path.join(__dirname, '../../', note.thumbnail);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      updates.thumbnail = `/uploads/notes/${req.files.thumbnail[0].filename}`;
    }

    await note.update(updates);
    res.json({ success: true, data: note });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── DELETE /admin/exam-series/:seriesId/notes/:noteId ──
exports.deleteNote = async (req, res) => {
  try {
    const note = await SeriesNote.findOne({
      where: { id: req.params.noteId, seriesId: req.params.seriesId },
    });
    if (!note) return res.status(404).json({ error: 'Note not found' });

    // Delete file if exists
    if (note.fileUrl) {
      const filePath = path.join(__dirname, '../../', note.fileUrl);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await note.destroy();
    res.json({ success: true, message: 'Note deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── PATCH /admin/exam-series/:seriesId/notes/:noteId/toggle ──
exports.toggleNoteStatus = async (req, res) => {
  try {
    const note = await SeriesNote.findOne({
      where: { id: req.params.noteId, seriesId: req.params.seriesId },
    });
    if (!note) return res.status(404).json({ error: 'Note not found' });
    await note.update({ isActive: !note.isActive });
    res.json({ success: true, data: note });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
