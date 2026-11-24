/**
 * Olympiad Module Routes
 * All routes prefixed with /api/olympiad
 */
const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const { protect, authorizeAdmin, authorizeStaff, authorize } = require('../middlewares/auth.middleware');

const adminCtrl   = require('../controllers/olympiad.admin.controller');
const studentCtrl = require('../controllers/olympiad.student.controller');
const smCtrl      = require('../controllers/olympiad.studymaterial.controller');

// In-memory multer for Excel import
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Disk-storage multer for study-material file uploads
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads/study-materials');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `sm-${unique}${path.extname(file.originalname)}`);
  },
});
const fileUpload = multer({
  storage: fileStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter: (req, file, cb) => {
    const allowed = /pdf|doc|docx|ppt|pptx|mp4|webm|png|jpg|jpeg/;
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    allowed.test(ext) ? cb(null, true) : cb(new Error('File type not allowed'));
  },
});

// Disk-storage multer for certificate template uploads
const certStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads/certificate-templates');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `cert-tpl-${unique}${path.extname(file.originalname)}`);
  },
});
const certTemplateUpload = multer({
  storage: certStorage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    /\.(png|jpg|jpeg|webp)$/.test(ext) ? cb(null, true) : cb(new Error('Only PNG/JPG/WEBP images allowed for certificate template'));
  },
});

// Disk-storage multer for student identity document and photo uploads
const docStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads/documents');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const prefix = file.fieldname === 'photo' ? 'photo' : file.fieldname === 'schoolIdCard' ? 'school-id' : 'id-doc';
    cb(null, `${prefix}-${unique}${path.extname(file.originalname).toLowerCase()}`);
  },
});
const docUpload = multer({
  storage: docStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB general buffer limit; field-specific limits enforced below
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.jpg', '.jpeg', '.png'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG or PNG format allowed. PDF and other file formats are not supported.'));
    }
  },
});

// ─────────────────────────── PUBLIC ROUTES ────────────────────────
router.get('/public/list',     studentCtrl.listPublicOlympiads);
router.get('/public/rewards',  adminCtrl.getOlympiadRewards);
router.get('/public/:slug',    studentCtrl.getPublicOlympiad);
router.get('/verify/:certId',  studentCtrl.verifyCertificate);
// Study Materials — public
router.get('/study-materials',          smCtrl.listPublicMaterials);
router.get('/study-materials/:id',      smCtrl.getMaterial);
// Subjects — public list (for forms)
router.get('/subjects',                 adminCtrl.listSubjects);


// ─────────────────────────── STUDENT ROUTES ───────────────────────
router.use('/student', protect, authorize('student'));

router.get('/student/registrations',              studentCtrl.myRegistrations);
router.get('/student/certificates',               studentCtrl.getMyCertificates);
router.get('/student/certificate/:certId',        studentCtrl.getMyCertificate);

const verificationUpload = docUpload.fields([
  { name: 'document', maxCount: 1 },
  { name: 'photo', maxCount: 1 },
  { name: 'schoolIdCard', maxCount: 1 },
]);

router.post('/student/submit-verification', (req, res, next) => {
  verificationUpload(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message || 'File upload error' });

    const cleanupFiles = () => {
      if (req.files) {
        Object.values(req.files).flat().forEach(f => {
          if (f.path && fs.existsSync(f.path)) {
            try { fs.unlinkSync(f.path); } catch (e) {}
          }
        });
      }
    };

    // Strict file size & type validations:
    // 1. Document max 500 KB (JPEG / PNG)
    const docFile = req.files?.['document']?.[0];
    if (docFile && docFile.size > 500 * 1024) {
      cleanupFiles();
      return res.status(400).json({
        error: `Identity document must be maximum 500 KB (uploaded ${(docFile.size / 1024).toFixed(1)} KB)`
      });
    }

    // 2. Photo max 100 KB (JPEG / PNG)
    const photoFile = req.files?.['photo']?.[0];
    if (photoFile && photoFile.size > 100 * 1024) {
      cleanupFiles();
      return res.status(400).json({
        error: `Student photograph must be maximum 100 KB (uploaded ${(photoFile.size / 1024).toFixed(1)} KB)`
      });
    }

    // 3. School ID Card max 500 KB (JPEG / PNG)
    const schoolIdCardFile = req.files?.['schoolIdCard']?.[0];
    if (schoolIdCardFile && schoolIdCardFile.size > 500 * 1024) {
      cleanupFiles();
      return res.status(400).json({
        error: `School ID card must be maximum 500 KB (uploaded ${(schoolIdCardFile.size / 1024).toFixed(1)} KB)`
      });
    }

    next();
  });
}, studentCtrl.submitVerification);
router.post('/student/register',                  studentCtrl.initiateRegistration);
router.post('/student/payment/verify',            studentCtrl.verifyPayment);
router.get('/student/admit-card/:regId',          studentCtrl.getAdmitCard);
router.get('/student/receipt/:regId',             studentCtrl.getReceipt);
router.get('/student/preparation/:regId',         studentCtrl.getPreparation);

