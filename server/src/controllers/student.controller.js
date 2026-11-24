const { Op } = require('sequelize');
const { User, Test, Result, Batch, BatchStudent, BatchTest, Course, CourseModule, Lesson, LessonProgress, LiveClass, Notification, CourseQuiz, CourseQuizAttempt, EnrollmentRequest } = require('../models');

// ─── Dashboard ────────────────────────────────────────
exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    const [
      totalTests,
      results,
      unreadNotifications
    ] = await Promise.all([
      Result.count({ where: { userId, status: ['completed', 'auto-submitted'] } }),
      Result.findAll({
        where: { userId, status: ['completed', 'auto-submitted'] },
        include: [{ association: 'test', attributes: ['id', 'title'] }],
        order: [['submittedAt', 'DESC']],
        limit: 10,
      }),
      Notification ? Notification.findAll({ where: { userId, isRead: false }, order: [['createdAt', 'DESC']] }) : []
    ]);

    const avgScore    = results.length > 0 ? results.reduce((s, r) => s + r.score,    0) / results.length : 0;
    const avgAccuracy = results.length > 0 ? results.reduce((s, r) => s + r.accuracy, 0) / results.length : 0;
    const totalTime   = results.reduce((s, r) => s + (r.timeTaken || 0), 0);

    // Build subject analytics in-memory (MariaDB-compatible — no JSON_TABLE)
    const subjectMap = {};
    results.forEach(r => {
      const perf = r.subjectPerformance;
      const arr = Array.isArray(perf) ? perf : (typeof perf === 'string' ? (() => { try { return JSON.parse(perf); } catch { return []; } })() : []);
      arr.forEach(sp => {
        if (!sp?.subject) return;
        if (!subjectMap[sp.subject]) subjectMap[sp.subject] = { totalAcc: 0, count: 0 };
        subjectMap[sp.subject].totalAcc += parseFloat(sp.accuracy || 0);
        subjectMap[sp.subject].count += 1;
      });
    });
    const subjectAnalytics = Object.entries(subjectMap)
      .map(([subject, d]) => ({ subject, avgAccuracy: d.count ? d.totalAcc / d.count : 0, count: d.count }))
      .sort((a, b) => a.avgAccuracy - b.avgAccuracy);

    // Get available tests for this student
    const user = await User.findByPk(userId);
    let testsWithStatus = [];
    
    // If NOT an institute student, show global active tests. 
    // If an institute student, they only see assignedTests (handled below).
    if (!user.instituteId) {
      const availableTests = await Test.findAll({
        where: { isActive: true },
        order: [['createdAt', 'DESC']],
        limit: 10,
      });

      const testIds = availableTests.map(t => t.id);
      const userResults = await Result.findAll({
        where: { userId, testId: testIds },
        attributes: ['testId', 'status', 'score', 'accuracy'],
      });
      const resultMap = {};
      userResults.forEach(r => { resultMap[r.testId] = r; });

      testsWithStatus = availableTests.map(t => ({
        ...t.toJSON(),
        attemptStatus: resultMap[t.id]?.status || 'not-attempted',
        lastScore: resultMap[t.id]?.score,
        lastAccuracy: resultMap[t.id]?.accuracy,
      }));
    }

    // Find custom assigned tests from institute batches
    const studentBatches = await BatchStudent.findAll({ where: { userId } });
    const batchIds = studentBatches.map(b => b.batchId);
    let assignedTestsWithStatus = [];
    if (batchIds.length > 0) {
      const batchTests = await BatchTest.findAll({
        where: { batchId: batchIds },
        include: [{ model: Test, as: 'test' }]
      });
      const assignedTestIds = batchTests.map(bt => bt.testId);

      // fetch their results
      const assignedResults = await Result.findAll({
        where: { userId, testId: assignedTestIds },
        attributes: ['testId', 'status', 'score', 'accuracy']
      });
      const assignedResultMap = {};
      assignedResults.forEach(r => { assignedResultMap[r.testId] = r; });

      assignedTestsWithStatus = batchTests.map(bt => {
        const t = bt.test ? bt.test.toJSON() : {};
        return {
          ...t,
          assigned: true,
          deadline: bt.deadline,
          startTime: bt.startTime,   // ← for live test detection on frontend
          attemptStatus: assignedResultMap[t.id]?.status || 'not-attempted',
          lastScore: assignedResultMap[t.id]?.score,
          lastAccuracy: assignedResultMap[t.id]?.accuracy,
        };
      });
    }

    res.json({
      success: true,
      data: {
        stats: { totalTests, avgScore, avgAccuracy, totalTime },
        recentResults: results,
        availableTests: testsWithStatus,
        assignedTests: assignedTestsWithStatus,
        subjectAnalytics,
        performanceTrend: results.slice(0, 10).reverse(),
        unreadNotifications,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ─── My Tests ────────────────────────────────────────
exports.getMyTests = async (req, res) => {
  try {
    const userId = req.user.id;
    const { category, limit = 50 } = req.query;
    
    const user = await User.findByPk(userId);
    let testsList = [];
    
    if (user.instituteId) {
      // Institute student: ONLY show tests assigned to their batches
      const studentBatches = await BatchStudent.findAll({ where: { userId } });
      const batchIds = studentBatches.map(b => b.batchId);
      
      if (batchIds.length > 0) {
        const batchTests = await BatchTest.findAll({
          where: { batchId: batchIds },
          include: [{ 
            model: Test, 
            as: 'test',
            where: category ? { category, isActive: true } : { isActive: true }
          }],
          order: [[{ model: Test, as: 'test' }, 'createdAt', 'DESC']],
          limit: parseInt(limit)
        });
        
        const seenTestIds = new Set();
        testsList = batchTests.map(bt => {
          if (!bt.test || seenTestIds.has(bt.testId)) return null;
          seenTestIds.add(bt.testId);
          return {
            ...bt.test.toJSON(),
            startTime: bt.startTime,
            deadline: bt.deadline,
            assigned: true
          };
        }).filter(Boolean);
      }
    } else {
      // Global student: show all platform-active tests
      const whereClause = { isActive: true };
      if (category) whereClause.category = category;
      
      const tests = await Test.findAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
      });
      testsList = tests.map(t => t.toJSON());
    }

    if (testsList.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const testIds = testsList.map(t => t.id);
    const userResults = await Result.findAll({
      where: { userId, testId: testIds },
      attributes: ['testId', 'status', 'score', 'accuracy'],
    });
    
    const resultMap = {};
    userResults.forEach(r => { resultMap[r.testId] = r; });

    const data = testsList.map(t => ({
      ...t,
      attemptStatus: resultMap[t.id]?.status || 'not-attempted',
      lastScore: resultMap[t.id]?.score,
      lastAccuracy: resultMap[t.id]?.accuracy,
    }));

    res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ─── My Courses (LMS) ────────────────────────────────
exports.getMyCourses = async (req, res) => {
  try {
    const userId = req.user.id;
    const studentBatches = await BatchStudent.findAll({ where: { userId } });
    const batchIds = studentBatches.map(b => b.batchId);

    if (batchIds.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const batches = await Batch.findAll({
      where: { id: batchIds, courseId: { [Op.ne]: null } },
      include: [{ 
        model: Course, 
        as: 'enrolledCourse',
        include: [
          { 
            model: CourseModule, 
            as: 'modules',
            include: [
              { 
                model: Lesson, 
                as: 'lessons',
                include: [{ model: LessonProgress, as: 'progressRecords', where: { userId }, required: false }]
              },
              { 
                model: Test, 
                as: 'quizzes',
                include: [{ model: Result, as: 'results', where: { userId }, required: false }]
              },
              { 
                model: CourseQuiz, 
                as: 'moduleQuizzes',
                include: [{ model: CourseQuizAttempt, as: 'attempts', where: { userId }, required: false }]
              }
            ]
          }
        ]
      }]
    });

    const courses = batches.map(b => b.enrolledCourse).filter(Boolean);
    // Deduplicate
    const uniqueCourses = Array.from(new Map(courses.map(c => [c.id, c])).values());

    res.json({ success: true, data: uniqueCourses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAvailableCourses = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);
    
    // Get all published courses from the user's institute
    let whereClause = { isPublished: true };
    if (user.instituteId) {
      whereClause.instituteId = user.instituteId;
    }

    const availableCourses = await Course.findAll({
      where: whereClause,
      include: [
        { model: User, as: 'assignedInstructor', attributes: ['name', 'avatar'] }
      ]
    });

    // Get current enrollment requests for this student to know status
    const requests = await EnrollmentRequest.findAll({
      where: { studentId: userId }
    });
    
    const requestMap = {};
    requests.forEach(r => {
      requestMap[r.courseId] = r.status;
    });

    // Also get currently enrolled courses
    const studentBatches = await BatchStudent.findAll({ where: { userId } });
    const batchIds = studentBatches.map(b => b.batchId);
    let enrolledCourseIds = [];
    if (batchIds.length > 0) {
      const batches = await Batch.findAll({
        where: { id: batchIds, courseId: { [Op.ne]: null } }
      });
      enrolledCourseIds = batches.map(b => b.courseId);
    }

    const coursesWithStatus = availableCourses.map(course => {
      const c = course.toJSON();
      if (enrolledCourseIds.includes(c.id)) {
        c.enrollmentStatus = 'enrolled';
      } else {
        c.enrollmentStatus = requestMap[c.id] || null;
      }
      return c;
    });

    res.json({ success: true, data: coursesWithStatus });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.requestCourseEnrollment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { courseId } = req.params;
    const user = await User.findByPk(userId);

    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const [request, created] = await EnrollmentRequest.findOrCreate({
      where: { studentId: userId, courseId },
      defaults: {
        instituteId: user.instituteId || course.instituteId,
        status: 'pending'
      }
    });

    if (!created) {
      return res.status(400).json({ error: 'Enrollment request already exists' });
    }

    res.json({ success: true, message: 'Enrollment request sent successfully', data: request });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.toggleLessonProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { lessonId, courseId, status } = req.body;

    const [progress, created] = await LessonProgress.findOrCreate({
      where: { userId, lessonId },
      defaults: { courseId, status: status || 'completed' }
    });

    if (!created) {
      await progress.destroy();
      return res.json({ success: true, message: 'Progress removed', completed: false });
    }

    res.json({ success: true, message: 'Lesson marked as completed', completed: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── My Results ────────────────────────────────────────
exports.getMyResults = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;
    const whereClause = { userId: req.user.id };
    if (status) whereClause.status = status === 'completed' ? ['completed', 'auto-submitted'] : status;

    const { count, rows } = await Result.findAndCountAll({
      where: whereClause,
      include: [{ association: 'test', attributes: ['id', 'title', 'category', 'totalMarks'] }],
      order: [['submittedAt', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    res.json({ success: true, data: rows, pagination: { total: count, page: parseInt(page), limit: parseInt(limit) } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Get Single Result ────────────────────────────────────────
exports.getResult = async (req, res) => {
  try {
    const result = await Result.findOne({
      where: { id: req.params.id, userId: req.user.id },
      include: [
        { association: 'test', attributes: ['id', 'title', 'allowReview', 'showResultImmediately'] },
        { association: 'user', attributes: ['id', 'name'] },
      ],
    });
    if (!result) return res.status(404).json({ error: 'Result not found' });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Leaderboard ────────────────────────────────────────
exports.getLeaderboard = async (req, res) => {
  try {
    const { testId, scope = 'global' } = req.query;
    const whereClause = { status: ['completed', 'auto-submitted'] };
    if (testId) whereClause.testId = testId;
    if (scope === 'institute' && req.user?.instituteId) whereClause.instituteId = req.user.instituteId;

    const results = await Result.findAll({
      where: whereClause,
      include: [
        { association: 'user', attributes: ['id', 'name', 'avatar'] },
        { association: 'institute', attributes: ['id', 'name'] },
      ],
      order: [['score', 'DESC'], ['timeTaken', 'ASC']],
      limit: 50,
    });

    res.json({ success: true, data: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Student ID Card ────────────────────────────────────────
exports.getIdCard = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findByPk(userId, {
      include: [
        {
          association: 'institute',
          attributes: ['id', 'name', 'logo', 'address', 'city', 'state', 'pincode', 'mobile', 'phone', 'email', 'website', 'tagline', 'foundedYear'],
        },
      ],
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    // Get batches
    const batchStudents = await BatchStudent.findAll({ where: { userId } });
    const batchIds = batchStudents.map(b => b.batchId);
    let batches = [];
    if (batchIds.length > 0) {
      batches = await Batch.findAll({
        where: { id: batchIds },
        attributes: ['id', 'name', 'description'],
      });
    }

    // Stats
    const totalTests = await Result.count({ where: { userId, status: ['completed', 'auto-submitted'] } });

    const cardData = {
      id: user.id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      avatar: user.avatar,
      state: user.state,
      city: user.city,
      role: user.role,
      isActive: user.isActive,
      joinedAt: user.createdAt,
      institute: user.institute ? user.institute.toJSON() : null,
      batches: batches.map(b => b.toJSON()),
      stats: { totalTests },
    };

    res.json({ success: true, data: cardData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ─── Live Classes ────────────────────────────────────────
exports.getMyLiveClasses = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);
    
    if (!user.instituteId) {
      return res.json({ success: true, data: [] });
    }

    const studentBatches = await BatchStudent.findAll({ where: { userId } });
    const batchIds = studentBatches.map(b => b.batchId);

    const liveClasses = await LiveClass.findAll({
      where: {
        instituteId: user.instituteId,
        [Op.or]: [
          { batchId: null },
          { batchId: { [Op.in]: batchIds } }
        ],
        status: { [Op.ne]: 'cancelled' }
      },
      include: [
        { model: Batch, as: 'batch', attributes: ['id', 'name'] },
        { model: User, as: 'host', attributes: ['name', 'avatar'] }
      ],
      order: [['scheduledAt', 'ASC']]
    });

    res.json({ success: true, data: liveClasses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateInstitute = async (req, res) => {
  try {
    const { instituteId } = req.body;
    const userId = req.user.id;

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!instituteId) {
      user.instituteId = null;
      user.instituteApprovalStatus = 'none';
    } else {
      user.instituteId = instituteId;
      user.instituteApprovalStatus = 'pending';
    }
    
    await user.save();

    const updatedUser = await User.findByPk(userId, {
      include: [{ association: 'institute', attributes: ['id', 'name', 'city', 'state', 'logo'] }]
    });

    res.json({ success: true, user: updatedUser.toJSON() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
