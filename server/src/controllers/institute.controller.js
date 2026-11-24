const { Op, fn, col, literal } = require('sequelize');
const { sequelize } = require('../config/database');
const { User, Institute, Batch, Test, Result, Notification, BatchTest, BatchStudent } = require('../models');
const crypto = require('crypto');

// ─── Dashboard ────────────────────────────────────────
exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const institute = await Institute.findOne({ where: { ownerId: userId } });
    if (!institute) return res.status(404).json({ error: 'Institute not found' });

    const [totalStudents, totalBatches] = await Promise.all([
      User.count({ where: { instituteId: institute.id, role: 'student' } }),
      Batch.count({ where: { instituteId: institute.id } }),
    ]);

    // Recent results
    const recentResults = await Result.findAll({
      where: { instituteId: institute.id, status: ['completed', 'auto-submitted'] },
      include: [
        { association: 'user', attributes: ['id', 'name'] },
        { association: 'test', attributes: ['id', 'title'] },
      ],
      order: [['submittedAt', 'DESC']],
      limit: 10,
    });

    // Top students by avg score
    const topStudents = await sequelize.query(`
      SELECT u.id, u.name, u.email,
             COUNT(r.id) AS totalTests,
             AVG(r.score) AS avgScore,
             AVG(r.accuracy) AS avgAccuracy
      FROM results r
      JOIN users u ON u.id = r.userId
      WHERE r.instituteId = :instituteId AND r.status IN ('completed','auto-submitted')
      GROUP BY u.id, u.name, u.email
      ORDER BY avgScore DESC
      LIMIT 10
    `, { replacements: { instituteId: institute.id }, type: sequelize.QueryTypes.SELECT });

    // Test performance
    const testPerformance = await sequelize.query(`
      SELECT t.id, t.title,
             COUNT(r.id) AS attempts,
             AVG(r.score) AS avgScore,
             AVG(r.accuracy) AS avgAccuracy
      FROM results r
      JOIN tests t ON t.id = r.testId
      WHERE r.instituteId = :instituteId AND r.status IN ('completed','auto-submitted')
      GROUP BY t.id, t.title
      ORDER BY attempts DESC
      LIMIT 10
    `, { replacements: { instituteId: institute.id }, type: sequelize.QueryTypes.SELECT });

    res.json({
      success: true,
      data: {
        institute,
        stats: {
          totalStudents,
          totalBatches,
          subscription: {
            plan: institute.subscriptionPlan,
            status: institute.subscriptionStatus,
            maxStudents: institute.maxStudents,
            maxBatches: institute.maxBatches,
          },
        },
        recentResults,
        topStudents,
        testPerformance,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ─── Get Students ────────────────────────────────────────
exports.getStudents = async (req, res) => {
  try {
    const userId = req.user.id;
    const institute = await Institute.findOne({ where: { ownerId: userId } });
    if (!institute) return res.status(404).json({ error: 'Institute not found' });

    const { page = 1, limit = 25, search, batchId } = req.query;
    const offset = (page - 1) * limit;
    const whereClause = { instituteId: institute.id, role: 'student' };
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { mobile: { [Op.like]: `%${search}%` } },
      ];
    }

    const includeClause = [];
    if (batchId) {
      includeClause.push({ model: Batch, as: 'batches', where: { id: batchId }, required: true, attributes: ['id', 'name'] });
    } else {
      includeClause.push({ model: Batch, as: 'batches', required: false, attributes: ['id', 'name'] });
    }

    const { count, rows } = await User.findAndCountAll({
      where: whereClause,
      include: includeClause,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset,
      distinct: true,
    });

    // Add first batch as `batch` field for convenience
    const data = rows.map(u => ({ ...u.toJSON(), batch: u.batches?.[0] || null }));

    res.json({ success: true, data, pagination: { total: count, page: parseInt(page), limit: parseInt(limit) } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Add Student ────────────────────────────────────────
exports.addStudent = async (req, res) => {
  try {
    const userId = req.user.id;
    const institute = await Institute.findOne({ where: { ownerId: userId } });
    if (!institute) return res.status(404).json({ error: 'Institute not found' });

    if (institute.totalStudents >= institute.maxStudents) {
      return res.status(400).json({ error: `Student limit reached (${institute.maxStudents}). Upgrade your plan.` });
    }

    const { name, mobile, email, password, batchId } = req.body;
    const pwd = password || Math.random().toString(36).slice(-8);

    const existing = await User.findOne({ where: { [Op.or]: [email ? { email } : null, mobile ? { mobile } : null].filter(Boolean) } });
    if (existing) return res.status(400).json({ error: 'Student already exists with this email/mobile' });

    const student = await User.create({ name, mobile, email, password: pwd, role: 'student', instituteId: institute.id });

    if (batchId) {
      const batch = await Batch.findOne({ where: { id: batchId, instituteId: institute.id } });
      if (batch) await BatchStudent.findOrCreate({ where: { batchId, userId: student.id } });
    }

    await institute.increment('totalStudents');

    res.status(201).json({ success: true, data: student.toJSON(), tempPassword: password ? undefined : pwd });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Send Announcement ────────────────────────────────────────
exports.sendAnnouncement = async (req, res) => {
  try {
    const userId = req.user.id;
    const institute = await Institute.findOne({ where: { ownerId: userId } });
    if (!institute) return res.status(404).json({ error: 'Institute not found' });

    const { title, message, batchId, image } = req.body;
    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required' });
    }

    let users = [];
    if (batchId && batchId !== 'all') {
      const batchStudents = await BatchStudent.findAll({ where: { batchId } });
      const userIds = batchStudents.map(bs => bs.userId);
      users = await User.findAll({ where: { id: userIds, instituteId: institute.id, role: 'student' } });
    } else {
      users = await User.findAll({ where: { instituteId: institute.id, role: 'student' } });
    }

    if (users.length === 0) {
      return res.status(400).json({ error: 'No students found to send the announcement to' });
    }

    const { Notification } = require('../models');
    const notifs = users.map(u => ({
      userId: u.id,
      title,
      message,
      type: 'general',
      data: { sender: institute.name, image: image || null }
    }));

    await Notification.bulkCreate(notifs);

    res.status(201).json({ success: true, message: `Announcement sent to ${users.length} students` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Toggle Student Access ────────────────────────────────────────
exports.toggleStudentAccess = async (req, res) => {
  try {
    const userId = req.user.id;
    const institute = await Institute.findOne({ where: { ownerId: userId } });
    if (!institute) return res.status(404).json({ error: 'Institute not found' });

    const student = await User.findOne({ where: { id: req.params.studentId, instituteId: institute.id, role: 'student' } });
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const newBlockedStatus = !student.institutePremiumBlocked;
    await student.update({ institutePremiumBlocked: newBlockedStatus });

    res.json({ success: true, message: `Premium access ${newBlockedStatus ? 'revoked' : 'granted'} successfully`, institutePremiumBlocked: newBlockedStatus });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// ─── Bulk Upload Students ────────────────────────────────────────
exports.bulkUploadStudents = async (req, res) => {
  try {
    const userId = req.user.id;
    const institute = await Institute.findOne({ where: { ownerId: userId } });
    if (!institute) return res.status(404).json({ error: 'Institute not found' });
    if (!req.file) return res.status(400).json({ error: 'CSV file required' });

    const csv = require('csv-parser');
    const fs = require('fs');
    const results = [];
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        let created = 0, skipped = 0;
        for (const row of results) {
          try {
            const exists = await User.findOne({
              where: { [Op.or]: [row.email ? { email: row.email } : null, row.mobile ? { mobile: row.mobile } : null].filter(Boolean) }
            });
            if (exists) { skipped++; continue; }

            const student = await User.create({
              name: row.name, email: row.email, mobile: row.mobile,
              password: row.password || Math.random().toString(36).slice(-8),
              role: 'student', instituteId: institute.id,
            });

            if (row.batch) {
              const batch = await Batch.findOne({ where: { name: row.batch, instituteId: institute.id } });
              if (batch) await BatchStudent.findOrCreate({ where: { batchId: batch.id, userId: student.id } });
            }
            created++;
          } catch {}
        }
        await institute.update({ totalStudents: await User.count({ where: { instituteId: institute.id, role: 'student' } }) });
        fs.unlinkSync(req.file.path);
        res.json({ success: true, data: { created, skipped, total: results.length } });
      });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Student Performance ────────────────────────────────────────
exports.getStudentPerformance = async (req, res) => {
  try {
    const userId = req.user.id;
    const institute = await Institute.findOne({ where: { ownerId: userId } });
    const student = await User.findOne({ where: { id: req.params.studentId, instituteId: institute.id } });
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const results = await Result.findAll({
      where: { userId: student.id, status: ['completed', 'auto-submitted'] },
      include: [{ association: 'test', attributes: ['id', 'title', 'totalMarks'] }],
      order: [['submittedAt', 'DESC']],
      limit: 20,
    });

    const totalTests = results.length;
    const avgScore = totalTests > 0 ? results.reduce((s, r) => s + r.score, 0) / totalTests : 0;
    const bestScore = totalTests > 0 ? Math.max(...results.map(r => r.score)) : 0;

    const subjectWise = {};
    results.forEach(r => {
      (r.subjectPerformance || []).forEach(sp => {
        if (!subjectWise[sp.subject]) subjectWise[sp.subject] = { correct: 0, total: 0 };
        subjectWise[sp.subject].correct += sp.correct || 0;
        subjectWise[sp.subject].total += sp.totalQuestions || 0;
      });
    });
    Object.keys(subjectWise).forEach(s => {
      subjectWise[s].accuracy = subjectWise[s].total > 0
        ? Math.round((subjectWise[s].correct / subjectWise[s].total) * 100) : 0;
    });

    res.json({ success: true, data: { student: student.toJSON(), results, analytics: { totalTests, avgScore, bestScore, subjectWise } } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Get Batches ────────────────────────────────────────
exports.getBatches = async (req, res) => {
  try {
    const userId = req.user.id;
    const institute = await Institute.findOne({ where: { ownerId: userId } });
    if (!institute) return res.status(404).json({ error: 'Institute not found' });

    const batches = await Batch.findAll({
      where: { instituteId: institute.id },
      include: [
        { model: User, as: 'students', attributes: ['id', 'name'], through: { attributes: [] } },
        { model: Test, as: 'tests', attributes: ['id', 'title', 'category', 'totalQuestions', 'duration', 'totalMarks'], through: { model: BatchTest, attributes: ['deadline', 'startTime', 'isActive'] } },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({ success: true, data: batches });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Create Batch ────────────────────────────────────────
exports.createBatch = async (req, res) => {
  try {
    const userId = req.user.id;
    const institute = await Institute.findOne({ where: { ownerId: userId } });
    if (!institute) return res.status(404).json({ error: 'Institute not found' });

    if (institute.totalBatches >= institute.maxBatches) {
      return res.status(400).json({ error: `Batch limit reached (${institute.maxBatches}). Upgrade your plan.` });
    }

    const { name, description } = req.body;
    const batch = await Batch.create({ name, description, instituteId: institute.id });
    await institute.increment('totalBatches');
    res.status(201).json({ success: true, data: batch });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Assign Test to Batch ────────────────────────────────────────
exports.assignTestToBatch = async (req, res) => {
  try {
    const userId = req.user.id;
    const institute = await Institute.findOne({ where: { ownerId: userId } });
    const batch = await Batch.findOne({ where: { id: req.params.batchId, instituteId: institute.id } });
    if (!batch) return res.status(404).json({ error: 'Batch not found' });

    const { testId, deadline, startTime, isLive } = req.body;
    const test = await Test.findByPk(testId);
    if (!test) return res.status(404).json({ error: 'Test not found' });

    // isLive: true  → use provided startTime or set to now
    // isLive: false → clear startTime (stop session)
    // isLive: undefined → keep existing or use provided startTime
    let finalStartTime;
    if (isLive === true)  finalStartTime = startTime ? new Date(startTime) : new Date(Date.now() + 1000);
    else if (isLive === false) finalStartTime = null;
    else finalStartTime = startTime ? new Date(startTime) : null;

    const [bt, created] = await BatchTest.findOrCreate({
      where: { batchId: batch.id, testId },
      defaults: { deadline: deadline || null, startTime: finalStartTime },
    });

    if (!created) await bt.update({ deadline: deadline || bt.deadline, startTime: finalStartTime });

    // Notify all students in batch
    const students = await BatchStudent.findAll({ where: { batchId: batch.id } });
    const { Notification } = require('../models');
    await Promise.all(students.map(s =>
      Notification.create({ userId: s.userId, title: 'New Test Assigned!', message: `"${test.title}" has been assigned to your batch.`, type: 'test_assigned' })
    ));

    res.json({ success: true, data: bt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Assign Existing Students to Batch ────────────────────────────────────────
exports.assignStudentsToBatch = async (req, res) => {
  try {
    const userId = req.user.id;
    const institute = await Institute.findOne({ where: { ownerId: userId } });
    const batch = await Batch.findOne({ where: { id: req.params.batchId, instituteId: institute.id } });
    if (!batch) return res.status(404).json({ error: 'Batch not found' });

    const { studentIds } = req.body;
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ error: 'Please provide an array of student IDs' });
    }

    // Verify all students belong to the institute
    const studentsCount = await User.count({
      where: { id: studentIds, instituteId: institute.id, role: 'student' }
    });

    if (studentsCount !== studentIds.length) {
      return res.status(400).json({ error: 'Some students do not exist or do not belong to your institute.' });
    }

    // Create associations
    for (const studentId of studentIds) {
      await BatchStudent.findOrCreate({ where: { batchId: batch.id, userId: studentId } });
    }

    res.json({ success: true, message: `${studentsCount} students added to the batch.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// ─── Get Institute Profile ────────────────────────────────────────
exports.getProfile = async (req, res) => {
  try {
    const institute = await Institute.findOne({ where: { ownerId: req.user.id } });
    if (!institute) return res.status(404).json({ error: 'Institute not found' });
    res.json({ success: true, data: institute });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Update Institute Profile ────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const institute = await Institute.findOne({ where: { ownerId: req.user.id } });
    if (!institute) return res.status(404).json({ error: 'Institute not found' });

    let {
      name, description, city, state, website,
      slug, tagline, landingBio, achievements,
      socialLinks, courses, faculty, testimonials, gallery, foundedYear,
      phone, contactAddress, isLandingEnabled
    } = req.body;

    const safeParse = (val, fb) => {
      if (typeof val === 'string') {
        try { return JSON.parse(val); } catch { return fb; }
      }
      return val || fb;
    };

    achievements = safeParse(achievements, []);
    socialLinks = safeParse(socialLinks, {});
    courses = safeParse(courses, []);
    let parsedFaculty = safeParse(faculty, []);
    testimonials = safeParse(testimonials, []);
    gallery = safeParse(gallery, []);

    // Create or update Instructor users from faculty
    const { User } = require('../models');
    for (const f of parsedFaculty) {
      if (f.email) {
        let instructor = await User.findOne({ where: { email: f.email } });
        if (!instructor) {
          instructor = await User.create({
            name: f.name,
            email: f.email,
            password: f.password || '123456',
            role: 'instructor',
            instituteId: institute.id,
            avatar: f.photo || null
          });
          f.userId = instructor.id;
        } else if (instructor.instituteId === institute.id) {
          const updates = { name: f.name, avatar: f.photo || null };
          if (f.password) updates.password = f.password;
          await instructor.update(updates);
          f.userId = instructor.id;
        }
        delete f.password; // do not store plain password in JSON
      }
    }

    let finalSlug = slug;
    if (!finalSlug && name) {
      finalSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }
    if (finalSlug && finalSlug !== institute.slug) {
      const existing = await Institute.findOne({ where: { slug: finalSlug } });
      if (existing && existing.id !== institute.id) {
        finalSlug = `${finalSlug}-${institute.id.slice(0, 4)}`;
      }
    }
    
    const updates = { 
      name, description, city, state, website,
      slug: finalSlug || institute.slug,
      tagline, landingBio,
      achievements, socialLinks, courses, faculty: parsedFaculty, testimonials, gallery,
      foundedYear, phone, contactAddress,
      ...(isLandingEnabled !== undefined && { isLandingEnabled: isLandingEnabled === 'true' || isLandingEnabled === true })
    };
    
    if (req.files && req.files.logo && req.files.logo[0]) {
      updates.logo = req.files.logo[0].filename;
    }
    if (req.files && req.files.banner && req.files.banner[0]) {
      updates.bannerImage = req.files.banner[0].filename;
    }

    await institute.update(updates);
    res.json({ success: true, data: institute });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Upload Generic Image ────────────────────────────────────────
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
    res.json({ success: true, url: req.file.filename });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Get Invite Link ────────────────────────────────────────
exports.getInviteLink = async (req, res) => {
  try {
    const institute = await Institute.findOne({ where: { ownerId: req.user.id } });
    if (!institute) return res.status(404).json({ error: 'Institute not found' });
    if (!institute.inviteCode) {
      const inviteCode = crypto.randomBytes(4).toString('hex').toUpperCase();
      await institute.update({ inviteCode });
    }
    const clientUrls = (process.env.CLIENT_URL || 'http://localhost:5173').split(',');
    const primaryClientUrl = clientUrls[0].trim();
    const inviteUrl = `${primaryClientUrl}/register?code=${institute.inviteCode}`;
    res.json({ success: true, data: { inviteCode: institute.inviteCode, inviteUrl } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Get Subscription Details ────────────────────────────────────────
exports.getSubscription = async (req, res) => {
  try {
    const { Plan } = require('../models');
    const institute = await Institute.findOne({ where: { ownerId: req.user.id } });
    if (!institute) return res.status(404).json({ error: 'Institute not found' });

    const studentCount = await User.count({ where: { instituteId: institute.id, role: 'student' } });
    const allInstitutePlans = await Plan.findAll({ where: { type: 'institute', isActive: true }, order: [['price', 'ASC']] });
    
    const isActive = (institute.subscriptionStatus === 'active' || institute.subscriptionStatus === 'trial') &&
      institute.subscriptionEndDate && new Date(institute.subscriptionEndDate) > new Date();

    const hasHadTrial = institute.subscriptionStatus === 'trial' ||
      (institute.subscriptionStatus === 'active' && institute.subscriptionPlan !== 'free') ||
      (institute.subscriptionEndDate && new Date(institute.subscriptionEndDate) > new Date());

    // Normalize plan name to enum key ('pro monthly' → 'pro')
    const normalizePlanName = (name) => {
      let p = (name || '').toLowerCase().replace(/[^a-z]/g, '');
      if (['free', 'basic', 'pro', 'enterprise'].includes(p)) return p;
      if (p.includes('enterprise')) return 'enterprise';
      if (p.includes('pro')) return 'pro';
      if (p.includes('basic')) return 'basic';
      return 'free';
    };

    // Find the exact active plan by matching normalized name + student/batch limits
    let activePlanId = null;
    if (isActive && institute.subscriptionPlan !== 'free') {
      const matched = allInstitutePlans.find(p =>
        normalizePlanName(p.name) === institute.subscriptionPlan &&
        (p.maxStudents === institute.maxStudents || p.maxStudents === 999999) &&
        (p.maxBatches === institute.maxBatches || p.maxBatches === 999)
      ) || allInstitutePlans.find(p => normalizePlanName(p.name) === institute.subscriptionPlan && p.price > 0);
      activePlanId = matched?.id || null;
    } else if (institute.subscriptionPlan === 'free') {
      const freePlan = allInstitutePlans.find(p => p.price === 0);
      activePlanId = freePlan?.id || null;
    }

    const activePlanObj = allInstitutePlans.find(p => p.id === activePlanId);
    let activeModules = { courses: true, erp: true, liveClasses: true, certificate: true, reviews: true, attendance: true };
    if (activePlanObj && activePlanObj.modules) {
      activeModules = typeof activePlanObj.modules === 'string' 
        ? { ...activeModules, ...JSON.parse(activePlanObj.modules) }
        : { ...activeModules, ...activePlanObj.modules };
    }

    res.json({
      success: true,
      data: {
        plan: institute.subscriptionPlan || 'free',
        status: institute.subscriptionStatus,
        startDate: institute.subscriptionStartDate,
        endDate: institute.subscriptionEndDate,
        isActive,
        hasHadTrial,
        maxStudents: institute.maxStudents,
        maxBatches: institute.maxBatches,
        studentCount,
        activePlanId,   // ← definitive plan ID for frontend matching
        activeModules,
        coversStudentTests: isActive && institute.subscriptionPlan && institute.subscriptionPlan !== 'free',
        plans: allInstitutePlans,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.upgradeSubscription = async (req, res) => {
  try {
    const { Plan, Coupon } = require('../models');
    const { planId, planName, couponCode } = req.body; // accept planId since plans are UUIDs now.
    let plan = await Plan.findOne({ where: { id: planId, type: 'institute' }});
    // Fallback if frontend sends planName ('basic', 'pro')
    if (!plan && planName) {
      plan = await Plan.findOne({ where: { name: planName, type: 'institute' }});
    }

    if (!plan || plan.price === 0) return res.status(400).json({ error: 'Invalid or free plan' });

    let finalPrice = plan.price;
    if (couponCode) {
      const coupon = await Coupon.findOne({ where: { code: couponCode.toUpperCase() } });
      if (coupon && coupon.isActive && (!coupon.maxUses || coupon.usedCount < coupon.maxUses)) {
        if (coupon.discountType === 'percentage') {
          finalPrice = Math.max(0, plan.price - (plan.price * coupon.discountValue / 100));
        } else {
          finalPrice = Math.max(0, plan.price - coupon.discountValue);
        }
      }
    }

    const institute = await Institute.findOne({ where: { ownerId: req.user.id } });
    if (!institute) return res.status(404).json({ error: 'Institute not found' });

    const Razorpay = require('razorpay');
    const Payment  = require('../models/Payment.model');

    const payment = await Payment.create({
      userId: req.user.id,
      amount: finalPrice,
      type: 'institute_subscription',
      status: 'pending',
      description: `Institute ${plan.name} Plan`,
      couponCode: couponCode ? couponCode.toUpperCase() : null,
    });

    let razorpay = null;
    try {
      razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
    } catch {}

    if (!razorpay || !process.env.RAZORPAY_KEY_ID) {
      throw new Error('Razorpay keys are not configured on the server. Payments cannot be processed.');
    }

    const order = await razorpay.orders.create({ amount: Math.round(finalPrice * 100), currency: 'INR', receipt: payment.id });
    await payment.update({ razorpayOrderId: order.id });
    res.json({ success: true, data: { orderId: order.id, amount: order.amount, currency: 'INR', paymentId: payment.id, key: process.env.RAZORPAY_KEY_ID, planId: plan.id } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Verify Subscription Payment ────────────────────────────────────────
exports.verifyInstituteSubscription = async (req, res) => {
  try {
    const { Plan } = require('../models');
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentId, planId } = req.body;
    
    const plan = await Plan.findOne({ where: { id: planId, type: 'institute' }});
    if (!plan) return res.status(400).json({ error: 'Invalid plan' });

    const Payment = require('../models/Payment.model');
    const payment = await Payment.findOne({ where: { id: paymentId, userId: req.user.id } });
    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    const crypto = require('crypto');
    if (process.env.RAZORPAY_KEY_SECRET && razorpay_signature) {
      const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');
      if (expected !== razorpay_signature) {
        await payment.update({ status: 'failed' });
        return res.status(400).json({ error: 'Invalid payment signature' });
      }
    }

    await payment.update({ razorpayOrderId: razorpay_order_id, razorpayPaymentId: razorpay_payment_id, status: 'captured' });
    
    if (payment.couponCode) {
      const { Coupon } = require('../models');
      await Coupon.increment('usedCount', { where: { code: payment.couponCode } });
    }

    const institute = await Institute.findOne({ where: { ownerId: req.user.id } });
    await activateInstitutePlan(institute, plan);
    res.json({ success: true, message: `${plan.name} plan activated!` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

async function activateInstitutePlan(institute, plan) {
  const endDate = new Date();
  if (plan.interval === 'yearly') endDate.setDate(endDate.getDate() + 365);
  else endDate.setDate(endDate.getDate() + 30); // monthly default

  // Support ENUM backwards compatibility for the 'subscriptionPlan' column by lowercasing the plan name
  let enumPlanName = plan.name.toLowerCase().replace(/[^a-z]/g, '');
  if (!['free', 'basic', 'pro', 'enterprise'].includes(enumPlanName)) {
    enumPlanName = 'pro'; // Fallback if custom plan name
  }

  await institute.update({
    subscriptionPlan: enumPlanName,
    subscriptionStatus: 'active',
    subscriptionStartDate: new Date(),
    subscriptionEndDate: endDate,
    maxStudents: plan.maxStudents || 999999,
    maxBatches: plan.maxBatches || 999,
  });
  try {
    const { Notification } = require('../models');
    await Notification.create({
      userId: institute.ownerId,
      title: '🎉 Institute Plan Activated!',
      message: `Your ${plan.name} plan is active until ${endDate.toLocaleDateString('en-IN')}. Your students can now access premium tests!`,
      type: 'payment_success',
    });
  } catch {}
}

// ─── Get Students with Access Status ────────────────────────────────────────
exports.getStudentsWithAccess = async (req, res) => {
  try {
    const { Plan } = require('../models');
    const institute = await Institute.findOne({ where: { ownerId: req.user.id } });
    if (!institute) return res.status(404).json({ error: 'Institute not found' });

    // Fix: subscriptionPlan is stored as enum ('free','basic','pro','enterprise').
    // Previously looked up Plan by name which always mismatched (e.g. 'pro' vs 'Pro Monthly').
    const instituteHasActivePlan = institute.subscriptionStatus === 'active' &&
      institute.subscriptionEndDate &&
      new Date(institute.subscriptionEndDate) > new Date() &&
      institute.subscriptionPlan !== 'free';

    const students = await User.findAll({
      where: { instituteId: institute.id, role: 'student' },
      attributes: ['id', 'name', 'email', 'mobile', 'isActive', 'institutePremiumBlocked', 'studentSubscriptionPlan', 'studentSubscriptionStatus', 'studentSubscriptionEndDate', 'createdAt', 'casteCategory'],
      order: [['name', 'ASC']],
    });

    const data = students.map(s => {
      const sJson = s.toJSON();
      const hasOwnSub = ['active', 'trial'].includes(sJson.studentSubscriptionStatus) &&
        sJson.studentSubscriptionEndDate && new Date(sJson.studentSubscriptionEndDate) > new Date();
      return {
        ...sJson,
        accessSource: sJson.institutePremiumBlocked ? (hasOwnSub ? 'own_subscription' : 'none') : hasOwnSub ? 'own_subscription' : instituteHasActivePlan ? 'institute_plan' : 'none',
        hasAccess: sJson.isActive && (hasOwnSub || (!sJson.institutePremiumBlocked && instituteHasActivePlan)),
      };
    });

    res.json({
      success: true,
      data,
      meta: {
        instituteHasActivePlan,
        plan: institute.subscriptionPlan,
        planCoversTests: instituteHasActivePlan,
        endDate: institute.subscriptionEndDate,
        totalStudents: students.length,
        studentsWithAccess: data.filter(s => s.hasAccess).length,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Get Student ID Card (Institute Side) ─────────────────────────────
exports.getStudentIdCard = async (req, res) => {
  try {
    const institute = await Institute.findOne({ where: { ownerId: req.user.id } });
    if (!institute) return res.status(404).json({ error: 'Institute not found' });

    const student = await User.findOne({
      where: { id: req.params.studentId, instituteId: institute.id, role: 'student' },
    });
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const batchStudents = await BatchStudent.findAll({ where: { userId: student.id } });
    const batchIds = batchStudents.map(b => b.batchId);
    let batches = [];
    if (batchIds.length > 0) {
      batches = await Batch.findAll({
        where: { id: batchIds, instituteId: institute.id },
        attributes: ['id', 'name', 'description'],
      });
    }

    const totalTests = await Result.count({ where: { userId: student.id, status: ['completed', 'auto-submitted'] } });

    res.json({
      success: true,
      data: {
        id: student.id,
        name: student.name,
        email: student.email,
        mobile: student.mobile,
        avatar: student.avatar,
        state: student.state,
        city: student.city,
        isActive: student.isActive,
        joinedAt: student.createdAt,
        institute: institute.toJSON(),
        batches: batches.map(b => b.toJSON()),
        stats: { totalTests },
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Approval Management ────────────────────────────────────────
exports.getPendingStudents = async (req, res) => {
  try {
    const institute = await Institute.findOne({ where: { ownerId: req.user.id } });
    if (!institute) return res.status(404).json({ error: 'Institute not found' });

    const students = await User.findAll({
      where: { instituteId: institute.id, instituteApprovalStatus: 'pending' },
      attributes: ['id', 'name', 'email', 'mobile', 'city', 'state', 'createdAt'],
      order: [['createdAt', 'ASC']]
    });

    res.json({ success: true, data: students });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.approveStudent = async (req, res) => {
  try {
    const institute = await Institute.findOne({ where: { ownerId: req.user.id } });
    if (!institute) return res.status(404).json({ error: 'Institute not found' });

    const { studentId, status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const student = await User.findOne({ where: { id: studentId, instituteId: institute.id } });
    if (!student) return res.status(404).json({ error: 'Student not found in your linking queue' });

    student.instituteApprovalStatus = status;
    if (status === 'rejected') {
      student.instituteId = null;
      student.instituteApprovalStatus = 'none';
    }
    await student.save();

    // Notify student
    try {
      await Notification.create({
        userId: student.id,
        title: status === 'approved' ? 'Enrollment Approved!' : 'Enrollment Rejected',
        message: status === 'approved' 
          ? `Congratulations! ${institute.name} has approved your enrollment.` 
          : `Your request to join ${institute.name} was rejected.`,
        type: 'system'
      });
    } catch {}

    res.json({ success: true, message: `Student ${status} successfully.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Institute Analytics ────────────────────────────────────────
exports.getAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const institute = await Institute.findOne({ where: { ownerId: userId } });
    if (!institute) return res.status(404).json({ error: 'Institute not found' });

    const iid = institute.id;
    const { period = '30d' } = req.query;
    const days = period === '7d' ? 7 : period === '90d' ? 90 : period === '1y' ? 365 : 30;
    const since = new Date(Date.now() - days * 86400000);

    const [totalStudents, totalBatches] = await Promise.all([
      User.count({ where: { instituteId: iid, role: 'student' } }),
      Batch.count({ where: { instituteId: iid } }),
    ]);

    const [resultsAll, resultsPeriod] = await Promise.all([
      Result.findAll({
        where: { instituteId: iid, status: ['completed', 'auto-submitted'] },
        attributes: ['score', 'accuracy', 'timeTaken', 'submittedAt', 'subjectPerformance', 'testId', 'userId'],
      }),
      Result.findAll({
        where: { instituteId: iid, status: ['completed', 'auto-submitted'], submittedAt: { [Op.gte]: since } },
        attributes: ['score', 'accuracy', 'submittedAt', 'userId'],
      }),
    ]);

    const totalAttempts = resultsAll.length;
    const avgAccuracy = totalAttempts > 0
      ? Math.round(resultsAll.reduce((s, r) => s + (r.accuracy || 0), 0) / totalAttempts)
      : 0;
    const avgScore = totalAttempts > 0
      ? parseFloat((resultsAll.reduce((s, r) => s + (r.score || 0), 0) / totalAttempts).toFixed(1))
      : 0;

    const attemptsByDay = {};
    resultsPeriod.forEach(r => {
      const d = r.submittedAt ? new Date(r.submittedAt).toISOString().split('T')[0] : null;
      if (d) attemptsByDay[d] = (attemptsByDay[d] || 0) + 1;
    });
    const dailyAttempts = Object.entries(attemptsByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));

    const activeStudentIds = new Set(resultsPeriod.map(r => r.userId));
    const activeStudents = activeStudentIds.size;

    const topStudents = await sequelize.query(`
      SELECT u.id, u.name, u.email, u.avatar,
             COUNT(r.id) AS totalTests,
             ROUND(AVG(r.score), 1) AS avgScore,
             ROUND(AVG(r.accuracy), 1) AS avgAccuracy
      FROM results r
      JOIN users u ON u.id = r.userId
      WHERE r.instituteId = :iid AND r.status IN ('completed','auto-submitted')
      GROUP BY u.id, u.name, u.email, u.avatar
      ORDER BY avgScore DESC
      LIMIT 10
    `, { replacements: { iid }, type: sequelize.QueryTypes.SELECT });

    const testPerformance = await sequelize.query(`
      SELECT t.id, t.title, t.category, t.type,
             COUNT(r.id) AS attempts,
             ROUND(AVG(r.score), 1) AS avgScore,
             ROUND(AVG(r.accuracy), 1) AS avgAccuracy
      FROM results r
      JOIN tests t ON t.id = r.testId
      WHERE r.instituteId = :iid AND r.status IN ('completed','auto-submitted')
      GROUP BY t.id, t.title, t.category, t.type
      ORDER BY attempts DESC
      LIMIT 10
    `, { replacements: { iid }, type: sequelize.QueryTypes.SELECT });

    const bands = [
      { range: '0-20%', min: 0, max: 20 },
      { range: '20-40%', min: 20, max: 40 },
      { range: '40-60%', min: 40, max: 60 },
      { range: '60-80%', min: 60, max: 80 },
      { range: '80-100%', min: 80, max: 101 },
    ];
    const scoreDist = bands.map(b => ({
      range: b.range,
      count: resultsAll.filter(r => r.accuracy >= b.min && r.accuracy < b.max).length,
    }));

    const subjectMap = {};
    resultsAll.forEach(r => {
      (r.subjectPerformance || []).forEach(sp => {
        if (!subjectMap[sp.subject]) subjectMap[sp.subject] = { correct: 0, total: 0 };
        subjectMap[sp.subject].correct += sp.correct || 0;
        subjectMap[sp.subject].total += sp.totalQuestions || 0;
      });
    });
    const subjectAccuracy = Object.entries(subjectMap).map(([subject, d]) => ({
      subject,
      accuracy: d.total > 0 ? Math.round((d.correct / d.total) * 100) : 0,
      total: d.total,
    })).sort((a, b) => b.accuracy - a.accuracy).slice(0, 8);

    const batchStats = await sequelize.query(`
      SELECT b.name,
             COUNT(r.id) AS attempts,
             ROUND(AVG(r.accuracy), 1) AS avgAccuracy
      FROM results r
      JOIN batch_students bs ON bs.userId = r.userId
      JOIN batches b ON b.id = bs.batchId
      WHERE r.instituteId = :iid AND r.status IN ('completed','auto-submitted') AND b.instituteId = :iid
      GROUP BY b.id, b.name
      ORDER BY attempts DESC
      LIMIT 8
    `, { replacements: { iid }, type: sequelize.QueryTypes.SELECT });

    res.json({
      success: true,
      data: {
        kpis: { totalStudents, activeStudents, totalAttempts, avgAccuracy, avgScore, totalBatches },
        dailyAttempts,
        topStudents,
        testPerformance,
        scoreDist,
        subjectAccuracy,
        batchStats,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