router.post('/student/exam/:olympiadId/start',    studentCtrl.startExam);
router.post('/student/exam/:olympiadId/autosave', studentCtrl.autoSave);
router.post('/student/exam/:olympiadId/submit',   studentCtrl.submitExam);
router.get('/student/result/:olympiadId',         studentCtrl.getMyResult);

// ─────────────────────────── ADMIN ROUTES ─────────────────────────
router.use('/admin', protect, authorizeStaff);

// Subjects
router.get('/admin/subjects',           adminCtrl.listSubjects);
router.post('/admin/subjects',          adminCtrl.createSubject);
router.put('/admin/subjects/:id',       adminCtrl.updateSubject);
router.patch('/admin/subjects/:id',     adminCtrl.updateSubject);
router.delete('/admin/subjects/:id',    adminCtrl.deleteSubject);

// Classes
router.get('/admin/classes',            adminCtrl.listClasses);

// Chapters
router.get('/admin/chapters',           adminCtrl.listChapters);
router.post('/admin/chapters',          adminCtrl.createChapter);
router.put('/admin/chapters/:id',       adminCtrl.updateChapter);
router.delete('/admin/chapters/:id',    adminCtrl.deleteChapter);

// Topics
router.get('/admin/topics',             adminCtrl.listTopics);
router.post('/admin/topics',            adminCtrl.createTopic);
router.delete('/admin/topics/:id',      adminCtrl.deleteTopic);

// Questions
router.get('/admin/questions',                          adminCtrl.listQuestions);
router.post('/admin/questions',                         adminCtrl.createQuestion);
router.put('/admin/questions/:id',                      adminCtrl.updateQuestion);
router.delete('/admin/questions/:id',                   adminCtrl.deleteQuestion);
router.post('/admin/questions/import', upload.single('file'), adminCtrl.importQuestions);

// Olympiads
router.get('/admin/olympiads',          adminCtrl.listOlympiads);
router.post('/admin/olympiads',         adminCtrl.createOlympiad);
router.get('/admin/olympiads/:id',      adminCtrl.getOlympiad);
router.put('/admin/olympiads/:id',      adminCtrl.updateOlympiad);
router.delete('/admin/olympiads/:id',   adminCtrl.deleteOlympiad);

// Certificate Template upload
router.post('/admin/olympiads/:id/certificate-template',
  (req, res, next) => certTemplateUpload.single('template')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message || 'Upload error' });
    next();
  }),
  adminCtrl.uploadCertificateTemplate
);

// Syllabus PDF upload
router.post('/admin/olympiads/:id/syllabus-pdf',
  (req, res, next) => fileUpload.single('syllabus')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message || 'Upload error' });
    next();
  }),
  adminCtrl.uploadSyllabusPdf
);

// Registrations
router.get('/admin/registrations',                adminCtrl.listRegistrations);
router.put('/admin/registrations/:id/verify',      adminCtrl.verifyRegistration);

// Results & Rankings
router.get('/admin/results',            adminCtrl.listResults);
router.post('/admin/results/publish-ranks', adminCtrl.publishRanks);

// Certificates
router.post('/admin/certificates/generate-all', adminCtrl.generateAllCertificates);

// Analytics & Monitoring
router.get('/admin/analytics',          adminCtrl.getAnalytics);
router.get('/admin/live-monitor/:olympiadId', adminCtrl.liveMonitor);

// Study Materials — admin CRUD + file upload
// NOTE: /upload must be declared BEFORE /:id routes so Express does not treat "upload" as an id
router.post('/admin/study-materials/upload',
  (req, res, next) => fileUpload.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message || 'File upload error' });
    next();
  }),
  (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    // Store relative path so it works on any host/domain
    const fileUrl = `/uploads/study-materials/${req.file.filename}`;
    res.json({ success: true, url: fileUrl, filename: req.file.filename });
  }
);
router.get('/admin/study-materials',       smCtrl.listMaterials);
router.post('/admin/study-materials',      smCtrl.createMaterial);
router.put('/admin/study-materials/:id',   smCtrl.updateMaterial);
router.delete('/admin/study-materials/:id', smCtrl.deleteMaterial);

// Olympiad Prizes & Rewards Settings — admin
router.get('/admin/rewards',               adminCtrl.getOlympiadRewards);
router.post('/admin/rewards',              adminCtrl.saveOlympiadRewards);
router.put('/admin/rewards',               adminCtrl.saveOlympiadRewards);

module.exports = router;

