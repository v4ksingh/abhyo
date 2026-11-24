const { Op } = require('sequelize');
const { EmailLog, User, BatchStudent, Course } = require('../models');
const { sendEmail } = require('../utils/email.util');

/**
 * Send an email notification (Broadcast)
 */
exports.sendBroadcastEmail = async (req, res) => {
  try {
    const { subject, body, targetGroup, courseId, batchId, specificEmails } = req.body;
    
    // Validations
    if (!subject || !body || !targetGroup) {
      return res.status(400).json({ error: 'Subject, body, and target group are required' });
    }

    let users = [];
    let whereClause = { status: 'active' };

    // Role-based logic
    const isSuperadmin = req.user.role === 'superadmin' || req.user.role === 'admin';
    const instituteId = req.user.instituteId;

    if (!isSuperadmin && !instituteId) {
       return res.status(403).json({ error: 'Not authorized to send broadcasts' });
    }

    // Filter by institute if not superadmin
    if (!isSuperadmin) {
      whereClause.instituteId = instituteId;
    }

    // Fetch Target Users
    switch (targetGroup) {
      case 'all':
        if (!isSuperadmin) whereClause.role = ['student', 'teacher', 'instructor', 'content_manager'];
        users = await User.findAll({ where: whereClause, attributes: ['id', 'email', 'name'] });
        break;
      case 'students':
        whereClause.role = 'student';
        users = await User.findAll({ where: whereClause, attributes: ['id', 'email', 'name'] });
        break;
      case 'teachers':
        whereClause.role = ['teacher', 'instructor'];
        users = await User.findAll({ where: whereClause, attributes: ['id', 'email', 'name'] });
        break;
      case 'institutes':
        if (!isSuperadmin) return res.status(403).json({ error: 'Only admins can email institutes' });
        whereClause.role = 'institute';
        users = await User.findAll({ where: whereClause, attributes: ['id', 'email', 'name'] });
        break;
      case 'course_students':
        if (!courseId) return res.status(400).json({ error: 'Course ID is required' });
        return res.status(400).json({ error: 'Course target not fully implemented yet' });
      case 'batch_students':
        if (!batchId) return res.status(400).json({ error: 'Batch ID is required' });
        const batchStudents = await BatchStudent.findAll({ where: { batchId }, include: [{ model: User, as: 'user' }] });
        users = batchStudents.map(bs => bs.user).filter(u => u && u.email);
        break;
      case 'specific':
        if (!specificEmails) return res.status(400).json({ error: 'Specific emails are required' });
        users = specificEmails.split(',').map(e => e.trim()).filter(e => e).map(email => ({ email, name: 'Specific User' }));
        break;
      default:
        return res.status(400).json({ error: 'Invalid target group' });
    }

    if (users.length === 0) {
      return res.status(400).json({ error: 'No users found for the selected target group' });
    }

    // Log the intent
    const emailLog = await EmailLog.create({
      subject,
      body,
      targetGroup,
      recipientCount: users.length,
      status: 'pending',
      senderId: req.user.id,
      instituteId: isSuperadmin ? null : instituteId,
    });

    // Send Emails (Asynchronous so we don't block response)
    const emails = users.map(u => u.email).filter(e => e);
    
    // Note: To avoid being marked as spam or hitting SMTP limits, it's best to use Bcc or send individually.
    // For simplicity, we loop and send (ideally use a queue like BullMQ in production).
    let successCount = 0;
    
    // Send asynchronously
    setTimeout(async () => {
       try {
           // Basic batch sending using BCC could work, but let's just loop for now.
           for (const email of emails) {
              await sendEmail({
                  to: email,
                  subject: subject,
                  html: body,
              });
              successCount++;
           }
           emailLog.status = 'sent';
           emailLog.recipientCount = successCount;
           await emailLog.save();
       } catch (err) {
           emailLog.status = 'failed';
           emailLog.errorMessage = err.message;
           await emailLog.save();
       }
    }, 0);

    return res.status(200).json({
      success: true,
      message: `Email broadcast initiated for ${emails.length} recipients`,
      logId: emailLog.id
    });

  } catch (error) {
    console.error('Email Broadcast Error:', error);
    res.status(500).json({ error: 'Failed to initiate broadcast' });
  }
};

/**
 * Get Email Logs
 */
exports.getEmailLogs = async (req, res) => {
  try {
    const isSuperadmin = req.user.role === 'superadmin' || req.user.role === 'admin';
    const where = {};
    if (!isSuperadmin) {
        where.instituteId = req.user.instituteId;
    }

    const logs = await EmailLog.findAll({
      where,
      include: [{ model: User, as: 'sender', attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC']],
    });

    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch email logs' });
  }
};
