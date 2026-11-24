const express = require('express');
const router = express.Router();
const auth = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authLimiter, otpLimiter } = require('../middlewares/rateLimiter.middleware');
const upload = require('../middlewares/upload.middleware');

router.post('/register', authLimiter, auth.register);
router.post('/login', authLimiter, auth.login);
router.post('/admin-login', authLimiter, auth.adminLogin);
router.post('/send-otp', otpLimiter, auth.sendOTP);
router.post('/verify-otp', auth.verifyOTP);
router.post('/refresh-token', auth.refreshToken);
router.post('/forgot-password', auth.forgotPassword);
router.get('/verify-reset-token', authLimiter, auth.verifyResetToken);
router.post('/reset-password', authLimiter, auth.resetPassword);
router.get('/me', protect, auth.getMe);
router.put('/update-profile', protect, upload.single('avatar'), auth.updateProfile);
router.put('/change-password', protect, auth.changePassword);

module.exports = router;
