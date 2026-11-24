const { Op } = require('sequelize');
const { Review, User, Course, Institute } = require('../models');

// ─── GET /api/reviews/course/:courseId ──────────────────────────────────────
// Public: fetch all approved reviews for a course with stats
exports.getCourseReviews = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { sort = 'recent', rating, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = { courseId, isHidden: false, isApproved: true };
    if (rating) where.rating = parseInt(rating);

    let order = [['createdAt', 'DESC']];
    if (sort === 'helpful') order = [['helpfulCount', 'DESC'], ['createdAt', 'DESC']];
    if (sort === 'highest') order = [['rating', 'DESC'], ['createdAt', 'DESC']];
    if (sort === 'lowest')  order = [['rating', 'ASC'],  ['createdAt', 'DESC']];

    const { count, rows } = await Review.findAndCountAll({
      where,
      include: [
        { model: User, as: 'reviewer', attributes: ['id', 'name', 'avatar'] },
        { model: User, as: 'repliedBy', attributes: ['id', 'name', 'avatar'] },
      ],
      order,
      limit: parseInt(limit),
      offset,
      distinct: true,
    });

    // Compute rating distribution
    const allForStats = await Review.findAll({
      where: { courseId, isHidden: false, isApproved: true },
      attributes: ['rating']
    });

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let totalRating = 0;
    allForStats.forEach(r => {
      distribution[r.rating] = (distribution[r.rating] || 0) + 1;
      totalRating += r.rating;
    });
    const totalCount = allForStats.length;
    const avgRating = totalCount > 0 ? (totalRating / totalCount).toFixed(1) : '0.0';

    res.json({
      success: true,
      data: rows,
      stats: {
        avgRating: parseFloat(avgRating),
        totalCount,
        distribution,
      },
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── GET /api/reviews/course/:courseId/my ───────────────────────────────────
// Auth: get the current user's review for a specific course
exports.getMyReview = async (req, res) => {
  try {
    const { courseId } = req.params;
    const review = await Review.findOne({
      where: { courseId, userId: req.user.id }
    });
    res.json({ success: true, data: review });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── POST /api/reviews/course/:courseId ─────────────────────────────────────
// Auth (student): submit or update a review
exports.submitReview = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { rating, title, body } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Verify course exists
    const course = await Course.findByPk(courseId, { attributes: ['id', 'instituteId'] });
    if (!course) return res.status(404).json({ error: 'Course not found' });

    const [review, created] = await Review.upsert({
      courseId,
      userId: req.user.id,
      instituteId: course.instituteId,
      rating: parseInt(rating),
      title: title?.trim() || null,
      body: body?.trim() || null,
      helpfulVoters: [],  // reset helpful votes on edit
      helpfulCount: 0,
      reply: null,        // reset reply on edit
      repliedAt: null,
      repliedById: null,
    }, { returning: true });

    const result = await Review.findByPk(review.id || review.dataValues?.id, {
      include: [{ model: User, as: 'reviewer', attributes: ['id', 'name', 'avatar'] }]
    });

    res.status(created ? 201 : 200).json({
      success: true,
      message: created ? 'Review submitted successfully!' : 'Review updated successfully!',
      data: result
    });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'You have already reviewed this course.' });
    }
    res.status(500).json({ error: err.message });
  }
};

