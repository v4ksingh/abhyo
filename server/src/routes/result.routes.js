const express = require('express');
const router = express.Router();
const { Result, User, Test, Institute } = require('../models');
const { protect, authorize } = require('../middlewares/auth.middleware');

// Get all results (admin)
router.get('/', protect, authorize('superadmin'), async (req, res, next) => {
  try {
    const { testId, userId, instituteId, page = 1, limit = 50 } = req.query;
    const whereClause = { status: ['completed', 'auto-submitted'] };
    if (testId) whereClause.testId = testId;
    if (userId) whereClause.userId = userId;
    if (instituteId) whereClause.instituteId = instituteId;

    const offset = (page - 1) * limit;
    const { count, rows } = await Result.findAndCountAll({
      where: whereClause,
      order: [['submittedAt', 'DESC']],
      limit: parseInt(limit),
      offset,
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'mobile', 'email'] },
        { model: Test, as: 'test', attributes: ['id', 'title', 'category'] },
        { model: Institute, as: 'institute', attributes: ['id', 'name'] },
      ]
    });

    res.json({
      success: true,
      data: rows,
      pagination: { total: count, page: parseInt(page), limit: parseInt(limit) },
    });
  } catch (err) {
    next(err);
  }
});

// Get specific result
router.get('/:id', protect, async (req, res, next) => {
  try {
    const result = await Result.findByPk(req.params.id, {
      include: [
        { model: Test, as: 'test' },
        { model: User, as: 'user', attributes: ['id', 'name'] }
      ]
    });

    if (!result) return res.status(404).json({ error: 'Result not found' });
    
    let isAllowed = false;
    if (result.userId === req.user.id || req.user.role === 'superadmin') {
      isAllowed = true;
    } else if (req.user.role === 'institute') {
      const institute = await Institute.findOne({ where: { ownerId: req.user.id } });
      if (institute) {
        // Allow if result is directly associated with institute
        if (result.instituteId === institute.id) {
          isAllowed = true;
        } else {
          // Also allow if the student who took the test belongs to this institute
          const studentUser = await User.findOne({ where: { id: result.userId, instituteId: institute.id } });
          if (studentUser) isAllowed = true;
        }
      }
    }

    if (!isAllowed) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
