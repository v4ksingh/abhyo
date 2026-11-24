const express = require('express');
const router = express.Router();
const planController = require('../controllers/plan.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

// Public route to get active plans (used by students and institutes to see pricing)
router.get('/public', async (req, res) => {
  try {
    const { Plan } = require('../models');
    const { type } = req.query;
    const whereClause = { isActive: true };
    if (type) whereClause.type = type;

    const plans = await Plan.findAll({
      where: whereClause,
      order: [['price', 'ASC']],
    });
    res.json({ success: true, data: plans });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Public route to validate a coupon
router.post('/public/validate-coupon', planController.validateCoupon);

// Admin ONLY routes
router.use(protect, authorize('superadmin'));

// Coupon routes (must be before /:id routes to avoid matching "coupons" as an id)
router.get('/coupons', planController.getAllCoupons);
router.post('/coupons', planController.createCoupon);
router.put('/coupons/:id', planController.updateCoupon);
router.delete('/coupons/:id', planController.deleteCoupon);

router.get('/', planController.getAllPlans);
router.post('/', planController.createPlan);
router.put('/:id', planController.updatePlan);
router.delete('/:id', planController.deletePlan);

module.exports = router;
