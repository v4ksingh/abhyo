const express = require('express');
const router = express.Router();
const notification = require('../controllers/notification.controller');
const { protect } = require('../middlewares/auth.middleware');

router.get('/', protect, notification.getNotifications);
router.patch('/:id/read', protect, notification.markRead);
router.patch('/read-all', protect, notification.markAllRead);

module.exports = router;
