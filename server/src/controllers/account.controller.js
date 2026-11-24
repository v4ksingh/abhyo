const { FeeStructure, StudentFee, Payment, Expense, User, Institute } = require('../models');
const { Op } = require('sequelize');

// ---- Fee Structures ----
exports.createFeeStructure = async (req, res) => {
  try {
    const { courseName, totalFee, installmentType } = req.body;
    const feeStructure = await FeeStructure.create({
      instituteId: req.user.instituteId || req.user.id,
      courseName,
      totalFee,
      installmentType,
    });
    res.status(201).json({ success: true, feeStructure });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteFeeStructure = async (req, res) => {
  try {
    const { id } = req.params;
    await FeeStructure.destroy({ where: { id, instituteId: req.user.instituteId || req.user.id } });
    res.json({ success: true, message: 'Fee structure deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getFeeStructures = async (req, res) => {
  try {
    const feeStructures = await FeeStructure.findAll({
      where: { instituteId: req.user.instituteId || req.user.id }
    });
    res.json({ success: true, feeStructures });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---- Student Fees ----
exports.assignStudentFee = async (req, res) => {
  try {
    const { studentId, studentIds, totalFee } = req.body;
    const idsToAssign = studentIds && studentIds.length > 0 ? studentIds : (studentId ? [studentId] : []);
    
    if (idsToAssign.length === 0) {
      return res.status(400).json({ success: false, message: 'No students selected' });
    }

    const instituteId = req.user.instituteId || req.user.id;
    const assignedFees = [];

    for (const sid of idsToAssign) {
      let studentFee = await StudentFee.findOne({
        where: { studentId: sid, instituteId }
      });

      if (studentFee) {
        studentFee.totalFee = totalFee;
        await studentFee.save();
        assignedFees.push(studentFee);
      } else {
        studentFee = await StudentFee.create({
          studentId: sid,
          instituteId,
          totalFee,
          paidAmount: 0
        });
        assignedFees.push(studentFee);
      }
    }

    res.json({ success: true, count: assignedFees.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getStudentFees = async (req, res) => {
  try {
    const studentFees = await StudentFee.findAll({
      where: { instituteId: req.user.instituteId || req.user.id },
      include: [{ model: User, as: 'student', attributes: ['id', 'name', 'email', 'mobile'] }]
    });
    res.json({ success: true, studentFees });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---- Offline Payments ----
exports.addOfflinePayment = async (req, res) => {
  try {
    const { studentId, amount, paymentMode, transactionId, description, date } = req.body;
    const instituteId = req.user.instituteId || req.user.id;

    // Create payment entry
    const payment = await Payment.create({
      userId: studentId,
      instituteId,
      amount,
      status: 'success',
      type: 'fee_payment',
      paymentMode: paymentMode || 'cash',
      transactionId,
      description: description || 'Offline Fee Payment',
      date: date || new Date()
    });

    // Update StudentFee
    const studentFee = await StudentFee.findOne({ where: { studentId, instituteId } });
    if (studentFee) {
      studentFee.paidAmount = parseFloat(studentFee.paidAmount) + parseFloat(amount);
      await studentFee.save();
    }

    res.status(201).json({ success: true, payment, studentFee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getOfflinePayments = async (req, res) => {
  try {
    const payments = await Payment.findAll({
      where: { 
        instituteId: req.user.instituteId || req.user.id,
        type: 'fee_payment'
      },
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'mobile'] }],
      order: [['date', 'DESC'], ['createdAt', 'DESC']]
    });
    res.json({ success: true, payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---- Expenses ----
exports.addExpense = async (req, res) => {
  try {
    const { title, amount, category, date } = req.body;
    const expense = await Expense.create({
      instituteId: req.user.instituteId || req.user.id,
      title,
      amount,
      category,
      date: date || new Date()
    });
    res.status(201).json({ success: true, expense });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.findAll({
      where: { instituteId: req.user.instituteId || req.user.id },
      order: [['date', 'DESC']]
    });
    res.json({ success: true, expenses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;
    await Expense.destroy({ where: { id: expenseId, instituteId: req.user.instituteId || req.user.id } });
    res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.editExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;
    const { title, amount, category, date } = req.body;
    
    const expense = await Expense.findOne({ 
      where: { id: expenseId, instituteId: req.user.instituteId || req.user.id } 
    });

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    if (title) expense.title = title;
    if (amount !== undefined) expense.amount = amount;
    if (category) expense.category = category;
    if (date) expense.date = date;

    await expense.save();
    res.json({ success: true, expense });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---- Reports ----
exports.getAccountReport = async (req, res) => {
  try {
    const instituteId = req.user.instituteId || req.user.id;
    
    // Total Income from Payments
    const incomePayments = await Payment.findAll({
      where: {
        instituteId,
        type: 'fee_payment',
        status: 'success'
      }
    });
    const totalIncome = incomePayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

    // Total Expenses
    const expenses = await Expense.findAll({
      where: { instituteId }
    });
    const totalExpense = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

    const netBalance = totalIncome - totalExpense;

    // Due amounts
    const studentFees = await StudentFee.findAll({ where: { instituteId } });
    const totalDue = studentFees.reduce((sum, f) => sum + (parseFloat(f.totalFee) - parseFloat(f.paidAmount)), 0);

    res.json({
      success: true,
      report: {
        totalIncome,
        totalExpense,
        netBalance,
        totalDue
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.sendPaymentReminder = async (req, res) => {
  try {
    const { studentId } = req.body;
    const { Notification } = require('../models');

    const studentFee = await StudentFee.findOne({
      where: { studentId, instituteId: req.user.instituteId || req.user.id },
      include: [{ model: User, as: 'student', attributes: ['id', 'name', 'email', 'mobile'] }]
    });

    if (!studentFee) return res.status(404).json({ success: false, message: 'Fee record not found' });

    const dueAmount = studentFee.totalFee - studentFee.paidAmount;
    if (dueAmount <= 0) return res.status(400).json({ success: false, message: 'No due amount for this student' });

    // Create a mock notification
    if (Notification) {
      await Notification.create({
        type: 'FEE_REMINDER',
        title: 'Fee Payment Reminder',
        message: `Dear ${studentFee.student?.name}, you have a pending fee of ₹${dueAmount.toLocaleString()}. Please clear it soon.`,
        userId: studentId,
        isRead: false
      });
    }

    res.json({ success: true, message: 'Reminder sent successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
