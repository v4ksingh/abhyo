/**
 * Proactive Cache Warming Engine for Abhyo LMS & Olympiad Platform
 * Preloads heavy and frequently requested database queries into fast RAM.
 */

const cache = require('./cache.util');
const {
  Category, Test, Institute, Course, ExamSeries, EBook, Result, Setting
} = require('../models');

// ── 1. Warm Categories ──
async function warmCategories() {
  try {
    const [allCategories, activeCategories] = await Promise.all([
      Category.findAll({
        where: { parentId: null },
        include: [{ model: Category, as: 'subCategories' }],
        order: [['name', 'ASC']],
      }),
      Category.findAll({
        where: { isActive: true, parentId: null },
        include: [{ model: Category, as: 'subCategories', where: { isActive: true }, required: false }],
        order: [['name', 'ASC']],
      }),
    ]);

    cache.set('categories:all', allCategories, 3600); // 1 hour
    cache.set('categories:active', activeCategories, 3600);
    return { module: 'Categories', count: allCategories.length + activeCategories.length };
  } catch (err) {
    console.warn('[Cache Warmer] Categories error:', err.message);
    return { module: 'Categories', error: err.message };
  }
}

// ── 2. Warm Category Exam Stats ──
async function warmCategoryStats() {
  try {
    const { sequelize: db } = require('../config/database');
    const stats = await db.query(`
      SELECT 
        category,
        type,
        COUNT(*) AS total,
        SUM(CASE WHEN isActive = 1 THEN 1 ELSE 0 END) AS active,
        SUM(totalAttempts) AS attempts
      FROM tests
      GROUP BY category, type
      ORDER BY category, type
    `, { type: db.QueryTypes.SELECT });

    const byCategory = {};
    const byType = {};
    let grandTotal = 0;

    stats.forEach(row => {
      const cat = row.category;
      const typ = row.type;
      if (!byCategory[cat]) byCategory[cat] = { total: 0, active: 0, attempts: 0 };
      byCategory[cat].total += parseInt(row.total || 0, 10);
      byCategory[cat].active += parseInt(row.active || 0, 10);
      byCategory[cat].attempts += parseInt(row.attempts || 0, 10);
      if (!byType[typ]) byType[typ] = { total: 0, active: 0 };
      byType[typ].total += parseInt(row.total || 0, 10);
      byType[typ].active += parseInt(row.active || 0, 10);
      grandTotal += parseInt(row.total || 0, 10);
    });

    const payload = { byCategory, byType, grandTotal };
    cache.set('tests:category-stats', payload, 1800); // 30 mins
    return { module: 'CategoryStats', count: Object.keys(byCategory).length };
  } catch (err) {
    console.warn('[Cache Warmer] CategoryStats error:', err.message);
    return { module: 'CategoryStats', error: err.message };
  }
}

// ── 3. Warm Course Categories ──
async function warmCourseCategories() {
  try {
    const { sequelize } = require('../config/database');
    const rows = await Course.findAll({
      where: { isPublished: true },
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('category')), 'category']],
      raw: true,
    });
    const cats = rows.map(r => r.category).filter(Boolean).sort();
    cache.set('public:course-categories', cats, 3600);
    return { module: 'CourseCategories', count: cats.length };
  } catch (err) {
    console.warn('[Cache Warmer] CourseCategories error:', err.message);
    return { module: 'CourseCategories', error: err.message };
  }
}

// ── 4. Warm Public Featured Institutes (Landing Page) ──
async function warmPublicInstitutes() {
  try {
    const { count, rows } = await Institute.findAndCountAll({
      where: { status: 'approved' },
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
        required: false,
      }],
      order: [['isFeatured', 'DESC'], ['totalStudents', 'DESC']],
      limit: 12,
      offset: 0,
      distinct: true,
    });

    const data = rows.map(r => {
      const instData = r.toJSON();
      if (instData.lmsCourses && instData.lmsCourses.length > 0) {
        instData.courses = instData.lmsCourses;
      }
      delete instData.lmsCourses;
      return instData;
    });

    const payload = {
      data,
      pagination: { total: count, page: 1, limit: 12 },
    };

    cache.set('public:institutes:default', payload, 1800);
    return { module: 'PublicInstitutes', count: data.length };
  } catch (err) {
    console.warn('[Cache Warmer] PublicInstitutes error:', err.message);
    return { module: 'PublicInstitutes', error: err.message };
  }
}

// ── 5. Warm Top Global Leaderboard ──
async function warmGlobalLeaderboard() {
  try {
    const results = await Result.findAll({
      where: { status: ['completed', 'auto-submitted'] },
      include: [
        { association: 'user', attributes: ['id', 'name', 'avatar'] },
        { association: 'institute', attributes: ['id', 'name'] },
      ],
      order: [['score', 'DESC'], ['timeTaken', 'ASC']],
      limit: 50,
    });

    cache.set('leaderboard:global:global:50', results, 600); // 10 minutes
    return { module: 'GlobalLeaderboard', count: results.length };
  } catch (err) {
    console.warn('[Cache Warmer] GlobalLeaderboard error:', err.message);
    return { module: 'GlobalLeaderboard', error: err.message };
  }
}

// ── 6. Warm System Settings ──
async function warmSystemSettings() {
  try {
    if (!Setting) return { module: 'SystemSettings', skipped: true };
    const settings = await Setting.findAll();
    cache.set('system:settings', settings, 86400); // 24 hours
    return { module: 'SystemSettings', count: settings.length };
  } catch (err) {
    console.warn('[Cache Warmer] SystemSettings error:', err.message);
    return { module: 'SystemSettings', error: err.message };
  }
}

/**
 * Master Warm-Up Runner
 * Preloads all defined modules concurrently with timing benchmarks.
 */
async function warmAll(trigger = 'system-boot') {
  const startTime = Date.now();
  console.log(`🔥 [Cache Warmer] Starting cache warm-up (trigger: ${trigger})...`);

  const results = await Promise.allSettled([
    warmCategories(),
    warmCategoryStats(),
    warmCourseCategories(),
    warmPublicInstitutes(),
    warmGlobalLeaderboard(),
    warmSystemSettings(),
  ]);

  const durationMs = Date.now() - startTime;
  cache.lastWarmedAt = new Date().toISOString();

  const summary = results.map(r => r.status === 'fulfilled' ? r.value : { error: r.reason?.message });
  console.log(`⚡ [Cache Warmer] Completed warm-up in ${durationMs}ms across ${results.length} modules.`);

  return {
    success: true,
    trigger,
    durationMs,
    timestamp: cache.lastWarmedAt,
    modules: summary,
    stats: cache.getStats(),
  };
}

// Recurring background warming every 20 minutes
let recurringTimer = null;
function startPeriodicWarming(intervalMinutes = 20) {
  if (recurringTimer) clearInterval(recurringTimer);
  recurringTimer = setInterval(() => {
    warmAll('scheduled-cron').catch(e => console.error('[Cache Warmer Cron Error]:', e.message));
  }, intervalMinutes * 60 * 1000);

  if (recurringTimer.unref) {
    recurringTimer.unref();
  }
}

module.exports = {
  warmAll,
  warmCategories,
  warmCategoryStats,
  warmCourseCategories,
  warmPublicInstitutes,
  warmGlobalLeaderboard,
  warmSystemSettings,
  startPeriodicWarming,
};
