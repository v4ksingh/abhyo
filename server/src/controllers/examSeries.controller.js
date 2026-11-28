const { ExamSeries, Test } = require('../models');
const { Op } = require('sequelize');

// ── slug helper ─────────────────────────────────────────────────
const toSlug = (str) => {
  if (!str) return '';
  return str.toString().toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

const generateUniqueSlug = async (baseStr, excludeId = null) => {
  let base = toSlug(baseStr) || `series-${Date.now()}`;
  let candidate = base;
  let count = 1;
  while (true) {
    const where = { slug: candidate };
    if (excludeId) where.id = { [Op.ne]: excludeId };
    const existing = await ExamSeries.findOne({ where, attributes: ['id'] });
    if (!existing) return candidate;
    candidate = `${base}-${count++}`;
  }
};

// ── GET /exam-series          (public list) ────────────────────
exports.listSeries = async (req, res) => {
  try {
    const { category, featured } = req.query;
    const where = { isActive: true };
    if (category) where.category = category;
    if (featured === 'true') where.isFeatured = true;

    const series = await ExamSeries.findAll({
      where,
      order: [['isFeatured', 'DESC'], ['createdAt', 'DESC']],
      attributes: { exclude: ['syllabus', 'examPattern', 'faqs'] }, // keep response light
    });
    res.json({ success: true, data: series });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── GET /exam-series/:slug    (public detail) ──────────────────
exports.getSeriesBySlug = async (req, res) => {
  try {
    const series = await ExamSeries.findOne({
      where: { slug: req.params.slug, isActive: true },
    });
    if (!series) return res.status(404).json({ error: 'Series not found' });

    // Get tests in this series
    const tests = await Test.findAll({
      where: { seriesId: series.id, isActive: true },
      attributes: ['id','title','type','duration','totalMarks','totalQuestions',
                   'isFree','price','totalAttempts','negativeMarkingEnabled',
                   'difficultyTag','category','scheduledAt'],
      order: [['createdAt', 'ASC']],
    });

    res.json({ success: true, data: { ...series.toJSON(), tests } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── GET /admin/exam-series    (admin list all) ─────────────────
exports.adminListSeries = async (req, res) => {
  try {
    const series = await ExamSeries.findAll({
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, data: series });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── POST /admin/exam-series   (create — supports single, batch, and n8n) ─────────────────────────
exports.createSeries = async (req, res) => {
  try {
    // Support batch input from n8n: e.g. [ { title: '...' } ] or { series: [ ... ] }
    const items = Array.isArray(req.body)
      ? req.body
      : Array.isArray(req.body.series)
        ? req.body.series
        : [req.body];

    const results = [];

    for (const item of items) {
      const finalTitle = (item.title || item.examName || '').trim();
      const finalExamName = (item.examName || item.title || '').trim();

      if (!finalTitle) continue;

      // Optional upsert for automated workflows (n8n)
      if (item.upsert || req.body.upsert) {
        const existing = await ExamSeries.findOne({
          where: { title: finalTitle }
        });
        if (existing) {
          const updates = {};
          const fields = [
            'tagline', 'description', 'category', 'subCategory', 'linkedExams',
            'bannerImage', 'thumbnailImage', 'isFree', 'price',
            'isActive', 'isFeatured', 'examDetails'
          ];
          fields.forEach(f => { if (item[f] !== undefined) updates[f] = item[f]; });
          if (item.examName && item.examName !== existing.examName) updates.examName = item.examName;
          await existing.update(updates);
          results.push(existing);
          continue;
        }
      }

      const finalCategory = (item.category || 'General').trim();
      const finalSlug = await generateUniqueSlug(item.slug || finalExamName || finalTitle);

      const isFree = item.isFree !== undefined ? !!item.isFree : (item.price ? parseFloat(item.price) <= 0 : true);
      const price = item.price ? parseFloat(item.price) : 0;

      const series = await ExamSeries.create({
        title: finalTitle,
        examName: finalExamName,
        slug: finalSlug,
        tagline: item.tagline || '',
        description: item.description || '',
        category: finalCategory,
        subCategory: item.subCategory || null,
        linkedExams: Array.isArray(item.linkedExams) ? item.linkedExams : (item.linkedExams ? [item.linkedExams] : []),
        examDetails: item.examDetails || {},
        eligibility: item.eligibility || [],
        syllabus: item.syllabus || [],
        examPattern: item.examPattern || [],
        importantDates: item.importantDates || [],
        highlights: item.highlights || [],
        faqs: item.faqs || [],
        selectionProcess: item.selectionProcess || [],
        salaryDetails: item.salaryDetails || [],
        howToApply: item.howToApply || [],
        importantLinks: item.importantLinks || [],
        bannerImage: item.bannerImage || null,
        thumbnailImage: item.thumbnailImage || null,
        isFree,
        price,
        isActive: item.isActive !== false,
        isFeatured: !!item.isFeatured,
        createdBy: req.user?.id || null,
      });

      results.push(series);
    }

    if (results.length === 0) {
      return res.status(400).json({ error: 'title or examName is required' });
    }

    if (!Array.isArray(req.body) && !Array.isArray(req.body.series)) {
      return res.status(201).json({ success: true, data: results[0] });
    }
    return res.status(201).json({ success: true, count: results.length, data: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── PUT /admin/exam-series/:id  (update) ──────────────────────
exports.updateSeries = async (req, res) => {
  try {
    const series = await ExamSeries.findByPk(req.params.id);
    if (!series) return res.status(404).json({ error: 'Not found' });

    const allowed = [
      'title','examName','tagline','description','category','subCategory','linkedExams',
      'examDetails','eligibility','syllabus','examPattern',
      'importantDates','highlights','faqs',
      'selectionProcess','salaryDetails','howToApply','importantLinks',
      'bannerImage','thumbnailImage',
      'isFree','price','isActive','isFeatured',
    ];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    // Regenerate slug if examName changed
    if (updates.examName && updates.examName !== series.examName) {
      updates.slug = await generateUniqueSlug(updates.examName, series.id);
    } else if (updates.title && !updates.examName && (!series.examName || series.examName === series.title)) {
      updates.examName = updates.title;
      updates.slug = await generateUniqueSlug(updates.title, series.id);
    }

    await series.update(updates);

    // Update test count
    const count = await Test.count({ where: { seriesId: series.id } });
    await series.update({ totalTests: count });

    res.json({ success: true, data: series });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── DELETE /admin/exam-series/:id ─────────────────────────────
exports.deleteSeries = async (req, res) => {
  try {
    const series = await ExamSeries.findByPk(req.params.id);
    if (!series) return res.status(404).json({ error: 'Not found' });

    // Unlink tests (don't delete them)
    await Test.update({ seriesId: null }, { where: { seriesId: series.id } });
    await series.destroy();
    res.json({ success: true, message: 'Series deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── POST /admin/exam-series/:id/assign-tests (assign tests) ────
exports.assignTests = async (req, res) => {
  try {
    const { testIds = [] } = req.body;
    const series = await ExamSeries.findByPk(req.params.id);
    if (!series) return res.status(404).json({ error: 'Series not found' });

    await Test.update({ seriesId: series.id }, { where: { id: testIds } });
    const count = await Test.count({ where: { seriesId: series.id } });
    await series.update({ totalTests: count });

    res.json({ success: true, message: `${testIds.length} test(s) assigned`, totalTests: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── GET /admin/exam-series/:id/tests (list tests in series) ────
exports.getSeriesTests = async (req, res) => {
  try {
    const tests = await Test.findAll({
      where: { seriesId: req.params.id },
      attributes: ['id','title','type','duration','totalMarks','totalQuestions','isActive','isFree','totalAttempts'],
      order: [['createdAt', 'ASC']],
    });
    res.json({ success: true, data: tests });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── POST /admin/upload  (generic file/image/pdf upload for admin) ──
exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    res.json({ success: true, url: `/uploads/${req.file.filename}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
