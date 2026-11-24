const express = require('express');
const router = express.Router();
const hrController = require('../controllers/hr.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

// Apply auth middleware to all routes
router.use(protect);
router.use(authorize('institute', 'superadmin'));

// Departments
router.route('/departments')
  .get(hrController.getDepartments)
  .post(hrController.createDepartment);
router.route('/departments/:id')
  .put(hrController.updateDepartment)
  .delete(hrController.deleteDepartment);

// Designations
router.route('/designations')
  .get(hrController.getDesignations)
  .post(hrController.createDesignation);
router.route('/designations/:id')
  .put(hrController.updateDesignation)
  .delete(hrController.deleteDesignation);

// Staff Directory
router.route('/staff')
  .get(hrController.getStaff)
  .post(upload.single('avatar'), hrController.createStaff);
router.route('/staff/:id')
  .get(hrController.getStaffById)
  .put(upload.single('avatar'), hrController.updateStaff)
  .delete(hrController.deleteStaff);
router.put('/staff/:id/toggle-status', hrController.toggleStaffDisabled);

// Leave Types
router.route('/leave-types')
  .get(hrController.getLeaveTypes)
  .post(hrController.createLeaveType);
router.route('/leave-types/:id')
  .put(hrController.updateLeaveType)
  .delete(hrController.deleteLeaveType);

// Leave Requests
router.route('/leave-requests')
  .get(hrController.getLeaveRequests)
  .post(hrController.applyLeave);
router.put('/leave-requests/:id/review', hrController.reviewLeave);

// Staff Attendance
router.route('/attendance')
  .get(hrController.getStaffAttendance)
  .post(hrController.markStaffAttendance);

// Payroll
router.route('/payroll')
  .get(hrController.getPayroll);
router.post('/payroll/generate', hrController.generatePayroll);
router.put('/payroll/:id', hrController.updatePayroll);

// Teacher Ratings
router.route('/ratings')
  .get(hrController.getTeacherRatings)
  .post(hrController.createTeacherRating);

module.exports = router;
