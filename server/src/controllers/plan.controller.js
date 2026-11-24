const { Plan, Coupon } = require('../models');
const Razorpay = require('razorpay');
const { Op } = require('sequelize');

// Helper to get razorpay instance dynamically
const getRazorpay = () => {
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    return new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return null;
};

// ─── Get All Plans ──────────────────────────────────────────────
exports.getAllPlans = async (req, res) => {
  try {
    const { type } = req.query; // 'institute' or 'student'
    const whereClause = {};
    if (type) whereClause.type = type;

    const plans = await Plan.findAll({
      where: whereClause,
      order: [['price', 'ASC']],
    });

    res.json({ success: true, data: plans });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Create Plan ────────────────────────────────────────────────
exports.createPlan = async (req, res) => {
  try {
    const { name, type, price, interval, features, isActive, maxStudents, maxBatches, highlight, trialEnabled, trialDays, modules } = req.body;
    
    // Validate required fields
    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required' });
    }

    // Create Razorpay Plan automatically if possible
    let razorpayPlanId = null;
    const rzp = getRazorpay();
    if (rzp && price > 0 && ['monthly', 'yearly'].includes(interval)) {
      try {
        const rzpPlan = await rzp.plans.create({
          period: interval === 'yearly' ? 'yearly' : 'monthly',
          interval: 1, // e.g., every 1 month or 1 year
          item: {
            name: `${type === 'institute' ? 'Institute' : 'Student'} - ${name}`,
            amount: Math.round(price * 100), // convert to paise
            currency: 'INR',
            description: `LMS Subscription for ${name}`,
          }
        });
        razorpayPlanId = rzpPlan.id;
      } catch (err) {
        console.error("Razorpay Plan Creation Failed:", err);
      }
    }

    const plan = await Plan.create({
      name,
      type,
      price: price || 0,
      interval: interval || 'monthly',
      features: features || [],
      isActive: isActive !== undefined ? isActive : true,
      maxStudents: type === 'institute' ? maxStudents : null,
      maxBatches: type === 'institute' ? maxBatches : null,
      highlight: highlight || false,
      razorpayPlanId: razorpayPlanId,
      trialEnabled: trialEnabled || false,
      trialDays: trialEnabled ? (trialDays || 7) : null,
      modules: modules || {},
    });

    res.status(201).json({ success: true, data: plan });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Update Plan ────────────────────────────────────────────────
exports.updatePlan = async (req, res) => {
  try {
    const plan = await Plan.findByPk(req.params.id);
    if (!plan) return res.status(404).json({ error: 'Plan not found' });

    const { name, price, interval, features, isActive, maxStudents, maxBatches, highlight, trialEnabled, trialDays, modules } = req.body;

    await plan.update({
      name: name || plan.name,
      price: price !== undefined ? price : plan.price,
      interval: interval || plan.interval,
      features: features || plan.features,
      isActive: isActive !== undefined ? isActive : plan.isActive,
      maxStudents: plan.type === 'institute' && maxStudents !== undefined ? maxStudents : plan.maxStudents,
      maxBatches: plan.type === 'institute' && maxBatches !== undefined ? maxBatches : plan.maxBatches,
      highlight: highlight !== undefined ? highlight : plan.highlight,
      trialEnabled: trialEnabled !== undefined ? trialEnabled : plan.trialEnabled,
      trialDays: trialEnabled !== undefined
        ? (trialEnabled ? (trialDays || plan.trialDays || 7) : null)
        : plan.trialDays,
      modules: modules !== undefined ? modules : plan.modules,
    });

    res.json({ success: true, data: plan });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Delete Plan ────────────────────────────────────────────────
exports.deletePlan = async (req, res) => {
  try {
    const plan = await Plan.findByPk(req.params.id);
    if (!plan) return res.status(404).json({ error: 'Plan not found' });

    await plan.destroy();
    res.json({ success: true, message: 'Plan deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Coupon Management ──────────────────────────────────────────

exports.getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.findAll({ order: [['createdAt', 'DESC']] });
    res.json({ success: true, data: coupons });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createCoupon = async (req, res) => {
  try {
    const { code, discountType, discountValue, isActive, maxUses, validFrom, validUntil, applicablePlans } = req.body;
    if (!code || !discountType || discountValue === undefined) {
      return res.status(400).json({ error: 'Code, discountType, and discountValue are required' });
    }
    const coupon = await Coupon.create({
      code: code.toUpperCase(), discountType, discountValue, isActive, maxUses, validFrom, validUntil, applicablePlans
    });
    res.status(201).json({ success: true, data: coupon });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByPk(req.params.id);
    if (!coupon) return res.status(404).json({ error: 'Coupon not found' });
    const { code, discountType, discountValue, isActive, maxUses, validFrom, validUntil, applicablePlans } = req.body;
    await coupon.update({
      code: code ? code.toUpperCase() : coupon.code,
      discountType: discountType || coupon.discountType,
      discountValue: discountValue !== undefined ? discountValue : coupon.discountValue,
      isActive: isActive !== undefined ? isActive : coupon.isActive,
      maxUses: maxUses !== undefined ? maxUses : coupon.maxUses,
      validFrom: validFrom !== undefined ? validFrom : coupon.validFrom,
      validUntil: validUntil !== undefined ? validUntil : coupon.validUntil,
      applicablePlans: applicablePlans || coupon.applicablePlans,
    });
    res.json({ success: true, data: coupon });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByPk(req.params.id);
    if (!coupon) return res.status(404).json({ error: 'Coupon not found' });
    await coupon.destroy();
    res.json({ success: true, message: 'Coupon deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.validateCoupon = async (req, res) => {
  try {
    const { code, planId } = req.body;
    if (!code) return res.status(400).json({ error: 'Coupon code is required' });

    const coupon = await Coupon.findOne({ where: { code: code.toUpperCase() } });
    if (!coupon) return res.status(404).json({ error: 'Invalid coupon code' });

    if (!coupon.isActive) return res.status(400).json({ error: 'Coupon is no longer active' });

    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return res.status(400).json({ error: 'Coupon usage limit reached' });
    }

    const now = new Date();
    if (coupon.validFrom && new Date(coupon.validFrom) > now) {
      return res.status(400).json({ error: 'Coupon is not yet valid' });
    }
    if (coupon.validUntil && new Date(coupon.validUntil) < now) {
      return res.status(400).json({ error: 'Coupon has expired' });
    }

    if (planId && coupon.applicablePlans && coupon.applicablePlans.length > 0) {
      if (!coupon.applicablePlans.includes(planId)) {
        return res.status(400).json({ error: 'Coupon is not applicable for this plan' });
      }
    }

    res.json({ success: true, data: coupon });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
