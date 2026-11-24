const { Subject, Question } = require('../models');

// GET /subjects
exports.getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.findAll({ order: [['name', 'ASC']] });
    res.json({ success: true, data: subjects });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /subjects/public (Active)
exports.getActiveSubjects = async (req, res) => {
  try {
    const subjects = await Subject.findAll({ where: { isActive: true }, order: [['name', 'ASC']] });
    res.json({ success: true, data: subjects });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /subjects
exports.createSubject = async (req, res) => {
  try {
    const { name, description, isActive } = req.body;
    const subject = await Subject.create({ name, description, isActive });
    res.status(201).json({ success: true, data: subject });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Subject with this name already exists.' });
    }
    res.status(400).json({ error: err.message });
  }
};

// PUT /subjects/:id
exports.updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, isActive } = req.body;
    const subject = await Subject.findByPk(id);
    if (!subject) return res.status(404).json({ error: 'Subject not found' });
    
    await subject.update({ name, description, isActive });
    res.json({ success: true, data: subject });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Subject with this name already exists.' });
    }
    res.status(400).json({ error: err.message });
  }
};

// DELETE /subjects/:id
exports.deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const subject = await Subject.findByPk(id);
    if (!subject) return res.status(404).json({ error: 'Subject not found' });
    
    await subject.destroy();
    res.json({ success: true, message: 'Subject deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
