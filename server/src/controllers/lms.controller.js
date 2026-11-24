const { Course, CourseModule, Lesson, CourseMaterial, Batch, User, LessonProgress, Test, Attendance, CourseQA, CourseQuiz, Result, CourseQuizAttempt, EnrollmentRequest, BatchStudent } = require('../models');
const { Op } = require('sequelize');

// ── Instructors ───────────────────────────────────────

exports.getInstructors = async (req, res) => {
  try {
    const instructors = await User.findAll({
      where: { role: 'instructor', instituteId: req.user.instituteId },
      attributes: ['id', 'name', 'email', 'avatar'],
      order: [['name', 'ASC']]
    });
    res.json({ success: true, data: instructors });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Course Management ────────────────────────────────

exports.createCourse = async (req, res) => {
  try {
    const { 
      title, description, price, category, instructorName, instructorBio,
      seats, recordedClasses, liveClasses, courseDuration,
      salientFeatures, productHighlights, examsCovered, faqs
    } = req.body;
    let { thumbnail } = req.body;
    
    if (req.file) {
      const protocol = req.protocol;
      const host = req.get('host');
      thumbnail = `${protocol}://${host}/uploads/${req.file.filename}`;
    }

    const slug = title.toLowerCase().split(' ').join('-') + '-' + Date.now();
    
    const course = await Course.create({
      title, slug, description, price, category,
      instructorName, instructorBio,
      thumbnail: thumbnail || null,
      instituteId: req.user.instituteId,
      createdBy: req.user.id,
      instructorId: req.user.role === 'instructor' ? req.user.id : (req.body.instructorId || null),
      seats: seats ? Number(seats) : null,
      recordedClasses: recordedClasses ? Number(recordedClasses) : null,
      liveClasses: liveClasses ? Number(liveClasses) : null,
      courseDuration: courseDuration || null,
      salientFeatures: salientFeatures ? (typeof salientFeatures === 'string' ? JSON.parse(salientFeatures) : salientFeatures) : null,
      productHighlights: productHighlights ? (typeof productHighlights === 'string' ? JSON.parse(productHighlights) : productHighlights) : null,
      examsCovered: examsCovered ? (typeof examsCovered === 'string' ? JSON.parse(examsCovered) : examsCovered) : null,
      faqs: faqs ? (typeof faqs === 'string' ? JSON.parse(faqs) : faqs) : null,
      isPublished: false
    });
    
    res.status(201).json({ success: true, data: course });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCourses = async (req, res) => {
  try {
    // Instructors only see their assigned courses; institute sees all
    const where = req.user.role === 'instructor'
      ? { instructorId: req.user.id }
      : { instituteId: req.user.instituteId };

    const courses = await Course.findAll({
      where,
      include: [
        { model: CourseModule, as: 'modules', attributes: ['id', 'title'] },
        { model: Batch, as: 'enrolledBatches', attributes: ['id', 'name'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, data: courses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const { 
      title, description, price, category, isPublished, instructorName, instructorBio,
      seats, recordedClasses, liveClasses, courseDuration,
      salientFeatures, productHighlights, examsCovered, faqs
    } = req.body;
    let { thumbnail } = req.body;
    
    if (req.file) {
      const protocol = req.protocol;
      const host = req.get('host');
      thumbnail = `${protocol}://${host}/uploads/${req.file.filename}`;
    }

    const where = req.user.role === 'instructor'
      ? { id: req.params.id, instructorId: req.user.id }
      : { id: req.params.id, instituteId: req.user.instituteId };
    const course = await Course.findOne({ where });
    if (!course) return res.status(404).json({ error: 'Course not found' });

    const updates = {
      title,
      description,
      thumbnail: thumbnail || course.thumbnail,
      price,
      category,
      instructorName,
      instructorBio,
      isPublished,
      seats: seats ? Number(seats) : null,
      recordedClasses: recordedClasses ? Number(recordedClasses) : null,
      liveClasses: liveClasses ? Number(liveClasses) : null,
      courseDuration: courseDuration || null,
    };

    if (salientFeatures !== undefined) updates.salientFeatures = typeof salientFeatures === 'string' ? JSON.parse(salientFeatures) : salientFeatures;
    if (productHighlights !== undefined) updates.productHighlights = typeof productHighlights === 'string' ? JSON.parse(productHighlights) : productHighlights;
    if (examsCovered !== undefined) updates.examsCovered = typeof examsCovered === 'string' ? JSON.parse(examsCovered) : examsCovered;
    if (faqs !== undefined) updates.faqs = typeof faqs === 'string' ? JSON.parse(faqs) : faqs;
    if (req.user.role === 'institute' && req.body.instructorId !== undefined) {
      updates.instructorId = req.body.instructorId || null;
    }
    await course.update(updates);

    res.json({ success: true, data: course });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findOne({ where: { id: req.params.id, instituteId: req.user.instituteId } });
    if (!course) return res.status(404).json({ error: 'Course not found' });
    
    await course.destroy();
    res.json({ success: true, message: 'Course deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCourseDetails = async (req, res) => {
  try {
    const include = [
      { 
        model: CourseModule, 
        as: 'modules',
        include: [
          { 
            model: Lesson, 
            as: 'lessons',
            include: req.user.role === 'student' ? [
              { model: LessonProgress, as: 'progressRecords', where: { userId: req.user.id }, required: false }
            ] : []
          },
          { 
            model: Test, 
            as: 'quizzes',
            include: req.user.role === 'student' ? [
              { model: Result, as: 'results', where: { userId: req.user.id }, required: false }
            ] : []
          },
          { 
            model: CourseQuiz, 
            as: 'moduleQuizzes',
            include: req.user.role === 'student' ? [
              { model: CourseQuizAttempt, as: 'attempts', where: { userId: req.user.id }, required: false }
            ] : []
          }
        ]
      },
      { model: CourseMaterial, as: 'allMaterials' },
      { model: Batch, as: 'enrolledBatches', attributes: ['id', 'name'] },
      { model: Lesson, as: 'allLessons' }
    ];

    const where = req.user.role === 'instructor'
      ? { id: req.params.id, instructorId: req.user.id }
      : req.user.role === 'student'
        ? { id: req.params.id }
        : { id: req.params.id, instituteId: req.user.instituteId };
    const course = await Course.findOne({
      where,
      include
    });
    if (!course) return res.status(404).json({ error: 'Course not found' });
    res.json({ success: true, data: course });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Module & Lesson Management ────────────────────────

exports.addModule = async (req, res) => {
  try {
    const courseWhere = req.user.role === 'instructor'
      ? { id: req.params.courseId, instructorId: req.user.id }
      : { id: req.params.courseId, instituteId: req.user.instituteId };
    const course = await Course.findOne({ where: courseWhere });
    if (!course) return res.status(403).json({ error: 'Unauthorized to modify this course' });

    const { title, order } = req.body;
    const module = await CourseModule.create({
      title,
      order,
      courseId: req.params.courseId
    });
    res.status(201).json({ success: true, data: module });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addLesson = async (req, res) => {
  try {
    const courseWhere = req.user.role === 'instructor'
      ? { id: req.params.courseId, instructorId: req.user.id }
      : { id: req.params.courseId, instituteId: req.user.instituteId };
    const course = await Course.findOne({ where: courseWhere });
    if (!course) return res.status(403).json({ error: 'Unauthorized to modify this course' });

    const { title, content, videoUrl, videoType, duration, order, isFree, moduleId, lessonType } = req.body;
    const lesson = await Lesson.create({
      title,
      content,
      videoUrl,
      videoType,
      duration,
      order,
      isFree,
      moduleId,
      type: lessonType || 'video',
      courseId: req.params.courseId
    });
    res.status(201).json({ success: true, data: lesson });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addQuiz = async (req, res) => {
  try {
    const courseWhere = req.user.role === 'instructor'
      ? { id: req.params.courseId, instructorId: req.user.id }
      : { id: req.params.courseId, instituteId: req.user.instituteId };
    const course = await Course.findOne({ where: courseWhere });
    if (!course) return res.status(403).json({ error: 'Unauthorized to modify this course' });

    const { testId, moduleId } = req.body;
    const test = await Test.findByPk(testId);
    if (!test) return res.status(404).json({ error: 'Test not found' });

    await test.update({ 
      moduleId, 
      courseId: req.params.courseId 
    });

    res.json({ success: true, data: test });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addMaterial = async (req, res) => {
  try {
    const courseWhere = req.user.role === 'instructor'
      ? { id: req.params.courseId, instructorId: req.user.id }
      : { id: req.params.courseId, instituteId: req.user.instituteId };
    const course = await Course.findOne({ where: courseWhere });
    if (!course) return res.status(403).json({ error: 'Unauthorized to modify this course' });

    const { title, fileType, moduleId, lessonId } = req.body;
    let { fileUrl } = req.body;

    if (req.file) {
      const protocol = req.protocol;
      const host = req.get('host');
      fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
    }

    if (!fileUrl) {
      return res.status(400).json({ error: 'Please upload a file or provide a URL' });
    }

    const material = await CourseMaterial.create({
      title,
      fileUrl,
      fileType: fileType || 'pdf',
      moduleId,
      lessonId,
      courseId: req.params.courseId
    });
    res.status(201).json({ success: true, data: material });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Batch Assignment ──────────────────────────────────

exports.assignToBatch = async (req, res) => {
  try {
    // only institute role should assign batch. (Instructors cannot assign to batch)
    if (req.user.role !== 'institute') return res.status(403).json({ error: 'Only institute can assign batches' });

    const { batchId } = req.body;
    const batch = await Batch.findByPk(batchId);
    if (!batch || batch.instituteId !== req.user.instituteId) {
      return res.status(404).json({ error: 'Batch not found' });
    }
    
    batch.courseId = req.params.id;
    await batch.save();
    
    res.json({ success: true, message: 'Course assigned to batch successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Attendance Management ─────────────────────────────

exports.getCourseStudents = async (req, res) => {
  try {
    const course = await Course.findOne({
      where: { id: req.params.id, instituteId: req.user.instituteId },
      include: [
        {
          model: Batch,
          as: 'enrolledBatches',
          include: [
            {
              model: User,
              as: 'students',
              attributes: ['id', 'name', 'email', 'mobile', 'avatar'],
              through: { attributes: [] }
            }
          ]
        }
      ]
    });

    if (!course) return res.status(404).json({ error: 'Course not found' });

    // Flatten students from all batches
    const studentMap = new Map();
    course.enrolledBatches.forEach(batch => {
      batch.students.forEach(student => {
        if (!studentMap.has(student.id)) {
          studentMap.set(student.id, {
            ...student.toJSON(),
            batchId: batch.id,
            batchName: batch.name
          });
        }
      });
    });

    res.json({ success: true, data: Array.from(studentMap.values()) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.markAttendance = async (req, res) => {
  try {
    const { date, attendanceData } = req.body; // attendanceData: [{ studentId, batchId, status, remarks }]
    const instituteId = req.user.instituteId;
    const markedBy = req.user.id;

    if (!date || !attendanceData || !Array.isArray(attendanceData)) {
      return res.status(400).json({ error: 'Invalid attendance data provided' });
    }

    const records = attendanceData.map(item => ({
      date,
      studentId: item.studentId,
      batchId: item.batchId,
      courseId: req.body.courseId || null,
      status: item.status || 'present',
      remarks: item.remarks || '',
      instituteId,
      markedBy
    }));

    // Use upsert-like logic: delete existing records for this date/batch/students and insert new ones
    // Or just use bulkCreate with updateOnDuplicate if the DB supports it.
    // Since we have a unique constraint, we can use bulkCreate with ignore/update.
    
    await Attendance.bulkCreate(records, {
      updateOnDuplicate: ['status', 'remarks', 'markedBy', 'updatedAt']
    });

    res.json({ success: true, message: 'Attendance marked successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAttendance = async (req, res) => {
  try {
    const { date, batchId, courseId, studentId, startDate, endDate } = req.query;
    const where = {};

    // Scope by role
    if (req.user.role === 'student') {
      // Students only see their own records
      where.studentId = req.user.id;
    } else {
      // Institutes & instructors are scoped to their institute
      where.instituteId = req.user.instituteId;
      if (studentId) where.studentId = studentId;
    }

    if (date) where.date = date;
    if (batchId) where.batchId = batchId;
    if (courseId) where.courseId = courseId;
    if (startDate && endDate) {
      where.date = { [Op.between]: [startDate, endDate] };
    }

    const attendance = await Attendance.findAll({
      where,
      include: [
        { model: User, as: 'student', attributes: ['name', 'email'] },
        { model: Batch, as: 'batch', attributes: ['name'] },
        { model: Course, as: 'course', attributes: ['title'] },
        { model: User, as: 'marker', attributes: ['name'] }
      ],
      order: [['date', 'DESC']]
    });

    res.json({ success: true, data: attendance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Course Enrollment Requests ───────────────────────

exports.getEnrollmentRequests = async (req, res) => {
  try {
    const where = { instituteId: req.user.instituteId };
    
    // If we want to filter by status
    if (req.query.status) {
      where.status = req.query.status;
    }

    const requests = await EnrollmentRequest.findAll({
      where,
      include: [
        { model: User, as: 'student', attributes: ['id', 'name', 'email', 'mobile', 'avatar'] },
        { model: Course, as: 'course', attributes: ['id', 'title'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, data: requests });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.approveEnrollmentRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, batchId } = req.body; // status: 'approved' or 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const request = await EnrollmentRequest.findOne({
      where: { id, instituteId: req.user.instituteId },
      include: [{ model: Course, as: 'course' }]
    });

    if (!request) return res.status(404).json({ error: 'Request not found' });

    if (status === 'approved') {
      if (!batchId) return res.status(400).json({ error: 'Batch selection is required to approve' });
      
      // Verify the batch belongs to this course and institute
      const batch = await Batch.findOne({
        where: { id: batchId, instituteId: req.user.instituteId }
      });

      if (!batch) return res.status(404).json({ error: 'Batch not found' });
      
      // Set the batch's course if not already set, though usually it is.
      if (!batch.courseId) {
        batch.courseId = request.courseId;
        await batch.save();
      } else if (batch.courseId !== request.courseId) {
        return res.status(400).json({ error: 'Selected batch belongs to a different course' });
      }

      // Add student to batch
      await BatchStudent.findOrCreate({
        where: { batchId: batch.id, userId: request.studentId }
      });
    }

    request.status = status;
    await request.save();

    res.json({ success: true, message: `Request ${status} successfully` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Course Q&A Management ─────────────────────────────

// GET all questions for a course (institute, instructor & student)
exports.getCourseQA = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { status } = req.query;

    const where = { courseId };

    // Students can view all Q&A for the course (no institute scope needed)
    // Institutes & Instructors are scoped to their own institute
    if (req.user.role !== 'student') {
      where.instituteId = req.user.instituteId;
    }

    if (status === 'answered') where.isAnswered = true;
    if (status === 'unanswered') where.isAnswered = false;

    const questions = await CourseQA.findAll({
      where,
      include: [
        { model: User, as: 'askedBy', attributes: ['id', 'name', 'email', 'avatar'] },
        { model: User, as: 'answeredBy', attributes: ['id', 'name'] }
      ],
      order: [['isPinned', 'DESC'], ['createdAt', 'DESC']]
    });

    res.json({ success: true, data: questions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST answer a question (institute & instructor)
exports.answerQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { answer } = req.body;

    const qa = await CourseQA.findOne({ where: { id, instituteId: req.user.instituteId } });
    if (!qa) return res.status(404).json({ error: 'Question not found' });

    await qa.update({
      answer,
      answeredById: req.user.id,
      isAnswered: true,
      answeredAt: new Date()
    });

    res.json({ success: true, data: qa });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH toggle pin
exports.togglePinQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const qa = await CourseQA.findOne({ where: { id, instituteId: req.user.instituteId } });
    if (!qa) return res.status(404).json({ error: 'Question not found' });
    await qa.update({ isPinned: !qa.isPinned });
    res.json({ success: true, data: qa });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE a question
exports.deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const qa = await CourseQA.findOne({ where: { id, instituteId: req.user.instituteId } });
    if (!qa) return res.status(404).json({ error: 'Question not found' });
    await qa.destroy();
    res.json({ success: true, message: 'Question deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST ask a question (student)
exports.askQuestion = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { question } = req.body;

    if (!question?.trim()) return res.status(400).json({ error: 'Question cannot be empty' });

    const course = await Course.findByPk(courseId, { attributes: ['id', 'instituteId'] });
    if (!course) return res.status(404).json({ error: 'Course not found' });

    const qa = await CourseQA.create({
      question: question.trim(),
      courseId,
      askedById: req.user.id,
      instituteId: course.instituteId
    });

    res.status(201).json({ success: true, data: qa });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
