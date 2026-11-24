const Razorpay = require('razorpay');
const crypto = require('crypto');
const { Payment, Test, Plan } = require('../models');

const getRazorpay = () => {
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    return new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  throw new Error('Razorpay keys are not configured on the server. Payments cannot be processed.');
};

// ─── Get Plans ────────────────────────────────────────
exports.getPlans = async (req, res) => {
  try {
    const plans = await Plan.findAll({ where: { type: 'institute', isActive: true }, order: [['price', 'ASC']] });
    res.json({ success: true, data: plans });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Create Payment Order ────────────────────────────────────────
exports.createOrder = async (req, res) => {
  try {
    const { amount, type, testId, plan } = req.body;

    // Record pending payment
    const payment = await Payment.create({
      userId: req.user.id,
      amount: parseFloat(amount),
      type: type || 'one_time',
      testId: testId || null,
      status: 'pending',
      description: plan ? `${plan} plan subscription` : testId ? `Test purchase` : 'Payment',
    });

    const rzp = getRazorpay();

    const order = await rzp.orders.create({
      amount: Math.round(amount * 100), // Razorpay works in paise
      currency: 'INR',
      receipt: payment.id,
    });

    await payment.update({ razorpayOrderId: order.id });

    res.json({
      success: true,
      data: { orderId: order.id, amount: order.amount, currency: order.currency, paymentId: payment.id, key: process.env.RAZORPAY_KEY_ID },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Verify Payment ────────────────────────────────────────
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentId } = req.body;

    const payment = await Payment.findOne({ where: { id: paymentId, userId: req.user.id } });
    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    const rzp = getRazorpay();
    if (rzp && razorpay_signature) {
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body).digest('hex');

      if (expectedSignature !== razorpay_signature) {
        await payment.update({ status: 'failed' });
        return res.status(400).json({ error: 'Invalid payment signature' });
      }
    }

    await payment.update({
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      status: 'captured',
    });

    // Create notification
    const { Notification } = require('../models');
    await Notification.create({
      userId: req.user.id,
      title: 'Payment Successful! 💳',
      message: `Your payment of ₹${payment.amount} was successful.`,
      type: 'payment_success',
    });

    // Send payment receipt email asynchronously
    if (req.user?.email) {
      try {
        const { sendEmail, emailTemplates } = require('../utils/email.util');
        sendEmail({
          to: req.user.email,
          subject: `Payment Successful! Receipt #${payment.razorpayPaymentId || payment.id.slice(0, 8)}`,
          html: emailTemplates.paymentReceiptEmail({
            name: req.user.name || 'Valued User',
            itemTitle: payment.description || 'Abhyo Platform Payment',
            amount: payment.amount,
            paymentId: payment.razorpayPaymentId || payment.id,
            orderId: payment.razorpayOrderId,
            date: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
          }),
        }).catch(e => console.error('[Payment Receipt Email Failed non-fatal]:', e.message));
      } catch (mailErr) {
        console.error('[Payment Receipt Email Init non-fatal]:', mailErr.message);
      }
    }

    res.json({ success: true, data: payment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// ─── Get Student Plans ────────────────────────────────────────
exports.getStudentPlans = async (req, res) => {
  try {
    const plans = await Plan.findAll({ where: { type: 'student', isActive: true }, order: [['price', 'ASC']] });
    res.json({ success: true, data: plans });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.buyStudentSubscription = async (req, res) => {
  try {
    const { planId, couponCode } = req.body;
    const { Coupon } = require('../models');
    const plan = await Plan.findByPk(planId);
    if (!plan || plan.type !== 'student') return res.status(400).json({ error: 'Invalid plan' });

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

    const payment = await Payment.create({
      userId: req.user.id,
      amount: finalPrice,
      type: 'one_time',
      status: 'pending',
      description: `Student ${plan.name} Subscription`,
      couponCode: couponCode ? couponCode.toUpperCase() : null,
    });

    const rzp = getRazorpay();

    const order = await rzp.orders.create({
      amount: Math.round(finalPrice * 100),
      currency: 'INR',
      receipt: payment.id,
    });
    await payment.update({ razorpayOrderId: order.id });

    res.json({ success: true, data: { orderId: order.id, amount: order.amount, currency: order.currency, paymentId: payment.id, key: process.env.RAZORPAY_KEY_ID, planId } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Verify Student Subscription Payment ─────────────────────
exports.verifyStudentSubscription = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentId, planId } = req.body;
    const plan = await Plan.findByPk(planId);
    if (!plan || plan.type !== 'student') return res.status(400).json({ error: 'Invalid plan' });

    const payment = await Payment.findOne({ where: { id: paymentId, userId: req.user.id } });
    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    const rzp = getRazorpay();
    if (rzp && razorpay_signature) {
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body).digest('hex');
      if (expectedSignature !== razorpay_signature) {
        await payment.update({ status: 'failed' });
        return res.status(400).json({ error: 'Invalid payment signature' });
      }
    }

    await payment.update({
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      status: 'captured',
    });

    if (payment.couponCode) {
      const { Coupon } = require('../models');
      await Coupon.increment('usedCount', { where: { code: payment.couponCode } });
    }

    await activateStudentSubscription(req.user.id, planId, plan);
    res.json({ success: true, message: `${plan.name} subscription activated!` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Start Free Trial ─────────────────────────────────────────
exports.startTrial = async (req, res) => {
  try {
    const { planId } = req.body;
    const { User, Institute, Notification } = require('../models');

    const plan = await Plan.findByPk(planId);
    if (!plan) return res.status(400).json({ error: 'Invalid plan' });
    if (!plan.trialEnabled || !plan.trialDays) return res.status(400).json({ error: 'This plan does not have a free trial' });

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.trialDays);

    if (plan.type === 'student') {
      const user = await User.findByPk(req.user.id);
      if (!user) return res.status(404).json({ error: 'User not found' });

      // Prevent double-trial
      const hasHadTrial = user.studentSubscriptionStatus === 'trial' ||
        (user.studentSubscriptionStatus === 'active') ||
        (user.studentSubscriptionEndDate && new Date(user.studentSubscriptionEndDate) > new Date());

      if (hasHadTrial) return res.status(400).json({ error: 'You have already used a trial or have an active subscription.' });

      await User.update({
        studentSubscriptionPlan: planId,
        studentSubscriptionStatus: 'trial',
        studentSubscriptionEndDate: endDate,
      }, { where: { id: user.id } });

      await Notification.create({
        userId: user.id,
        title: `🎁 ${plan.trialDays}-Day Free Trial Activated!`,
        message: `Your free trial of "${plan.name}" is active until ${endDate.toLocaleDateString('en-IN')}. Enjoy full premium access!`,
        type: 'payment_success',
      });

    } else if (plan.type === 'institute') {
      const user = await User.findByPk(req.user.id);
      if (!user || user.role !== 'institute' || !user.instituteId) {
        return res.status(403).json({ error: 'Only institute owners can activate an institute trial' });
      }

      const institute = await Institute.findByPk(user.instituteId);
      if (!institute) return res.status(404).json({ error: 'Institute not found' });

      // Prevent double-trial
      const hasHadTrial = institute.subscriptionStatus === 'trial' ||
        (institute.subscriptionStatus === 'active' && institute.subscriptionPlan !== 'free') ||
        (institute.subscriptionEndDate && new Date(institute.subscriptionEndDate) > new Date());

      if (hasHadTrial) return res.status(400).json({ error: 'Your institute has already used a trial or has an active subscription.' });

      const parsedPlanName = plan.name.toLowerCase().replace(/[^a-z]/g, '');

      await Institute.update({
        subscriptionPlan: ['free', 'basic', 'pro', 'enterprise'].includes(parsedPlanName) ? parsedPlanName : 'pro',
        subscriptionStatus: 'trial',
        subscriptionEndDate: endDate,
      }, { where: { id: institute.id } });

      await Notification.create({
        userId: user.id,
        title: `🎁 ${plan.trialDays}-Day Institute Trial Activated!`,
        message: `Your free trial of "${plan.name}" for your institute is active until ${endDate.toLocaleDateString('en-IN')}.`,
        type: 'payment_success',
      });
    } else {
      return res.status(400).json({ error: 'Invalid plan type' });
    }

    res.json({ success: true, message: `${plan.trialDays}-day free trial activated!`, trialEndDate: endDate });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

async function activateStudentSubscription(userId, planId, plan) {
  const { User, Notification } = require('../models');
  let durationDays = 30;
  if (plan.interval === 'yearly') durationDays = 365;
  if (plan.interval === 'lifetime') durationDays = 3650; // 10 years

  const endDate = new Date();
  endDate.setDate(endDate.getDate() + durationDays);
  await User.update({
    studentSubscriptionPlan: planId,
    studentSubscriptionStatus: 'active',   // always upgrades trial → active
    studentSubscriptionEndDate: endDate,
  }, { where: { id: userId } });
  await Notification.create({
    userId,
    title: '🎉 Subscription Activated!',
    message: `Your ${plan.name} plan is active until ${endDate.toLocaleDateString('en-IN')}.`,
    type: 'payment_success',
  });
}

