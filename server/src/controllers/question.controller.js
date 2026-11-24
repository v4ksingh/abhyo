const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const { Question } = require('../models');
const csv = require('csv-parser');
const fs = require('fs');

// ─── List Questions ────────────────────────────────────────
exports.getQuestions = async (req, res) => {
  try {
    const { page = 1, limit = 20, subjectId, difficulty, search, questionType, categoryId } = req.query;
    const offset = (page - 1) * limit;
    const whereClause = { isActive: true };
    if (subjectId) whereClause.subjectId = subjectId;
    if (categoryId) whereClause.categoryId = categoryId;
    if (difficulty) whereClause.difficulty = difficulty;
    if (questionType) whereClause.questionType = questionType;
    if (search) whereClause.questionText = { [Op.like]: `%${search}%` };

    const { count, rows } = await Question.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    res.json({ success: true, data: rows, pagination: { total: count, page: parseInt(page), limit: parseInt(limit) } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Get Subjects (Legacy, maps to new /subjects) ───────
exports.getSubjects = async (req, res) => {
  try {
    const { Subject } = require('../models');
    const subjects = await Subject.findAll({ where: { isActive: true }, raw: true });
    // Keep returning strings to not break legacy frontend calls that just need strings,
    // though the frontend gets subjects from /subjects directly for ID matching now.
    res.json({ success: true, data: subjects.map(s => s.name) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Create Question ────────────────────────────────────────
exports.createQuestion = async (req, res) => {
  try {
    const data = { ...req.body, createdBy: req.user.id };
    const question = await Question.create(data);
    res.status(201).json({ success: true, data: question });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Update Question ────────────────────────────────────────
exports.updateQuestion = async (req, res) => {
  try {
    const question = await Question.findByPk(req.params.id);
    if (!question) return res.status(404).json({ error: 'Question not found' });
    await question.update(req.body);
    res.json({ success: true, data: question });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Delete Question ────────────────────────────────────────
exports.deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findByPk(req.params.id);
    if (!question) return res.status(404).json({ error: 'Question not found' });
    await question.update({ isActive: false }); // Soft delete
    res.json({ success: true, message: 'Question deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── CSV Import ────────────────────────────────────────
exports.importCSV = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'CSV file is required' });

  const rows = [];
  fs.createReadStream(req.file.path)
    .pipe(csv({
      mapHeaders: ({ header }) => header.trim().replace(/^\uFEFF/, '')
    }))
    .on('data', (data) => rows.push(data))
    .on('end', async () => {
      let created = 0, errors = 0;
      let lastError = null;
      const batch = [];

      try {
        const { Subject, Category } = require('../models');
        const subjects = await Subject.findAll();
        const categories = await Category.findAll();
        const subjectMap = {};
        subjects.forEach(s => subjectMap[s.name.toLowerCase()] = s.id);
        const categoryMap = {};
        categories.forEach(c => categoryMap[c.name.toLowerCase()] = c.id);

        for (const row of rows) {
          try {
            const options = [
              { label: 'A', text: row.optionA || row.option_a || '', textHindi: row.optionAHindi || row.option_a_hindi || '' },
              { label: 'B', text: row.optionB || row.option_b || '', textHindi: row.optionBHindi || row.option_b_hindi || '' },
              { label: 'C', text: row.optionC || row.option_c || '', textHindi: row.optionCHindi || row.option_c_hindi || '' },
              { label: 'D', text: row.optionD || row.option_d || '', textHindi: row.optionDHindi || row.option_d_hindi || '' },
            ].filter(o => o.text || o.textHindi);

            if ((!row.question && !row.questionHindi && !row.question_hindi) || options.length < 2) { 
              errors++; 
              lastError = 'Missing question text or less than 2 options.';
              continue; 
            }

            const correctAnswer = (row.correctAnswer || row.correct_answer || 'A').toUpperCase();
            if (!['A', 'B', 'C', 'D', 'E'].includes(correctAnswer)) { 
              errors++; 
              lastError = 'Invalid correctAnswer (must be A, B, C, D, or E). Found: ' + correctAnswer;
              continue; 
            }

            // Auto-resolve or Auto-create Subject
            let sId = row.subjectId || null;
            if (!sId && row.subject) {
              const sName = String(row.subject).trim();
              const sKey = sName.toLowerCase();
              if (subjectMap[sKey]) {
                sId = subjectMap[sKey];
              } else {
                const newSub = await Subject.create({ name: sName });
                sId = newSub.id;
                subjectMap[sKey] = newSub.id;
              }
            }

            // Auto-resolve or Auto-create Category
            let cId = row.categoryId || null;
            if (!cId && row.category) {
              const cName = String(row.category).trim();
              const cKey = cName.toLowerCase();
              if (categoryMap[cKey]) {
                cId = categoryMap[cKey];
              } else {
                const newCat = await Category.create({ name: cName });
                cId = newCat.id;
                categoryMap[cKey] = newCat.id;
              }
            }

            batch.push({
              questionText: row.question || '',
              questionTextHindi: row.questionHindi || row.question_hindi || null,
              options,
              correctAnswer,
              subject: row.subject || 'General',
              topic: row.topic || null,
              difficulty: row.difficulty || 'medium',
              marks: parseFloat(row.marks) || 1,
              negativeMarks: parseFloat(row.negativeMarks) || 0,
              explanation: row.explanation || null,
              explanationHindi: row.explanationHindi || row.explanation_hindi || null,
              categoryId: cId,
              subjectId: sId,
              createdBy: req.user.id,
            });
          } catch (errInner) { 
            console.error('Row process error:', errInner);
            errors++; 
          }
        }
      } catch (e) {
        console.error('Import maps error:', e);
      }

      if (batch.length > 0) {
        const result = await Question.bulkCreate(batch, { ignoreDuplicates: true });
        created = result.length;
      }

      fs.unlinkSync(req.file.path);
      res.json({ success: true, data: { created, errors, total: rows.length } });
    })
    .on('error', (err) => {
      res.status(500).json({ error: 'CSV parse error: ' + err.message });
    });
};

// ─── Upload Image ────────────────────────────────────────
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image file provided' });
    const url = `/uploads/${req.file.filename}`;
    res.json({ success: true, data: { url, filename: req.file.filename } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
