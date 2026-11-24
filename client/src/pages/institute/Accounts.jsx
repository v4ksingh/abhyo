import React, { useState, useEffect } from 'react';
import { CreditCard, Download, Plus, Search, IndianRupee, Trash2, Calendar, FileText, ArrowUpRight, ArrowDownRight, Wallet, Layers, Filter, CheckCircle2, History, Edit, AlertCircle, TrendingUp, FilterX, Bell } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, AreaChart, Area } from 'recharts';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import { getImageUrl } from '../../lib/imageUrl';
import HRModule from './hr/HRModule';

export default function Accounts() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview'); // overview, payments, fees, structures, expenses
  const [report, setReport] = useState({ totalIncome: 0, totalExpense: 0, netBalance: 0, totalDue: 0 });
  const [studentFees, setStudentFees] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [feeStructures, setFeeStructures] = useState([]);
  const [institute, setInstitute] = useState(null);
  const [lmsCourses, setLmsCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Toggles
  const [chartRange, setChartRange] = useState(7); // 7 or 30 days
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, paid, partial, pending
  const [expenseCatFilter, setExpenseCatFilter] = useState('all');

  // Modal states
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState(null); // null means adding
  const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isStructModalOpen, setIsStructModalOpen] = useState(false);

  // Form states
  const [expenseForm, setExpenseForm] = useState({ title: '', amount: '', category: '', date: '' });
  const [feeForm, setFeeForm] = useState({ studentIds: [], totalFee: '', structId: '' });
  const [structForm, setStructForm] = useState({ courseName: '', totalFee: '', installmentType: 'lumpsum' });
  const [paymentForm, setPaymentForm] = useState({ studentId: '', amount: '', paymentMode: 'cash', transactionId: '', description: '', date: '' });


  const fetchData = async () => {
    try {
      setLoading(true);
      const [reportRes, feeRes, expRes, payRes, studentsRes, instProfileRes, structRes, lmsCoursesRes] = await Promise.all([
        api.get('/accounts/report'),
        api.get('/accounts/fees/students'),
        api.get('/accounts/expenses'),
        api.get('/accounts/payments/offline'),
        api.get('/institute/students'),
        api.get('/institute/profile'),
        api.get('/accounts/fees/structures'),
        api.get('/lms/courses')
      ]);
      if (reportRes.data.success) setReport(reportRes.data.report);
      if (feeRes.data.success) setStudentFees(feeRes.data.studentFees);
      if (expRes.data.success) setExpenses(expRes.data.expenses);
      if (payRes.data.success) setPayments(payRes.data.payments);
      if (studentsRes.data.success) setAllStudents(studentsRes.data.data || []);
      if (instProfileRes.data.success) {
        let profile = instProfileRes.data.data;
        if (typeof profile.courses === 'string') {
          try { profile.courses = JSON.parse(profile.courses); } catch (e) { }
        }
        setInstitute(profile);
      }
      if (structRes.data.success) setFeeStructures(structRes.data.feeStructures || []);
      if (lmsCoursesRes.data.success) setLmsCourses(lmsCoursesRes.data.data || []);
    } catch (err) {
      toast.error('Failed to load accounts data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Handlers ---

  const handleOpenExpenseModal = (expense = null) => {
    if (expense) {
      setEditingExpenseId(expense.id);
      setExpenseForm({
        title: expense.title,
        amount: expense.amount,
        category: expense.category || '',
        date: new Date(expense.date).toISOString().split('T')[0]
      });
    } else {
      setEditingExpenseId(null);
      setExpenseForm({ title: '', amount: '', category: '', date: new Date().toISOString().split('T')[0] });
    }
    setIsExpenseModalOpen(true);
  };

  const handleSaveExpense = async (e) => {
    e.preventDefault();
    try {
      if (editingExpenseId) {
        const res = await api.put(`/accounts/expenses/${editingExpenseId}`, expenseForm);
        if (res.data.success) toast.success('Expense updated');
      } else {
        const res = await api.post('/accounts/expenses', expenseForm);
        if (res.data.success) toast.success('Expense added');
      }
      setIsExpenseModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save expense');
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      await api.delete(`/accounts/expenses/${id}`);
      toast.success('Expense deleted');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete expense');
    }
  };

  const handleCreateStructure = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/accounts/fees/structures', structForm);
      if (res.data.success) {
        toast.success('Fee structure created');
        setIsStructModalOpen(false);
        setStructForm({ courseName: '', totalFee: '', installmentType: 'lumpsum' });
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create fee structure');
    }
  };

  const handleDeleteStructure = async (id) => {
    if (!window.confirm('Delete this course plan? It won\'t affect already assigned fees.')) return;
    try {
      await api.delete(`/accounts/fees/structures/${id}`);
      toast.success('Fee structure deleted');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete fee structure');
    }
  };

  const handleAssignFee = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/accounts/fees/students', feeForm);
      if (res.data.success) {
        toast.success(`Fee assigned successfully to ${res.data.count || 1} student(s)`);
        setIsFeeModalOpen(false);
        setFeeForm({ studentIds: [], totalFee: '', structId: '' });
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign fee');
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/accounts/payments/offline', paymentForm);
      if (res.data.success) {
        toast.success('Payment recorded successfully');
        setIsPaymentModalOpen(false);
        setPaymentForm({ studentId: '', amount: '', paymentMode: 'cash', transactionId: '', description: '', date: '' });
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record payment');
    }
  };

  const openQuickPay = (studentId, dueAmount) => {
    setPaymentForm({
      studentId: studentId,
      amount: dueAmount > 0 ? dueAmount : '',
      paymentMode: 'cash',
      transactionId: '',
      description: 'Fee Payment',
      date: new Date().toISOString().split('T')[0]
    });
    setIsPaymentModalOpen(true);
  };

  const handleSendReminder = async (studentId) => {
    try {
      const res = await api.post('/accounts/remind', { studentId });
      if (res.data.success) {
        toast.success(res.data.message || 'Reminder sent successfully');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reminder');
    }
  };

  // --- CSV Export Utilities ---
  const exportToCSV = (filename, rows) => {
    if (!rows || !rows.length) return toast.error("No data to export");
    const headers = Object.keys(rows[0]).join(',');
    const csvContent = rows.map(row =>
      Object.values(row).map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    const blob = new Blob([headers + '\n' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
  };

  const exportPayments = () => {
    const data = payments.map(p => ({
      Date: new Date(p.date).toLocaleDateString(),
      'Receipt No': p.id.split('-')[0],
      Student: p.user?.name || 'Walk-in',
      'Contact': p.user?.mobile || p.user?.email || '-',
      Mode: p.paymentMode,
      'Transaction ID': p.transactionId || '-',
      Description: p.description,
      Amount: p.amount
    }));
    exportToCSV(`Payments_${new Date().toLocaleDateString('en-CA')}`, data);
  };

  const exportFees = () => {
    const data = studentFees.map(f => ({
      Student: f.student?.name || '-',
      'Contact': f.student?.mobile || f.student?.email || '-',
      'Total Fee': f.totalFee,
      'Paid Amount': f.paidAmount,
      'Due Amount': f.totalFee - f.paidAmount,
      Status: f.status
    }));
    exportToCSV(`DueFees_${new Date().toLocaleDateString('en-CA')}`, data);
  };

  // --- Filtering & Derived Data ---

  const filteredFees = studentFees.filter(f => {
    const matchesSearch =
      (f.student?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.student?.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.student?.mobile || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'all') return true;
    if (statusFilter === 'pending') return f.status === 'pending';
    if (statusFilter === 'partial') return f.status === 'partial';
    if (statusFilter === 'paid') return f.status === 'paid';
    return true;
  });

  // Calculate unique expense categories
  const expenseCategories = [...new Set(expenses.map(e => e.category).filter(Boolean))];
  const filteredExpenses = expenses.filter(e => {
    if (expenseCatFilter === 'all') return true;
    return e.category === expenseCatFilter;
  });

  // Generate chart data based on selected range
  const datesMap = {};
  const today = new Date();
  for (let i = chartRange - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    datesMap[d.toLocaleDateString('en-CA')] = {
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      Income: 0,
      Expense: 0
    };
  }

  payments.forEach(p => {
    const d = new Date(p.date).toLocaleDateString('en-CA');
    if (datesMap[d]) datesMap[d].Income += p.amount;
  });
  expenses.forEach(e => {
    const d = new Date(e.date).toLocaleDateString('en-CA');
    if (datesMap[d]) datesMap[d].Expense += e.amount;
  });
  const chartData = Object.values(datesMap);

  // --- Print Receipt Logic Component ---
  const printReceipt = (tx) => {
    const printWindow = window.open('', '_blank');
    const logoUrl = getImageUrl(institute?.logo);
    const instName = institute?.name || 'Your Institute';
    const instAddress = institute?.contactAddress || institute?.city || '';
    const instEmail = institute?.website || '';

    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - ${tx.id}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; max-width: 800px; margin: 0 auto; line-height: 1.6; }
            .invoice-box { border: 1px solid #e2e8f0; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #f1f5f9; padding-bottom: 24px; margin-bottom: 32px; }
            .logo-container { display: flex; align-items: center; gap: 16px; }
            .logo { width: 64px; height: 64px; object-fit: contain; border-radius: 8px; }
            .inst-details h1 { margin: 0; color: #0f172a; font-size: 24px; font-weight: 700; }
            .inst-details p { margin: 4px 0 0; color: #64748b; font-size: 14px; }
            .receipt-title { text-align: right; }
            .receipt-title h2 { margin: 0; color: #4f46e5; font-size: 28px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
            .receipt-title p { margin: 8px 0 0; color: #64748b; font-size: 13px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 32px; }
            .info-box { background: #f8fafc; padding: 20px; border-radius: 8px; }
            .info-box h3 { margin: 0 0 12px; font-size: 12px; text-transform: uppercase; color: #94a3b8; font-weight: 600; letter-spacing: 0.5px; }
            .info-item { margin-bottom: 8px; display: flex; justify-content: space-between; font-size: 14px; }
            .info-item span:first-child { color: #64748b; }
            .info-item span:last-child { font-weight: 600; color: #0f172a; text-align: right; }
            .summary { margin-top: 32px; border-top: 2px solid #f1f5f9; padding-top: 24px; }
            .total-row { display: flex; justify-content: space-between; align-items: center; background: #4f46e5; color: white; padding: 16px 24px; border-radius: 8px; margin-top: 16px; }
            .total-row span:first-child { font-weight: 600; font-size: 16px; }
            .total-row span:last-child { font-weight: 700; font-size: 24px; }
            .footer { margin-top: 60px; display: flex; justify-content: space-between; align-items: flex-end; }
            .remarks { color: #64748b; font-size: 13px; font-style: italic; max-width: 50%; }
            .signature { text-align: right; }
            .signature-line { border-top: 1px solid #cbd5e1; width: 160px; padding-top: 8px; margin-top: 40px; font-size: 14px; color: #64748b; font-weight: 600; }
            @media print { body { padding: 0; } .invoice-box { border: none; box-shadow: none; padding: 20px; } }
          </style>
        </head>
        <body>
          <div class="invoice-box">
            <div class="header">
              <div class="logo-container">
                ${logoUrl ? `<img src="${logoUrl}" class="logo" alt="Logo" />` : ''}
                <div class="inst-details">
                  <h1>${instName}</h1>
                  ${instAddress ? `<p>${instAddress}</p>` : ''}
                  ${instEmail ? `<p>${instEmail}</p>` : ''}
                </div>
              </div>
              <div class="receipt-title">
                <h2>FEE RECEIPT</h2>
                <p>Date: ${new Date(tx.date).toLocaleDateString('en-IN')}</p>
                <p>Receipt No: #${tx.id.split('-')[0].toUpperCase()}</p>
              </div>
            </div>
            
            <div class="info-grid">
              <div class="info-box">
                <h3>Student Information</h3>
                <div class="info-item"><span>Name</span><span>${tx.user?.name || '-'}</span></div>
                <div class="info-item"><span>Contact</span><span>${tx.user?.mobile || tx.user?.email || '-'}</span></div>
              </div>
              <div class="info-box">
                <h3>Payment Details</h3>
                <div class="info-item"><span>Mode</span><span style="text-transform:capitalize">${tx.paymentMode}</span></div>
                ${tx.transactionId ? `<div class="info-item"><span>Reference No</span><span>${tx.transactionId}</span></div>` : ''}
                <div class="info-item"><span>Status</span><span style="color:#10b981">Successful</span></div>
              </div>
            </div>
            
            <div class="summary">
              <div class="info-item" style="font-size:16px; margin-bottom:16px;">
                <span>Payment Description</span>
                <span style="font-weight:400">${tx.description || 'Course Fee Installment'}</span>
              </div>
              <div class="total-row">
                <span>Total Amount Received</span>
                <span>₹ ${tx.amount.toLocaleString('en-IN')}</span>
              </div>
            </div>
            
            <div class="footer">
              <div class="remarks">
                <p>This is a computer generated receipt and does not require a physical signature.</p>
                <p style="margin-top:4px">Thank you for your payment!</p>
              </div>
              <div class="signature">
                <div class="signature-line">Authorized Signatory</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  };

  return (
    <div className="space-y-4 max-w-[1400px] mx-auto bg-slate-50/50 min-h-[calc(100vh-64px)] pb-10">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white px-5 py-3 shadow-sm border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-800 text-white rounded flex items-center justify-center shadow-sm">
            <Wallet size={16} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 leading-tight">Accounts & Finance</h1>
            <p className="text-xs text-slate-500">Financial Management Module</p>
          </div>
        </div>
        <div className="flex gap-2 mt-3 md:mt-0">
          <button onClick={() => setChartRange(chartRange === 7 ? 30 : 7)} className="px-3 py-1.5 border border-slate-300 text-slate-600 hover:bg-slate-50 rounded text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors">
            <TrendingUp size={14} /> {chartRange === 7 ? 'View 30 Days' : 'View 7 Days'}
          </button>
          <button onClick={() => handleOpenExpenseModal()} className="px-3 py-1.5 border border-slate-300 text-slate-600 hover:bg-slate-50 rounded text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors">
            <Plus size={14} /> Add Expense
          </button>
          <button onClick={() => {
            setPaymentForm({ studentId: '', amount: '', paymentMode: 'cash', transactionId: '', description: '', date: new Date().toISOString().split('T')[0] });
            setIsPaymentModalOpen(true);
          }} className="px-3 py-1.5 bg-slate-800 text-white hover:bg-slate-700 rounded text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors">
            <IndianRupee size={14} /> Receive Payment
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 px-5">
        {['overview', 'payments', 'fees', 'structures', 'expenses', 'hr'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors uppercase tracking-wider ${activeTab === tab ? 'border-slate-800 text-slate-800' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'}`}
          >
            {tab === 'hr' ? 'Human Resources' : tab.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="h-64 flex-center"><div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div></div>
      ) : activeTab === 'overview' ? (
        <div className="space-y-4 px-5 animate-fade-in">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 p-4 rounded shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Total Income</p>
                <h3 className="text-xl font-bold text-slate-900">₹{report.totalIncome.toLocaleString()}</h3>
              </div>
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 flex items-center justify-center rounded border border-emerald-100">
                <ArrowUpRight size={18} />
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Total Expenses</p>
                <h3 className="text-xl font-bold text-slate-900">₹{report.totalExpense.toLocaleString()}</h3>
              </div>
              <div className="w-10 h-10 bg-rose-50 text-rose-600 flex items-center justify-center rounded border border-rose-100">
                <ArrowDownRight size={18} />
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Net Balance</p>
                <h3 className="text-xl font-bold text-slate-900">₹{report.netBalance.toLocaleString()}</h3>
              </div>
              <div className="w-10 h-10 bg-blue-50 text-blue-600 flex items-center justify-center rounded border border-blue-100">
                <Wallet size={18} />
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Total Due Fees</p>
                <h3 className="text-xl font-bold text-slate-900">₹{report.totalDue.toLocaleString()}</h3>
              </div>
              <div className="w-10 h-10 bg-amber-50 text-amber-600 flex items-center justify-center rounded border border-amber-100">
                <AlertCircle size={18} />
              </div>
            </div>
          </div>

          {/* Income vs Expenses Chart */}
          <div className="card p-6 border-slate-200 shadow-sm bg-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <BarChart className="text-primary-500 w-5 h-5" /> Financial Trend ({chartRange} Days)
              </h3>
              <select className="input-field py-1" value={chartRange} onChange={e => setChartRange(Number(e.target.value))}>
                <option value={7}>Last 7 Days</option>
                <option value={30}>Last 30 Days</option>
              </select>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} minTickGap={20} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={v => `₹${v}`} width={60} />
                  <RechartsTooltip
                    cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                  <Area type="monotone" dataKey="Income" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                  <Area type="monotone" dataKey="Expense" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      ) : activeTab === 'payments' ? (
        <div className="space-y-4 px-5 animate-fade-in">
          <div className="flex justify-between items-center bg-white border border-slate-200 p-3 shadow-sm rounded">
            <div className="text-slate-800 text-sm font-bold flex items-center gap-2">
              <History className="w-4 h-4 text-slate-500" />
              Payment Receipts
            </div>
            <button onClick={exportPayments} className="px-3 py-1.5 border border-slate-300 text-slate-600 hover:bg-slate-50 rounded text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors">
              <Download size={14} /> Export CSV
            </button>
          </div>

          <div className="bg-white border border-slate-200 shadow-sm rounded overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500">
                    <th className="p-3 font-bold border-r border-slate-200 w-40">Date & ID</th>
                    <th className="p-3 font-bold border-r border-slate-200">Student Info</th>
                    <th className="p-3 font-bold border-r border-slate-200 w-48">Mode & Ref</th>
                    <th className="p-3 font-bold border-r border-slate-200 text-right w-32">Amount</th>
                    <th className="p-3 font-bold text-center w-24">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {payments.map(tx => (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="p-3 border-r border-slate-100">
                        <div className="font-semibold text-slate-800">{new Date(tx.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">#{tx.id.split('-')[0].toUpperCase()}</div>
                      </td>
                      <td className="p-3 border-r border-slate-100">
                        <div className="font-semibold text-slate-900">{tx.user?.name || 'Walk-in Student'}</div>
                        <div className="text-[10px] text-slate-500">{tx.user?.mobile || tx.user?.email || tx.description}</div>
                      </td>
                      <td className="p-3 border-r border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-block w-1.5 h-1.5 rounded-full ${tx.paymentMode === 'cash' ? 'bg-amber-400' : tx.paymentMode === 'upi' ? 'bg-indigo-400' : 'bg-blue-400'}`}></span>
                          <span className="capitalize font-semibold text-slate-700">{tx.paymentMode}</span>
                        </div>
                        {tx.transactionId && <div className="text-[10px] text-slate-500 mt-1 font-mono">{tx.transactionId}</div>}
                      </td>
                      <td className="p-3 border-r border-slate-100 text-right">
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                          + ₹{tx.amount.toLocaleString()}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button onClick={() => printReceipt(tx)} className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 transition-colors focus:ring-1 focus:ring-slate-300 outline-none" title="Print Receipt">
                          <Download size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {payments.length === 0 && (
                    <tr>
                      <td colSpan="5" className="p-12 text-center">
                        <div className="flex flex-col items-center justify-center text-slate-400">
                          <History className="w-12 h-12 mb-3 text-slate-200" />
                          <p className="text-base font-medium text-slate-600">No payments found</p>
                          <p className="text-sm">Record a payment to see it here.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      ) : activeTab === 'fees' ? (
        <div className="space-y-3 px-5 animate-fade-in">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2 bg-white border border-slate-200 p-2 shadow-sm rounded">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
              <input type="text" placeholder="Search student..." className="pl-8 pr-3 py-1.5 border border-slate-300 rounded text-xs w-48 focus:outline-none focus:ring-1 focus:ring-slate-400" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <select className="border border-slate-300 rounded text-xs px-2 py-1.5 text-slate-600 focus:outline-none" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
            </select>
            <div className="ml-auto flex gap-2">
              <button onClick={exportFees} className="px-3 py-1.5 border border-slate-300 text-slate-600 hover:bg-slate-50 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors"><Download size={13} /> Export</button>
              <button onClick={() => setIsFeeModalOpen(true)} className="px-3 py-1.5 bg-slate-800 text-white hover:bg-slate-700 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors"><CreditCard size={13} /> Assign Fee</button>
            </div>
          </div>
          {/* Fees Table */}
          <div className="bg-white border border-slate-200 shadow-sm rounded overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[820px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500">
                    <th className="p-3 font-bold border-r border-slate-200">Student</th>
                    <th className="p-3 font-bold border-r border-slate-200 w-28">Total Fee</th>
                    <th className="p-3 font-bold border-r border-slate-200 w-44">Paid</th>
                    <th className="p-3 font-bold border-r border-slate-200 w-28">Balance Due</th>
                    <th className="p-3 font-bold border-r border-slate-200 w-24">Status</th>
                    <th className="p-3 font-bold text-right w-36">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredFees.map(fee => {
                    const dueAmount = fee.totalFee - fee.paidAmount;
                    const pct = Math.min(100, Math.round((fee.paidAmount / fee.totalFee) * 100)) || 0;
                    return (
                      <tr key={fee.id} className="hover:bg-blue-50/30 transition-colors group">
                        <td className="p-3 border-r border-slate-100">
                          <div className="text-xs font-bold text-slate-900">{fee.student?.name}</div>
                          <div className="text-[10px] text-slate-400">{fee.student?.mobile || fee.student?.email}</div>
                        </td>
                        <td className="p-3 border-r border-slate-100 text-xs font-bold text-slate-700">₹{fee.totalFee.toLocaleString()}</td>
                        <td className="p-3 border-r border-slate-100">
                          <div className="text-xs font-bold text-emerald-700 mb-1">₹{fee.paidAmount.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">({pct}%)</span></div>
                          <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-emerald-500' : pct > 50 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${pct}%` }} />
                          </div>
                        </td>
                        <td className="p-3 border-r border-slate-100">
                          <span className={`text-xs font-bold ${dueAmount > 0 ? 'text-red-600' : 'text-slate-400'}`}>₹{dueAmount.toLocaleString()}</span>
                        </td>
                        <td className="p-3 border-r border-slate-100">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                            fee.status === 'paid' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                            fee.status === 'partial' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                            'bg-red-100 text-red-800 border border-red-200'}`}>
                            {fee.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {dueAmount > 0 && (
                              <button onClick={() => handleSendReminder(fee.studentId)} title="Send Reminder" className="p-1.5 rounded border border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors">
                                <Bell size={12} />
                              </button>
                            )}
                            <button onClick={() => openQuickPay(fee.studentId, dueAmount)} disabled={dueAmount <= 0}
                              className={`px-2.5 py-1 rounded text-[10px] font-bold border transition-colors ${
                                dueAmount > 0 ? 'bg-slate-800 text-white border-slate-800 hover:bg-slate-700 cursor-pointer' : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'}`}>
                              Quick Pay
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredFees.length === 0 && (
                    <tr><td colSpan="6" className="py-16 text-center text-xs text-slate-400">No fee records found. Assign a fee to a student first.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      ) : activeTab === 'structures' ? (
        <div className="space-y-3 px-5 animate-fade-in">
          <div className="flex items-center justify-between bg-white border border-slate-200 p-2 shadow-sm rounded">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Layers size={14} className="text-slate-500" /> Course Fee Plans
              <span className="ml-1 px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold">{feeStructures.length}</span>
            </div>
            <button onClick={() => setIsStructModalOpen(true)} className="px-3 py-1.5 bg-slate-800 text-white hover:bg-slate-700 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors"><Plus size={13} /> New Plan</button>
          </div>
          <div className="bg-white border border-slate-200 shadow-sm rounded overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500">
                  <th className="p-3 font-bold border-r border-slate-200">Course / Plan Name</th>
                  <th className="p-3 font-bold border-r border-slate-200 w-32">Payment Type</th>
                  <th className="p-3 font-bold border-r border-slate-200 w-32">Total Fee</th>
                  <th className="p-3 font-bold border-r border-slate-200 w-28">Created</th>
                  <th className="p-3 font-bold text-right w-36">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {feeStructures.map(struct => (
                  <tr key={struct.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="p-3 border-r border-slate-100">
                      <div className="text-xs font-bold text-slate-900">{struct.courseName}</div>
                    </td>
                    <td className="p-3 border-r border-slate-100">
                      <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wide rounded border border-slate-200">{(struct.installmentType || 'lumpsum').replace('_', ' ')}</span>
                    </td>
                    <td className="p-3 border-r border-slate-100">
                      <span className="text-xs font-bold text-slate-800">₹{parseFloat(struct.totalFee).toLocaleString()}</span>
                    </td>
                    <td className="p-3 border-r border-slate-100">
                      <span className="text-[10px] text-slate-500">{new Date(struct.createdAt).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}</span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { setFeeForm({ ...feeForm, structId: struct.id, totalFee: struct.totalFee }); setIsFeeModalOpen(true); }}
                          className="px-2.5 py-1 rounded text-[10px] font-bold bg-slate-800 text-white hover:bg-slate-700 border border-slate-800 transition-colors">
                          Assign
                        </button>
                        <button onClick={() => handleDeleteStructure(struct.id)} className="p-1.5 rounded border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 transition-colors" title="Delete">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {feeStructures.length === 0 && (
                  <tr><td colSpan="5" className="py-16 text-center text-xs text-slate-400">No course plans yet. Click "New Plan" to create one.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'expenses' ? (
        <div className="space-y-3 px-5 animate-fade-in">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2 bg-white border border-slate-200 p-2 shadow-sm rounded">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <ArrowDownRight size={14} className="text-rose-500" /> Operating Expenses
            </div>
            {expenseCategories.length > 0 && (
              <select className="border border-slate-300 rounded text-xs px-2 py-1.5 text-slate-600 focus:outline-none ml-2" value={expenseCatFilter} onChange={e => setExpenseCatFilter(e.target.value)}>
                <option value="all">All Categories</option>
                {expenseCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            )}
            <button onClick={() => handleOpenExpenseModal()} className="ml-auto px-3 py-1.5 bg-slate-800 text-white hover:bg-slate-700 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors">
              <Plus size={13} /> New Record
            </button>
          </div>
          <div className="bg-white border border-slate-200 shadow-sm rounded overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500">
                    <th className="p-3 font-bold border-r border-slate-200 w-32">Date</th>
                    <th className="p-3 font-bold border-r border-slate-200">Title / Description</th>
                    <th className="p-3 font-bold border-r border-slate-200 w-36">Category</th>
                    <th className="p-3 font-bold border-r border-slate-200 text-right w-32">Amount</th>
                    <th className="p-3 font-bold text-right w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredExpenses.map(exp => (
                    <tr key={exp.id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="p-3 border-r border-slate-100 text-[10px] text-slate-600 font-mono">
                        {new Date(exp.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="p-3 border-r border-slate-100 text-xs font-semibold text-slate-900">{exp.title}</td>
                      <td className="p-3 border-r border-slate-100">
                        {exp.category
                          ? <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase border border-slate-200">{exp.category}</span>
                          : <span className="text-slate-300 text-[10px]">—</span>}
                      </td>
                      <td className="p-3 border-r border-slate-100 text-right">
                        <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">- ₹{exp.amount.toLocaleString()}</span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleOpenExpenseModal(exp)} className="p-1.5 rounded border border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors" title="Edit"><Edit size={12} /></button>
                          <button onClick={() => handleDeleteExpense(exp.id)} className="p-1.5 rounded border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 transition-colors" title="Delete"><Trash2 size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredExpenses.length === 0 && (
                    <tr><td colSpan="5" className="py-16 text-center text-xs text-slate-400">No expenses recorded. Click "New Record" to add one.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === 'hr' && (
        <div className="px-5 animate-fade-in">
          <HRModule />
        </div>
      )}

      {/* --- MODALS --- */}

      {/* Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fade-in">
          <div className="bg-white w-full max-w-md shadow-2xl border border-slate-200 rounded overflow-hidden">
            <div className="bg-slate-800 px-4 py-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2"><ArrowDownRight size={14} className="text-rose-300" />{editingExpenseId ? 'Edit Expense Record' : 'New Expense Record'}</h2>
              <button onClick={() => setIsExpenseModalOpen(false)} className="text-slate-400 hover:text-white text-lg leading-none">×</button>
            </div>
            <form onSubmit={handleSaveExpense} className="p-4 space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Title / Description</label>
                <input required type="text" className="w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400" value={expenseForm.title} onChange={e => setExpenseForm({ ...expenseForm, title: e.target.value })} placeholder="e.g. Server Maintenance, Office Rent" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Amount (₹)</label>
                  <input required type="number" min="0" className="w-full border border-slate-300 rounded px-3 py-1.5 text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400" value={expenseForm.amount} onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })} placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Date</label>
                  <input type="date" required className="w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400" value={expenseForm.date} onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Category</label>
                <input type="text" className="w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400" value={expenseForm.category} onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })} placeholder="e.g. Utility, Tech" list="exp-cats" />
                <datalist id="exp-cats">{expenseCategories.map(c => <option key={c} value={c} />)}</datalist>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 mt-2">
                <button type="button" onClick={() => setIsExpenseModalOpen(false)} className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded border border-slate-200 transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-1.5 text-xs font-bold bg-slate-800 text-white hover:bg-slate-700 rounded transition-colors flex items-center gap-1.5"><CheckCircle2 size={13} />{editingExpenseId ? 'Update' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Fee Modal */}
      {isFeeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fade-in">
          <div className="bg-white w-full max-w-md shadow-2xl border border-slate-200 rounded overflow-hidden">
            <div className="bg-slate-800 px-4 py-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2"><CreditCard size={14} className="text-blue-300" /> Assign Fee to Student(s)</h2>
              <button onClick={() => setIsFeeModalOpen(false)} className="text-slate-400 hover:text-white text-lg leading-none">×</button>
            </div>
            <form onSubmit={handleAssignFee} className="p-4 space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Select Students <span className="normal-case text-slate-400">(hold Ctrl for multiple)</span></label>
                <select multiple required className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-900 cursor-pointer min-h-[120px] focus:outline-none focus:ring-1 focus:ring-slate-400" value={feeForm.studentIds} onChange={e => setFeeForm({ ...feeForm, studentIds: Array.from(e.target.selectedOptions, o => o.value) })}>
                  {allStudents.map(s => <option key={s.id} value={s.id}>{s.name} ({s.email || s.mobile || 'N/A'})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Fee Plan Preset <span className="normal-case text-slate-400">(optional)</span></label>
                <select className="w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400" value={feeForm.structId} onChange={e => { const s = feeStructures.find(x => x.id === e.target.value); setFeeForm({ ...feeForm, structId: e.target.value, totalFee: s ? s.totalFee : feeForm.totalFee }); }}>
                  <option value="">-- Custom Amount --</option>
                  {feeStructures.map(s => <option key={s.id} value={s.id}>{s.courseName} — ₹{s.totalFee.toLocaleString()}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total Course Fee (₹)</label>
                <input required type="number" min="0" className="w-full border border-slate-300 rounded px-3 py-1.5 text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400" value={feeForm.totalFee} onChange={e => setFeeForm({ ...feeForm, totalFee: e.target.value })} placeholder="e.g. 15000" />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 mt-2">
                <button type="button" onClick={() => setIsFeeModalOpen(false)} className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded border border-slate-200 transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-1.5 text-xs font-bold bg-slate-800 text-white hover:bg-slate-700 rounded transition-colors">Assign Fee</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receive Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fade-in">
          <div className="bg-white w-full max-w-md shadow-2xl border border-slate-200 rounded overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="bg-slate-800 px-4 py-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2"><IndianRupee size={14} className="text-emerald-300" /> Receive Payment</h2>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-white text-lg leading-none">×</button>
            </div>
            <form onSubmit={handleAddPayment} className="p-4 space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Paying Student</label>
                <select required className="w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400" value={paymentForm.studentId} onChange={e => setPaymentForm({ ...paymentForm, studentId: e.target.value })}>
                  <option value="">-- Select Student --</option>
                  {allStudents.map(s => <option key={s.id} value={s.id}>{s.name} ({s.email || s.mobile || 'No Contact'})</option>)}
                </select>
                {paymentForm.studentId && studentFees.find(f => f.studentId === paymentForm.studentId) && (() => {
                  const f = studentFees.find(f => f.studentId === paymentForm.studentId);
                  const bal = f.totalFee - f.paidAmount;
                  return bal > 0
                    ? <div className="mt-1 text-[10px] font-bold text-red-500">Current Due: ₹{bal.toLocaleString()}</div>
                    : <div className="mt-1 text-[10px] font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 size={10} /> Fully Paid</div>;
                })()}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Amount (₹)</label>
                  <input required type="number" min="1" className="w-full border border-slate-300 rounded px-3 py-1.5 text-xs font-mono text-emerald-700 font-bold focus:outline-none focus:ring-1 focus:ring-slate-400" value={paymentForm.amount} onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })} placeholder="0" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Date</label>
                  <input type="date" required className="w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400" value={paymentForm.date} onChange={e => setPaymentForm({ ...paymentForm, date: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Payment Method</label>
                <div className="flex gap-2">
                  {['cash', 'upi', 'bank'].map(mode => (
                    <button key={mode} type="button" onClick={() => setPaymentForm({ ...paymentForm, paymentMode: mode })}
                      className={`flex-1 py-1.5 rounded text-xs font-bold border capitalize transition-colors ${paymentForm.paymentMode === mode ? 'bg-slate-800 text-white border-slate-800' : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'}`}>
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
              {(paymentForm.paymentMode === 'upi' || paymentForm.paymentMode === 'bank') && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Ref / Transaction ID</label>
                  <input type="text" className="w-full border border-slate-300 rounded px-3 py-1.5 text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400" value={paymentForm.transactionId} onChange={e => setPaymentForm({ ...paymentForm, transactionId: e.target.value })} placeholder="e.g. UTR123456789" />
                </div>
              )}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Remarks</label>
                <textarea className="w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 min-h-[60px] resize-none focus:outline-none focus:ring-1 focus:ring-slate-400" placeholder="e.g. Installment 1 for Main Course" value={paymentForm.description} onChange={e => setPaymentForm({ ...paymentForm, description: e.target.value })} />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 mt-2">
                <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded border border-slate-200 transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-1.5 text-xs font-bold bg-emerald-700 text-white hover:bg-emerald-800 rounded transition-colors flex items-center gap-1.5"><IndianRupee size={13} /> Record Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Fee Structure Modal */}
      {isStructModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fade-in">
          <div className="bg-white w-full max-w-md shadow-2xl border border-slate-200 rounded overflow-hidden">
            <div className="bg-slate-800 px-4 py-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2"><Layers size={14} className="text-indigo-300" /> New Course Fee Plan</h2>
              <button onClick={() => setIsStructModalOpen(false)} className="text-slate-400 hover:text-white text-lg leading-none">×</button>
            </div>
            <form onSubmit={handleCreateStructure} className="p-4 space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Select Course</label>
                {(lmsCourses && lmsCourses.length > 0) ? (
                  <select required className="w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400" value={structForm.courseName} onChange={e => { const sel = lmsCourses.find(c => c.title === e.target.value); setStructForm({ ...structForm, courseName: e.target.value, totalFee: sel && sel.price ? sel.price.toString() : structForm.totalFee }); }}>
                    <option value="">-- Choose a Course --</option>
                    {lmsCourses.map(c => <option key={c.id} value={c.title}>{c.title} {c.price ? `(₹${c.price})` : ''}</option>)}
                  </select>
                ) : (
                  <input required type="text" className="w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400" value={structForm.courseName} onChange={e => setStructForm({ ...structForm, courseName: e.target.value })} placeholder="e.g. Target NEET 2024" />
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total Fee (₹)</label>
                  <input required type="number" min="0" className="w-full border border-slate-300 rounded px-3 py-1.5 text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400" value={structForm.totalFee} onChange={e => setStructForm({ ...structForm, totalFee: e.target.value })} placeholder="50000" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Payment Frequency</label>
                  <select className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400" value={structForm.installmentType} onChange={e => setStructForm({ ...structForm, installmentType: e.target.value })}>
                    <option value="lumpsum">Lumpsum</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="half_yearly">Half Yearly</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 mt-2">
                <button type="button" onClick={() => setIsStructModalOpen(false)} className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded border border-slate-200 transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-1.5 text-xs font-bold bg-slate-800 text-white hover:bg-slate-700 rounded transition-colors">Create Plan</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
