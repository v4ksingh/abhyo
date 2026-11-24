const { CourseQuiz, CourseQuizQuestion, CourseQuizAttempt, User, Course } = require('../models');
const { Op } = require('sequelize');

// ── helper: check course access ─────────────────────────────
const canManageCourse = async (courseId, user) => {
  const where = user.role === 'instructor'
    ? { id: courseId, instructorId: user.id }
    : { id: courseId, instituteId: user.instituteId };
  return await Course.findOne({ where });
};

// ════════════════════════════════════════════════════════════
// QUIZ CRUD  (institute / instructor)
// ════════════════════════════════════════════════════════════

exports.createQuiz = async (req, res) => {
  try {
    const { courseId } = req.params;
    if (!await canManageCourse(courseId, req.user))
      return res.status(403).json({ error: 'Unauthorized' });

    const { title, description, timeLimit, passingScore, shuffleQuestions,
            showAnswers, maxAttempts, moduleId, lessonId, order } = req.body;

    const quiz = await CourseQuiz.create({
      courseId, moduleId: moduleId || null, lessonId: lessonId || null,
      title, description, timeLimit: timeLimit || null,
      passingScore: passingScore ?? 60,
      shuffleQuestions: shuffleQuestions ?? false,
      showAnswers: showAnswers ?? true,
      maxAttempts: maxAttempts || null,
      order: order ?? 0,
      isPublished: false,
    });
    res.status(201).json({ success: true, data: quiz });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getQuizzes = async (req, res) => {
  try {
    const { courseId } = req.params;
    const where = { courseId };
    // Students only see published quizzes
    if (req.user.role === 'student') where.isPublished = true;

    const quizzes = await CourseQuiz.findAll({
      where,
      include: [{ model: CourseQuizQuestion, as: 'questions', attributes: ['id', 'order', 'points', 'type'] }],
      order: [['order', 'ASC'], ['createdAt', 'ASC']],
    });
    res.json({ success: true, data: quizzes });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const quiz = await CourseQuiz.findByPk(id, {
      include: [{
        model: CourseQuizQuestion, as: 'questions',
        // Hide correct answers from students before they attempt
        attributes: req.user.role === 'student'
          ? ['id', 'question', 'type', 'options', 'points', 'order']
          : undefined,
        order: [['order', 'ASC']],
      }],
    });
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    res.json({ success: true, data: quiz });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updateQuiz = async (req, res) => {
  try {
    const quiz = await CourseQuiz.findByPk(req.params.id);
    if (!quiz) return res.status(404).json({ error: 'Not found' });
    if (!await canManageCourse(quiz.courseId, req.user))
      return res.status(403).json({ error: 'Unauthorized' });
    await quiz.update(req.body);
    res.json({ success: true, data: quiz });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.deleteQuiz = async (req, res) => {
  try {
    const quiz = await CourseQuiz.findByPk(req.params.id);
    if (!quiz) return res.status(404).json({ error: 'Not found' });
    if (!await canManageCourse(quiz.courseId, req.user))
      return res.status(403).json({ error: 'Unauthorized' });
    await CourseQuizQuestion.destroy({ where: { quizId: quiz.id } });
    await CourseQuizAttempt.destroy({ where: { quizId: quiz.id } });
    await quiz.destroy();
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ════════════════════════════════════════════════════════════
// QUESTION CRUD  (institute / instructor)
// ════════════════════════════════════════════════════════════

exports.addQuestion = async (req, res) => {
  try {
    const quiz = await CourseQuiz.findByPk(req.params.quizId);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    if (!await canManageCourse(quiz.courseId, req.user))
      return res.status(403).json({ error: 'Unauthorized' });

    const { question, type, options, correctAnswer, explanation, points, order } = req.body;
    const q = await CourseQuizQuestion.create({
      quizId: quiz.id, question, type: type || 'mcq',
      options: options || null, correctAnswer,
      explanation: explanation || null,
      points: points ?? 1, order: order ?? 0,
    });
    res.status(201).json({ success: true, data: q });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updateQuestion = async (req, res) => {
  try {
    const q = await CourseQuizQuestion.findByPk(req.params.questionId);
    if (!q) return res.status(404).json({ error: 'Not found' });
    await q.update(req.body);
    res.json({ success: true, data: q });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.deleteQuestion = async (req, res) => {
  try {
    const q = await CourseQuizQuestion.findByPk(req.params.questionId);
    if (!q) return res.status(404).json({ error: 'Not found' });
    await q.destroy();
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ════════════════════════════════════════════════════════════
// STUDENT: Submit Attempt
// ════════════════════════════════════════════════════════════

exports.submitAttempt = async (req, res) => {
  try {
    const { quizId } = req.params;
    const quiz = await CourseQuiz.findByPk(quizId, {
      include: [{ model: CourseQuizQuestion, as: 'questions' }],
    });
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    if (!quiz.isPublished) return res.status(403).json({ error: 'Quiz not published' });

    // Check max attempts
    if (quiz.maxAttempts) {
      const prevAttempts = await CourseQuizAttempt.count({
        where: { quizId, userId: req.user.id },
      });
      if (prevAttempts >= quiz.maxAttempts)
        return res.status(400).json({ error: `Maximum ${quiz.maxAttempts} attempt(s) allowed` });
    }

    const { answers, timeTaken } = req.body; // answers: { questionId: answer }
    let earnedPoints = 0;
    let totalPoints = 0;
    const result = {};

    quiz.questions.forEach(q => {
      totalPoints += q.points;
      const given = answers?.[q.id];
      const correct = q.type === 'mcq'
        ? String(given) === String(q.correctAnswer)
        : q.type === 'true_false'
          ? String(given).toLowerCase() === String(q.correctAnswer).toLowerCase()
          : String(given || '').trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase();

      if (correct) earnedPoints += q.points;
      result[q.id] = { given, correct, correctAnswer: quiz.showAnswers ? q.correctAnswer : undefined, explanation: quiz.showAnswers ? q.explanation : undefined };
    });

    const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const passed = score >= quiz.passingScore;

    const attempt = await CourseQuizAttempt.create({
      quizId, userId: req.user.id,
      answers, score, totalPoints, earnedPoints, passed,
      timeTaken: timeTaken || null,
      completedAt: new Date(),
    });

    res.json({ success: true, data: { attempt, score, passed, earnedPoints, totalPoints, result } });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ════════════════════════════════════════════════════════════
// STUDENT: Get My Attempts for a Quiz
// ════════════════════════════════════════════════════════════

exports.getMyAttempts = async (req, res) => {
  try {
    const attempts = await CourseQuizAttempt.findAll({
      where: { quizId: req.params.quizId, userId: req.user.id },
      order: [['completedAt', 'DESC']],
    });
    res.json({ success: true, data: attempts });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ════════════════════════════════════════════════════════════
// INSTRUCTOR / INSTITUTE: Analytics — all student attempts
// ════════════════════════════════════════════════════════════

exports.getQuizAnalytics = async (req, res) => {
  try {
    const { quizId } = req.params;
    const attempts = await CourseQuizAttempt.findAll({
      where: { quizId },
      include: [{ model: User, as: 'student', attributes: ['id', 'name', 'email', 'mobile'] }],
      order: [['completedAt', 'DESC']],
    });

    const total = attempts.length;
    const passed = attempts.filter(a => a.passed).length;
    const avgScore = total ? Math.round(attempts.reduce((s, a) => s + a.score, 0) / total) : 0;

    res.json({ success: true, data: { attempts, stats: { total, passed, failed: total - passed, avgScore, passRate: total ? Math.round((passed / total) * 100) : 0 } } });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
