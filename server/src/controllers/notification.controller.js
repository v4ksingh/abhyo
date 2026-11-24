const { Notification } = require('../models');

exports.getNotifications = async (req, res) => {
  try {
    let notifications = await Notification.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 50,
    });
    if (req.user?.isOlympiadUser) {
      notifications = notifications.filter(n => {
        const text = `${n.title || ''} ${n.message || ''}`.toLowerCase();
        return !text.includes('free trial') && !text.includes('trial activated');
      });
    }
    const unreadCount = notifications.filter(n => !n.isRead).length;
    res.json({ success: true, data: notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.markRead = async (req, res) => {
  try {
    await Notification.update({ isRead: true }, { where: { id: req.params.id, userId: req.user.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.markAllRead = async (req, res) => {
  try {
    await Notification.update({ isRead: true }, { where: { userId: req.user.id, isRead: false } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
