/**
 * Olympiad Student & Exam Controller
 * Handles: Registration, Payment, Admit Card, Exam Engine, Result, Certificate
 */
const Razorpay = require('razorpay');
const crypto   = require('crypto');
const path     = require('path');
const { Op } = require('sequelize');
const {
  Olympiad, OlympiadSubject, OlympiadClass,
  OlympiadQuestion, OlympiadRegistration, OlympiadExamSession,
  OlympiadResult, OlympiadCertificate, User, Payment,
  OlympiadStudyMaterial,
} = require('../models');

// ─────────────────────────── Public ───────────────────────────────

exports.listPublicOlympiads = async (req, res) => {
  try {
    const olympiads = await Olympiad.findAll({
      where: { status: ['open', 'upcoming', 'closed', 'ongoing', 'completed'] },
      include: [{ model: OlympiadSubject, as: 'subject', attributes: ['id', 'name', 'color', 'icon'] }],
      order: [['examDate', 'ASC']],
      attributes: [
        'id', 'title', 'slug', 'tagline', 'bannerImage',
        'registrationStartDate', 'registrationEndDate',
        'examDate', 'examStartTime', 'examDurationMinutes',
        'resultDate', 'eligibleClasses', 'totalQuestions',
        'marksPerQuestion', 'negativeMarks', 'registrationFee',
        'status', 'totalRegistrations', 'prizeDetails',
        'subjectId', 'createdAt',
      ],
    });
    res.json({ success: true, data: olympiads });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getPublicOlympiad = async (req, res) => {
  try {
    const { slug } = req.params;
    // Accept either a UUID id or a slug string
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
    const where = isUUID ? { id: slug } : { slug };
    const olympiad = await Olympiad.findOne({
      where,
      include: [{ model: OlympiadSubject, as: 'subject' }],
    });
    if (!olympiad) return res.status(404).json({ error: 'Olympiad not found' });
    res.json({ success: true, data: olympiad });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// Step 1: Submit student details & identity document for admin verification
exports.submitVerification = async (req, res) => {
  try {
    const {
      olympiadId,
      classSelected,
      dob,
      gender,
      fatherName,
      address,
      board,
      medium,
      schoolType = 'private',
      schoolName,
      schoolAddress,
      documentType,
      documentNumber,
    } = req.body;
    const userId = req.user.id;

    if (!olympiadId || !classSelected) {
      return res.status(400).json({ error: 'olympiadId and classSelected are required' });
    }

    if (!fatherName || !fatherName.trim()) {
      return res.status(400).json({ error: "Father's name is required" });
    }
    if (!dob) {
      return res.status(400).json({ error: 'Date of birth is required' });
    }
    if (!address || !address.trim()) {
      return res.status(400).json({ error: 'Residential address is required' });
    }
    if (!schoolName || !schoolName.trim()) {
      return res.status(400).json({ error: 'School name is required' });
    }
    if (!schoolAddress || !schoolAddress.trim()) {
      return res.status(400).json({ error: 'School address is required' });
    }
    if (!documentNumber || !documentNumber.trim()) {
      return res.status(400).json({ error: 'Document / ID card number is required' });
    }

    const normalizedSchoolType = (schoolType || '').toLowerCase() === 'govt' ? 'govt' : 'private';

    const olympiad = await Olympiad.findByPk(olympiadId);
    if (!olympiad) return res.status(404).json({ error: 'Olympiad not found' });
    if (olympiad.status !== 'open') return res.status(400).json({ error: 'Registration is not open for this olympiad' });
    if (!olympiad.eligibleClasses.includes(parseInt(classSelected))) {
      return res.status(400).json({ error: `Class ${classSelected} is not eligible for this olympiad` });
    }

    const existing = await OlympiadRegistration.findOne({ where: { olympiadId, userId } });
    if (existing && existing.paymentStatus === 'paid') {
      return res.status(400).json({ error: 'You are already registered and confirmed for this olympiad' });
    }

    let documentUrl = existing ? existing.documentUrl : null;
    if (req.files?.['document']?.[0]) {
      documentUrl = `/uploads/documents/${req.files['document'][0].filename}`;
    } else if (req.file) {
      documentUrl = `/uploads/documents/${req.file.filename}`;
    }

    let studentPhotoUrl = existing ? existing.studentPhotoUrl : null;
    if (req.files?.['photo']?.[0]) {
      studentPhotoUrl = `/uploads/documents/${req.files['photo'][0].filename}`;
      try {
        await User.update({ avatar: studentPhotoUrl }, { where: { id: userId } });
      } catch (avatarErr) {
        console.error('Failed to update User avatar (non-fatal):', avatarErr.message);
      }
    }

    let schoolIdCardUrl = existing ? existing.schoolIdCardUrl : null;
    if (req.files?.['schoolIdCard']?.[0]) {
      schoolIdCardUrl = `/uploads/documents/${req.files['schoolIdCard'][0].filename}`;
    }

    if (!documentUrl) {
      return res.status(400).json({ error: 'Please upload an Aadhaar card or identity document (JPEG/PNG, max 500 KB)' });
    }

    if (!studentPhotoUrl) {
      return res.status(400).json({ error: 'Please upload student passport-size photograph (JPEG/PNG, max 100 KB)' });
    }

    // If Govt School selected, School ID Card is mandatory
    if (normalizedSchoolType === 'govt' && !schoolIdCardUrl) {
      return res.status(400).json({
        error: 'School ID Card is mandatory for Government school students to claim 100% free registration'
      });
    }

    let registration;
    if (existing) {
      await existing.update({
        classSelected: parseInt(classSelected),
        dob: dob || existing.dob,
        gender: gender || existing.gender,
        fatherName: fatherName.trim(),
        address: address.trim(),
        board: board || existing.board,
        medium: medium || existing.medium,
        schoolType: normalizedSchoolType,
        schoolName: schoolName.trim(),
        schoolAddress: schoolAddress.trim(),
        documentType: documentType || existing.documentType || 'Aadhaar Card',
        documentNumber: documentNumber.trim(),
        documentUrl,
        schoolIdCardUrl: schoolIdCardUrl || existing.schoolIdCardUrl,
        studentPhotoUrl: studentPhotoUrl || existing.studentPhotoUrl,
        verificationStatus: 'pending',
        verificationRemarks: null,
      });
      registration = existing;
    } else {
      registration = await OlympiadRegistration.create({
        olympiadId,
        userId,
        classSelected: parseInt(classSelected),
        dob,
        gender,
        fatherName: fatherName.trim(),
        address: address.trim(),
        board,
        medium,
        schoolType: normalizedSchoolType,
        schoolName: schoolName.trim(),
        schoolAddress: schoolAddress.trim(),
        documentType: documentType || 'Aadhaar Card',
        documentNumber: documentNumber.trim(),
        documentUrl,
        schoolIdCardUrl,
        studentPhotoUrl,
        amountPaid: olympiad.registrationFee,
        status: 'pending',
        paymentStatus: 'pending',
        verificationStatus: 'pending',
      });
    }

    res.json({
      success: true,
      message: 'Registration details, student photo, and documents submitted for verification',
      data: registration,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// Step 2: Create Razorpay order for olympiad registration (Only after admin verification approval)
exports.initiateRegistration = async (req, res) => {
  try {
    const { olympiadId, classSelected } = req.body;
    const userId = req.user.id;

    if (!olympiadId || !classSelected) return res.status(400).json({ error: 'olympiadId and classSelected required' });

    const olympiad = await Olympiad.findByPk(olympiadId, {
      include: [{ model: OlympiadSubject, as: 'subject', attributes: ['name'] }],
    });
    if (!olympiad) return res.status(404).json({ error: 'Olympiad not found' });
    if (olympiad.status !== 'open') return res.status(400).json({ error: 'Registration is not open for this olympiad' });
    if (!olympiad.eligibleClasses.includes(parseInt(classSelected))) {
      return res.status(400).json({ error: `Class ${classSelected} is not eligible for this olympiad` });
    }

    // Check duplicate or unapproved registration
    const existing = await OlympiadRegistration.findOne({ where: { olympiadId, userId } });
    if (!existing) {
      return res.status(400).json({ error: 'Please submit your registration details and upload identity document first.' });
    }
    if (existing.paymentStatus === 'paid') {
      return res.status(400).json({ error: 'You are already registered for this olympiad' });
    }
    if (existing.schoolType === 'govt' && existing.verificationStatus === 'approved') {
      return res.status(400).json({
        error: 'Your registration is approved 100% free of cost as a Government School student. No payment is required.'
      });
    }
    if (existing.verificationStatus !== 'approved') {
      return res.status(400).json({
        error: existing.verificationStatus === 'rejected'
          ? `Your document was rejected: ${existing.verificationRemarks || 'Please re-upload your document.'}`
          : 'Your registration is under admin review. Payment will be enabled once your identity document is approved.'
      });
    }

    // Create Razorpay order
    const razorpay = new Razorpay({
      key_id:     process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const amountPaise = Math.round(olympiad.registrationFee * 100);
    const order = await razorpay.orders.create({
      amount:   amountPaise,
      currency: 'INR',
      receipt:  `oly_${olympiadId.slice(0,8)}_${userId.slice(0,8)}`,
      notes:    { olympiadId, userId, classSelected: String(classSelected) },
    });

    await existing.update({ classSelected: parseInt(classSelected), paymentStatus: 'pending' });

    res.json({
      success: true,
      data: {
        orderId:   order.id,
        amount:    amountPaise,
        currency:  'INR',
        key:       process.env.RAZORPAY_KEY_ID,
        olympiadTitle: olympiad.title,
        subjectName:   olympiad.subject?.name,
        studentName:   req.user.name,
        studentEmail:  req.user.email,
        studentMobile: req.user.mobile,
      },
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// Step 2: Verify payment and confirm registration
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, olympiadId } = req.body;
    const userId = req.user.id;

    // Verify signature
    const body      = razorpayOrderId + '|' + razorpayPaymentId;
    const expected  = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(body).digest('hex');
    if (expected !== razorpaySignature) return res.status(400).json({ error: 'Payment verification failed — invalid signature' });

    const registration = await OlympiadRegistration.findOne({ where: { olympiadId, userId } });
    if (!registration) return res.status(404).json({ error: 'Registration not found' });

    // Create Payment record
    const olympiad = await Olympiad.findByPk(olympiadId);
    const payment  = await Payment.create({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      amount:      olympiad.registrationFee,
      currency:    'INR',
      status:      'captured',
      type:        'one_time',
      description: `Olympiad registration: ${olympiad.title}`,
      userId,
    });

    // Generate roll number: OLY-<year><subjectCode><class>-<seq>
    const year        = new Date(olympiad.examDate).getFullYear().toString().slice(2);
    const subjectCode = olympiad.subjectId.slice(-4).toUpperCase();
    const seq         = String(olympiad.totalRegistrations + 1).padStart(5, '0');
    const rollNumber  = `OLY${year}${subjectCode}${registration.classSelected}-${seq}`;

    await registration.update({
      paymentId:      payment.id,
      paymentStatus:  'paid',
      status:         'confirmed',
      amountPaid:     olympiad.registrationFee,
      rollNumber,
      admitCardGenerated: true,
    });

    // Increment olympiad registration counter
    await Olympiad.update(
      { totalRegistrations: (olympiad.totalRegistrations || 0) + 1 },
      { where: { id: olympiadId } }
    );

    // Create exam session placeholder
    await OlympiadExamSession.findOrCreate({
      where: { olympiadId, userId },
      defaults: {
        registrationId: registration.id,
        status: 'not_started',
        answers: {},
        markedForReview: [],
        questionOrder: [],
      },
    });

    res.json({
      success: true,
      message: 'Registration confirmed!',
      data: { rollNumber, registrationId: registration.id },
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ─────────────────────────── Student queries ──────────────────────

exports.myRegistrations = async (req, res) => {
  try {
    const registrations = await OlympiadRegistration.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: Olympiad, as: 'olympiad',
          include: [{ model: OlympiadSubject, as: 'subject', attributes: ['id', 'name', 'color'] }],
        },
        {
          model: OlympiadResult, as: 'result', required: false,
          include: [
            { model: OlympiadCertificate, as: 'certificate', required: false },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    // Also attach exam session status
    const withSession = await Promise.all(registrations.map(async reg => {
      const session = await OlympiadExamSession.findOne({
        where: { olympiadId: reg.olympiadId, userId: req.user.id },
        attributes: ['id', 'status', 'startedAt', 'submittedAt'],
      });
      const json = reg.toJSON();
      // Promote certificate up to registration level for easy frontend access
      json.certificate = json.result?.certificate || null;
      json.examSession = session ? session.toJSON() : null;
      return json;
    }));

    res.json({ success: true, data: withSession });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getAdmitCard = async (req, res) => {
  try {
    const { regId } = req.params;
    const registration = await OlympiadRegistration.findOne({
      where: { id: regId, userId: req.user.id },
      include: [
        {
          model: Olympiad, as: 'olympiad',
          include: [{ model: OlympiadSubject, as: 'subject', attributes: ['id', 'name'] }],
        },
      ],
    });

    if (!registration) return res.status(404).json({ error: 'Registration not found' });
    if (registration.paymentStatus !== 'paid') return res.status(400).json({ error: 'Payment not completed' });

    const student = await User.findByPk(req.user.id, {
      attributes: ['id', 'name', 'email', 'mobile', 'avatar', 'state', 'city'],
    });

    res.json({
      success: true,
      data: {
        rollNumber:      registration.rollNumber,
        classSelected:   registration.classSelected,
        dob:             registration.dob,
        gender:          registration.gender,
        fatherName:      registration.fatherName,
        address:         registration.address,
        board:           registration.board,
        medium:          registration.medium,
        schoolType:      registration.schoolType,
        schoolName:      registration.schoolName,
        schoolAddress:   registration.schoolAddress,
        documentNumber:  registration.documentNumber,
        studentName:     student.name,
        studentEmail:    student.email,
        studentMobile:   student.mobile,
        studentAvatar:   registration.studentPhotoUrl || student.avatar,
        studentState:    student.state,
        studentCity:     student.city,
        olympiadTitle:   registration.olympiad.title,
        subjectName:     registration.olympiad.subject?.name,
        examDate:        registration.olympiad.examDate,
        examStartTime:   registration.olympiad.examStartTime,
        examDuration:    registration.olympiad.examDurationMinutes,
        totalQuestions:  registration.olympiad.totalQuestions,
        marksPerQuestion:registration.olympiad.marksPerQuestion,
        negativeMarks:   registration.olympiad.negativeMarks,
        registrationId:  registration.id,
        paymentDate:     registration.verifiedAt || registration.updatedAt || registration.createdAt,
        createdAt:       registration.createdAt,
      },
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// Fee Receipt / Payment Slip
exports.getReceipt = async (req, res) => {
  try {
    const { regId } = req.params;
    const registration = await OlympiadRegistration.findOne({
      where: { id: regId, userId: req.user.id },
      include: [
        {
          model: Olympiad, as: 'olympiad',
          include: [{ model: OlympiadSubject, as: 'subject', attributes: ['id', 'name', 'color'] }],
        },
      ],
    });

    if (!registration) return res.status(404).json({ error: 'Registration not found' });
    if (registration.paymentStatus !== 'paid') {
      return res.status(400).json({ error: 'Payment not completed for this registration' });
    }

    const student = await User.findByPk(req.user.id, {
      attributes: ['id', 'name', 'email', 'mobile', 'avatar', 'state', 'city'],
    });

    let paymentRecord = null;
    if (registration.paymentId) {
      paymentRecord = await Payment.findByPk(registration.paymentId);
    }
    if (!paymentRecord && registration.userId) {
      paymentRecord = await Payment.findOne({
        where: {
          userId: registration.userId,
          [Op.or]: [
            { description: { [Op.like]: `%${registration.olympiad?.title || 'Olympiad'}%` } },
            { description: { [Op.like]: '%Olympiad%' } },
            { type: 'one_time' },
          ],
        },
        order: [['createdAt', 'DESC']],
      });
    }

    const feeAmount = typeof registration.amountPaid === 'number' && registration.amountPaid >= 0
      ? registration.amountPaid
      : (registration.schoolType === 'govt' ? 0 : 150);

    // Actual immutable payment timestamp from Payment record, verifiedAt (for govt free waivers), or registration timestamp
    const actualPaymentDate = paymentRecord?.createdAt
      || (registration.schoolType === 'govt' ? (registration.verifiedAt || registration.createdAt) : (registration.updatedAt || registration.createdAt));
    const actualTxnId = paymentRecord?.razorpayPaymentId
      || paymentRecord?.transactionId
      || paymentRecord?.razorpayOrderId
      || (registration.rollNumber ? `TXN-${registration.rollNumber}` : `TXN-OLY-${registration.id.slice(0, 8).toUpperCase()}`);

    res.json({
      success: true,
      data: {
        receiptNo: `REC-OLY-${(registration.rollNumber || registration.id.slice(0, 8)).toUpperCase()}`,
        registrationId: registration.id,
        rollNumber: registration.rollNumber,
        transactionId: actualTxnId,
        paymentDate: actualPaymentDate,
        paymentStatus: registration.paymentStatus,
        paymentMethod: paymentRecord?.paymentMode ? paymentRecord.paymentMode.toUpperCase() : 'Online (UPI / Card / NetBanking)',
        amountPaid: feeAmount,
        currency: 'INR',
        studentName: student?.name || 'Student',
        studentEmail: student?.email || '',
        studentMobile: student?.mobile || '',
        studentCity: student?.city || '',
        studentState: student?.state || '',
        classSelected: registration.classSelected,
        schoolName: registration.schoolName || '—',
        schoolType: registration.schoolType || 'private',
        board: registration.board || 'CBSE',
        medium: registration.medium || 'English',
        olympiadTitle: registration.olympiad?.title || 'National Olympiad',
        subjectName: registration.olympiad?.subject?.name || 'General',
        examDate: registration.olympiad?.examDate,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Step 3: Get preparation portal data (Selected class syllabus, study materials & related mock tests)
exports.getPreparation = async (req, res) => {
  try {
    const { regId } = req.params;
    const registration = await OlympiadRegistration.findOne({
      where: { id: regId, userId: req.user.id },
      include: [
        {
          model: Olympiad, as: 'olympiad',
          include: [{ model: OlympiadSubject, as: 'subject', attributes: ['id', 'name', 'color'] }],
        },
      ],
    });

    if (!registration) return res.status(404).json({ error: 'Registration not found' });
    if (registration.paymentStatus !== 'paid') {
      return res.status(400).json({ error: 'Payment not completed for this registration' });
    }

    const student = await User.findByPk(req.user.id, {
      attributes: ['id', 'name', 'email', 'mobile', 'avatar'],
    });

    // Fetch study materials for this subject and class
    let studyMaterials = [];
    try {
      studyMaterials = await OlympiadStudyMaterial.findAll({
        where: {
          subjectId: registration.olympiad.subjectId,
          isActive: true,
          [Op.or]: [
            { classLevel: registration.classSelected },
            { classLevel: null },
          ],
        },
        order: [['orderIndex', 'ASC'], ['createdAt', 'DESC']],
      });
    } catch (smErr) {
      console.error('Error loading study materials for preparation:', smErr.message);
    }

    // Fetch official questions if any exist for this class & subject in the DB
    let officialQuestions = [];
    try {
      const classRecord = await OlympiadClass.findOne({ where: { classNumber: registration.classSelected } });
      if (classRecord) {
        officialQuestions = await OlympiadQuestion.findAll({
          where: {
            subjectId: registration.olympiad.subjectId,
            classId: classRecord.id,
            isActive: true,
          },
          attributes: ['id', 'questionText', 'image', 'options', 'correctAnswer', 'explanation', 'difficulty', 'marks'],
          limit: 30,
        });
      }
    } catch (qErr) {
      console.error('Error loading official questions:', qErr.message);
    }

    res.json({
      success: true,
      data: {
        registrationId: registration.id,
        rollNumber: registration.rollNumber,
        classSelected: registration.classSelected,
        dob: registration.dob,
        board: registration.board,
        medium: registration.medium,
        schoolType: registration.schoolType,
        schoolName: registration.schoolName,
        paymentStatus: registration.paymentStatus,
        amountPaid: registration.amountPaid,
        studentName: student?.name,
        studentEmail: student?.email,
        studentMobile: student?.mobile,
        studentAvatar: registration.studentPhotoUrl || student?.avatar,
        olympiad: {
          id: registration.olympiad.id,
          title: registration.olympiad.title,
          description: registration.olympiad.description,
          syllabusPdfUrl: registration.olympiad.syllabusPdfUrl,
          examDate: registration.olympiad.examDate,
          examStartTime: registration.olympiad.examStartTime,
          examDurationMinutes: registration.olympiad.examDurationMinutes,
          totalQuestions: registration.olympiad.totalQuestions,
          marksPerQuestion: registration.olympiad.marksPerQuestion,
          negativeMarks: registration.olympiad.negativeMarks,
          status: registration.olympiad.status,
          subject: registration.olympiad.subject,
        },
        studyMaterials,
        officialQuestions,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────── Exam Engine ──────────────────────────

// Get shuffled questions for the exam (called when student starts)
exports.startExam = async (req, res) => {
  try {
    const { olympiadId } = req.params;
    const userId = req.user.id;

    const olympiad = await Olympiad.findByPk(olympiadId);
    if (!olympiad) return res.status(404).json({ error: 'Olympiad not found' });

    // Check registration
    const registration = await OlympiadRegistration.findOne({
      where: { olympiadId, userId, paymentStatus: 'paid' },
    });
    if (!registration) return res.status(403).json({ error: 'You are not registered for this olympiad' });

    // Allow exam if status is 'ongoing' OR 'open' (admin may not have changed it yet)
    if (!['open', 'ongoing'].includes(olympiad.status)) {
      return res.status(400).json({ error: 'Exam is not available for this olympiad' });
    }

    // Check exam window — students can start the exam any time on the exam date (00:00–23:59 local time).
    // The in-session timer on the frontend still enforces the duration once started.
    // NOTE: parse DATEONLY string ("2026-06-30") as LOCAL time, not UTC.
    const now = new Date();
    const [yr, mo, dy] = (olympiad.examDate || '').split('-').map(Number);
    const examDayStart = new Date(yr, mo - 1, dy, 0, 0, 0, 0);    // 00:00 local
    const examDayEnd   = new Date(yr, mo - 1, dy, 23, 59, 59, 999); // 23:59 local

    if (now < examDayStart) return res.status(400).json({ error: 'Exam has not started yet. It is scheduled for ' + olympiad.examDate });
    if (now > examDayEnd)   return res.status(400).json({ error: 'Exam window has closed. The exam date was ' + olympiad.examDate });

    let session = await OlympiadExamSession.findOne({ where: { olympiadId, userId } });

    if (session?.status === 'submitted' || session?.status === 'auto_submitted') {
      return res.status(400).json({ error: 'You have already submitted this exam' });
    }

    // First start — assign shuffled questions
    if (!session || session.status === 'not_started' || !session.questionOrder?.length) {
      // Look up the class record first (we need its UUID for the foreign key)
      const classRecord = await OlympiadClass.findOne({
        where: { classNumber: registration.classSelected },
      });

      let finalQuestions = [];
      if (classRecord) {
        finalQuestions = await OlympiadQuestion.findAll({
          where: { subjectId: olympiad.subjectId, classId: classRecord.id, isActive: true },
          attributes: ['id', 'questionText', 'image', 'options', 'difficulty', 'marks', 'negativeMarks'],
        });
      }

      // Fallback: fetch all active questions for the subject (no class filter)
      if (!finalQuestions.length) {
        finalQuestions = await OlympiadQuestion.findAll({
          where: { subjectId: olympiad.subjectId, isActive: true },
          attributes: ['id', 'questionText', 'image', 'options', 'difficulty', 'marks', 'negativeMarks'],
        });
      }

      if (!finalQuestions.length) return res.status(400).json({ error: 'No questions available for this exam. Please contact admin.' });

      // Fisher-Yates shuffle
      const shuffled = [...finalQuestions].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, Math.min(olympiad.totalQuestions, shuffled.length));

      // Shuffle options for each question
      const questionsWithShuffledOptions = selected.map(q => {
        const qObj = q.toJSON();
        qObj.options = [...(qObj.options || [])].sort(() => Math.random() - 0.5);
        return qObj;
      });

      const questionOrder = questionsWithShuffledOptions.map(q => q.id);

      if (session) {
        await session.update({
          status: 'in_progress',
          startedAt: now,
          questionOrder,
          answers: {},
          markedForReview: [],
        });
      } else {
        session = await OlympiadExamSession.create({
          olympiadId, userId,
          registrationId: registration.id,
          status: 'in_progress',
          startedAt: now,
          questionOrder,
          answers: {},
          markedForReview: [],
        });
      }

      return res.json({
        success: true,
        data: {
          sessionId:      session.id,
          questions:      questionsWithShuffledOptions,
          totalQuestions: questionsWithShuffledOptions.length,
          examDurationMinutes: olympiad.examDurationMinutes,
          startedAt: now,
          marksPerQuestion: olympiad.marksPerQuestion,
          negativeMarks:   olympiad.negativeMarks,
          answers: {},
          markedForReview: [],
        },
      });
    }

    // Resuming existing session
    const questions = await OlympiadQuestion.findAll({
      where: { id: session.questionOrder, isActive: true },
      attributes: ['id', 'questionText', 'image', 'options', 'difficulty', 'marks', 'negativeMarks'],
    });

    // Restore original order
    const orderedQuestions = session.questionOrder
      .map(qId => questions.find(q => q.id === qId))
      .filter(Boolean)
      .map(q => q.toJSON());

    const elapsed = Math.floor((now - new Date(session.startedAt)) / 1000);
    const remaining = Math.max(0, olympiad.examDurationMinutes * 60 - elapsed);

    res.json({
      success: true,
      data: {
        sessionId:      session.id,
        questions:      orderedQuestions,
        totalQuestions: orderedQuestions.length,
        examDurationMinutes: olympiad.examDurationMinutes,
        startedAt:      session.startedAt,
        timeRemainingSeconds: remaining,
        marksPerQuestion: olympiad.marksPerQuestion,
        negativeMarks:   olympiad.negativeMarks,
        answers:         session.answers || {},
        markedForReview: session.markedForReview || [],
      },
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// Auto-save answers
exports.autoSave = async (req, res) => {
  try {
    const { olympiadId } = req.params;
    const { answers, markedForReview, tabSwitchCount, fullScreenViolations } = req.body;

    const session = await OlympiadExamSession.findOne({
      where: { olympiadId, userId: req.user.id, status: 'in_progress' },
    });
    if (!session) return res.status(404).json({ error: 'No active exam session found' });

    await session.update({
      answers:              answers || session.answers,
      markedForReview:      markedForReview || session.markedForReview,
      tabSwitchCount:       tabSwitchCount ?? session.tabSwitchCount,
      fullScreenViolations: fullScreenViolations ?? session.fullScreenViolations,
    });

    res.json({ success: true, message: 'Auto-saved' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// Submit exam and calculate score
exports.submitExam = async (req, res) => {
  try {
    const { olympiadId } = req.params;
    const { answers, markedForReview } = req.body;
    const userId = req.user.id;

    const session = await OlympiadExamSession.findOne({ where: { olympiadId, userId } });
    if (!session) return res.status(404).json({ error: 'Exam session not found' });
    if (['submitted', 'auto_submitted'].includes(session.status)) {
      return res.status(400).json({ error: 'Exam already submitted' });
    }

    const olympiad     = await Olympiad.findByPk(olympiadId);
    const registration = await OlympiadRegistration.findOne({ where: { olympiadId, userId } });
    const student      = await User.findByPk(userId, { attributes: ['id', 'name', 'state', 'city', 'instituteId'] });

    // Fetch all questions in this session
    const questions = await OlympiadQuestion.findAll({
      where: { id: session.questionOrder },
      attributes: ['id', 'correctAnswer', 'marks', 'negativeMarks'],
    });

    const finalAnswers = answers || session.answers || {};
    const now = new Date();
    const timeTaken = Math.floor((now - new Date(session.startedAt)) / 1000);

    // Score calculation
    let obtained = 0, correct = 0, wrong = 0, skipped = 0;
    const answerReview = [];

    questions.forEach(q => {
      const selected = finalAnswers[q.id];
      if (!selected) {
        skipped++;
        answerReview.push({ qId: q.id, selected: null, correct: q.correctAnswer, isCorrect: false, skipped: true });
      } else if (selected === q.correctAnswer) {
        correct++;
        obtained += (q.marks || olympiad.marksPerQuestion || 1);
        answerReview.push({ qId: q.id, selected, correct: q.correctAnswer, isCorrect: true, skipped: false });
      } else {
        wrong++;
        obtained -= (q.negativeMarks || olympiad.negativeMarks || 0);
        answerReview.push({ qId: q.id, selected, correct: q.correctAnswer, isCorrect: false, skipped: false });
      }
    });

    const totalMarks = questions.reduce((s, q) => s + (q.marks || olympiad.marksPerQuestion || 1), 0);
    obtained = Math.max(0, obtained); // no negative total
    const accuracy = correct + wrong > 0 ? Math.round((correct / (correct + wrong)) * 1000) / 10 : 0;

    // Update session
    await session.update({
      answers:        finalAnswers,
      markedForReview: markedForReview || session.markedForReview,
      status:         'submitted',
      submittedAt:    now,
    });

    // Update question stats
    await Promise.all(questions.map(q => {
      const rev = answerReview.find(r => r.qId === q.id);
      if (!rev || rev.skipped) return null;
      return OlympiadQuestion.increment(
        { totalAttempts: 1, ...(rev.isCorrect ? { correctAttempts: 1 } : {}) },
        { where: { id: q.id } }
      );
    }).filter(Boolean));

    // Create result
    const result = await OlympiadResult.create({
      totalMarks,
      obtainedMarks:  Math.round(obtained * 100) / 100,
      correctAnswers: correct,
      wrongAnswers:   wrong,
      skippedAnswers: skipped,
      accuracy,
      timeTakenSeconds: timeTaken,
      studentState:    student.state,
      studentDistrict: student.city,
      studentClass:    registration.classSelected,
      answerReview,
      rankPublished: false,
      olympiadId,
      userId,
      registrationId: registration.id,
      sessionId:      session.id,
    });

    res.json({
      success: true,
      message: 'Exam submitted successfully!',
      data: {
        resultId:      result.id,
        totalMarks,
        obtainedMarks: result.obtainedMarks,
        correctAnswers: correct,
        wrongAnswers:   wrong,
        skippedAnswers: skipped,
        accuracy,
        timeTakenSeconds: timeTaken,
      },
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ─────────────────────────── Result & Certificate ─────────────────

exports.getMyResult = async (req, res) => {
  try {
    const { olympiadId } = req.params;
    const result = await OlympiadResult.findOne({
      where: { olympiadId, userId: req.user.id },
      include: [
        { model: Olympiad, as: 'olympiad', include: [{ model: OlympiadSubject, as: 'subject' }] },
        { model: OlympiadCertificate, as: 'certificate', required: false },
      ],
    });
    if (!result) return res.status(404).json({ error: 'Result not found' });
    res.json({ success: true, data: result });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getMyCertificate = async (req, res) => {
  try {
    const { certId } = req.params;
    const cert = await OlympiadCertificate.findOne({
      where: { userId: req.user.id, ...(certId === 'all' ? {} : { certificateId: certId }) },
      include: [{
        model: Olympiad,
        as: 'olympiad',
        attributes: ['id', 'certificateTemplate'],
        required: false,
      }],
    });
    if (!cert) return res.status(404).json({ error: 'Certificate not found' });

    // Fetch student avatar separately
    const student = await User.findByPk(req.user.id, { attributes: ['avatar'] });
    const data = cert.toJSON();
    data.studentAvatar = student?.avatar || null;
    // Expose the olympiad's custom certificate template (if set)
    data.certificateTemplate = cert.olympiad?.certificateTemplate || null;

    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ error: err.message }); }
};


exports.getMyCertificates = async (req, res) => {
  try {
    const certs = await OlympiadCertificate.findAll({
      where: { userId: req.user.id },
      include: [{ model: Olympiad, as: 'olympiad', attributes: ['id', 'title', 'examDate'] }],
      order: [['issuedAt', 'DESC']],
    });
    res.json({ success: true, data: certs });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// Public certificate verification
exports.verifyCertificate = async (req, res) => {
  try {
    const cert = await OlympiadCertificate.findOne({ where: { certificateId: req.params.certId } });
    if (!cert) return res.status(404).json({ success: false, error: 'Certificate not found or invalid' });
    res.json({
      success: true,
      valid: true,
      data: {
        certificateId:  cert.certificateId,
        studentName:    cert.studentName,
        olympiadTitle:  cert.olympiadTitle,
        subjectName:    cert.subjectName,
        className:      cert.className,
        grade:          cert.grade,
        nationalRank:   cert.nationalRank,
        examDate:       cert.examDate,
        issuedAt:       cert.issuedAt,
      },
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
