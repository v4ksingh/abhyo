const { VideoSeries, SeriesVideo } = require('../models');
const { Op } = require('sequelize');

// slug helper
const toSlug = (str) => str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// GET /video-series (public list)
exports.listSeries = async (req, res) => {
  try {
    const { category, featured } = req.query;
    const where = { isActive: true };
    if (category) where.category = category;
    if (featured === 'true') where.isFeatured = true;

    const series = await VideoSeries.findAll({
      where,
      order: [['isFeatured', 'DESC'], ['createdAt', 'DESC']],
    });
    res.json({ success: true, data: series });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /video-series/:slug (public detail)
exports.getSeriesBySlug = async (req, res) => {
  try {
    const series = await VideoSeries.findOne({
      where: { slug: req.params.slug, isActive: true },
    });
    if (!series) return res.status(404).json({ error: 'Video series not found' });

    // Get videos in this series
    const videos = await SeriesVideo.findAll({
      where: { videoSeriesId: series.id },
      order: [['order', 'ASC'], ['createdAt', 'ASC']],
    });

    res.json({ success: true, data: { ...series.toJSON(), videos } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /admin/video-series (admin list all)
exports.adminListSeries = async (req, res) => {
  try {
    const series = await VideoSeries.findAll({
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, data: series });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /admin/video-series (create)
exports.createSeries = async (req, res) => {
  try {
    const {
      title, description, category, instructor,
      thumbnail, banner, isFree, price, isActive, isFeatured,
    } = req.body;

    if (!title) return res.status(400).json({ error: 'Title is required' });

    const slug = toSlug(`${title}-${Date.now()}`);
    const series = await VideoSeries.create({
      title, slug, description, category, instructor,
      thumbnail, banner,
      isFree: isFree !== false,
      price: price || 0,
      isActive: isActive !== false,
      isFeatured: !!isFeatured,
      createdBy: req.user?.id,
    });

    res.status(201).json({ success: true, data: series });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /admin/video-series/:id (update)
exports.updateSeries = async (req, res) => {
  try {
    const series = await VideoSeries.findByPk(req.params.id);
    if (!series) return res.status(404).json({ error: 'Not found' });

    const allowed = [
      'title','description','category','instructor',
      'thumbnail','banner','isFree','price','isActive','isFeatured',
    ];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    if (updates.title && updates.title !== series.title) {
      updates.slug = toSlug(`${updates.title}-${Date.now()}`);
    }

    await series.update(updates);
    
    // Update count
    const count = await SeriesVideo.count({ where: { videoSeriesId: series.id } });
    await series.update({ totalVideos: count });

    res.json({ success: true, data: series });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /admin/video-series/:id
exports.deleteSeries = async (req, res) => {
  try {
    const series = await VideoSeries.findByPk(req.params.id);
    if (!series) return res.status(404).json({ error: 'Not found' });

    await series.destroy();
    res.json({ success: true, message: 'Series deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /admin/video-series/:id/videos
exports.getSeriesVideos = async (req, res) => {
  try {
    const videos = await SeriesVideo.findAll({
      where: { videoSeriesId: req.params.id },
      order: [['order', 'ASC'], ['createdAt', 'ASC']],
    });
    res.json({ success: true, data: videos });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /admin/video-series/:id/videos
exports.addVideo = async (req, res) => {
  try {
    const series = await VideoSeries.findByPk(req.params.id);
    if (!series) return res.status(404).json({ error: 'Series not found' });

    const { title, description, videoUrl, videoType, duration, order, isFree } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });

    const video = await SeriesVideo.create({
      title, description, videoUrl, videoType, duration, order, isFree: !!isFree,
      videoSeriesId: series.id
    });

    const count = await SeriesVideo.count({ where: { videoSeriesId: series.id } });
    await series.update({ totalVideos: count });

    res.status(201).json({ success: true, data: video });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /admin/video-series/:id/videos/:videoId
exports.updateVideo = async (req, res) => {
  try {
    const video = await SeriesVideo.findOne({ 
      where: { id: req.params.videoId, videoSeriesId: req.params.id }
    });
    if (!video) return res.status(404).json({ error: 'Video not found' });

    const allowed = ['title','description','videoUrl','videoType','duration','order','isFree'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    await video.update(updates);
    res.json({ success: true, data: video });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /admin/video-series/:id/videos/:videoId
exports.deleteVideo = async (req, res) => {
  try {
    const video = await SeriesVideo.findOne({ 
      where: { id: req.params.videoId, videoSeriesId: req.params.id }
    });
    if (!video) return res.status(404).json({ error: 'Video not found' });

    await video.destroy();
    
    // Update count
    const series = await VideoSeries.findByPk(req.params.id);
    if (series) {
      const count = await SeriesVideo.count({ where: { videoSeriesId: series.id } });
      await series.update({ totalVideos: count });
    }

    res.json({ success: true, message: 'Video removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
