/**
 * Olympiad Study Material Controller
 * Admin: CRUD   |   Student/Public: List & View
 */
const {
  OlympiadStudyMaterial, OlympiadSubject, OlympiadChapter, User,
} = require('../models');
const { Op } = require('sequelize');

const INCLUDE_FULL = [
  { model: OlympiadSubject, as: 'subject', attributes: ['id', 'name', 'color'] },
  { model: OlympiadChapter, as: 'chapter', attributes: ['id', 'name'], required: false },
];

// ─── Admin ──────────────────────────────────────────────────────

exports.listMaterials = async (req, res) => {
  try {
    const { subjectId, classLevel, type, search } = req.query;
    const where = {};
    if (subjectId)   where.subjectId  = subjectId;
    if (classLevel)  where.classLevel = classLevel;
    if (type)        where.type       = type;
    if (search)      where.title      = { [Op.like]: `%${search}%` };

    const materials = await OlympiadStudyMaterial.findAll({
      where,
      include: INCLUDE_FULL,
      order: [['subjectId', 'ASC'], ['classLevel', 'ASC'], ['orderIndex', 'ASC']],
    });
    res.json({ success: true, data: materials });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.createMaterial = async (req, res) => {
  try {
    const { title, description, type, fileUrl, videoUrl, externalUrl, classLevel, subjectId, chapterId, orderIndex, isActive, isFree } = req.body;
    if (!title || !subjectId || !type) return res.status(400).json({ error: 'title, subjectId and type are required' });

    const material = await OlympiadStudyMaterial.create({
      title, description, type,
      fileUrl: fileUrl || null,
      videoUrl: videoUrl || null,
      externalUrl: externalUrl || null,
      classLevel: classLevel ? parseInt(classLevel) : null,
      subjectId, chapterId: chapterId || null,
      orderIndex: orderIndex || 0,
      isActive: isActive !== false,
      isFree: isFree !== false,
      createdBy: req.user.id,
    });
    const full = await OlympiadStudyMaterial.findByPk(material.id, { include: INCLUDE_FULL });
    res.status(201).json({ success: true, data: full });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updateMaterial = async (req, res) => {
  try {
    const material = await OlympiadStudyMaterial.findByPk(req.params.id);
    if (!material) return res.status(404).json({ error: 'Not found' });
    await material.update(req.body);
    const full = await OlympiadStudyMaterial.findByPk(material.id, { include: INCLUDE_FULL });
    res.json({ success: true, data: full });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.deleteMaterial = async (req, res) => {
  try {
    const material = await OlympiadStudyMaterial.findByPk(req.params.id);
    if (!material) return res.status(404).json({ error: 'Not found' });
    await material.destroy();
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ─── Student / Public ────────────────────────────────────────────

exports.listPublicMaterials = async (req, res) => {
  try {
    const { subjectId, classLevel, type } = req.query;
    const where = { isActive: true };
    if (subjectId)  where.subjectId  = subjectId;
    if (type)       where.type       = type;
    if (classLevel) {
      where[Op.or] = [
        { classLevel: parseInt(classLevel) },
        { classLevel: null }, // null = all classes
      ];
    }
    const materials = await OlympiadStudyMaterial.findAll({
      where,
      include: INCLUDE_FULL,
      order: [['subjectId', 'ASC'], ['classLevel', 'ASC'], ['orderIndex', 'ASC']],
    });
    res.json({ success: true, data: materials });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getMaterial = async (req, res) => {
  try {
    const material = await OlympiadStudyMaterial.findOne({
      where: { id: req.params.id, isActive: true },
      include: INCLUDE_FULL,
    });
    if (!material) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true, data: material });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
