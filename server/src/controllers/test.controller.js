const { Op, fn, col } = require('sequelize');
const { sequelize } = require('../config/database');
const { Test, Question, Result, Batch, BatchTest, BatchStudent, User, Institute, Payment } = require('../models');
const cache = require('../utils/cache.util');

// ─── List Tests ────────────────────────────────────────
exports.getTests = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, category, isActive, type } = req.query;
    const offset = (page - 1) * limit;
    const whereClause = {};
    if (search) whereClause.title = { [Op.like]: `%${search}%` };
    if (category && category !== 'all') whereClause.category = category;
    if (type && type !== 'all') whereClause.type = type;

    // For non-admin routes, only show active tests by default
    if (isActive !== undefined) {
      whereClause.isActive = isActive === 'true';
    } else if (!req.user || req.user.role !== 'superadmin') {
      whereClause.isActive = true;
    }

    const { count, rows } = await Test.findAndCountAll({
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

// ─── Category Stats (Served from Warm Cache) ──────────────────
exports.getCategoryStats = async (req, res) => {
  try {
    const payload = await cache.wrap('tests:category-stats', 1800, async () => {
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
        byCategory[cat].total += parseInt(row.total);
        byCategory[cat].active += parseInt(row.active);
        byCategory[cat].attempts += parseInt(row.attempts || 0);
        if (!byType[typ]) byType[typ] = { total: 0, active: 0 };
        byType[typ].total += parseInt(row.total);
        byType[typ].active += parseInt(row.active);
        grandTotal += parseInt(row.total);
      });

      return { byCategory, byType, grandTotal };
    });

    res.json({ success: true, data: payload });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Get Single Test ────────────────────────────────────────
exports.getTest = async (req, res) => {
  try {
    const test = await Test.findByPk(req.params.id);
    if (!test) return res.status(404).json({ error: 'Test not found' });
    res.json({ success: true, data: test });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Create Test ────────────────────────────────────────
exports.createTest = async (req, res) => {
  try {
    const data = req.body;
    data.createdBy = req.user.id;

    // Flatten negativeMarking object if sent from frontend
    if (data.negativeMarking) {
      data.negativeMarkingEnabled = data.negativeMarking.enabled || false;
      data.negativeMarkingValue = data.negativeMarking.value || 0.25;
      delete data.negativeMarking;
    }

    // If sections provided, compute totalQuestions
    if (data.sections?.length > 0) {
      data.totalQuestions = data.sections.reduce((sum, s) => sum + (s.questions?.length || 0), 0);
    } else if (data.questionIds?.length > 0) {
      data.totalQuestions = data.questionIds.length;
    }

    const test = await Test.create(data);

    // Compute totalMarks if questions are specified
    if (test.questionIds?.length > 0) {
      const questions = await Question.findAll({ where: { id: test.questionIds }, attributes: ['marks'] });
      const totalMarks = questions.reduce((s, q) => s + q.marks, 0);
      await test.update({ totalMarks });
    }

    res.status(201).json({ success: true, data: test });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ─── Update Test ────────────────────────────────────────
exports.updateTest = async (req, res) => {
  try {
    const test = await Test.findByPk(req.params.id);
    if (!test) return res.status(404).json({ error: 'Test not found' });

    const data = req.body;
    if (data.negativeMarking) {
      data.negativeMarkingEnabled = data.negativeMarking.enabled;
      data.negativeMarkingValue = data.negativeMarking.value;
      delete data.negativeMarking;
    }

    await test.update(data);
    cache.delByPattern('tests:*');
    res.json({ success: true, data: test });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Delete Test ────────────────────────────────────────
exports.deleteTest = async (req, res) => {
  try {
    const test = await Test.findByPk(req.params.id);
    if (!test) return res.status(404).json({ error: 'Test not found' });
    await test.destroy();
    cache.delByPattern('tests:*');
    res.json({ success: true, message: 'Test deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Start Test ────────────────────────────────────────
exports.startTest = async (req, res) => {
  try {
    const { id: testId } = req.params;
    const userId = req.user.id;

    const test = await Test.findByPk(testId);
    if (!test || !test.isActive) return res.status(404).json({ error: 'Test not found or inactive' });

    // --- ACCESS CONTROL OVERRIDE ---
    const userObj = await User.findByPk(userId);
    let hasAccess = test.isFree || test.price === 0 || userObj.role === 'superadmin' || userObj.role === 'institute';

    if (!hasAccess) {
      // 1. Check direct active subscription or trial
      if (['active', 'trial'].includes(userObj.studentSubscriptionStatus) && userObj.studentSubscriptionEndDate > new Date()) {
        hasAccess = true;
      }
      
      // 2. Check if their associated institute has a premium subscription
      if (!hasAccess && userObj.instituteId && !userObj.institutePremiumBlocked) {
        const inst = await Institute.findByPk(userObj.instituteId);
        if (inst && inst.subscriptionStatus === 'active' && inst.subscriptionPlan !== 'free') {
          hasAccess = true;
        }
      }

      // 3. Check if user bought this single test specifically
      if (!hasAccess) {
        const purchased = await Payment.findOne({
          where: { userId, testId, status: 'captured' }
        });
        if (purchased) hasAccess = true;
      }
    }

    if (!hasAccess) {
      return res.status(403).json({ 
        error: 'Premium Test. Please purchase a student subscription or buy this test directly to unlock it.',
        requiresPayment: true, 
        price: test.price 
      });
    }
    // -------------------------------

    // Check if already in-progress
    const existingInProgress = await Result.findOne({
      where: { userId, testId, status: 'in-progress' },
    });

    if (existingInProgress) {
      const elapsed = Math.floor((Date.now() - existingInProgress.startedAt) / 1000);
      const timeRemaining = Math.max(0, test.duration * 60 - elapsed);

      // Load questions
      const questions = await loadTestQuestions(test, test.shuffleQuestions);
      return res.json({ success: true, data: { test: sanitizeTestForStudent(test), resultId: existingInProgress.id, timeRemaining, questions } });
    }

    // Create new result
    const result = await Result.create({
      userId, testId,
      instituteId: req.user.instituteId || null,
      totalMarks: test.totalMarks,
      startedAt: new Date(),
      status: 'in-progress',
    });

    await test.increment('totalAttempts');

    const questions = await loadTestQuestions(test, test.shuffleQuestions);
    res.json({ success: true, data: { test: sanitizeTestForStudent(test), resultId: result.id, timeRemaining: test.duration * 60, questions } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ─── Submit Test ────────────────────────────────────────
exports.submitTest = async (req, res) => {
  try {
    const { id: testId } = req.params;
    const { resultId, responses = [], isAutoSubmit = false } = req.body;
    const userId = req.user.id;

    const test = await Test.findByPk(testId);
    const result = await Result.findOne({ where: { id: resultId, userId, testId } });
    if (!result) return res.status(404).json({ error: 'Test session not found' });
    if (result.status !== 'in-progress') return res.status(400).json({ error: 'Test already submitted' });

    // Load all questions for scoring
    let questionIds = test.questionIds || [];
    if (typeof questionIds === 'string') {
      try { questionIds = JSON.parse(questionIds); } catch(e) { questionIds = []; }
    }
    let sections = test.sections || [];
    if (typeof sections === 'string') {
      try { sections = JSON.parse(sections); } catch(e) { sections = []; }
    }
    if (sections?.length > 0) {
      questionIds = sections.flatMap(s => s.questions || []);
    }

    const questions = await Question.findAll({ where: { id: questionIds } });
    const questionMap = {};
    let actualTotalMarks = 0;
    questions.forEach(q => { 
      questionMap[q.id] = q; 
      actualTotalMarks += (q.marks || 0);
    });
    
    // If actual total marks differs from test, use actual to avoid incorrect percentages
    const finalTotalMarks = actualTotalMarks > 0 ? actualTotalMarks : test.totalMarks;

    // Score responses
    let score = 0, correctAnswers = 0, wrongAnswers = 0, skippedAnswers = 0;
    const subjectStats = {};
    const scoredResponses = [];

    (Array.isArray(responses) ? responses : []).forEach(resp => {
      const q = questionMap[resp.questionId];
      if (!q) return;

      const isSkipped = !resp.selectedOption;
      const isCorrect = !isSkipped && resp.selectedOption === q.correctAnswer;
      const markEarned = isSkipped ? 0
        : isCorrect ? q.marks
        : test.negativeMarkingEnabled ? -test.negativeMarkingValue : 0;

      score += markEarned;
      if (isSkipped) skippedAnswers++;
      else if (isCorrect) correctAnswers++;
      else wrongAnswers++;

      // Subject analytics
      if (!subjectStats[q.subject]) subjectStats[q.subject] = { correct: 0, wrong: 0, skipped: 0, totalQuestions: 0 };
      subjectStats[q.subject].totalQuestions++;
      if (isCorrect) subjectStats[q.subject].correct++;
      else if (!isSkipped) subjectStats[q.subject].wrong++;
      else subjectStats[q.subject].skipped++;

      scoredResponses.push({
        questionId: resp.questionId,
        selectedOption: resp.selectedOption || null,
        isCorrect,
        isSkipped,
        marksEarned: markEarned,
        timeTaken: resp.timeTaken || 0,
        question: test.allowReview ? {
          questionText: q.questionText,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
        } : null,
      });
    });

    // Handle unattempted
    const attemptedIds = responses.map(r => r.questionId);
    questions.forEach(q => {
      if (!attemptedIds.includes(q.id)) {
        skippedAnswers++;
        if (!subjectStats[q.subject]) subjectStats[q.subject] = { correct: 0, wrong: 0, skipped: 0, totalQuestions: 0 };
        subjectStats[q.subject].totalQuestions++;
        subjectStats[q.subject].skipped++;
      }
    });

    score = Math.max(0, score);
    const attempted = correctAnswers + wrongAnswers;
    const accuracy = attempted > 0 ? Math.round((correctAnswers / attempted) * 100) : 0;
    const timeTaken = Math.floor((Date.now() - result.startedAt) / 1000);

    // Build subject performance array
    const subjectPerformance = Object.entries(subjectStats).map(([subject, s]) => ({
      subject,
      correct: s.correct,
      wrong: s.wrong,
      skipped: s.skipped,
      totalQuestions: s.totalQuestions,
      accuracy: s.totalQuestions > 0 ? Math.round((s.correct / s.totalQuestions) * 100) : 0,
    }));

    await result.update({
      score: parseFloat(score.toFixed(2)),
      correctAnswers, wrongAnswers, skippedAnswers, accuracy,
      timeTaken, submittedAt: new Date(),
      status: isAutoSubmit ? 'auto-submitted' : 'completed',
      responses: scoredResponses,
      subjectPerformance,
      totalMarks: finalTotalMarks,
    });

    // Compute ranks asynchronously
    computeRanks(result.id, testId, result.instituteId).catch(console.error);

    // Update test stats
    const allResults = await Result.findAll({
      where: { testId, status: ['completed', 'auto-submitted'] },
      attributes: ['score', 'accuracy'],
    });
    if (allResults.length > 0) {
      const avgScore = allResults.reduce((s, r) => s + r.score, 0) / allResults.length;
      const avgAccuracy = allResults.reduce((s, r) => s + r.accuracy, 0) / allResults.length;
      await test.update({ avgScore, avgAccuracy });
    }

    // Invalidate leaderboard cache after fresh submission
    cache.delByPattern('leaderboard:*');

    res.json({ success: true, data: { resultId: result.id, score, totalMarks: finalTotalMarks, accuracy } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ─── Leaderboard (High-Speed Cached) ────────────────────────
exports.getLeaderboard = async (req, res) => {
  try {
    const { testId, scope = 'global', limit = 50 } = req.query;
    const cacheKey = `leaderboard:${testId || 'global'}:${scope}:${limit}:${req.user?.instituteId || 'all'}`;

    const results = await cache.wrap(cacheKey, 300, async () => {
      const whereClause = { status: ['completed', 'auto-submitted'] };
      if (testId) whereClause.testId = testId;
      if (scope === 'institute' && req.user?.instituteId) whereClause.instituteId = req.user.instituteId;

      return Result.findAll({
        where: whereClause,
        include: [
          { association: 'user', attributes: ['id', 'name', 'avatar'] },
          { association: 'institute', attributes: ['id', 'name'] },
        ],
        order: [['score', 'DESC'], ['timeTaken', 'ASC']],
        limit: parseInt(limit),
      });
    });

    res.json({ success: true, data: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Helpers ────────────────────────────────────────
async function loadTestQuestions(test, shuffle) {
  let questionIds = test.questionIds || [];
  if (typeof questionIds === 'string') {
    try { questionIds = JSON.parse(questionIds); } catch(e) { questionIds = []; }
  }
  
  let sections = test.sections || [];
  if (typeof sections === 'string') {
    try { sections = JSON.parse(sections); } catch(e) { sections = []; }
  }

  if (sections?.length > 0) {
    questionIds = sections.flatMap(s => s.questions || []);
  }
  if (!questionIds.length) return [];

  const questions = await Question.findAll({
    where: { id: questionIds, isActive: true },
    attributes: ['id', 'questionText', 'questionTextHindi', 'options', 'subject', 'topic', 'difficulty', 'marks', 'negativeMarks', 'image'],
  });

  console.log('--- loadTestQuestions Debug ---');
  console.log('IsActive Filter questions.length:', questions.length);

  // Maintain order
  const qMap = {};
  questions.forEach(q => { qMap[q.id] = q; });
  let ordered = questionIds.map(id => qMap[id]).filter(Boolean);
  
  console.log('Final Ordered questions length:', ordered.length);

  if (shuffle) {
    for (let i = ordered.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ordered[i], ordered[j]] = [ordered[j], ordered[i]];
    }
  }
  return ordered;
}

function sanitizeTestForStudent(test) {
  let sections = test.sections || [];
  if (typeof sections === 'string') {
    try { sections = JSON.parse(sections); } catch(e) { sections = []; }
  }
  
  return {
    id: test.id,
    title: test.title,
    category: test.category,
    duration: test.duration,
    totalMarks: test.totalMarks,
    totalQuestions: test.totalQuestions,
    negativeMarkingEnabled: test.negativeMarkingEnabled,
    negativeMarkingValue: test.negativeMarkingValue,
    allowReview: test.allowReview,
    showResultImmediately: test.showResultImmediately,
    shuffleQuestions: test.shuffleQuestions,
    sections,
  };
}

async function computeRanks(resultId, testId, instituteId) {
  const allResults = await Result.findAll({
    where: { testId, status: ['completed', 'auto-submitted'] },
    attributes: ['id', 'score', 'timeTaken', 'instituteId'],
    order: [['score', 'DESC'], ['timeTaken', 'ASC']],
  });

  const totalParticipants = allResults.length;
  await Promise.all(allResults.map(async (r, idx) => {
    await r.update({
      globalRank: idx + 1,
      totalParticipants,
      globalPercentile: Math.round(((totalParticipants - idx - 1) / totalParticipants) * 100),
    });
  }));

  // Institute ranks
  if (instituteId) {
    const instResults = allResults.filter(r => r.instituteId?.toString() === instituteId?.toString());
    await Promise.all(instResults.map(async (r, idx) => {
      await r.update({ instituteRank: idx + 1 });
    }));
  }
}
