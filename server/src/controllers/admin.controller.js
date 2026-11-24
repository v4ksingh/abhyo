const { Op, fn, col, literal, where } = require('sequelize');
const { sequelize } = require('../config/database');
const { User, Institute, Test, Result, Payment, Question } = require('../models');

// ─── Dashboard ────────────────────────────────────────
exports.getDashboard = async (req, res) => {
  try {
    const [
      totalStudents,
      totalInstitutes,
      pendingInstitutes,
      totalTests,
      totalResults,
      totalQuestions,
      totalUsers,
    ] = await Promise.all([
      User.count({ where: { role: 'student', isActive: true } }),
      Institute.count(),
      Institute.count({ where: { status: 'pending' } }),
      Test.count({ where: { isActive: true } }),
      Result.count({ where: { status: ['completed', 'auto-submitted'] } }),
      Question.count({ where: { isActive: true } }),
      User.count(),
    ]);

    // Revenue stats
    const revenueRow = await Payment.findOne({
      where: { status: 'captured' },
      attributes: [
        [fn('SUM', col('amount')), 'total'],
        [fn('COUNT', col('id')), 'count'],
      ],
      raw: true,
    });

    // Monthly revenue (last 6 months)
    const monthlyRevenue = await sequelize.query(`
      SELECT 
        DATE_FORMAT(createdAt, '%Y-%m') AS month,
        SUM(amount) AS total,
        COUNT(*) AS count
      FROM payments
      WHERE status = 'captured' AND createdAt >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(createdAt, '%Y-%m')
      ORDER BY month ASC
    `, { type: sequelize.QueryTypes.SELECT });

    // Daily attempts (last 7 days)
    const dailyAttempts = await sequelize.query(`
      SELECT 
        DATE(submittedAt) AS date,
        COUNT(*) AS count
      FROM results
      WHERE status IN ('completed','auto-submitted') AND submittedAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(submittedAt)
      ORDER BY date ASC
    `, { type: sequelize.QueryTypes.SELECT });

    // Recent pending institutes
    const recentInstitutes = await Institute.findAll({
      where: { status: 'pending' },
      include: [{ association: 'owner', attributes: ['id', 'name', 'email'] }],
      order: [['createdAt', 'DESC']],
      limit: 5,
    });

    // Recent payments
    const recentPayments = await Payment.findAll({
      where: { status: 'captured' },
      include: [{ association: 'user', attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC']],
      limit: 10,
    });

    res.json({
      success: true,
      data: {
        stats: {
          totalStudents,
          totalInstitutes,
          pendingInstitutes,
          totalTests,
          totalResults,
          totalQuestions,
          totalUsers,
          totalRevenue: parseFloat(revenueRow?.total || 0),
          totalTransactions: parseInt(revenueRow?.count || 0),
        },
        monthlyRevenue,
        dailyAttempts,
        recentInstitutes,
        recentPayments,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ─── Get All Institutes ────────────────────────────────────────
exports.getInstitutes = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const offset = (page - 1) * limit;
    const whereClause = {};
    if (status) whereClause.status = status;
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Institute.findAndCountAll({
      where: whereClause,
      include: [{ association: 'owner', attributes: ['id', 'name', 'email'] }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    res.json({ success: true, data: rows, pagination: { total: count, page: parseInt(page), limit: parseInt(limit) } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Approve Institute ────────────────────────────────────────
exports.approveInstitute = async (req, res) => {
  try {
    const inst = await Institute.findByPk(req.params.id, {
      include: [{ association: 'owner', attributes: ['id', 'name', 'email'] }],
    });
    if (!inst) return res.status(404).json({ error: 'Institute not found' });

    // Activate Free plan by default
    const { Plan } = require('../models');
    const freePlan = await Plan.findOne({
      where: { type: 'institute', isActive: true, name: 'Free' }
    });

    const updates = { 
      status: 'approved',
      subscriptionPlan: 'free',
      subscriptionStatus: 'active',
      subscriptionStartDate: new Date(),
      // Free plan never really expires, but let's give it a 10-year horizon
      subscriptionEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 10)),
      maxStudents: freePlan?.maxStudents || 50,
      maxBatches: freePlan?.maxBatches || 3
    };

    await inst.update(updates);

    // Notify owner
    if (inst.owner) {
      await sendNotification(inst.ownerId, 'Institute Approved! 🎉', `Your institute "${inst.name}" has been approved. You can now login and start managing students.`, 'institute_approved');
    }

    res.json({ success: true, message: 'Institute approved', data: inst });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Reject Institute ────────────────────────────────────────
exports.rejectInstitute = async (req, res) => {
  try {
    const { reason } = req.body;
    const inst = await Institute.findByPk(req.params.id);
    if (!inst) return res.status(404).json({ error: 'Institute not found' });

    await inst.update({ status: 'rejected', rejectionReason: reason });
    res.json({ success: true, message: 'Institute rejected' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Update Subscription ────────────────────────────────────────
exports.updateSubscription = async (req, res) => {
  try {
    const { plan } = req.body;
    const inst = await Institute.findByPk(req.params.id);
    if (!inst) return res.status(404).json({ error: 'Institute not found' });

    const { Plan } = require('../models');
    const planObj = await Plan.findOne({ where: { name: plan, type: 'institute' } });
    
    let maxStudents = 50;
    let maxBatches = 3;
    
    if (planObj) {
      maxStudents = planObj.maxStudents || 50;
      maxBatches = planObj.maxBatches || 3;
    } else {
      const planLimits = { free: [50, 3], basic: [200, 10], pro: [1000, 50], enterprise: [99999, 999] };
      const fallback = planLimits[String(plan).toLowerCase()] || planLimits.free;
      maxStudents = fallback[0];
      maxBatches = fallback[1];
    }

    await inst.update({
      subscriptionPlan: plan,
      subscriptionStatus: 'active',
      subscriptionStartDate: new Date(),
      subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      maxStudents,
      maxBatches,
    });

    res.json({ success: true, data: inst });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Get All Users ────────────────────────────────────────
exports.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 25, role, search } = req.query;
    const offset = (page - 1) * limit;
    const whereClause = {};
    if (role) whereClause.role = role;
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { mobile: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where: whereClause,
      include: [{ association: 'institute', attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    res.json({ success: true, data: rows, pagination: { total: count, page: parseInt(page), limit: parseInt(limit) } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Toggle User Active ────────────────────────────────────────
exports.toggleUserActive = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    await user.update({ isActive: !user.isActive });
    res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Delete User ────────────────────────────────────────
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role === 'superadmin') return res.status(403).json({ error: 'Cannot delete superadmin' });
    await user.destroy();
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Revenue Analytics ────────────────────────────────────────
exports.getRevenue = async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const days = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 }[period] || 30;

    const [overview, byType, daily, byInstitute, byPaymentMode] = await Promise.all([
      Payment.findOne({
        where: {
          status: 'captured',
          createdAt: { [Op.gte]: new Date(Date.now() - days * 24 * 60 * 60 * 1000) },
        },
        attributes: [
          [fn('SUM', col('amount')), 'total'],
          [fn('COUNT', col('id')), 'count'],
        ],
        raw: true,
      }),
      sequelize.query(`
        SELECT type, SUM(amount) AS total, COUNT(*) AS count
        FROM payments
        WHERE status = 'captured' AND createdAt >= DATE_SUB(NOW(), INTERVAL ${days} DAY)
        GROUP BY type
      `, { type: sequelize.QueryTypes.SELECT }),
      sequelize.query(`
        SELECT DATE(createdAt) AS date, SUM(amount) AS total, COUNT(*) AS count
        FROM payments
        WHERE status = 'captured' AND createdAt >= DATE_SUB(NOW(), INTERVAL ${days} DAY)
        GROUP BY DATE(createdAt)
        ORDER BY date ASC
      `, { type: sequelize.QueryTypes.SELECT }),
      sequelize.query(`
        SELECT i.name as instituteName, SUM(p.amount) AS total, COUNT(*) AS count
        FROM payments p
        LEFT JOIN institutes i ON p.instituteId = i.id
        WHERE p.status = 'captured' AND p.createdAt >= DATE_SUB(NOW(), INTERVAL ${days} DAY)
        GROUP BY i.id, i.name
        ORDER BY total DESC
        LIMIT 10
      `, { type: sequelize.QueryTypes.SELECT }),
      sequelize.query(`
        SELECT paymentMode as type, SUM(amount) AS total, COUNT(*) AS count
        FROM payments
        WHERE status = 'captured' AND createdAt >= DATE_SUB(NOW(), INTERVAL ${days} DAY)
        GROUP BY paymentMode
      `, { type: sequelize.QueryTypes.SELECT }),
    ]);

    res.json({
      success: true,
      data: {
        overview: { total: parseFloat(overview?.total || 0), count: parseInt(overview?.count || 0) },
        byType,
        daily,
        byInstitute,
        byPaymentMode,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Get Detailed Transactions ──────────────────────────────
exports.getTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 100, status = 'captured' } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await Payment.findAndCountAll({
      where: status !== 'all' ? { status } : {},
      include: [{ association: 'user', attributes: ['id', 'name', 'email'] }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({ 
      success: true, 
      data: rows, 
      pagination: { total: count, page: parseInt(page), limit: parseInt(limit) } 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Broadcast Notification to All Users ─────────────────────
exports.broadcastNotification = async (req, res) => {
  try {
    const { message, title = 'Platform Announcement 📢' } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    const { Notification } = require('../models');
    const users = await User.findAll({ where: { isActive: true }, attributes: ['id'] });

    await Notification.bulkCreate(
      users.map(u => ({ userId: u.id, title, message, type: 'system' })),
      { ignoreDuplicates: true }
    );

    res.json({ success: true, message: `Broadcast sent to ${users.length} users`, count: users.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Notify Single User ────────────────────────────────────────
exports.notifyUser = async (req, res) => {
  try {
    const { message, title = 'Message from Admin' } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    await sendNotification(user.id, title, message, 'admin_message');
    res.json({ success: true, message: 'Notification sent' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Toggle Institute Landing Page ──────────────────────────────────────
exports.toggleInstituteLanding = async (req, res) => {
  try {
    const inst = await Institute.findByPk(req.params.id);
    if (!inst) return res.status(404).json({ error: 'Institute not found' });

    const updates = { isLandingEnabled: !inst.isLandingEnabled };

    // Auto-generate slug when enabling if none exists
    if (updates.isLandingEnabled && !inst.slug && inst.name) {
      let slug = inst.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const existing = await Institute.findOne({ where: { slug } });
      if (existing && existing.id !== inst.id) slug = `${slug}-${inst.id.slice(0, 4)}`;
      updates.slug = slug;
    }

    await inst.update(updates);
    res.json({
      success: true,
      data: { isLandingEnabled: inst.isLandingEnabled, slug: inst.slug },
      message: inst.isLandingEnabled ? 'Landing page published' : 'Landing page hidden',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Toggle Institute Featured ─────────────────────────────────────────
exports.toggleInstituteFeatured = async (req, res) => {
  try {
    const inst = await Institute.findByPk(req.params.id);
    if (!inst) return res.status(404).json({ error: 'Institute not found' });
    await inst.update({ isFeatured: !inst.isFeatured });
    res.json({ success: true, data: { isFeatured: inst.isFeatured } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Update Institute Landing Page Content ───────────────────────────
exports.updateInstituteLanding = async (req, res) => {
  try {
    const inst = await Institute.findByPk(req.params.id);
    if (!inst) return res.status(404).json({ error: 'Institute not found' });

    let {
      slug, tagline, landingBio, achievements,
      socialLinks, courses, faculty, testimonials, foundedYear,
      phone, contactAddress, isLandingEnabled, isFeatured,
    } = req.body;

    // Handle files if uploaded
    let bannerImage = inst.bannerImage;
    if (req.files && req.files.banner && req.files.banner[0]) {
      bannerImage = req.files.banner[0].filename;
    }

    let logo = inst.logo;
    if (req.files && req.files.logo && req.files.logo[0]) {
      logo = req.files.logo[0].filename;
    }

    // Helper to carefully parse stringified arrays/objects
    const safeParse = (val, fb) => {
      if (typeof val === 'string') {
        try { return JSON.parse(val); } catch { return fb; }
      }
      return val || fb;
    };

    achievements = safeParse(achievements, []);
    socialLinks = safeParse(socialLinks, {});
    courses = safeParse(courses, []);
    faculty = safeParse(faculty, []);
    testimonials = safeParse(testimonials, []);

    // Auto-generate slug from name if not provided
    let finalSlug = slug;
    if (!finalSlug && inst.name) {
      finalSlug = inst.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }

    // Ensure slug uniqueness
    if (finalSlug && finalSlug !== inst.slug) {
      const existing = await Institute.findOne({ where: { slug: finalSlug } });
      if (existing && existing.id !== inst.id) {
        finalSlug = `${finalSlug}-${inst.id.slice(0, 4)}`;
      }
    }

    await inst.update({
      logo,
      slug: finalSlug || inst.slug,
      tagline, bannerImage, landingBio,
      achievements,
      socialLinks,
      courses,
      faculty,
      testimonials,
      foundedYear, phone, contactAddress,
      ...(isLandingEnabled !== undefined && { isLandingEnabled: isLandingEnabled === 'true' || isLandingEnabled === true }),
      ...(isFeatured !== undefined && { isFeatured: isFeatured === 'true' || isFeatured === true }),
    });

    res.json({ success: true, data: inst });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Internal helper ────────────────────────────────────────
async function sendNotification(userId, title, message, type) {
  const { Notification } = require('../models');
  await Notification.create({ userId, title, message, type }).catch(() => {});
}

// ─── Settings Operations ────────────────────────────────────────

exports.getSettings = async (req, res) => {
  try {
    // Only return non-secret configurations
    res.json({
      success: true,
      data: {
        RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || '',
        RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET ? '********' : '',
        EMAIL_HOST: process.env.EMAIL_HOST || '',
        EMAIL_PORT: process.env.EMAIL_PORT || '',
        EMAIL_USER: process.env.EMAIL_USER || '',
        EMAIL_PASS: process.env.EMAIL_PASS ? '********' : '',
        EMAIL_FROM: process.env.EMAIL_FROM || '',
        EMAIL_SECURE: process.env.EMAIL_SECURE || 'false',
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const { 
      RAZORPAY_KEY_ID, 
      RAZORPAY_KEY_SECRET,
      EMAIL_HOST,
      EMAIL_PORT,
      EMAIL_USER,
      EMAIL_PASS,
      EMAIL_FROM,
      EMAIL_SECURE
    } = req.body;
    
    const fs = require('fs');
    const path = require('path');
    const envPath = path.join(__dirname, '../../.env');
    
    let envContent = '';
    if (fs.existsSync(envPath)) {
       envContent = fs.readFileSync(envPath, 'utf8');
    }

    const updateEnv = (key, value) => {
      if (value !== undefined) {
        if (value === '********') return; // Do not overwrite with mask
        process.env[key] = value;
        if (envContent.includes(`${key}=`)) {
           envContent = envContent.replace(new RegExp(`^${key}=.*`, 'm'), `${key}=${value}`);
        } else {
           envContent += `\n${key}=${value}`;
        }
      }
    };

    updateEnv('RAZORPAY_KEY_ID', RAZORPAY_KEY_ID);
    updateEnv('RAZORPAY_KEY_SECRET', RAZORPAY_KEY_SECRET);
    updateEnv('EMAIL_HOST', EMAIL_HOST);
    updateEnv('EMAIL_PORT', EMAIL_PORT);
    updateEnv('EMAIL_USER', EMAIL_USER);
    updateEnv('EMAIL_PASS', EMAIL_PASS);
    updateEnv('EMAIL_FROM', EMAIL_FROM);
    updateEnv('EMAIL_SECURE', EMAIL_SECURE);
    
    fs.writeFileSync(envPath, envContent.trim());
    
    res.json({ success: true, message: 'Settings explicitly updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ─── Test SMTP Email Connection ────────────────────────────────────────
exports.testEmail = async (req, res) => {
  try {
    const { testSmtpConnection } = require('../utils/email.util');
    const { recipientEmail, EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM, EMAIL_SECURE } = req.body;

    const customConfig = {
      host: EMAIL_HOST,
      port: EMAIL_PORT,
      user: EMAIL_USER,
      pass: EMAIL_PASS === '********' ? process.env.EMAIL_PASS : EMAIL_PASS,
      from: EMAIL_FROM,
      secure: EMAIL_SECURE,
    };

    const targetRecipient = recipientEmail || req.user?.email || process.env.EMAIL_USER;

    const result = await testSmtpConnection(customConfig, targetRecipient);

    if (result.success) {
      return res.json({
        success: true,
        message: result.message,
        details: result.details,
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error,
        code: result.code,
        originalError: result.originalError,
      });
    }
  } catch (err) {
    console.error('Test email route error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── Get System Email Templates ────────────────────────────────────────
exports.getEmailTemplates = async (req, res) => {
  try {
    const { emailTemplates } = require('../utils/email.util');
    const primaryClientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim();

    const sampleData = {
      welcome: {
        id: 'welcome',
        name: 'Welcome & Account Registration',
        description: 'Sent automatically when a new student or institute completes registration.',
        subject: 'Welcome to Abhyo - Your Account is Ready',
        trigger: 'On Registration (/register, /olympiad/register-account)',
        previewHtml: emailTemplates.welcomeEmail({
          name: 'Priya Sharma',
          email: 'priya.sharma@example.com',
          role: 'student',
          loginUrl: 'https://abhyo.com/login',
        }),
      },
      forgotPassword: {
        id: 'forgotPassword',
        name: 'Forgot Password & Reset Token',
        description: 'Sent when a user requests a password reset link.',
        subject: 'Reset Your Password - Abhyo',
        trigger: 'On Forgot Password Request (/forgot-password)',
        previewHtml: emailTemplates.forgotPasswordEmail({
          name: 'Priya Sharma',
          resetUrl: `${primaryClientUrl}/reset-password?token=sample_token_8f9c2e`,
          expiryMinutes: 60,
        }),
      },
      olympiadVerification: {
        id: 'olympiadVerification',
        name: 'Olympiad ID Verification (Approved / Rejected)',
        description: 'Sent when the admin approves or rejects a student identity document.',
        subject: '🎉 Document Approved - Complete Your Registration',
        trigger: 'On Admin Verification Action (/admin/olympiad/registrations)',
        previewHtml: emailTemplates.olympiadVerificationEmail({
          name: 'Priya Sharma',
          olympiadTitle: 'National Science & Math Olympiad 2026',
          status: 'approved',
          remarks: 'Aadhaar document verified successfully. Identity approved.',
          actionUrl: `${primaryClientUrl}/student/olympiad`,
        }),
      },
      paymentReceipt: {
        id: 'paymentReceipt',
        name: 'Payment Receipt & Order Confirmation',
        description: 'Sent when an Olympiad registration or plan fee payment succeeds.',
        subject: 'Payment Successful! Receipt #PAY-7E9B2',
        trigger: 'On Razorpay Payment Capture (/payment/verify)',
        previewHtml: emailTemplates.paymentReceiptEmail({
          name: 'Priya Sharma',
          itemTitle: 'National Science & Math Olympiad 2026 - Class 10 Registration',
          amount: '150.00',
          paymentId: 'pay_Nz8E3kL9pQ2m1A',
          orderId: 'order_Nz8E1jK8oP1m0B',
          date: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        }),
      },
    };

    res.json({ success: true, data: sampleData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Send Sample Email to Admin ────────────────────────────────────────
exports.sendSampleEmail = async (req, res) => {
  try {
    const { templateId, recipientEmail } = req.body;
    const { sendEmail, emailTemplates } = require('../utils/email.util');
    const primaryClientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim();
    const targetEmail = recipientEmail || req.user.email;

    let subject = '';
    let html = '';

    if (templateId === 'welcome') {
      subject = '[SAMPLE] Welcome to Abhyo - Your Account is Ready';
      html = emailTemplates.welcomeEmail({
        name: req.user.name || 'Valued User',
        email: targetEmail,
        role: 'student',
        loginUrl: `${primaryClientUrl}/login`,
      });
    } else if (templateId === 'forgotPassword') {
      subject = '[SAMPLE] Reset Your Password - Abhyo';
      html = emailTemplates.forgotPasswordEmail({
        name: req.user.name || 'Valued User',
        resetUrl: `${primaryClientUrl}/reset-password?token=sample_token_${Date.now()}`,
        expiryMinutes: 60,
      });
    } else if (templateId === 'olympiadVerification') {
      subject = '[SAMPLE] 🎉 Document Approved - Complete Your Registration';
      html = emailTemplates.olympiadVerificationEmail({
        name: req.user.name || 'Valued User',
        olympiadTitle: 'National Science & Math Olympiad 2026',
        status: 'approved',
        remarks: 'Sample verification: Aadhaar card approved by admin.',
        actionUrl: `${primaryClientUrl}/student/olympiad`,
      });
    } else if (templateId === 'paymentReceipt') {
      subject = '[SAMPLE] Payment Successful! Receipt #PAY-SAMPLE';
      html = emailTemplates.paymentReceiptEmail({
        name: req.user.name || 'Valued User',
        itemTitle: 'National Science & Math Olympiad - Class 10 Registration',
        amount: '150.00',
        paymentId: 'pay_sample_' + Date.now().toString(16),
        orderId: 'order_sample_' + Date.now().toString(16),
        date: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      });
    } else {
      return res.status(400).json({ error: 'Invalid template identifier' });
    }

    await sendEmail({
      to: targetEmail,
      subject,
      html,
    });

    res.json({
      success: true,
      message: `Sample "${templateId}" email sent to ${targetEmail}!`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Staff Management ────────────────────────────────────────
const STAFF_ROLES = ['admin', 'accountant', 'content_manager', 'teacher'];

exports.getStaff = async (req, res) => {
  try {
    const staff = await User.findAll({
      where: { role: STAFF_ROLES },
      attributes: { exclude: ['password', 'otp', 'otpExpiry', 'resetPasswordToken', 'refreshToken'] },
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, data: staff });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createStaff = async (req, res) => {
  try {
    const { name, email, role, password } = req.body;
    // Sanitize mobile: treat empty string as null to avoid unique constraint collision
    const mobile = req.body.mobile?.trim() || null;
    if (!name || !email || !role || !password) {
      return res.status(400).json({ error: 'Name, email, role, and password are required' });
    }
    if (!STAFF_ROLES.includes(role)) {
      return res.status(400).json({ error: `Invalid staff role. Allowed: ${STAFF_ROLES.join(', ')}` });
    }
    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email already registered' });
    if (mobile) {
      const mobileExists = await User.findOne({ where: { mobile } });
      if (mobileExists) return res.status(400).json({ error: 'Mobile number already registered to another account' });
    }

    const staff = await User.create({ name, email, mobile, role, password, isActive: true });
    res.status(201).json({ success: true, data: staff });
  } catch (err) {
    console.error('[createStaff]', err);
    if (err.original?.code === 'ER_DUP_ENTRY') {
      const field = err.original.sqlMessage?.includes('mobile') ? 'Mobile number' : 'Email';
      return res.status(400).json({ error: `${field} is already registered` });
    }
    res.status(500).json({ error: err.message });
  }
};

exports.updateStaff = async (req, res) => {
  try {
    const { name, email, role, password, isActive } = req.body;
    // Sanitize mobile: treat empty string as null to avoid unique constraint collision
    const mobile = req.body.mobile !== undefined ? (req.body.mobile?.trim() || null) : undefined;
    const staff = await User.findOne({ where: { id: req.params.id, role: STAFF_ROLES } });
    if (!staff) return res.status(404).json({ error: 'Staff member not found' });
    if (role && !STAFF_ROLES.includes(role)) {
      return res.status(400).json({ error: `Invalid role. Allowed: ${STAFF_ROLES.join(', ')}` });
    }
    // Pre-check mobile uniqueness (excluding this staff member's own record)
    if (mobile && mobile !== staff.mobile) {
      const mobileExists = await User.findOne({ where: { mobile } });
      if (mobileExists && mobileExists.id !== staff.id) {
        return res.status(400).json({ error: 'Mobile number already registered to another account' });
      }
    }
    await staff.update({
      ...(name && { name }),
      ...(email && { email }),
      ...(mobile !== undefined && { mobile }),
      ...(role && { role }),
      ...(password && { password }),
      ...(isActive !== undefined && { isActive }),
    });
    res.json({ success: true, data: staff });
  } catch (err) {
    console.error('[updateStaff]', err);
    if (err.original?.code === 'ER_DUP_ENTRY') {
      const field = err.original.sqlMessage?.includes('mobile') ? 'Mobile number' : 'Email';
      return res.status(400).json({ error: `${field} is already registered` });
    }
    res.status(500).json({ error: err.message });
  }
};

exports.deleteStaff = async (req, res) => {
  try {
    const staff = await User.findOne({ where: { id: req.params.id, role: STAFF_ROLES } });
    if (!staff) return res.status(404).json({ error: 'Staff member not found' });
    await staff.destroy();
    res.json({ success: true, message: 'Staff member removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Sitemap Operations ────────────────────────────────────────
exports.getSitemapInfo = async (req, res) => {
  try {
    const { getSitemapInfo } = require('../utils/sitemap.util');
    const result = await getSitemapInfo();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.recreateSitemap = async (req, res) => {
  try {
    const { recreateSitemap } = require('../utils/sitemap.util');
    const { baseUrl } = req.body || {};
    const result = await recreateSitemap(baseUrl);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Cache Management ─────────────────────────────────────────
exports.getCacheStatus = async (req, res) => {
  try {
    const cache = require('../utils/cache.util');
    res.json({ success: true, data: cache.getStats() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.triggerCacheWarm = async (req, res) => {
  try {
    const { warmAll } = require('../utils/cacheWarmer');
    const result = await warmAll('superadmin-manual');
    res.json({ success: true, message: 'Cache successfully warmed and preloaded!', data: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.clearCache = async (req, res) => {
  try {
    const cache = require('../utils/cache.util');
    cache.clear();
    res.json({ success: true, message: 'All in-memory cache flushed clean.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
