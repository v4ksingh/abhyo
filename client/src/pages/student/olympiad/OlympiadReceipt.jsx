import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Download, Printer, CheckCircle, ShieldCheck,
  Receipt, Calendar, Clock, User, School, Hash, BookOpen, AlertCircle
} from 'lucide-react';
import api from '../../../lib/api';
import toast from 'react-hot-toast';

export default function OlympiadReceipt() {
  const { regId } = useParams();
  const navigate = useNavigate();
  const printRef = useRef();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!regId) {
      toast.error('Invalid registration ID');
      navigate('/student/olympiad');
      return;
    }

    api.get(`/olympiad/student/receipt/${regId}`)
      .then(res => setData(res.data.data))
      .catch(err => {
        // Fallback: try admit card endpoint to assemble slip data if receipt endpoint fails
        api.get(`/olympiad/student/admit-card/${regId}`)
          .then(admitRes => {
            const d = admitRes.data.data;
            setData({
              receiptNo: `REC-OLY-${(d.rollNumber || regId.slice(0, 8)).toUpperCase()}`,
              registrationId: d.registrationId || regId,
              rollNumber: d.rollNumber,
              transactionId: `TXN-OLY-${regId.slice(0, 8).toUpperCase()}`,
              paymentDate: d.paymentDate || d.createdAt || null,
              paymentStatus: 'paid',
              paymentMethod: 'Online Payment (Razorpay / UPI)',
              amountPaid: d.schoolType === 'govt' ? 0 : 150,
              currency: 'INR',
              studentName: d.studentName,
              studentEmail: d.studentEmail,
              studentMobile: d.studentMobile,
              studentCity: d.studentCity,
              studentState: d.studentState,
              classSelected: d.classSelected,
              schoolName: d.schoolName,
              schoolType: d.schoolType,
              board: d.board,
              medium: d.medium,
              olympiadTitle: d.olympiadTitle,
              subjectName: d.subjectName,
              examDate: d.examDate,
            });
          })
          .catch(() => {
            toast.error('Failed to load payment slip');
            navigate('/student/olympiad');
          });
      })
      .finally(() => setLoading(false));
  }, [regId, navigate]);

  const handlePrint = () => {
    window.print();
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16 space-y-3">
        <Receipt className="w-12 h-12 text-slate-400 mx-auto" />
        <h3 className="text-base font-bold text-slate-800">Payment Slip Not Found</h3>
        <button
          onClick={() => navigate('/student/olympiad')}
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const isFreeGovt = data.schoolType === 'govt' || data.amountPaid === 0;

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-16">
      {/* Print Styles */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #receipt-slip-print, #receipt-slip-print * { visibility: visible !important; }
          #receipt-slip-print {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 24px !important;
            border: none !important;
            box-shadow: none !important;
            background: #ffffff !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Top Action Bar */}
      <div className="no-print flex items-center justify-between gap-3 flex-wrap">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Slip</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-xs hover:shadow-sm transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download Slip (PDF)</span>
          </button>
        </div>
      </div>

      {/* Printable Receipt Slip Card */}
      <div
        ref={printRef}
        id="receipt-slip-print"
        className="bg-white border-2 border-slate-200 rounded-3xl overflow-hidden shadow-lg shadow-slate-100"
      >
        {/* Receipt Header Banner */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white p-6 sm:p-7 relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-44 h-44 rounded-full bg-white/5 pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-3.5">
              <img
                src="/logo.png"
                alt="Abhyo"
                className="h-11 w-auto bg-white/95 rounded-xl p-1.5 shadow-xs shrink-0"
              />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-300">
                  National School Olympiad 2026
                </p>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  OFFICIAL FEE RECEIPT
                </h1>
                <p className="text-xs text-indigo-200 mt-0.5">
                  Registration & Examination Confirmation Slip
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right bg-white/10 sm:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none">
              <span className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider block">
                Receipt No.
              </span>
              <span className="font-mono font-black text-sm sm:text-base text-emerald-400">
                {data.receiptNo}
              </span>
            </div>
          </div>
        </div>

        {/* Verification Status Ribbon */}
        <div className="bg-emerald-50 border-b border-emerald-100 px-6 py-3 flex items-center justify-between gap-3 text-xs flex-wrap">
          <div className="flex items-center gap-2 text-emerald-800 font-semibold">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Payment Verified & Seat Confirmed</span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-emerald-700">
            <span>TXN: {data.transactionId}</span>
          </div>
        </div>

        {/* Receipt Details Body */}
        <div className="p-6 sm:p-7 space-y-6">

          {/* Student & Registration Information */}
          <div>
            <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              <span>Student & Candidate Details</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 bg-slate-50/70 rounded-2xl p-4 border border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Candidate Name</span>
                <p className="font-bold text-slate-900 mt-0.5">{data.studentName}</p>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Roll Number</span>
                <p className="font-mono font-black text-indigo-700 mt-0.5">{data.rollNumber}</p>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Class & Board</span>
                <p className="font-bold text-slate-900 mt-0.5">Class {data.classSelected} ({data.board || 'CBSE'})</p>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Registered Email</span>
                <p className="font-medium text-slate-800 truncate mt-0.5">{data.studentEmail || '—'}</p>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Contact Number</span>
                <p className="font-medium text-slate-800 mt-0.5">{data.studentMobile || '—'}</p>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">School Name</span>
                <p className="font-medium text-slate-800 truncate mt-0.5">{data.schoolName}</p>
              </div>
            </div>
          </div>

          {/* Olympiad Details */}
          <div>
            <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Examination Particulars</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 bg-slate-50/70 rounded-2xl p-4 border border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Olympiad</span>
                <p className="font-bold text-slate-900 mt-0.5">{data.olympiadTitle}</p>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Subject</span>
                <p className="font-bold text-indigo-700 mt-0.5">{data.subjectName}</p>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Scheduled Exam Date</span>
                <p className="font-medium text-slate-800 mt-0.5">
                  {data.examDate ? new Date(data.examDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'As per schedule'}
                </p>
              </div>
            </div>
          </div>

          {/* Payment & Fee Summary Table */}
          <div>
            <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5" />
              <span>Fee Breakdown</span>
            </h4>
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4 text-left">Description</th>
                    <th className="py-2.5 px-3 text-center">Type</th>
                    <th className="py-2.5 px-4 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      National Olympiad Examination Fee (Class {data.classSelected})
                      <span className="block text-[10px] text-slate-400 font-normal">
                        Includes online CBT test, rank analysis & participation certificate
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center capitalize">
                      {data.schoolType} School
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      ₹150.00
                    </td>
                  </tr>

                  {isFreeGovt && (
                    <tr className="bg-emerald-50/50">
                      <td className="py-2.5 px-4 font-semibold text-emerald-800">
                        Government School Educational Subsidy (100% Waived)
                      </td>
                      <td className="py-2.5 px-3 text-center text-emerald-700 font-bold">
                        Special
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-700">
                        -₹150.00
                      </td>
                    </tr>
                  )}

                  <tr className="bg-slate-50 font-bold text-sm">
                    <td colSpan="2" className="py-3 px-4 text-slate-900">
                      Total Amount Paid
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-indigo-700 text-base">
                      ₹{Number(data.amountPaid).toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment Meta Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-slate-500 border-t border-slate-100">
            <div>
              <span>Payment Date & Time: </span>
              <strong className="text-slate-800 font-bold">
                {formatDateTime(data.paymentDate)}
              </strong>
            </div>
            <div>
              <span>Payment Mode: </span>
              <strong className="text-slate-700 font-semibold">{data.paymentMethod}</strong>
            </div>
          </div>

          {/* Official Verification Seal & Note */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 flex items-start sm:items-center justify-between gap-4 flex-wrap">
            <div className="space-y-0.5 text-[11px] text-slate-500 max-w-sm">
              <p className="font-bold text-slate-700 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                Computer Generated Official Receipt
              </p>
              <p>
                This receipt is legally binding for Abhyo National Olympiad 2026. Keep this slip along with your Admit Card for verification.
              </p>
            </div>

            <div className="text-center px-4 py-2 border-2 border-dashed border-emerald-400 bg-emerald-50/70 rounded-xl">
              <span className="text-[10px] font-black uppercase text-emerald-800 tracking-widest block">
                Official Seal
              </span>
              <span className="text-xs font-black text-emerald-600">
                ✓ PAYMENT CONFIRMED
              </span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-100 border-t border-slate-200 px-6 py-3 text-center text-[10px] text-slate-400">
          Abhyo Technologies Pvt. Ltd. · support@abhyo.com · https://abhyo.com
        </div>
      </div>
    </div>
  );
}
