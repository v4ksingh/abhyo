/**
 * Olympiad Admin Controller
 * Handles: Olympiad CRUD, Question Bank, Registrations, Results, Rankings, Analytics
 */
const { Op, fn, col, literal } = require('sequelize');
const { sequelize }  = require('../config/database');
const path = require('path');
const fs   = require('fs');
const {
  Olympiad, OlympiadSubject, OlympiadClass, OlympiadChapter, OlympiadTopic,
  OlympiadQuestion, OlympiadRegistration, OlympiadExamSession,
  OlympiadResult, OlympiadCertificate, User, Payment,
} = require('../models');
const xlsx = require('xlsx');


// ─────────────────────────── Subjects ─────────────────────────────

exports.listSubjects = async (req, res) => {
  try {
    const where = {};
    // Only return active subjects unless admin specifically requests all with ?all=true
    if (req.query.all !== 'true') {
      where.isActive = true;
    }
    const subjects = await OlympiadSubject.findAll({ where, order: [['name', 'ASC']] });
    res.json({ success: true, data: subjects });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, description, color, icon, isActive } = req.body;
    const subject = await OlympiadSubject.findByPk(id);
    if (!subject) return res.status(404).json({ error: 'Subject not found' });
    if (name) subject.name = name.trim();
    if (slug) subject.slug = slug.trim();
    if (description !== undefined) subject.description = description;
    if (color) subject.color = color;
    if (icon) subject.icon = icon;
    if (isActive !== undefined) subject.isActive = Boolean(isActive);
    await subject.save();
    res.json({ success: true, data: subject });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.createSubject = async (req, res) => {
  try {
    let { name, slug, description, color, icon } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Subject name is required' });
    if (!slug) {
      slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    const existing = await OlympiadSubject.findOne({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }
    const subject = await OlympiadSubject.create({
      name: name.trim(),
      slug,
      description: description || `${name} Olympiad for Class 6-12`,
      color: color || '#6366f1',
      icon: icon || '📘',
      isActive: true,
    });
    res.status(201).json({ success: true, data: subject });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const subject = await OlympiadSubject.findByPk(id);
    if (!subject) return res.status(404).json({ error: 'Subject not found' });

    // Check if any olympiads are currently linked to this subject
    const olympiadCount = await Olympiad.count({ where: { subjectId: id } });
    if (olympiadCount > 0) {
      return res.status(400).json({
        error: `Cannot delete "${subject.name}" because it is currently assigned to ${olympiadCount} Olympiad(s). Please reassign or delete those Olympiads first.`
      });
    }

    // Check if any chapters or questions are linked to this subject
    const questionCount = await OlympiadQuestion.count({ where: { subjectId: id } });
    if (questionCount > 0) {
      return res.status(400).json({
        error: `Cannot delete "${subject.name}" because ${questionCount} question(s) belong to it.`
      });
    }

    await OlympiadChapter.destroy({ where: { subjectId: id } });
    await OlympiadTopic.destroy({ where: { subjectId: id } });
    await subject.destroy();
    res.json({ success: true, message: `Subject "${subject.name}" deleted successfully` });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ─────────────────────────── Classes ──────────────────────────────

exports.listClasses = async (req, res) => {
  try {
    const classes = await OlympiadClass.findAll({ where: { isActive: true }, order: [['classNumber', 'ASC']] });
    res.json({ success: true, data: classes });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ─────────────────────────── Chapters ─────────────────────────────

exports.listChapters = async (req, res) => {
  try {
    const { subjectId, classId } = req.query;
    const where = {};
    if (subjectId) where.subjectId = subjectId;
    if (classId)   where.classId   = classId;
    const chapters = await OlympiadChapter.findAll({
      where,
      include: [
        { model: OlympiadSubject, as: 'subject', attributes: ['id', 'name'] },
        { model: OlympiadClass,   as: 'class',   attributes: ['id', 'classNumber', 'label'] },
      ],
      order: [['orderIndex', 'ASC'], ['name', 'ASC']],
    });
    res.json({ success: true, data: chapters });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.createChapter = async (req, res) => {
  try {
    const { name, subjectId, classId, orderIndex } = req.body;
    if (!name || !subjectId || !classId) return res.status(400).json({ error: 'name, subjectId, classId are required' });
    const chapter = await OlympiadChapter.create({ name, subjectId, classId, orderIndex: orderIndex || 0 });
    res.status(201).json({ success: true, data: chapter });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updateChapter = async (req, res) => {
  try {
    const chapter = await OlympiadChapter.findByPk(req.params.id);
    if (!chapter) return res.status(404).json({ error: 'Chapter not found' });
    await chapter.update(req.body);
    res.json({ success: true, data: chapter });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.deleteChapter = async (req, res) => {
  try {
    const chapter = await OlympiadChapter.findByPk(req.params.id);
    if (!chapter) return res.status(404).json({ error: 'Chapter not found' });
    await chapter.destroy();
    res.json({ success: true, message: 'Chapter deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ─────────────────────────── Topics ───────────────────────────────

exports.listTopics = async (req, res) => {
  try {
    const { chapterId, subjectId, classId } = req.query;
    const where = {};
    if (chapterId) where.chapterId = chapterId;
    if (subjectId) where.subjectId = subjectId;
    if (classId)   where.classId   = classId;
    const topics = await OlympiadTopic.findAll({
      where,
      include: [{ model: OlympiadChapter, as: 'chapter', attributes: ['id', 'name'] }],
      order: [['orderIndex', 'ASC'], ['name', 'ASC']],
    });
    res.json({ success: true, data: topics });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.createTopic = async (req, res) => {
  try {
    const { name, chapterId, subjectId, classId, orderIndex } = req.body;
    if (!name || !chapterId) return res.status(400).json({ error: 'name and chapterId are required' });
    const topic = await OlympiadTopic.create({ name, chapterId, subjectId, classId, orderIndex: orderIndex || 0 });
    res.status(201).json({ success: true, data: topic });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.deleteTopic = async (req, res) => {
  try {
    await OlympiadTopic.destroy({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Topic deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ─────────────────────────── Questions ────────────────────────────

exports.listQuestions = async (req, res) => {
  try {
    const { subjectId, classId, chapterId, topicId, difficulty, search, page = 1, limit = 50 } = req.query;
    const where = { isActive: true };
    if (subjectId)  where.subjectId  = subjectId;
    if (classId)    where.classId    = classId;
    if (chapterId)  where.chapterId  = chapterId;
    if (topicId)    where.topicId    = topicId;
    if (difficulty) where.difficulty = difficulty;
    if (search)     where.questionText = { [Op.like]: `%${search}%` };

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await OlympiadQuestion.findAndCountAll({
      where,
      include: [
        { model: OlympiadSubject, as: 'subject', attributes: ['id', 'name'] },
        { model: OlympiadClass,   as: 'class',   attributes: ['id', 'classNumber', 'label'] },
        { model: OlympiadChapter, as: 'chapter', attributes: ['id', 'name'] },
        { model: OlympiadTopic,   as: 'topic',   attributes: ['id', 'name'] },
      ],
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.json({ success: true, data: rows, total: count, page: parseInt(page), pages: Math.ceil(count / limit) });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.createQuestion = async (req, res) => {
  try {
    const { questionText, image, options, correctAnswer, explanation, explanationImage,
            difficulty, marks, negativeMarks, subjectId, classId, chapterId, topicId } = req.body;

    if (!questionText || !options || !correctAnswer || !subjectId || !classId) {
      return res.status(400).json({ error: 'questionText, options, correctAnswer, subjectId, classId are required' });
    }
    if (!Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ error: 'At least 2 options required' });
    }

    const q = await OlympiadQuestion.create({
      questionText, image, options, correctAnswer, explanation, explanationImage,
      difficulty: difficulty || 'medium',
      marks: marks || 1,
      negativeMarks: negativeMarks || 0,
      subjectId, classId, chapterId, topicId,
      createdBy: req.user.id,
    });
    res.status(201).json({ success: true, data: q });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updateQuestion = async (req, res) => {
  try {
    const q = await OlympiadQuestion.findByPk(req.params.id);
    if (!q) return res.status(404).json({ error: 'Question not found' });
    await q.update(req.body);
    res.json({ success: true, data: q });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.deleteQuestion = async (req, res) => {
  try {
    await OlympiadQuestion.update({ isActive: false }, { where: { id: req.params.id } });
    res.json({ success: true, message: 'Question deactivated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// Excel bulk import
exports.importQuestions = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheet    = workbook.Sheets[workbook.SheetNames[0]];
    const rows     = xlsx.utils.sheet_to_json(sheet);

    if (!rows.length) return res.status(400).json({ error: 'Empty spreadsheet' });

    const questions = [];
    const errors    = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const options = [
          { label: 'A', text: String(row['Option A'] || '').trim() },
          { label: 'B', text: String(row['Option B'] || '').trim() },
          { label: 'C', text: String(row['Option C'] || '').trim() },
          { label: 'D', text: String(row['Option D'] || '').trim() },
        ];

        questions.push({
          questionText:   String(row['Question'] || '').trim(),
          options,
          correctAnswer:  String(row['Correct Answer'] || '').trim().toUpperCase(),
          explanation:    String(row['Explanation'] || '').trim() || null,
          difficulty:     ['easy','medium','hard'].includes(String(row['Difficulty']).toLowerCase())
                            ? String(row['Difficulty']).toLowerCase() : 'medium',
          marks:          parseFloat(row['Marks']) || 1,
          negativeMarks:  parseFloat(row['Negative Marks']) || 0,
          subjectId:      req.body.subjectId,
          classId:        req.body.classId,
          chapterId:      req.body.chapterId || null,
          topicId:        req.body.topicId   || null,
          createdBy:      req.user.id,
        });
      } catch (e) {
        errors.push({ row: i + 2, error: e.message });
      }
    }

    const created = await OlympiadQuestion.bulkCreate(questions, { validate: true });
    res.json({
      success: true,
      imported: created.length,
      errors,
      message: `${created.length} questions imported successfully${errors.length ? `, ${errors.length} rows had errors` : ''}`,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ─────────────────────────── Olympiads ────────────────────────────

exports.listOlympiads = async (req, res) => {
  try {
    const { status, subjectId, page = 1, limit = 20 } = req.query;
    const where = {};
    if (status)    where.status    = status;
    if (subjectId) where.subjectId = subjectId;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await Olympiad.findAndCountAll({
      where,
      include: [{ model: OlympiadSubject, as: 'subject', attributes: ['id', 'name', 'color'] }],
      limit: parseInt(limit),
      offset,
      order: [['examDate', 'DESC']],
    });
    res.json({ success: true, data: rows, total: count, page: parseInt(page), pages: Math.ceil(count / limit) });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getOlympiad = async (req, res) => {
  try {
    const olympiad = await Olympiad.findByPk(req.params.id, {
      include: [{ model: OlympiadSubject, as: 'subject' }],
    });
    if (!olympiad) return res.status(404).json({ error: 'Olympiad not found' });
    res.json({ success: true, data: olympiad });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.createOlympiad = async (req, res) => {
  try {
    const {
      title, description, bannerImage, tagline, subjectId,
      syllabusPdfUrl,
      registrationStartDate, registrationEndDate,
      examDate, examStartTime, examDurationMinutes,
      resultDate, eligibleClasses,
      totalQuestions, marksPerQuestion, negativeMarks, passingMarks,
      registrationFee, prizeDetails,
    } = req.body;

    if (!title || !subjectId || !examDate || !registrationStartDate || !registrationEndDate) {
      return res.status(400).json({ error: 'title, subjectId, examDate, registrationStartDate, registrationEndDate are required' });
    }

    // Generate slug from title
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();

    const olympiad = await Olympiad.create({
      title, slug, description, syllabusPdfUrl, bannerImage, tagline, subjectId,
      registrationStartDate, registrationEndDate,
      examDate, examStartTime: examStartTime || '10:00', examDurationMinutes: examDurationMinutes || 60,
      resultDate, eligibleClasses: eligibleClasses || [6,7,8,9,10,11,12],
      totalQuestions: totalQuestions || 40,
      marksPerQuestion: marksPerQuestion || 1,
      negativeMarks: negativeMarks || 0,
      passingMarks: passingMarks || 0,
      registrationFee: registrationFee || 150,
      prizeDetails,
      status: req.body.status || 'draft',
      createdBy: req.user.id,
    });

    res.status(201).json({ success: true, data: olympiad });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updateOlympiad = async (req, res) => {
  try {
    const olympiad = await Olympiad.findByPk(req.params.id);
    if (!olympiad) return res.status(404).json({ error: 'Olympiad not found' });
    await olympiad.update(req.body);
    res.json({ success: true, data: olympiad });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.uploadCertificateTemplate = async (req, res) => {
  try {
    const olympiad = await Olympiad.findByPk(req.params.id);
    if (!olympiad) return res.status(404).json({ error: 'Olympiad not found' });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    // Delete old template file if present
    if (olympiad.certificateTemplate) {
      try {
        const oldFilename = olympiad.certificateTemplate.split('/uploads/certificate-templates/')[1];
        if (oldFilename) {
          const oldPath = path.join(__dirname, '../../uploads/certificate-templates', oldFilename);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
      } catch (_) { /* ignore old file deletion errors */ }
    }

    const templateUrl = `${req.protocol}://${req.get('host')}/uploads/certificate-templates/${req.file.filename}`;
    await olympiad.update({ certificateTemplate: templateUrl });

    res.json({ success: true, templateUrl, message: 'Certificate template uploaded successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.uploadSyllabusPdf = async (req, res) => {
  try {
    const olympiad = await Olympiad.findByPk(req.params.id);
    if (!olympiad) return res.status(404).json({ error: 'Olympiad not found' });
    if (!req.file) return res.status(400).json({ error: 'No PDF file uploaded' });

    // Delete old syllabus file if present
    if (olympiad.syllabusPdfUrl) {
      try {
        const oldFilename = olympiad.syllabusPdfUrl.split('/uploads/study-materials/')[1];
        if (oldFilename) {
          const oldPath = path.join(__dirname, '../../uploads/study-materials', oldFilename);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
      } catch (_) {}
    }

    // Store relative path so it resolves correctly on any host/domain
    const syllabusUrl = `/uploads/study-materials/${req.file.filename}`;
    await olympiad.update({ syllabusPdfUrl: syllabusUrl });

    res.json({ success: true, syllabusPdfUrl: syllabusUrl, message: 'Syllabus PDF uploaded successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};



exports.deleteOlympiad = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const olympiad = await Olympiad.findByPk(req.params.id, { transaction: t });
    if (!olympiad) {
      await t.rollback();
      return res.status(404).json({ error: 'Olympiad not found' });
    }

    // Clean up dependent child records within transaction so foreign key constraints succeed
    await OlympiadCertificate.destroy({ where: { olympiadId: olympiad.id }, transaction: t });
    await OlympiadResult.destroy({ where: { olympiadId: olympiad.id }, transaction: t });
    await OlympiadExamSession.destroy({ where: { olympiadId: olympiad.id }, transaction: t });
    await OlympiadRegistration.destroy({ where: { olympiadId: olympiad.id }, transaction: t });

    // Permanently remove the olympiad
    await olympiad.destroy({ transaction: t });
    await t.commit();

    res.json({ success: true, message: 'Olympiad deleted successfully' });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────── Registrations ────────────────────────

exports.listRegistrations = async (req, res) => {
  try {
    const { olympiadId, paymentStatus, verificationStatus, schoolType, page = 1, limit = 50 } = req.query;
    const where = {};
    if (olympiadId)    where.olympiadId    = olympiadId;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (verificationStatus && verificationStatus !== 'all') {
      where.verificationStatus = verificationStatus;
    }
    if (schoolType && schoolType !== 'all') {
      where.schoolType = schoolType;
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await OlympiadRegistration.findAndCountAll({
      where,
      include: [
        { model: User,     as: 'student', attributes: ['id', 'name', 'email', 'mobile', 'state', 'city'] },
        { model: Olympiad, as: 'olympiad', attributes: ['id', 'title', 'examDate'] },
      ],
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, data: rows, total: count });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.verifyRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const { verificationStatus, remarks } = req.body;

    if (!['approved', 'rejected', 'pending'].includes(verificationStatus)) {
      return res.status(400).json({ error: 'Invalid verification status' });
    }

    const registration = await OlympiadRegistration.findByPk(id, {
      include: [
        { model: User, as: 'student', attributes: ['id', 'name', 'email', 'mobile'] },
        { model: Olympiad, as: 'olympiad', attributes: ['id', 'title', 'examDate', 'subjectId', 'totalRegistrations'] },
      ],
    });

    if (!registration) return res.status(404).json({ error: 'Registration not found' });

    const isGovtSchool = (registration.schoolType || '').toLowerCase() === 'govt';
    const isApproved = verificationStatus === 'approved';

    let rollNumber = registration.rollNumber;
    const updatePayload = {
      verificationStatus,
      verificationRemarks: remarks || null,
      verifiedAt: new Date(),
      verifiedBy: req.user.id,
    };

    // If student is from a Government School and approved by Admin:
    // IT IS 100% FREE OF COST FOR THE STUDENT!
    if (isGovtSchool && isApproved) {
      updatePayload.paymentStatus = 'paid';
      updatePayload.amountPaid = 0;
      updatePayload.status = 'confirmed';
      updatePayload.admitCardGenerated = true;

      // Generate Roll Number if not already assigned
      if (!rollNumber) {
        const oly = registration.olympiad || await Olympiad.findByPk(registration.olympiadId);
        const year = new Date(oly?.examDate || Date.now()).getFullYear().toString().slice(2);
        const subjectCode = (oly?.subjectId || 'OLYM').slice(-4).toUpperCase();
        const seq = String((oly?.totalRegistrations || 0) + 1).padStart(5, '0');
        rollNumber = `OLY${year}${subjectCode}${registration.classSelected}-${seq}`;
        updatePayload.rollNumber = rollNumber;

        if (oly) {
          await Olympiad.update(
            { totalRegistrations: (oly.totalRegistrations || 0) + 1 },
            { where: { id: registration.olympiadId } }
          );
        }
      }

      // Create Exam Session placeholder if not already created
      await OlympiadExamSession.findOrCreate({
        where: { olympiadId: registration.olympiadId, userId: registration.userId },
        defaults: {
          registrationId: registration.id,
          status: 'not_started',
          answers: {},
          markedForReview: [],
          questionOrder: [],
        },
      });
    }

    await registration.update(updatePayload);

    // Send email notification to student asynchronously
    if (registration.student?.email) {
      try {
        const { sendEmail, emailTemplates } = require('../utils/email.util');
        const primaryClientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim();
        const actionUrl = `${primaryClientUrl}/student/olympiad`;

        let emailSubject;
        let emailRemarksText;

        if (isApproved && isGovtSchool) {
          emailSubject = `🎉 Govt School ID Verified & Free Registration Approved — ${registration.olympiad?.title || 'Olympiad'}`;
          emailRemarksText = remarks || `Congratulations! Your Government School verification is approved. Your registration is 100% Free of Cost. Your Roll Number is ${rollNumber}. You can download your admit card now.`;
        } else if (isApproved) {
          emailSubject = `🎉 ID Verification Approved — ${registration.olympiad?.title || 'Olympiad'}`;
          emailRemarksText = remarks || 'Identity document approved. You can now proceed to complete fee payment and confirm your seat.';
        } else {
          emailSubject = `⚠️ Verification Update Required — ${registration.olympiad?.title || 'Olympiad'}`;
          emailRemarksText = remarks || 'Please upload a clearer identity document or school ID card.';
        }

        sendEmail({
          to: registration.student.email,
          subject: emailSubject,
          html: emailTemplates.olympiadVerificationEmail({
            name: registration.student.name || 'Student',
            olympiadTitle: registration.olympiad?.title || 'Olympiad Exam',
            status: verificationStatus,
            remarks: emailRemarksText,
            actionUrl,
          }),
        }).catch(e => console.error('[Olympiad Verification Email Failed non-fatal]:', e.message));
      } catch (mailErr) {
        console.error('[Olympiad Verification Email non-fatal]:', mailErr.message);
      }
    }

    res.json({
      success: true,
      message: isGovtSchool && isApproved
        ? 'Government School student approved free of cost! Registration confirmed & roll number assigned.'
        : `Registration ${verificationStatus} successfully`,
      data: registration,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ─────────────────────────── Results ──────────────────────────────

exports.listResults = async (req, res) => {
  try {
    const { olympiadId, page = 1, limit = 30 } = req.query;
    const where = {};
    if (olympiadId) where.olympiadId = olympiadId;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await OlympiadResult.findAndCountAll({
      where,
      include: [
        { model: User, as: 'student', attributes: ['id', 'name', 'email', 'mobile', 'state', 'city'] },
        { model: Olympiad, as: 'olympiad', attributes: ['id', 'title', 'examDate'] },
      ],
      limit: parseInt(limit),
      offset,
      order: [['obtainedMarks', 'DESC']],
    });
    res.json({ success: true, data: rows, total: count });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// Publish ranks — calculate national/state/district/school/class ranks
exports.publishRanks = async (req, res) => {
  try {
    const { olympiadId } = req.body;
    if (!olympiadId) return res.status(400).json({ error: 'olympiadId is required' });

    const results = await OlympiadResult.findAll({
      where: { olympiadId },
      include: [{ model: User, as: 'student', attributes: ['id', 'state', 'city', 'instituteId'] }],
      order: [['obtainedMarks', 'DESC'], ['timeTakenSeconds', 'ASC']],
    });

    if (!results.length) return res.status(404).json({ error: 'No results found for this olympiad' });

    // National rank
    const total = results.length;

    // Group by state for state rank
    const stateGroups   = {};
    const districtGroups = {};
    const schoolGroups  = {};
    const classGroups   = {};

    results.forEach(r => {
      const state    = r.studentState    || r.student?.state    || 'Unknown';
      const district = r.studentDistrict || r.student?.city     || 'Unknown';
      const school   = r.student?.instituteId || 'none';
      const cls      = r.studentClass || 0;

      if (!stateGroups[state])     stateGroups[state]     = [];
      if (!districtGroups[district]) districtGroups[district] = [];
      if (!schoolGroups[school])   schoolGroups[school]   = [];
      if (!classGroups[cls])       classGroups[cls]       = [];

      stateGroups[state].push(r.id);
      districtGroups[district].push(r.id);
      schoolGroups[school].push(r.id);
      classGroups[cls].push(r.id);
    });

    // Assign ranks in transaction
    await sequelize.transaction(async (t) => {
      for (let i = 0; i < results.length; i++) {
        const r       = results[i];
        const natRank = i + 1;
        const percentile = Math.round(((total - natRank) / total) * 100 * 10) / 10;

        const state    = r.studentState    || r.student?.state    || 'Unknown';
        const district = r.studentDistrict || r.student?.city     || 'Unknown';
        const school   = r.student?.instituteId || 'none';
        const cls      = r.studentClass || 0;

        const stateRank    = stateGroups[state].indexOf(r.id)    + 1;
        const districtRank = districtGroups[district].indexOf(r.id) + 1;
        const schoolRank   = schoolGroups[school].indexOf(r.id)  + 1;
        const classRank    = classGroups[cls].indexOf(r.id)      + 1;

        // Assign grade
        let grade = 'Merit';
        if      (natRank === 1)  grade = 'Gold';
        else if (natRank <= 3)   grade = 'Silver';
        else if (natRank <= 10)  grade = 'Bronze';
        else if (percentile >= 90) grade = 'Distinction';
        else if (percentile >= 75) grade = 'Merit';

        await r.update({
          nationalRank: natRank,
          stateRank,
          districtRank,
          schoolRank,
          classRank,
          percentile,
          grade,
          rankPublished: true,
        }, { transaction: t });
      }

      // Mark olympiad as completed
      await Olympiad.update({ status: 'completed' }, { where: { id: olympiadId }, transaction: t });
    });

    res.json({ success: true, message: `Ranks published for ${results.length} students`, total });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ─────────────────────────── Analytics ────────────────────────────

exports.getAnalytics = async (req, res) => {
  try {
    const { olympiadId } = req.query;

    const [totalOlympiads, totalRegistrations, totalResults, recentOlympiads] = await Promise.all([
      Olympiad.count(),
      OlympiadRegistration.count({ where: olympiadId ? { olympiadId } : {} }),
      OlympiadResult.count({ where: olympiadId ? { olympiadId } : {} }),
      Olympiad.findAll({
        limit: 5,
        order: [['createdAt', 'DESC']],
        include: [{ model: OlympiadSubject, as: 'subject', attributes: ['name', 'color'] }],
        attributes: ['id', 'title', 'status', 'examDate', 'totalRegistrations', 'registrationFee'],
      }),
    ]);

    // Revenue
    const revResult = await OlympiadRegistration.findAll({
      where: { paymentStatus: 'paid', ...(olympiadId ? { olympiadId } : {}) },
      attributes: ['amountPaid'],
    });
    const totalRevenue = revResult.reduce((sum, r) => sum + (r.amountPaid || 0), 0);

    // Subject-wise breakdown
    const subjectStats = await OlympiadRegistration.findAll({
      where: { paymentStatus: 'paid' },
      include: [{ model: Olympiad, as: 'olympiad', attributes: [], include: [{ model: OlympiadSubject, as: 'subject', attributes: ['name'] }] }],
      attributes: ['olympiadId', [fn('COUNT', col('OlympiadRegistration.id')), 'count']],
      group: ['olympiadId', 'olympiad.subjectId', 'olympiad->subject.id', 'olympiad->subject.name'],
    });

    // Class-wise
    const classStats = await OlympiadRegistration.findAll({
      where: { paymentStatus: 'paid' },
      attributes: ['classSelected', [fn('COUNT', col('id')), 'count']],
      group: ['classSelected'],
      order: [['classSelected', 'ASC']],
    });

    // Active exam sessions
    const activeSessions = await OlympiadExamSession.count({ where: { status: 'in_progress' } });

    res.json({
      success: true,
      data: {
        totalOlympiads,
        totalRegistrations,
        totalResults,
        totalRevenue,
        activeSessions,
        recentOlympiads,
        subjectStats,
        classStats,
      },
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// Live monitoring
exports.liveMonitor = async (req, res) => {
  try {
    const { olympiadId } = req.params;
    const sessions = await OlympiadExamSession.findAll({
      where: { olympiadId, status: 'in_progress' },
      include: [{ model: User, as: 'student', attributes: ['id', 'name', 'email'] }],
      order: [['startedAt', 'ASC']],
    });
    const submitted  = await OlympiadExamSession.count({ where: { olympiadId, status: { [Op.in]: ['submitted', 'auto_submitted'] } } });
    const notStarted = await OlympiadExamSession.count({ where: { olympiadId, status: 'not_started' } });

    res.json({
      success: true,
      data: {
        inProgress: sessions.length,
        submitted,
        notStarted,
        sessions: sessions.map(s => ({
          id: s.id,
          studentId: s.userId,
          studentName: s.student?.name,
          startedAt: s.startedAt,
          tabSwitchCount: s.tabSwitchCount,
          fullScreenViolations: s.fullScreenViolations,
          answeredCount: Object.keys(s.answers || {}).length,
        })),
      },
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// Generate certificates for all students in an olympiad
exports.generateAllCertificates = async (req, res) => {
  try {
    const { olympiadId } = req.body;
    const results = await OlympiadResult.findAll({
      where: { olympiadId, rankPublished: true },
      include: [
        { model: User,     as: 'student', attributes: ['id', 'name'] },
        { model: Olympiad, as: 'olympiad', attributes: ['id', 'title', 'examDate', 'subjectId'] },
        { model: OlympiadRegistration, as: 'registration', attributes: ['id', 'classSelected'] },
      ],
    });

    if (!results.length) return res.status(400).json({ error: 'No published results found. Publish ranks first.' });

    const { generateCertificatePDF, generateCertificateId } = require('../utils/certificateGenerator');
    const fs   = require('fs');
    const path = require('path');

    const certDir = path.join(__dirname, '../../uploads/olympiad-certificates');
    if (!fs.existsSync(certDir)) fs.mkdirSync(certDir, { recursive: true });

    let generated = 0;
    for (const result of results) {
      const existing = await OlympiadCertificate.findOne({ where: { olympiadId, userId: result.userId } });
      if (existing) continue;

      const certId  = generateCertificateId();
      const fileName = `${certId}.pdf`;
      const filePath = path.join(certDir, fileName);
      const subject  = await OlympiadSubject.findByPk(result.olympiad.subjectId);

      const examDate = new Date(result.olympiad.examDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

      await generateCertificatePDF({
        studentName:   result.student.name,
        olympiadTitle: result.olympiad.title,
        subjectName:   subject?.name || '',
        className:     `Class ${result.registration?.classSelected || ''}`,
        grade:         result.grade,
        nationalRank:  result.nationalRank,
        obtainedMarks: result.obtainedMarks,
        totalMarks:    result.totalMarks,
        examDate,
        certificateId: certId,
      }, filePath);

      await OlympiadCertificate.create({
        certificateId:  certId,
        certificateUrl: `/uploads/olympiad-certificates/${fileName}`,
        studentName:    result.student.name,
        olympiadTitle:  result.olympiad.title,
        subjectName:    subject?.name,
        className:      `Class ${result.registration?.classSelected}`,
        grade:          result.grade,
        nationalRank:   result.nationalRank,
        obtainedMarks:  result.obtainedMarks,
        totalMarks:     result.totalMarks,
        examDate:       result.olympiad.examDate,
        olympiadId,
        userId:         result.userId,
        resultId:       result.id,
        registrationId: result.registrationId,
      });

      generated++;
    }

    res.json({ success: true, message: `${generated} certificates generated`, generated });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ─────────────────────────── Rewards & Prize Settings ───────────────────
const DEFAULT_REWARDS = {
  prizePoolBadge: '₹10 Lakh+ Prize Pool',
  heading: 'Rewards for Top Performers',
  subtitle: 'Top rankers receive cash awards, medals and national recognition. Every participant earns a verified certificate.',
  airOnePrize: '₹25,000 + Gold Medal',
  prizes: [
    { pos: '2nd Place', prize: '₹15,000', extra: 'Silver Medal + Certificate', color: '#94a3b8', border: 'border-slate-700', featured: false },
    { pos: '1st Place', prize: '₹25,000', extra: 'Gold Trophy + Medal + Certificate', color: '#fbbf24', border: 'border-amber-500/60', featured: true },
    { pos: '3rd Place', prize: '₹10,000', extra: 'Bronze Medal + Certificate', color: '#b45309', border: 'border-amber-900/50', featured: false },
  ],
  participantRewardTitle: 'Every Participant Gets a Certificate',
  participantRewardSubtitle: 'QR-code verified, downloadable from your dashboard. Accepted by schools across India.',
  registrationFee: 150,
};

exports.getOlympiadRewards = async (req, res) => {
  try {
    const SiteSettings = require('../models/SiteSettings.model');
    const setting = await SiteSettings.findOne({ where: { key: 'olympiadRewards' } });
    if (!setting || !setting.value) {
      return res.json({ success: true, data: DEFAULT_REWARDS });
    }
    let data;
    try {
      data = JSON.parse(setting.value);
    } catch {
      data = {};
    }
    const finalData = {
      ...DEFAULT_REWARDS,
      ...data,
      prizes: (Array.isArray(data?.prizes) && data.prizes.length > 0) ? data.prizes : DEFAULT_REWARDS.prizes,
    };
    res.json({ success: true, data: finalData });
  } catch (err) {
    res.json({ success: true, data: DEFAULT_REWARDS });
  }
};

exports.saveOlympiadRewards = async (req, res) => {
  try {
    const SiteSettings = require('../models/SiteSettings.model');
    const value = JSON.stringify(req.body);
    const setting = await SiteSettings.findOne({ where: { key: 'olympiadRewards' } });
    if (setting) {
      await setting.update({ value });
    } else {
      await SiteSettings.create({ key: 'olympiadRewards', value });
    }
    res.json({ success: true, message: 'Olympiad prizes and rewards updated successfully', data: req.body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

