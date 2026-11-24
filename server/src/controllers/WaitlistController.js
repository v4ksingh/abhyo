const { Waitlist } = require('../models');

// Add a new email to the waitlist
exports.joinWaitlist = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const existingEntry = await Waitlist.findOne({ where: { email } });
    if (existingEntry) {
      return res.status(200).json({ success: true, message: 'You are already on the waitlist!' });
    }

    await Waitlist.create({ email });
    return res.status(201).json({ success: true, message: "You're on the list! We'll notify you soon." });

  } catch (error) {
    console.error('Waitlist error:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ success: false, message: 'Invalid email address.' });
    }
    return res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
  }
};

// Admin: Get all waitlist entries
exports.getWaitlist = async (req, res) => {
  try {
    const waitlist = await Waitlist.findAll({
      order: [['createdAt', 'DESC']]
    });
    return res.status(200).json({ success: true, waitlist });
  } catch (error) {
    console.error('Fetch waitlist error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch waitlist.' });
  }
};

// Admin: Delete a waitlist entry
exports.deleteWaitlistEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await Waitlist.findByPk(id);
    
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Entry not found.' });
    }

    await entry.destroy();
    return res.status(200).json({ success: true, message: 'Entry removed successfully.' });
  } catch (error) {
    console.error('Delete waitlist entry error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete entry.' });
  }
};