// ─── DELETE /api/reviews/:id ─────────────────────────────────────────────────
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!review) return res.status(404).json({ error: 'Review not found or not yours' });
    await review.destroy();
    res.json({ success: true, message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── POST /api/reviews/:id/helpful ───────────────────────────────────────────
// Auth: toggle "helpful" vote on a review
exports.toggleHelpful = async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id);
    if (!review) return res.status(404).json({ error: 'Review not found' });

    const voters = review.helpfulVoters || [];
    const uid = req.user.id;
    let alreadyVoted = voters.includes(uid);

    let newVoters, newCount;
    if (alreadyVoted) {
      newVoters = voters.filter(v => v !== uid);
      newCount = Math.max(0, review.helpfulCount - 1);
    } else {
      newVoters = [...voters, uid];
      newCount = review.helpfulCount + 1;
    }

    await review.update({ helpfulVoters: newVoters, helpfulCount: newCount });
    res.json({ success: true, marked: !alreadyVoted, helpfulCount: newCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── POST /api/reviews/:id/reply ─────────────────────────────────────────────
// Auth (institute admin / instructor): reply to a review
exports.replyToReview = async (req, res) => {
  try {
    const { reply } = req.body;
    if (!reply?.trim()) return res.status(400).json({ error: 'Reply cannot be empty' });

    const review = await Review.findByPk(req.params.id, {
      include: [{ model: Course, as: 'course', attributes: ['id', 'instituteId'] }]
    });
    if (!review) return res.status(404).json({ error: 'Review not found' });

    // Only allow institute owner or admin
    const roles = ['institute', 'admin', 'instructor'];
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Not authorized to reply' });
    }

    await review.update({
      reply: reply.trim(),
      repliedAt: new Date(),
      repliedById: req.user.id
    });

    res.json({ success: true, message: 'Reply posted', data: review });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── PATCH /api/reviews/:id/moderate ─────────────────────────────────────────
// Auth (institute / admin): hide or approve a review
exports.moderateReview = async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id);
    if (!review) return res.status(404).json({ error: 'Review not found' });

    const { isHidden, isApproved } = req.body;
    await review.update({
      ...(isHidden !== undefined && { isHidden }),
      ...(isApproved !== undefined && { isApproved }),
    });
    res.json({ success: true, message: 'Review moderated', data: review });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── GET /api/reviews/institute/:instituteId ──────────────────────────────────
// Auth (institute): get all reviews for their institute's courses
exports.getInstituteReviews = async (req, res) => {
  try {
    const { instituteId } = req.params;
    const { page = 1, limit = 20, filter = 'all' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = { instituteId };
    if (filter === 'pending')    where.isApproved = false;
    if (filter === 'hidden')     where.isHidden = true;
    if (filter === 'unanswered') where.reply = null;

    const { count, rows } = await Review.findAndCountAll({
      where,
      include: [
        { model: User, as: 'reviewer', attributes: ['id', 'name', 'avatar'] },
        { model: Course, as: 'course', attributes: ['id', 'title', 'slug', 'thumbnail'] },
        { model: User, as: 'repliedBy', attributes: ['id', 'name'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset,
      distinct: true,
    });

    res.json({
      success: true,
      data: rows,
      pagination: { total: count, page: parseInt(page), limit: parseInt(limit) }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── GET /api/institute/reviews ────────────────────────────────────────────────
// Auth (institute owner): secure route using ownerId, not URL param
exports.getMyInstituteReviews = async (req, res) => {
  try {
    const { page = 1, limit = 15, filter = 'all', sort = 'recent', rating } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const institute = await Institute.findOne({ where: { ownerId: req.user.id } });
    if (!institute) return res.status(404).json({ error: 'Institute not found' });

    const where = { instituteId: institute.id };
    if (filter === 'hidden')     where.isHidden = true;
    if (filter === 'unanswered') { where.reply = null; where.isHidden = false; }
    if (filter === 'visible')    where.isHidden = false;
    if (rating)                  where.rating = parseInt(rating);

    let order = [['createdAt', 'DESC']];
    if (sort === 'highest')  order = [['rating', 'DESC'], ['createdAt', 'DESC']];
    if (sort === 'lowest')   order = [['rating', 'ASC'],  ['createdAt', 'DESC']];
    if (sort === 'helpful')  order = [['helpfulCount', 'DESC'], ['createdAt', 'DESC']];

    const { count, rows } = await Review.findAndCountAll({
      where,
      include: [
        { model: User,   as: 'reviewer',  attributes: ['id', 'name', 'avatar'] },
        { model: Course, as: 'course',    attributes: ['id', 'title', 'slug', 'thumbnail'] },
        { model: User,   as: 'repliedBy', attributes: ['id', 'name'] },
      ],
      order,
      limit: parseInt(limit),
      offset,
      distinct: true,
    });

    res.json({
      success: true,
      data: rows,
      pagination: { total: count, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(count / parseInt(limit)) }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── GET /api/institute/reviews/stats ─────────────────────────────────────────
// Auth (institute owner): full summary stats from all reviews
exports.getInstituteReviewStats = async (req, res) => {
  try {
    const institute = await Institute.findOne({ where: { ownerId: req.user.id } });
    if (!institute) return res.status(404).json({ error: 'Institute not found' });

    const all = await Review.findAll({
      where: { instituteId: institute.id },
      attributes: ['rating', 'reply', 'isHidden', 'helpfulCount'],
    });

    const total = all.length;
    const avgRating = total > 0
      ? parseFloat((all.reduce((s, r) => s + r.rating, 0) / total).toFixed(1))
      : 0;
    const needsReply = all.filter(r => !r.reply && !r.isHidden).length;
    const hidden = all.filter(r => r.isHidden).length;
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    all.forEach(r => { distribution[r.rating] = (distribution[r.rating] || 0) + 1; });

    res.json({ success: true, data: { total, avgRating, needsReply, hidden, distribution } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

