const EBook = require('../models/EBook.model');
const { Payment, User, Institute } = require('../models');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const getRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET)
    throw new Error('Razorpay keys not configured');
  return new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
};

// Check if user has active plan access (staff, active/trial subscription, or institute plan)
const checkUserPlanAccess = async (user) => {
  if (!user) return false;
  if (['superadmin', 'admin', 'content_manager', 'teacher'].includes(user.role)) return true;

  // Direct student active subscription or trial
  if (['active', 'trial'].includes(user.studentSubscriptionStatus)) {
    if (!user.studentSubscriptionEndDate) return true;
    if (new Date(user.studentSubscriptionEndDate) > new Date()) return true;
  }

  // Non-free assigned plan
  if (user.studentSubscriptionPlan && user.studentSubscriptionPlan !== 'free' && user.studentSubscriptionStatus !== 'expired') {
    return true;
  }

  // Associated institute active subscription
  if (user.instituteId && !user.institutePremiumBlocked) {
    try {
      const inst = await Institute.findByPk(user.instituteId);
      if (inst && ['active', 'trial'].includes(inst.subscriptionStatus) && inst.subscriptionPlan !== 'free') {
        return true;
      }
    } catch {}
  }

  return false;
};

// ── Helpers ──────────────────────────────────────────────────────
const toSlug = (str) =>
  str.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '')   // remove special chars
    .replace(/[\s_]+/g, '-')    // spaces/underscores → dash
    .replace(/-+/g, '-')        // collapse multiple dashes
    .replace(/^-+|-+$/g, '');   // trim leading/trailing dashes

const makeSlug = async (title, existingId = null) => {
  let base = toSlug(title);
  let slug = base;
  let counter = 1;
  while (true) {
    const where = { slug };
    if (existingId) where.id = { [Op.ne]: existingId };
    const existing = await EBook.findOne({ where });
    if (!existing) break;
    slug = `${base}-${counter++}`;
  }
  return slug;
};

const getFileUrl = (filename) => filename ? `/uploads/${filename}` : null;

// Safely parse tags from FormData string, JSON string, or array
const parseTags = (tags) => {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags;
  try { const parsed = JSON.parse(tags); return Array.isArray(parsed) ? parsed : []; } catch {}
  // Comma-separated fallback: "SSC, UPSC, GK" → ['SSC','UPSC','GK']
  return String(tags).split(',').map(t => t.trim()).filter(Boolean);
};

// ─────────────────────────────────────────────────────────────────
// ADMIN — CRUD
// ─────────────────────────────────────────────────────────────────

