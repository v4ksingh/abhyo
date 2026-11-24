const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const {
  Institute, Test, ExamSeries, Course, User, CourseModule, Lesson, CertificateRequest,
  Category, VideoSeries, EBook, Olympiad
} = require('../models');
const cache = require('../utils/cache.util');

// ─── GET /api/public/institutes — list all featured/landing-enabled institutes ──
router.get('/institutes', async (req, res) => {
  try {
    const { search, city, state, page = 1, limit = 12 } = req.query;
    const offset = (page - 1) * limit;
    const where = { status: 'approved' };
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { tagline: { [Op.like]: `%${search}%` } },
      ];
    }
    if (city) where.city = city;
    if (state) where.state = state;

    const { count, rows } = await Institute.findAndCountAll({
      where,
      attributes: [
        'id', 'name', 'slug', 'logo', 'bannerImage', 'tagline',
        'city', 'state', 'isFeatured', 'subscriptionPlan',
        'totalStudents', 'foundedYear', 'courses',
      ],
      include: [{
        model: Course,
        as: 'lmsCourses',
        attributes: ['id', 'title'],
        where: { isPublished: true },
        required: false
      }],
      order: [['isFeatured', 'DESC'], ['totalStudents', 'DESC']],
      limit: parseInt(limit),
      offset,
      distinct: true, // required when using include with findAndCountAll
    });

    const data = rows.map(r => {
      const instData = r.toJSON();
      if (instData.lmsCourses && instData.lmsCourses.length > 0) {
        // override old courses JSON with real DB courses
        instData.courses = instData.lmsCourses;
      }
      delete instData.lmsCourses;
      return instData;
    });

    res.json({
      success: true,
      data: data,
      pagination: { total: count, page: parseInt(page), limit: parseInt(limit) },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/public/institutes/:slug — single institute landing page ──
router.get('/institutes/:slug', async (req, res) => {
  try {
    const inst = await Institute.findOne({
      where: { slug: req.params.slug, status: 'approved', isLandingEnabled: true },
      attributes: { exclude: ['ownerId', 'inviteCode', 'rejectionReason', 'subscriptionStartDate', 'subscriptionEndDate'] },
    });

    if (!inst) return res.status(404).json({ error: 'Institute not found or not published' });

    // Safely parse JSON fields that MySQL/Sequelize may return as strings
    const safeJSON = (val, fallback) => {
      if (!val) return fallback;
      if (typeof val === 'string') { try { return JSON.parse(val); } catch { return fallback; } }
      return val;
    };
    const instData = inst.toJSON();
    instData.achievements = safeJSON(instData.achievements, []);
    instData.socialLinks = safeJSON(instData.socialLinks, {});

    // Fetch real courses from DB instead of JSON
    const courses = await Course.findAll({
      where: { instituteId: instData.id, isPublished: true },
      attributes: ['id', 'title', 'slug', 'description', 'thumbnail', 'price', 'category'],
      order: [['createdAt', 'DESC']]
    });
    instData.courses = courses; // Override JSON with DB records

    instData.faculty = safeJSON(instData.faculty, []);
    instData.testimonials = safeJSON(instData.testimonials, []);

    // Get public tests (free tests linked to this institute via batches or globally)
    const publicTests = await Test.findAll({
      where: { isActive: true, isFree: true },
      attributes: ['id', 'title', 'category', 'totalQuestions', 'duration', 'totalMarks', 'difficultyTag'],
      limit: 6,
      order: [['createdAt', 'DESC']],
    });

    res.json({ success: true, data: { institute: instData, publicTests } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/public/course-categories — distinct categories from published courses ──
router.get('/course-categories', async (req, res) => {
  try {
    const cats = await cache.wrap('public:course-categories', 3600, async () => {
      const { sequelize } = require('../config/database');
      const rows = await Course.findAll({
        where: { isPublished: true },
        attributes: [[sequelize.fn('DISTINCT', sequelize.col('category')), 'category']],
        raw: true,
      });
      return rows.map(r => r.category).filter(Boolean).sort();
    });
    res.json({ success: true, data: cats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/public/courses — list all published courses ──
router.get('/courses', async (req, res) => {
  try {
    const { search, category, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = { isPublished: true };
    if (category) where.category = category;
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Course.findAndCountAll({
      where,
      attributes: ['id', 'title', 'slug', 'description', 'thumbnail', 'price', 'category', 'instructorName', 'liveClasses', 'recordedClasses', 'courseDuration', 'seats', 'createdAt'],
      include: [
        { model: Institute, as: 'institute', attributes: ['id', 'name', 'slug', 'logo', 'city', 'state'] },
        { model: User, as: 'creator', attributes: ['id', 'name', 'avatar'] },
        { model: CourseModule, as: 'modules', attributes: ['id'] },
      ],
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']],
      distinct: true,
      subQuery: false,
    });

    res.json({ success: true, data: rows, total: count, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/public/courses/:slug — single course public detail ──
router.get('/courses/:slug', async (req, res) => {
  try {
    const course = await Course.findOne({
      where: { slug: req.params.slug, isPublished: true },
      include: [
        {
          model: Institute,
          as: 'institute',
          attributes: ['id', 'name', 'slug', 'logo', 'city', 'state', 'inviteCode']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'avatar']
        },
        {
          model: User,
          as: 'assignedInstructor',
          attributes: ['id', 'name', 'avatar']
        },
        {
          model: CourseModule,
          as: 'modules',
          include: [
            {
              model: Lesson,
              as: 'lessons',
              attributes: ['id', 'title', 'duration', 'type', 'isFree', 'order'], // Safe details
            }
          ]
        }
      ]
    });

    if (!course) return res.status(404).json({ error: 'Course not found or not published' });

    const courseData = course.toJSON();
    courseData.modules.sort((a, b) => a.order - b.order);
    courseData.modules.forEach(m => {
      m.lessons.sort((a, b) => a.order - b.order);
    });

    res.json({ success: true, data: courseData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/public/live-classes — Global Feed of Live Classes ──
router.get('/live-classes', async (req, res) => {
  try {
    const { LiveClass } = require('../models');
    const { search, status, page = 1, limit = 16 } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    // By default, only show scheduled or live
    if (status) where.status = status;
    else where.status = ['scheduled', 'live'];

    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { topic: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await LiveClass.findAndCountAll({
      where,
      include: [
        {
          model: Institute,
          as: 'institute',
          attributes: ['id', 'name', 'slug', 'logo'],
          where: { status: 'approved' },
        }
      ],
      order: [
        ['status', 'ASC'], // 'live' comes before 'scheduled' alphabetically
        ['scheduledAt', 'ASC'] // then closest scheduled
      ],
      limit: parseInt(limit),
      offset,
    });

    res.json({
      success: true,
      data: rows,
      pagination: { total: count, page: parseInt(page), limit: parseInt(limit) },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/public/certificates/:id — public certificate view ──
router.get('/certificates/:id', async (req, res) => {
  try {
    const cert = await CertificateRequest.findOne({
      where: { id: req.params.id, status: 'approved' },
      include: [
        { model: Course, as: 'course', attributes: ['id', 'title'] },
        { model: Institute, as: 'institute', attributes: ['id', 'name', 'logo'] },
        { model: User, as: 'student', attributes: ['id', 'name'] }
      ]
    });
    if (!cert) return res.status(404).json({ error: 'Certificate not found or not approved' });
    res.json({ success: true, data: cert });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/public/search — Unified Search across all platform content ──
router.get('/search', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) {
      return res.json({ success: true, query: '', total: 0, data: [] });
    }

    const likeQ = `%${q}%`;
    const isOlympiadIntent = /olympiad|school|award|prize|class\s*[6-9]|class\s*1[0-2]|contest|quiz/i.test(q);

    // Parallel fetch across content tables
    const [olympiadRows, seriesRows, testRows, courseRows, videoRows, ebookRows, instituteRows, categoryRows] = await Promise.all([
      // 1. Olympiads
      Olympiad ? Olympiad.findAll({
        where: {
          [Op.or]: [
            { title: { [Op.like]: likeQ } },
            { tagline: { [Op.like]: likeQ } },
          ]
        },
        attributes: ['id', 'title', 'slug', 'tagline', 'examDate', 'fee', 'status'],
        limit: 5,
      }).catch(() => []) : [],

      // 2. Exam Series
      ExamSeries ? ExamSeries.findAll({
        where: {
          [Op.or]: [
            { title: { [Op.like]: likeQ } },
            { category: { [Op.like]: likeQ } },
            { examName: { [Op.like]: likeQ } },
          ]
        },
        attributes: ['id', 'title', 'slug', 'category', 'examName', 'totalTests', 'thumbnail', 'isFree'],
        limit: 5,
      }).catch(() => []) : [],

      // 3. Mock Tests
      Test ? Test.findAll({
        where: {
          isActive: true,
          [Op.or]: [
            { title: { [Op.like]: likeQ } },
            { category: { [Op.like]: likeQ } },
          ]
        },
        attributes: ['id', 'title', 'category', 'totalQuestions', 'duration', 'totalMarks', 'isFree'],
        limit: 5,
      }).catch(() => []) : [],

      // 4. Courses
      Course ? Course.findAll({
        where: {
          isPublished: true,
          [Op.or]: [
            { title: { [Op.like]: likeQ } },
            { category: { [Op.like]: likeQ } },
          ]
        },
        attributes: ['id', 'title', 'slug', 'category', 'price', 'thumbnail'],
        limit: 5,
      }).catch(() => []) : [],

      // 5. Video Series
      VideoSeries ? VideoSeries.findAll({
        where: {
          [Op.or]: [
            { title: { [Op.like]: likeQ } },
            { category: { [Op.like]: likeQ } },
          ]
        },
        attributes: ['id', 'title', 'slug', 'category', 'thumbnail', 'totalVideos'],
        limit: 4,
      }).catch(() => []) : [],

      // 6. eBooks
      EBook ? EBook.findAll({
        where: {
          [Op.or]: [
            { title: { [Op.like]: likeQ } },
            { category: { [Op.like]: likeQ } },
          ]
        },
        attributes: ['id', 'title', 'category', 'thumbnail', 'price'],
        limit: 4,
      }).catch(() => []) : [],

      // 7. Institutes
      Institute ? Institute.findAll({
        where: {
          status: 'approved',
          [Op.or]: [
            { name: { [Op.like]: likeQ } },
            { city: { [Op.like]: likeQ } },
          ]
        },
        attributes: ['id', 'name', 'slug', 'logo', 'city', 'state'],
        limit: 4,
      }).catch(() => []) : [],

      // 8. Categories
      Category ? Category.findAll({
        where: {
          name: { [Op.like]: likeQ }
        },
        attributes: ['id', 'name', 'image'],
        limit: 4,
      }).catch(() => []) : [],
    ]);

    // Format results with direct destination links for "placing the user"
    const formatted = [];

    // If query matches Olympiad or keyword matches, always inject Abhyo Olympiad Hub
    if (isOlympiadIntent || 'abhyo olympiad national 2026'.includes(q.toLowerCase())) {
      formatted.push({
        id: 'olympiad-hub',
        type: 'olympiad',
        title: 'Abhyo National Olympiad 2026 (Class 6–12)',
        subtitle: 'Win Cash Prizes & Medals • 100% Online',
        icon: 'trophy',
        url: '/olympiad',
        badge: 'Olympiad Live'
      });
    }

    olympiadRows.forEach(item => {
      formatted.push({
        id: `oly-${item.id}`,
        type: 'olympiad',
        title: item.title,
        subtitle: item.tagline || 'National School Competition',
        icon: 'trophy',
        url: item.slug ? `/olympiad/${item.slug}` : '/olympiad',
        badge: 'Olympiad'
      });
    });

    categoryRows.forEach(item => {
      formatted.push({
        id: `cat-${item.id}`,
        type: 'category',
        title: item.name,
        subtitle: 'Browse all exams & mock tests in category',
        icon: 'folder',
        url: `/categories?category=${encodeURIComponent(item.name)}`,
        badge: 'Exam Category'
      });
    });

    seriesRows.forEach(item => {
      formatted.push({
        id: `series-${item.id}`,
        type: 'examSeries',
        title: item.title,
        subtitle: `${item.totalTests || 0} Mock Tests • ${item.category || item.examName || 'Exam Series'}`,
        icon: 'award',
        url: item.slug ? `/exam-series/${item.slug}` : `/categories?category=${encodeURIComponent(item.category || '')}`,
        badge: 'Exam Series'
      });
    });

    testRows.forEach(item => {
      formatted.push({
        id: `test-${item.id}`,
        type: 'test',
        title: item.title,
        subtitle: `${item.totalQuestions || 0} Questions • ${item.duration || 60} Mins • ${item.category || 'Mock Test'}`,
        icon: 'target',
        url: `/tests?search=${encodeURIComponent(item.title)}`,
        badge: 'Mock Test'
      });
    });

    courseRows.forEach(item => {
      formatted.push({
        id: `course-${item.id}`,
        type: 'course',
        title: item.title,
        subtitle: item.category || 'Live & Recorded Course',
        icon: 'book',
        url: item.slug ? `/courses/${item.slug}` : '/courses',
        badge: 'Course'
      });
    });

    videoRows.forEach(item => {
      formatted.push({
        id: `video-${item.id}`,
        type: 'video',
        title: item.title,
        subtitle: `${item.totalVideos || 0} Videos • ${item.category || 'Video Series'}`,
        icon: 'play',
        url: item.slug ? `/video-series/${item.slug}` : '/video-series',
        badge: 'Video Series'
      });
    });

    ebookRows.forEach(item => {
      formatted.push({
        id: `ebook-${item.id}`,
        type: 'ebook',
        title: item.title,
        subtitle: item.category || 'Study Material / PDF',
        icon: 'file',
        url: '/ebooks',
        badge: 'eBook'
      });
    });

    instituteRows.forEach(item => {
      formatted.push({
        id: `inst-${item.id}`,
        type: 'institute',
        title: item.name,
        subtitle: [item.city, item.state].filter(Boolean).join(', ') || 'Partner Institute',
        icon: 'building',
        url: item.slug ? `/institutes/${item.slug}` : '/institutes',
        badge: 'Institute'
      });
    });

    res.json({
      success: true,
      query: q,
      total: formatted.length,
      data: formatted,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
