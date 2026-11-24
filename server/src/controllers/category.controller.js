const { Category } = require('../models');
const cache = require('../utils/cache.util');
const { warmCategories } = require('../utils/cacheWarmer');

// Helper to invalidate categories cache and asynchronously re-warm
const invalidateAndRewarm = () => {
  cache.delByPattern('categories:*');
  // Asynchronously re-warm without blocking HTTP response
  setImmediate(() => {
    warmCategories().catch(err => console.warn('[Category Cache Invalidate]:', err.message));
  });
};

// GET /categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await cache.wrap('categories:all', 3600, async () => {
      return Category.findAll({
        where: { parentId: null },
        include: [{ model: Category, as: 'subCategories' }],
        order: [['name', 'ASC']],
      });
    });
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /categories/public (Only active)
exports.getActiveCategories = async (req, res) => {
  try {
    const categories = await cache.wrap('categories:active', 3600, async () => {
      return Category.findAll({
        where: { isActive: true, parentId: null },
        include: [{ model: Category, as: 'subCategories', where: { isActive: true }, required: false }],
        order: [['name', 'ASC']],
      });
    });
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /categories
exports.createCategory = async (req, res) => {
  try {
    const { name, description, isActive, image, parentId } = req.body;
    const category = await Category.create({ name, description, isActive, image, parentId: parentId || null });
    invalidateAndRewarm();
    res.status(201).json({ success: true, data: category });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Category with this name already exists.' });
    }
    res.status(400).json({ error: err.message });
  }
};

// PUT /categories/:id
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, isActive, image, parentId } = req.body;
    const category = await Category.findByPk(id);
    if (!category) return res.status(404).json({ error: 'Category not found' });

    await category.update({ name, description, isActive, image, parentId: parentId || null });
    invalidateAndRewarm();
    res.json({ success: true, data: category });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Category with this name already exists.' });
    }
    res.status(400).json({ error: err.message });
  }
};

// DELETE /categories/:id
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findByPk(id);
    if (!category) return res.status(404).json({ error: 'Category not found' });

    await category.destroy();
    invalidateAndRewarm();
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
