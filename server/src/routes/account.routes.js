const express = require('express');
const router = express.Router();
const accountController = require('../controllers/account.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

// All account routes require institute or admin access
router.use(protect);
router.use(authorize('institute', 'admin', 'superadmin'));

// Fee Structures
router.route('/fees/structures')
  .post(accountController.createFeeStructure)
  .get(accountController.getFeeStructures);

router.delete('/fees/structures/:id', accountController.deleteFeeStructure);

// Student Fees
router.route('/fees/students')
  .post(accountController.assignStudentFee)
  .get(accountController.getStudentFees);

// Offline Payments
router.route('/payments/offline')
  .post(accountController.addOfflinePayment)
  .get(accountController.getOfflinePayments);

// Expenses
router.route('/expenses')
  .post(accountController.addExpense)
  .get(accountController.getExpenses);

router.route('/expenses/:expenseId')
  .put(accountController.editExpense)
  .delete(accountController.deleteExpense);

// Report
router.get('/report', accountController.getAccountReport);

// Reminders
router.post('/remind', accountController.sendPaymentReminder);

module.exports = router;
