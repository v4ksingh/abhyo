const { Page, BlogPost, ContactMessage } = require('../models');

// --- Pages ---
exports.getPages = async (req, res) => {
  try {
    const pages = await Page.findAll();
    res.json({ success: true, data: pages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPage = async (req, res) => {
  try {
    const page = await Page.findOne({ where: { slug: req.params.slug } });
    if (!page) return res.status(404).json({ error: 'Page not found' });
    res.json({ success: true, data: page });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.savePage = async (req, res) => {
  try {
    const { slug, title, content, metaDescription, isPublished } = req.body;
    let page = await Page.findOne({ where: { slug } });
    if (page) {
      page = await page.update({ title, content, metaDescription, isPublished });
    } else {
      page = await Page.create({ slug, title, content, metaDescription, isPublished });
    }
    res.json({ success: true, data: page });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- Blog Posts ---
exports.getBlogPosts = async (req, res) => {
  try {
    const where = req.user?.role === 'superadmin' ? {} : { isPublished: true };
    const posts = await BlogPost.findAll({ where, order: [['createdAt', 'DESC']] });
    res.json({ success: true, data: posts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getBlogPost = async (req, res) => {
  try {
    const post = await BlogPost.findOne({ where: { slug: req.params.slug } });
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json({ success: true, data: post });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.saveBlogPost = async (req, res) => {
  try {
    const { id, slug, title, excerpt, content, category, coverImage, readTime, isPublished } = req.body;
    let post;
    if (id) {
      post = await BlogPost.findByPk(id);
      if (!post) return res.status(404).json({ error: 'Post not found' });
      await post.update({ slug, title, excerpt, content, category, coverImage, readTime, isPublished });
    } else {
      post = await BlogPost.create({ slug, title, excerpt, content, category, coverImage, readTime, isPublished });
    }
    res.json({ success: true, data: post });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteBlogPost = async (req, res) => {
  try {
    const post = await BlogPost.findByPk(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    await post.destroy();
    res.json({ success: true, message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- Contact Messages ---
exports.submitContact = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, subject, message } = req.body;
    await ContactMessage.create({ firstName, lastName, email, phone, subject, message });
    res.json({ success: true, message: 'Message sent successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getContactMessages = async (req, res) => {
  try {
    const messages = await ContactMessage.findAll({ order: [['createdAt', 'DESC']] });
    res.json({ success: true, data: messages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateContactMessageStatus = async (req, res) => {
  try {
    const msg = await ContactMessage.findByPk(req.params.id);
    if (!msg) return res.status(404).json({ error: 'Message not found' });
    await msg.update({ status: req.body.status });
    res.json({ success: true, data: msg });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- Settings ---
exports.getSettings = async (req, res) => {
  try {
    const settings = await require('../models/SiteSettings.model').findAll();
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.saveSettings = async (req, res) => {
  try {
    const changes = req.body; // Expecting { "socialLinks": "{...}" }
    const SiteSettings = require('../models/SiteSettings.model');
    for (const [key, value] of Object.entries(changes)) {
      const setting = await SiteSettings.findOne({ where: { key } });
      if (setting) {
        await setting.update({ value });
      } else {
        await SiteSettings.create({ key, value });
      }
    }
    res.json({ success: true, message: 'Settings saved' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
