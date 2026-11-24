import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trophy, Calendar, Clock, FileText, Award, ArrowRight,
  CheckCircle, AlertCircle, BookOpen, Star, Download, RefreshCw, Receipt
} from 'lucide-react';
import api from '../../../lib/api';

const StatusBadge = ({ status }) => {
  const map = {
    open:      { cls: 'bg-green-100 text-green-700 border border-green-200',   label: '🟢 Registration Open' },
    closed:    { cls: 'bg-yellow-100 text-yellow-700 border border-yellow-200', label: '🟡 Registration Closed' },
    ongoing:   { cls: 'bg-blue-100 text-blue-700 border border-blue-200',       label: '🔵 Exam Ongoing' },
    completed: { cls: 'bg-purple-100 text-purple-700 border border-purple-200', label: '🟣 Completed' },
    draft:     { cls: 'bg-slate-100 text-slate-600 border border-slate-200',    label: 'Upcoming' },
  };
  const cfg = map[status] || map.draft;
  return <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cfg.cls}`}>{cfg.label}</span>;
};

const PaymentBadge = ({ status, schoolType }) => {
  if (status === 'paid') {
    if (schoolType === 'govt') {
      return (
        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
          🏛️ Govt School (Free Waiver)
        </span>
      );
    }
    return <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">✅ Confirmed</span>;
  }
  if (status === 'pending') return <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 border border-orange-200">⏳ Payment Pending</span>;
  return <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-700 border border-red-200">❌ Failed</span>;
};

export default function OlympiadDashboard() {
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState([]);
  const [publicOlympiads, setPublicOlympiads] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const r1 = await api.get('/olympiad/student/registrations');
      setRegistrations(r1.data.data || []);
    } catch (e) {
      console.error('Registrations fetch failed:', e.message);
    }
    try {
      const r2 = await api.get('/olympiad/public/list');
      setPublicOlympiads(r2.data.data || []);
    } catch (e) {
      console.error('Public olympiads fetch failed:', e.message);
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  // All registered olympiad IDs (any payment status)
  const myRegIds = new Set(registrations.map(r => r.olympiadId));
  // Only show "upcoming" if not already registered
  const upcoming = publicOlympiads.filter(o => ['open', 'draft'].includes(o.status) && !myRegIds.has(o.id));
  // Paid = confirmed
  const paidRegs = registrations.filter(r => r.paymentStatus === 'paid');
  // Pending payment
  const pendingRegs = registrations.filter(r => r.paymentStatus !== 'paid');

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8 max-w-5xl mx-auto">

      {/* ── Hero Banner ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-8 text-white">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
            <Trophy className="w-8 h-8 text-yellow-300" />
          </div>
          <div>
            <h1 className="text-2xl font-black leading-tight">Abhyo Olympiad</h1>
            <p className="text-white/80 mt-1">Compete nationally · Earn recognition · Win prizes</p>
          </div>
          <div className="sm:ml-auto flex items-center gap-2 flex-wrap">
            <button onClick={loadData}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/20 hover:bg-white/30 backdrop-blur rounded-xl font-semibold text-xs transition-all border border-white/30">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
            <button onClick={() => navigate('/student/olympiad/study-materials')}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur rounded-xl font-semibold text-sm transition-all border border-white/30">
              <BookOpen className="w-4 h-4" /> Study Materials
            </button>
            <button onClick={() => navigate('/olympiad')}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur rounded-xl font-semibold text-sm transition-all border border-white/30">
              View All Olympiads <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
        {paidRegs.length > 0 && (
          <div className="mt-5 grid grid-cols-3 gap-3">
            {[
              { label: 'Registered',   value: paidRegs.length },
              { label: 'Results',      value: registrations.filter(r => r.result).length },
              { label: 'Certificates', value: registrations.filter(r => r.certificate).length },
            ].map(s => (
              <div key={s.label} className="bg-white/10 rounded-xl p-3 text-center">
                <p className="text-2xl font-black">{s.value}</p>
                <p className="text-xs text-white/70">{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Pending Verification / Payment Alert ── */}
      {pendingRegs.length > 0 && (
        <div className="space-y-3">
          {pendingRegs.map(reg => {
            const vStatus = reg.verificationStatus || 'pending';
            const isApproved = vStatus === 'approved';
            const isRejected = vStatus === 'rejected';

            return (
              <div
                key={reg.id}
                className={`rounded-2xl p-5 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
                  isApproved
                    ? 'bg-emerald-50 border-emerald-200'
                    : isRejected
                    ? 'bg-rose-50 border-rose-200'
                    : 'bg-amber-50 border-amber-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  {isApproved ? (
                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  ) : isRejected ? (
                    <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className={`font-bold text-sm ${
                        isApproved ? 'text-emerald-900' : isRejected ? 'text-rose-900' : 'text-amber-900'
                      }`}>
                        {isApproved
                          ? 'Verification Approved — Complete Payment'
                          : isRejected
                          ? 'Verification Rejected — Action Required'
                          : reg.schoolType === 'govt'
                          ? 'Govt School Documents Under Admin Review'
                          : 'Identity Document Under Admin Review'}
                      </p>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        isApproved
                          ? 'bg-emerald-200 text-emerald-800'
                          : isRejected
                          ? 'bg-rose-200 text-rose-800'
                          : 'bg-amber-200 text-amber-800'
                      }`}>
                        {vStatus}
                      </span>
                      {reg.schoolType === 'govt' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                          🏛️ Free Quota
                        </span>
                      )}
                    </div>
                    <p className={`text-xs mt-1 ${
                      isApproved ? 'text-emerald-700' : isRejected ? 'text-rose-700' : 'text-amber-700'
                    }`}>
                      {reg.olympiad?.title} · Class {reg.classSelected}
                      {isApproved && ' — Your documents are approved! Proceed to payment to confirm your seat.'}
                      {isRejected && ` — Reason: ${reg.verificationRemarks || 'Please re-upload a clear identity document.'}`}
                      {!isApproved && !isRejected && (
                        reg.schoolType === 'govt'
                          ? ' — Admin is carefully reviewing your Govt School ID & Identity document. 100% Free seat will be confirmed once approved.'
                          : ' — Admin is verifying your Aadhaar / ID document. Payment option will be enabled once approved.'
                      )}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/student/olympiad/register/${reg.olympiadId}`)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shadow-sm flex items-center gap-1.5 ${
                    isApproved
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : isRejected
                      ? 'bg-rose-600 hover:bg-rose-700 text-white'
                      : 'bg-amber-600 hover:bg-amber-700 text-white'
                  }`}
                >
                  {isApproved ? 'Pay Now →' : isRejected ? 'Re-upload Document →' : 'Check Status →'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── My Confirmed Registrations ── */}
      {paidRegs.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-500" /> My Registered Olympiads
          </h2>
          <div className="space-y-3">
            {paidRegs.map(reg => {
              const o       = reg.olympiad;
              const session = reg.examSession;
              const result  = reg.result;
              const cert    = reg.certificate;

              // Show exam button if:
              // 1. Status is 'ongoing' (admin manually set), OR
              // 2. Today IS the exam date (admin may not have changed status yet)
              const todayIST   = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // YYYY-MM-DD
              const examDay    = o?.examDate ? o.examDate.slice(0, 10) : null;
              const isExamDay  = examDay === todayIST;
              const canExam    = (o?.status === 'ongoing' || (o?.status === 'open' && isExamDay));
              const hasResult  = !!result;
              const hasCert    = !!cert;

              return (
                <div key={reg.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black flex-shrink-0"
                        style={{ background: (o?.subject?.color || '#6366f1') + '20', color: o?.subject?.color || '#6366f1' }}>
                        {o?.subject?.name?.[0] || '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate">{o?.title}</p>
                        <p className="text-xs text-slate-500">
                          {o?.subject?.name} · Class {reg.classSelected} · Roll: <span className="font-mono font-bold text-indigo-600">{reg.rollNumber}</span>
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <StatusBadge status={o?.status} />
                          <PaymentBadge status={reg.paymentStatus} schoolType={reg.schoolType} />
                          {session?.status === 'submitted' && <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-100 text-green-700 border border-green-200">✅ Submitted</span>}
                          {session?.status === 'in_progress' && <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200 animate-pulse">🔵 In Progress</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Exam: {o?.examDate ? new Date(o.examDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {o?.examDurationMinutes} min</span>
                    </div>
                  </div>
                  <div className="flex sm:flex-col gap-2 sm:items-end flex-wrap">
                    {reg.paymentStatus === 'paid' && (
                      <>
                        <button onClick={() => navigate(`/student/olympiad/preparation/${reg.id}`)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold hover:bg-indigo-100 transition-all shadow-2xs">
                          <BookOpen className="w-3.5 h-3.5 text-indigo-600" /> Syllabus & Mock Tests
                        </button>
                        <button onClick={() => navigate(`/student/olympiad/receipt/${reg.id}`)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold hover:bg-emerald-100 transition-all shadow-2xs">
                          <Receipt className="w-3.5 h-3.5 text-emerald-600" /> Fee Slip
                        </button>
                      </>
                    )}
                    <button onClick={() => navigate(`/student/olympiad/admit-card/${reg.id}`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-all">
                      <FileText className="w-3.5 h-3.5" /> Admit Card
                    </button>
                    {canExam && (!session || session.status === 'not_started' || session.status === 'in_progress') && (
                      <button onClick={() => navigate(`/student/olympiad/exam/${o.id}`)}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold hover:shadow-lg transition-all">
                        Start Exam →
                      </button>
                    )}
                    {hasResult && (
                      <button onClick={() => navigate(`/student/olympiad/result/${o.id}`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold hover:bg-emerald-100 transition-all">
                        <Award className="w-3.5 h-3.5" /> View Result
                      </button>
                    )}
                    {hasCert && (
                      <button onClick={() => navigate(`/student/olympiad/certificate/${cert.certificateId}`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-yellow-50 text-yellow-700 border border-yellow-200 text-xs font-semibold hover:bg-yellow-100 transition-all">
                        <Download className="w-3.5 h-3.5" /> Certificate
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Upcoming Olympiads ── */}
      {upcoming.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" /> Upcoming Olympiads
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {upcoming.slice(0, 4).map(o => (
              <div key={o.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black"
                      style={{ background: (o.subject?.color || '#6366f1') + '20', color: o.subject?.color || '#6366f1' }}>
                      {o.subject?.name?.[0] || '?'}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{o.title}</p>
                      <p className="text-xs text-slate-500">{o.subject?.name}</p>
                    </div>
                  </div>
                  <StatusBadge status={o.status} />
                </div>
                <div className="text-xs text-slate-500 space-y-1 mb-4">
                  <div className="flex justify-between"><span>Exam Date</span><span className="font-semibold text-slate-700">{o.examDate ? new Date(o.examDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBD'}</span></div>
                  <div className="flex justify-between"><span>Duration</span><span className="font-semibold text-slate-700">{o.examDurationMinutes} min</span></div>
                  <div className="flex justify-between"><span>Fee</span><span className="font-bold text-indigo-600">₹{o.registrationFee}</span></div>
                  <div className="flex justify-between"><span>Classes</span><span className="font-semibold text-slate-700">{(o.eligibleClasses || []).join(', ')}</span></div>
                </div>
                <button onClick={() => navigate(`/student/olympiad/register/${o.id}`)}
                  className="w-full py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold hover:shadow-lg transition-all">
                  Register Now →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Empty State ── */}
      {paidRegs.length === 0 && pendingRegs.length === 0 && upcoming.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <Trophy className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <h3 className="text-lg font-bold text-slate-600">No Olympiads Available</h3>
          <p className="text-sm mt-1">Check back later for upcoming olympiad events.</p>
        </div>
      )}

    </div>
  );
}
