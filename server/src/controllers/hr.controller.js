const { Op } = require('sequelize');
const { Institute, User } = require('../models');
const { Department, Designation, Staff, LeaveType, LeaveRequest, Payroll, StaffAttendance, TeacherRating } = require('../models/HR.model');

// ─── Helper: get institute for logged-in user ──────────────────────
const getInstitute = async (userId) => {
  const institute = await Institute.findOne({ where: { ownerId: userId } });
  if (!institute) throw new Error('Institute not found');
  return institute;
};

// ══════════════════════════════════════════════════
//  DEPARTMENT
// ══════════════════════════════════════════════════

exports.getDepartments = async (req, res) => {
  try {
    const inst = await getInstitute(req.user.id);
    const data = await Department.findAll({
      where: { instituteId: inst.id },
      include: [{ model: Designation, as: 'designations' }],
      order: [['name', 'ASC']],
    });
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.createDepartment = async (req, res) => {
  try {
    const inst = await getInstitute(req.user.id);
    const { name, description } = req.body;
    const dept = await Department.create({ instituteId: inst.id, name, description });
    res.status(201).json({ success: true, data: dept });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.updateDepartment = async (req, res) => {
  try {
    const inst = await getInstitute(req.user.id);
    const dept = await Department.findOne({ where: { id: req.params.id, instituteId: inst.id } });
    if (!dept) return res.status(404).json({ error: 'Not found' });
    await dept.update(req.body);
    res.json({ success: true, data: dept });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.deleteDepartment = async (req, res) => {
  try {
    const inst = await getInstitute(req.user.id);
    await Department.destroy({ where: { id: req.params.id, instituteId: inst.id } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ══════════════════════════════════════════════════
//  DESIGNATION
// ══════════════════════════════════════════════════

exports.getDesignations = async (req, res) => {
  try {
    const inst = await getInstitute(req.user.id);
    const data = await Designation.findAll({
      where: { instituteId: inst.id },
      include: [{ model: Department, as: 'department', attributes: ['id', 'name'] }],
      order: [['name', 'ASC']],
    });
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.createDesignation = async (req, res) => {
  try {
    const inst = await getInstitute(req.user.id);
    const { name, departmentId, description } = req.body;
    const desig = await Designation.create({ instituteId: inst.id, name, departmentId, description });
    res.status(201).json({ success: true, data: desig });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.updateDesignation = async (req, res) => {
  try {
    const inst = await getInstitute(req.user.id);
    const desig = await Designation.findOne({ where: { id: req.params.id, instituteId: inst.id } });
    if (!desig) return res.status(404).json({ error: 'Not found' });
    await desig.update(req.body);
    res.json({ success: true, data: desig });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.deleteDesignation = async (req, res) => {
  try {
    const inst = await getInstitute(req.user.id);
    await Designation.destroy({ where: { id: req.params.id, instituteId: inst.id } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ══════════════════════════════════════════════════
//  STAFF DIRECTORY
// ══════════════════════════════════════════════════

exports.getStaff = async (req, res) => {
  try {
    const inst = await getInstitute(req.user.id);
    const { search, departmentId, isDisabled } = req.query;
    const where = { instituteId: inst.id };
    if (isDisabled === 'true') where.isDisabled = true;
    else if (isDisabled === 'false') where.isDisabled = false;
    if (departmentId) where.departmentId = departmentId;
    if (search) {
      where[Op.or] = [
        { name:  { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { mobile:{ [Op.like]: `%${search}%` } },
        { employeeCode: { [Op.like]: `%${search}%` } },
      ];
    }
    const data = await Staff.findAll({
      where,
      include: [
        { model: Department,  as: 'department',  attributes: ['id', 'name'] },
        { model: Designation, as: 'designation', attributes: ['id', 'name'] },
      ],
      order: [['name', 'ASC']],
    });
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.getStaffById = async (req, res) => {
  try {
    const inst = await getInstitute(req.user.id);
    const staff = await Staff.findOne({
      where: { id: req.params.id, instituteId: inst.id },
      include: [
        { model: Department,  as: 'department' },
        { model: Designation, as: 'designation' },
      ],
    });
    if (!staff) return res.status(404).json({ error: 'Staff not found' });
    res.json({ success: true, data: staff });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.createStaff = async (req, res) => {
  try {
    const inst = await getInstitute(req.user.id);
    const { name, email, mobile, departmentId, designationId, salary, joiningDate,
            gender, dob, address, qualification, experience, subjects,
            bankAccount, ifscCode, password } = req.body;

    // Auto employee code
    const count = await Staff.count({ where: { instituteId: inst.id } });
    const employeeCode = `EMP${String(count + 1).padStart(4, '0')}`;

    let userId = null;
    if (email || mobile) {
      const { Op } = require('sequelize');
      let existingUser = await User.findOne({
        where: { [Op.or]: [email ? { email } : null, mobile ? { mobile } : null].filter(Boolean) }
      });
      if (!existingUser) {
        existingUser = await User.create({
          name, email, mobile, role: 'instructor', instituteId: inst.id,
          password: password || '123456',
        });
      }
      userId = existingUser.id;
    }

    const staff = await Staff.create({
      instituteId: inst.id, userId, name, email, mobile, departmentId, designationId,
      salary: salary || 0, joiningDate, gender, dob, address, qualification, experience,
      subjects: subjects ? JSON.stringify(subjects) : null,
      bankAccount, ifscCode, employeeCode,
    });

    if (req.file) await staff.update({ avatar: req.file.filename });
    res.status(201).json({ success: true, data: staff });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.updateStaff = async (req, res) => {
  try {
    const inst = await getInstitute(req.user.id);
    const staff = await Staff.findOne({ where: { id: req.params.id, instituteId: inst.id } });
    if (!staff) return res.status(404).json({ error: 'Staff not found' });
    const updates = { ...req.body };
    if (req.file) updates.avatar = req.file.filename;
    if (updates.subjects && typeof updates.subjects !== 'string') {
      updates.subjects = JSON.stringify(updates.subjects);
    }
    await staff.update(updates);
    res.json({ success: true, data: staff });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.toggleStaffDisabled = async (req, res) => {
  try {
    const inst = await getInstitute(req.user.id);
    const staff = await Staff.findOne({ where: { id: req.params.id, instituteId: inst.id } });
    if (!staff) return res.status(404).json({ error: 'Staff not found' });
    await staff.update({ isDisabled: !staff.isDisabled, isActive: staff.isDisabled });
    res.json({ success: true, data: staff });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.deleteStaff = async (req, res) => {
  try {
    const inst = await getInstitute(req.user.id);
    await Staff.destroy({ where: { id: req.params.id, instituteId: inst.id } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ══════════════════════════════════════════════════
//  LEAVE TYPE
// ══════════════════════════════════════════════════

exports.getLeaveTypes = async (req, res) => {
  try {
    const inst = await getInstitute(req.user.id);
    const data = await LeaveType.findAll({ where: { instituteId: inst.id }, order: [['name', 'ASC']] });
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.createLeaveType = async (req, res) => {
  try {
    const inst = await getInstitute(req.user.id);
    const { name, totalDays, isPaid, description } = req.body;
    const lt = await LeaveType.create({ instituteId: inst.id, name, totalDays, isPaid, description });
    res.status(201).json({ success: true, data: lt });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.updateLeaveType = async (req, res) => {
  try {
    const inst = await getInstitute(req.user.id);
    const lt = await LeaveType.findOne({ where: { id: req.params.id, instituteId: inst.id } });
    if (!lt) return res.status(404).json({ error: 'Not found' });
    await lt.update(req.body);
    res.json({ success: true, data: lt });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.deleteLeaveType = async (req, res) => {
  try {
    const inst = await getInstitute(req.user.id);
    await LeaveType.destroy({ where: { id: req.params.id, instituteId: inst.id } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ══════════════════════════════════════════════════
//  LEAVE REQUESTS
// ══════════════════════════════════════════════════

exports.getLeaveRequests = async (req, res) => {
  try {
    const inst = await getInstitute(req.user.id);
    const { status } = req.query;
    const where = { instituteId: inst.id };
    if (status) where.status = status;
    const data = await LeaveRequest.findAll({
      where,
      include: [
        { model: Staff, as: 'staff', attributes: ['id', 'name', 'employeeCode', 'avatar'] },
        { model: LeaveType, as: 'leaveType', attributes: ['id', 'name', 'isPaid'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// Apply leave (by staff/admin on behalf of staff)
exports.applyLeave = async (req, res) => {
  try {
    const inst = await getInstitute(req.user.id);
    const { staffId, leaveTypeId, startDate, endDate, reason } = req.body;
    const staff = await Staff.findOne({ where: { id: staffId, instituteId: inst.id } });
    if (!staff) return res.status(404).json({ error: 'Staff not found' });
    const start = new Date(startDate), end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    const lr = await LeaveRequest.create({ instituteId: inst.id, staffId, leaveTypeId, startDate, endDate, days, reason });
    res.status(201).json({ success: true, data: lr });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.reviewLeave = async (req, res) => {
  try {
    const inst = await getInstitute(req.user.id);
    const { status, reviewNote } = req.body;
    const lr = await LeaveRequest.findOne({ where: { id: req.params.id, instituteId: inst.id } });
    if (!lr) return res.status(404).json({ error: 'Not found' });
    await lr.update({ status, reviewNote, reviewedBy: req.user.id });
    res.json({ success: true, data: lr });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ══════════════════════════════════════════════════
//  STAFF ATTENDANCE
// ══════════════════════════════════════════════════

exports.getStaffAttendance = async (req, res) => {
  try {
    const inst = await getInstitute(req.user.id);
    const { date, month, year, staffId } = req.query;
    const where = { instituteId: inst.id };
    if (staffId) where.staffId = staffId;
    if (date) where.date = date;
    else if (month && year) {
      const pad = String(month).padStart(2, '0');
      where.date = { [Op.between]: [`${year}-${pad}-01`, `${year}-${pad}-31`] };
    }
    const data = await StaffAttendance.findAll({
      where,
      include: [{ model: Staff, as: 'staff', attributes: ['id', 'name', 'employeeCode', 'avatar'] }],
      order: [['date', 'DESC']],
    });
    const staff = await Staff.findAll({ where: { instituteId: inst.id, isDisabled: false }, attributes: ['id', 'name', 'employeeCode', 'avatar'] });
    res.json({ success: true, data, staff });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.markStaffAttendance = async (req, res) => {
  try {
    const inst = await getInstitute(req.user.id);
    const { records, date } = req.body; // records: [{staffId, status, checkIn, checkOut, note}]
    const results = [];
    for (const r of records) {
      const [att, created] = await StaffAttendance.findOrCreate({
        where: { instituteId: inst.id, staffId: r.staffId, date: date || r.date },
        defaults: { ...r, instituteId: inst.id },
      });
      if (!created) await att.update(r);
      results.push(att);
    }
    res.json({ success: true, data: results });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ══════════════════════════════════════════════════
//  PAYROLL
// ══════════════════════════════════════════════════

exports.getPayroll = async (req, res) => {
  try {
    const inst = await getInstitute(req.user.id);
    const { month, year, staffId } = req.query;
    const where = { instituteId: inst.id };
    if (month) where.month = month;
    if (year) where.year = year;
    if (staffId) where.staffId = staffId;
    const data = await Payroll.findAll({
      where,
      include: [{ model: Staff, as: 'staff', attributes: ['id', 'name', 'employeeCode', 'avatar', 'salary'] }],
      order: [['year', 'DESC'], ['month', 'DESC']],
    });
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.generatePayroll = async (req, res) => {
  try {
    const inst = await getInstitute(req.user.id);
    const { month, year } = req.body;
    const allStaff = await Staff.findAll({ where: { instituteId: inst.id, isDisabled: false } });

    const results = [];
    for (const s of allStaff) {
      // Count attendance for month
      const pad = String(month).padStart(2, '0');
      const attCount = await StaffAttendance.count({
        where: {
          staffId: s.id,
          date: { [Op.between]: [`${year}-${pad}-01`, `${year}-${pad}-31`] },
          status: 'present',
        },
      });
      const halfDays = await StaffAttendance.count({
        where: {
          staffId: s.id,
          date: { [Op.between]: [`${year}-${pad}-01`, `${year}-${pad}-31`] },
          status: 'half_day',
        },
      });
      const daysInMonth = new Date(year, month, 0).getDate();
      const daysWorked = attCount + halfDays * 0.5;
      const perDaySalary = parseFloat(s.salary) / daysInMonth;
      const basicSalary = parseFloat(s.salary);
      const leaveDed = Math.max(0, (daysInMonth - daysWorked) - 2) * perDaySalary; // 2 days grace
      const netSalary = Math.max(0, basicSalary - leaveDed);

      const [pr] = await Payroll.findOrCreate({
        where: { instituteId: inst.id, staffId: s.id, month, year },
        defaults: { basicSalary, allowances: 0, deductions: 0, leaveDed, netSalary, daysWorked, instituteId: inst.id },
      });
      results.push(pr);
    }
    res.json({ success: true, data: results });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.updatePayroll = async (req, res) => {
  try {
    const inst = await getInstitute(req.user.id);
    const pr = await Payroll.findOne({ where: { id: req.params.id, instituteId: inst.id } });
    if (!pr) return res.status(404).json({ error: 'Not found' });
    const updates = { ...req.body };
    if (updates.status === 'paid') updates.paidAt = new Date();
    await pr.update(updates);
    res.json({ success: true, data: pr });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ══════════════════════════════════════════════════
//  TEACHER RATINGS
// ══════════════════════════════════════════════════

exports.getTeacherRatings = async (req, res) => {
  try {
    const inst = await getInstitute(req.user.id);
    const { month, year, staffId } = req.query;
    const where = { instituteId: inst.id };
    if (month) where.month = month;
    if (year) where.year = year;
    if (staffId) where.staffId = staffId;
    const data = await TeacherRating.findAll({
      where,
      include: [{ model: Staff, as: 'staff', attributes: ['id', 'name', 'employeeCode', 'avatar'] }],
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.createTeacherRating = async (req, res) => {
  try {
    const inst = await getInstitute(req.user.id);
    const { staffId, month, year, punctuality, teaching, discipline, communication, feedback } = req.body;
    const overall = ((+punctuality + +teaching + +discipline + +communication) / 4).toFixed(2);
    const [rating, created] = await TeacherRating.findOrCreate({
      where: { instituteId: inst.id, staffId, month, year },
      defaults: { punctuality, teaching, discipline, communication, overall, feedback, ratedBy: req.user.id, instituteId: inst.id },
    });
    if (!created) await rating.update({ punctuality, teaching, discipline, communication, overall, feedback });
    res.json({ success: true, data: rating });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// disabled staff helper  (just uses existing getStaff)
exports.getDisabledStaff = async (req, res) => {
  req.query.isDisabled = 'true';
  return exports.getStaff(req, res);
};
