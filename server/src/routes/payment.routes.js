const express = require('express');
const router = express.Router();
const payment = require('../controllers/payment.controller');
const { protect } = require('../middlewares/auth.middleware');

router.get('/plans', payment.getPlans);
router.get('/student-plans', payment.getStudentPlans);
router.post('/create-order', protect, payment.createOrder);
router.post('/verify', protect, payment.verifyPayment);
router.post('/student-subscription', protect, payment.buyStudentSubscription);
router.post('/verify-student-subscription', protect, payment.verifyStudentSubscription);

router.post('/start-trial', protect, payment.startTrial);

module.exports = router;