exports.listAdmin = async (req, res) => {
  try {
    const { search, category, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = {};
    if (search) where.title = { [Op.like]: `%${search}%` };
    if (category) where.category = category;

    const { count, rows } = await EBook.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    res.json({ success: true, data: rows, total: count, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { title, description, author, category, tags, isFree, price, mrp, accessType, isActive, isFeatured, language, totalPages } = req.body;

    const slug = await makeSlug(title);

    const coverImage = req.files?.coverImage?.[0]?.filename || null;
    const pdfFile    = req.files?.pdfFile?.[0]?.filename || null;
    const fileSize   = req.files?.pdfFile?.[0]?.size || 0;

    const ebook = await EBook.create({
      title,
      slug,
      description,
      author,
      category: category || 'General',
      tags: parseTags(tags),
      coverImage,
      fileUrl: pdfFile,
      fileSize,
      totalPages: parseInt(totalPages) || 0,
      isFree: isFree === 'true' || isFree === true,
      price: parseFloat(price) || 0,
      mrp: parseFloat(mrp) || 0,
      accessType: accessType || (isFree ? 'free' : 'paid'),
      isActive: isActive !== 'false' && isActive !== false,
      isFeatured: isFeatured === 'true' || isFeatured === true,
      language: language || 'English',
      createdBy: req.user.id,
    });

    res.status(201).json({ success: true, data: ebook });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const ebook = await EBook.findByPk(id);
    if (!ebook) return res.status(404).json({ error: 'eBook not found' });

    const { title, description, author, category, tags, isFree, price, mrp, accessType, isActive, isFeatured, language, totalPages } = req.body;

    const updates = {
      description, author,
      category: category || ebook.category,
      tags: tags !== undefined ? parseTags(tags) : ebook.tags,
      isFree: isFree !== undefined ? (isFree === 'true' || isFree === true) : ebook.isFree,
      price: price !== undefined ? parseFloat(price) : ebook.price,
      mrp: mrp !== undefined ? parseFloat(mrp) : ebook.mrp,
      accessType: accessType || ebook.accessType,
      isActive: isActive !== undefined ? (isActive !== 'false' && isActive !== false) : ebook.isActive,
      isFeatured: isFeatured !== undefined ? (isFeatured === 'true' || isFeatured === true) : ebook.isFeatured,
      language: language || ebook.language,
      totalPages: totalPages !== undefined ? parseInt(totalPages) : ebook.totalPages,
    };

    if (title && title !== ebook.title) {
      updates.title = title;
      updates.slug = await makeSlug(title, id);
    }

    // Handle new file uploads
    if (req.files?.coverImage?.[0]) {
      // Delete old cover if exists
      if (ebook.coverImage) {
        const oldPath = path.join(__dirname, '../../uploads', ebook.coverImage);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      updates.coverImage = req.files.coverImage[0].filename;
    }

    if (req.files?.pdfFile?.[0]) {
      // Delete old PDF if exists
      if (ebook.fileUrl) {
        const oldPath = path.join(__dirname, '../../uploads', ebook.fileUrl);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      updates.fileUrl = req.files.pdfFile[0].filename;
      updates.fileSize = req.files.pdfFile[0].size;
    }

    await ebook.update(updates);
    res.json({ success: true, data: ebook });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const ebook = await EBook.findByPk(id);
    if (!ebook) return res.status(404).json({ error: 'eBook not found' });

    // Clean up files
    if (ebook.coverImage) {
      const p = path.join(__dirname, '../../uploads', ebook.coverImage);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    }
    if (ebook.fileUrl) {
      const p = path.join(__dirname, '../../uploads', ebook.fileUrl);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    }

    await ebook.destroy();
    res.json({ success: true, message: 'eBook deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const ebook = await EBook.findByPk(req.params.id);
    if (!ebook) return res.status(404).json({ error: 'eBook not found' });
    res.json({ success: true, data: ebook });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// PUBLIC — Listing & Preview
// ─────────────────────────────────────────────────────────────────

exports.listPublic = async (req, res) => {
  try {
    const { search, category, page = 1, limit = 12 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = { isActive: true };
    if (search) where.title = { [Op.like]: `%${search}%` };
    if (category) where.category = category;

    const { count, rows } = await EBook.findAndCountAll({
      where,
      attributes: { exclude: ['fileUrl'] }, // hide download URL
      order: [['isFeatured', 'DESC'], ['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    res.json({ success: true, data: rows, total: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getBySlug = async (req, res) => {
  try {
    const identifier = req.params.slug;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    const where = isUUID
      ? { id: identifier, isActive: true }
      : { slug: identifier, isActive: true };

    const ebook = await EBook.findOne({
      where,
      attributes: { exclude: ['fileUrl'] },
    });
    if (!ebook) return res.status(404).json({ error: 'Not found' });

    // Increment views
    await ebook.increment('totalViews');
    res.json({ success: true, data: ebook });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Protected download — checks if user has access
exports.download = async (req, res) => {
  try {
    const ebook = await EBook.findByPk(req.params.id);
    if (!ebook || !ebook.isActive) return res.status(404).json({ error: 'eBook not found' });

    const user = req.user;
    const isStaff = ['superadmin', 'admin', 'content_manager', 'teacher'].includes(user?.role);
    const hasPlan = isStaff || (await checkUserPlanAccess(user));

    // Access rules:
    //   free / plan-free → any logged-in user
    //   plan ebooks      → active plan subscription (or staff) OR purchased directly
    //   paid ebooks      → one-time purchase confirmed OR staff
    if (!ebook.isFree && ebook.accessType !== 'free') {
      let isPurchased = false;
      if (user?.id) {
        const purchase = await Payment.findOne({
          where: {
            userId: user.id,
            ebookId: ebook.id,
            status: { [Op.in]: ['captured', 'success'] },
          },
        });
        if (purchase) isPurchased = true;
      }

      if (ebook.accessType === 'plan') {
        if (!hasPlan && !isPurchased && !isStaff) {
          return res.status(403).json({ error: 'An active subscription plan or eBook purchase is required to download this eBook.' });
        }
      } else if (ebook.accessType === 'paid') {
        if (!isStaff && !isPurchased) {
          return res.status(403).json({ error: 'Please purchase this eBook to download it.' });
        }
      }
    }

    if (!ebook.fileUrl) return res.status(404).json({ error: 'No PDF file uploaded yet' });

    const filePath = path.join(__dirname, '../../uploads', ebook.fileUrl);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found on server' });

    await ebook.increment('totalDownloads');

    const sanitizedTitle = (ebook.title || 'eBook').replace(/[^a-zA-Z0-9_\-\. ]/g, '_');
    res.setHeader('Content-Disposition', `attachment; filename="${sanitizedTitle}.pdf"`);
    res.setHeader('Content-Type', 'application/pdf');
    res.sendFile(filePath);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Admin stats
exports.getStats = async (req, res) => {
  try {
    const total   = await EBook.count();
    const active  = await EBook.count({ where: { isActive: true } });
    const free    = await EBook.count({ where: { isFree: true } });
    const paid    = await EBook.count({ where: { isFree: false } });
    const { sequelize } = require('../config/database');
    const [revenue] = await sequelize.query(
      `SELECT COALESCE(SUM(price * totalSales),0) as total FROM ebooks WHERE isFree = false`
    );
    res.json({ success: true, data: { total, active, free, paid, estimatedRevenue: revenue[0]?.total || 0 } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Student — ebooks accessible to them (free, active plan, or purchased)
exports.myEbooks = async (req, res) => {
  try {
    const user = req.user;
    const isStaff = ['superadmin', 'admin', 'content_manager', 'teacher'].includes(user?.role);
    const hasPlan = isStaff || (await checkUserPlanAccess(user));

    // Fetch all captured/successful ebook purchases by this user
    const purchases = await Payment.findAll({
      where: {
        userId: user.id,
        ebookId: { [Op.ne]: null },
        status: { [Op.in]: ['captured', 'success'] },
      },
      attributes: ['ebookId', 'id', 'amount', 'date', 'razorpayPaymentId', 'createdAt'],
    });

    const purchaseMap = {};
    const purchasedEbookIds = [];
    purchases.forEach(p => {
      if (p.ebookId) {
        purchasedEbookIds.push(p.ebookId);
        purchaseMap[p.ebookId] = p;
      }
    });

    // Build WHERE clause
    const orConditions = [
      { isFree: true },
      { accessType: 'free' },
    ];

    if (hasPlan) {
      orConditions.push({ accessType: 'plan' });
    }

    if (purchasedEbookIds.length > 0) {
      orConditions.push({ id: { [Op.in]: purchasedEbookIds } });
    }

    const books = await EBook.findAll({
      where: {
        isActive: true,
        [Op.or]: orConditions,
      },
      order: [['isFeatured', 'DESC'], ['createdAt', 'DESC']],
    });

    const data = books.map(b => {
      const json = b.toJSON();
      const hasFile = !!json.fileUrl;
      delete json.fileUrl; // keep direct download path protected
      return {
        ...json,
        hasFile,
        hasPurchased: purchasedEbookIds.includes(b.id),
        payment: purchaseMap[b.id] || null,
      };
    });

    res.json({
      success: true,
      data,
      hasPlan,
      purchasedCount: purchasedEbookIds.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Check if user already purchased this ebook ────────────────────
exports.hasPurchased = async (req, res) => {
  try {
    const purchase = await Payment.findOne({
      where: {
        userId: req.user.id,
        ebookId: req.params.id,
        status: { [Op.in]: ['captured', 'success'] },
      },
    });
    res.json({ success: true, hasPurchased: !!purchase, payment: purchase || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Create Razorpay order for ebook one-time purchase ─────────────
exports.buyEbook = async (req, res) => {
  try {
    const ebook = await EBook.findByPk(req.params.id);
    if (!ebook || !ebook.isActive) return res.status(404).json({ error: 'eBook not found' });
    if (ebook.isFree || ebook.accessType === 'free')
      return res.status(400).json({ error: 'This eBook is free. No purchase needed.' });

    const existing = await Payment.findOne({
      where: {
        userId: req.user.id,
        ebookId: ebook.id,
        status: { [Op.in]: ['captured', 'success'] },
      },
    });
    if (existing) return res.status(400).json({ error: 'You already own this eBook.' });

    const amount = parseFloat(ebook.price) || 0;
    if (amount <= 0) return res.status(400).json({ error: 'Invalid ebook price.' });

    const payment = await Payment.create({
      userId: req.user.id,
      ebookId: ebook.id,
      amount,
      type: 'one_time',
      status: 'pending',
      description: `eBook: ${ebook.title}`,
    });

    const rzp = getRazorpay();
    const order = await rzp.orders.create({
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: payment.id,
    });
    await payment.update({ razorpayOrderId: order.id });

    res.json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        paymentId: payment.id,
        key: process.env.RAZORPAY_KEY_ID,
        ebook: {
          id: ebook.id,
          title: ebook.title,
          price: ebook.price,
          mrp: ebook.mrp,
          coverImage: ebook.coverImage,
          slug: ebook.slug,
          author: ebook.author,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Verify Razorpay payment + grant lifetime ebook access ─────────
exports.verifyEbookPurchase = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentId } = req.body;

    const payment = await Payment.findOne({ where: { id: paymentId, userId: req.user.id } });
    if (!payment) return res.status(404).json({ error: 'Payment record not found.' });

    if (razorpay_signature) {
      const expected = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(razorpay_order_id + '|' + razorpay_payment_id)
        .digest('hex');
      if (expected !== razorpay_signature) {
        await payment.update({ status: 'failed' });
        return res.status(400).json({ error: 'Invalid payment signature.' });
      }
    }

    await payment.update({
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      status: 'captured',
    });

    const ebook = await EBook.findByPk(payment.ebookId);
    if (ebook) {
      await ebook.increment('totalSales');
      const { Notification } = require('../models');
      await Notification.create({
        userId: req.user.id,
        title: 'eBook Purchase Successful!',
        message: `You now have lifetime access to "${ebook.title}". Download it anytime from My eBooks.`,
        type: 'payment_success',
      });
    }

    res.json({
      success: true,
      data: {
        payment,
        ebook: ebook
          ? { id: ebook.id, title: ebook.title, slug: ebook.slug, coverImage: ebook.coverImage, author: ebook.author }
          : null,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
