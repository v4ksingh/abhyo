const { LiveClass, Batch, User, BatchStudent } = require('../models');
const { Op } = require('sequelize');

// GET /institute/live-classes
exports.getLiveClasses = async (req, res) => {
  try {
    const { status, batchId } = req.query;
    const where = { instituteId: req.user.instituteId };
    if (status) where.status = status;
    if (batchId) where.batchId = batchId;

    const liveClasses = await LiveClass.findAll({
      where,
      include: [
        { model: Batch, as: 'batch', attributes: ['id', 'name'] },
        { model: User, as: 'host', attributes: ['name', 'email', 'avatar'] }
      ],
      order: [['scheduledAt', 'DESC']]
    });
    res.json({ success: true, data: liveClasses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /institute/live-classes
exports.createLiveClass = async (req, res) => {
  try {
    const {
      title, topic, description, batchId, scheduledAt, duration,
      meetingUrl, meetingPlatform, meetingPassword, tags, maxStudents, isRecorded
    } = req.body;

    if (!title || !scheduledAt || !meetingUrl) {
      return res.status(400).json({ error: 'Title, scheduled time, and meeting URL are required' });
    }

    const liveClass = await LiveClass.create({
      title, topic, description,
      batchId: batchId || null,
      scheduledAt, duration,
      meetingUrl, meetingPlatform, meetingPassword,
      tags: tags || null,
      maxStudents: maxStudents || null,
      isRecorded: isRecorded || false,
      status: 'scheduled',
      instituteId: req.user.instituteId,
      hostId: req.user.id
    });

    res.status(201).json({ success: true, data: liveClass });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /institute/live-classes/:id
exports.updateLiveClass = async (req, res) => {
  try {
    const { id } = req.params;
    const liveClass = await LiveClass.findOne({ where: { id, instituteId: req.user.instituteId } });
    if (!liveClass) return res.status(404).json({ error: 'Live class not found' });

    const allowed = [
      'title', 'topic', 'description', 'batchId', 'scheduledAt', 'duration',
      'meetingUrl', 'meetingPlatform', 'meetingPassword', 'status',
      'recordingUrl', 'tags', 'maxStudents', 'isRecorded', 'attendanceCount', 'notes'
    ];
    const payload = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) payload[k] = req.body[k]; });

    await liveClass.update(payload);
    res.json({ success: true, data: liveClass });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH /institute/live-classes/:id/status
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, recordingUrl, attendanceCount, notes } = req.body;
    const liveClass = await LiveClass.findOne({ where: { id, instituteId: req.user.instituteId } });
    if (!liveClass) return res.status(404).json({ error: 'Not found' });

    const update = { status };
    if (recordingUrl !== undefined) update.recordingUrl = recordingUrl;
    if (attendanceCount !== undefined) update.attendanceCount = attendanceCount;
    if (notes !== undefined) update.notes = notes;

    await liveClass.update(update);
    res.json({ success: true, data: liveClass });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /institute/live-classes/analytics
exports.getAnalytics = async (req, res) => {
  try {
    const instituteId = req.user.instituteId;
    const [total, scheduled, live, completed, cancelled] = await Promise.all([
      LiveClass.count({ where: { instituteId } }),
      LiveClass.count({ where: { instituteId, status: 'scheduled' } }),
      LiveClass.count({ where: { instituteId, status: 'live' } }),
      LiveClass.count({ where: { instituteId, status: 'completed' } }),
      LiveClass.count({ where: { instituteId, status: 'cancelled' } }),
    ]);

    // Upcoming this week
    const now = new Date();
    const weekEnd = new Date(now.getTime() + 7 * 24 * 3600 * 1000);
    const thisWeek = await LiveClass.count({
      where: { instituteId, scheduledAt: { [Op.between]: [now, weekEnd] }, status: 'scheduled' }
    });

    // Total attendance across completed classes
    const completedClasses = await LiveClass.findAll({
      where: { instituteId, status: 'completed' },
      attributes: ['attendanceCount', 'duration']
    });
    const totalAttendance = completedClasses.reduce((s, c) => s + (c.attendanceCount || 0), 0);
    const avgDuration = completedClasses.length
      ? completedClasses.reduce((s, c) => s + (c.duration || 60), 0) / completedClasses.length
      : 0;

    res.json({
      success: true,
      data: { total, scheduled, live, completed, cancelled, thisWeek, totalAttendance, avgDuration }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /institute/live-classes/:id
exports.deleteLiveClass = async (req, res) => {
  try {
    const { id } = req.params;
    const liveClass = await LiveClass.findOne({ where: { id, instituteId: req.user.instituteId } });
    if (!liveClass) return res.status(404).json({ error: 'Live class not found' });
    await liveClass.destroy();
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
