import React, { useEffect, useState } from 'react';
import { LayoutDashboard, BookOpen, BarChart3, Trophy, TrendingUp, Clock, Target, Crown, Zap, Building2, BellRing, X } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import useAuthStore from '../../store/authStore';
import { getImageUrl } from '../../lib/imageUrl';

const StatCard = ({ icon: Icon, label, value, sub, color }) => (
  <div className="card flex items-center gap-4">
    <div className={`stat-icon ${color}`}><Icon className="w-5 h-5 text-slate-900" /></div>
    <div>
      <p className="text-slate-500 text-xs">{label}</p>
      <p className="text-xl font-bold text-slate-900">{value}</p>
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
    </div>
  </div>
);

export default function StudentDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [planName, setPlanName] = useState(null); // actual plan name from DB
  const [cheapestPlan, setCheapestPlan] = useState(null); // cheapest paid plan for upgrade CTA
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user?.isOlympiadUser) {
      navigate('/student/olympiad', { replace: true });
    }
  }, [user, navigate]);

  const isProActive = user?.studentSubscriptionStatus === 'active' &&
    user?.studentSubscriptionEndDate && new Date(user.studentSubscriptionEndDate) > new Date();

  const isTrial = user?.studentSubscriptionStatus === 'trial' &&
    user?.studentSubscriptionEndDate && new Date(user.studentSubscriptionEndDate) > new Date();
  const trialDaysLeft = isTrial
    ? Math.max(0, Math.ceil((new Date(user.studentSubscriptionEndDate) - new Date()) / 86400000))
    : 0;

  // Fetch the plan name for display whenever user has a non-free plan
  useEffect(() => {
    api.get('/payments/student-plans')
      .then(res => {
        const plans = res.data.data || [];
        // Find current plan name
        const planId = user?.studentSubscriptionPlan;
        if (planId && planId !== 'free') {
          const match = plans.find(p => p.id === planId);
          if (match) setPlanName(match.name);
        }
        // Find cheapest paid plan for upgrade CTA
        const paid = plans.filter(p => p.price > 0).sort((a, b) => a.price - b.price);
        if (paid.length > 0) setCheapestPlan(paid[0]);
      })
      .catch(() => {});
  }, [user?.studentSubscriptionPlan]);

  // Check if institute has an active plan that covers student test access
  const INSTITUTE_PLANS_COVERING = ['basic', 'pro', 'enterprise'];
  const inst = user?.institute;
  const isInstitutePlanActive = !isProActive && inst && !user?.institutePremiumBlocked &&
    INSTITUTE_PLANS_COVERING.includes(inst.subscriptionPlan) &&
    inst.subscriptionStatus === 'active' &&
    inst.subscriptionEndDate && new Date(inst.subscriptionEndDate) > new Date();

  const [activeNotifications, setActiveNotifications] = useState([]);

  useEffect(() => {
    api.get('/student/dashboard')
      .then(res => {
        setData(res.data.data);
        if (res.data.data.unreadNotifications) {
          setActiveNotifications(res.data.data.unreadNotifications);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const dismissNotification = async (notifId) => {
    setActiveNotifications(prev => prev.filter(n => n.id !== notifId));
    try { await api.patch(`/notifications/${notifId}/read`); } catch (err) { }
  };

  // Safely parse notification data — MariaDB may return JSON field as a string
  const parseNotifData = (notif) => {
    if (!notif?.data) return {};
    if (typeof notif.data === 'object') return notif.data;
    try { return JSON.parse(notif.data); } catch { return {}; }
  };

  const [showAssignedModal, setShowAssignedModal] = useState(true);
  const [liveTest, setLiveTest] = useState(null);
  const [showLiveModal, setShowLiveModal] = useState(false);
  const [liveCountdown, setLiveCountdown] = useState(0);

  // Poll for live tests every 20 seconds
  useEffect(() => {
    const checkLive = async () => {
      try {
        const res = await api.get('/student/dashboard');
        const assigned = res.data.data?.assignedTests || [];
        const now = new Date();
        // A test is "live" if it has a startTime set within past 2 hours and not yet attempted
        const live = assigned.find(t => t.startTime && new Date(t.startTime) <= now && new Date(t.startTime) > new Date(now - 2 * 60 * 60 * 1000) && t.attemptStatus === 'not-attempted');
        if (live && (!liveTest || liveTest.id !== live.id)) {
          setLiveTest(live);
          setShowLiveModal(true);
        }
      } catch {}
    };
    checkLive();
    const interval = setInterval(checkLive, 20000);
    return () => clearInterval(interval);
  }, []);

  // Countdown timer when live test is open
  useEffect(() => {
    if (!liveTest) return;
    const update = () => {
      const elapsed = Math.floor((new Date() - new Date(liveTest.startTime)) / 1000);
      setLiveCountdown(Math.max(0, (liveTest.duration || 60) * 60 - elapsed));
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [liveTest]);

  if (loading) return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-24" />)}</div>
      <div className="skeleton h-64" />
    </div>
  );

  const { stats, recentResults = [], availableTests = [], assignedTests = [], subjectAnalytics = [], performanceTrend = [] } = data || {};

  const trendData = performanceTrend.map(r => ({
    date: new Date(r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    Score: r.score,
    Accuracy: r.accuracy,
    test: r.test?.title,
  }));

  const weakSubjects = [...subjectAnalytics].sort((a, b) => a.avgAccuracy - b.avgAccuracy).slice(0, 3);
  const pendingAssignedTests = assignedTests.filter(t => t.attemptStatus === 'not-attempted' && !t.startTime);
  const activeAssignedTest = pendingAssignedTests.length > 0 ? pendingAssignedTests[0] : null;

  const fmtCountdown = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h > 0 ? h + ':' : ''}${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="section-header">👋 My Dashboard</h1>
        <p className="section-subheader">Your learning progress and upcoming tests</p>
      </div>

      {/* 🔴 Live Test Floating Banner */}
      {liveTest && (
        <div
          onClick={() => setShowLiveModal(true)}
          className="cursor-pointer relative overflow-hidden rounded-2xl p-4 flex items-center gap-4 shadow-2xl border border-red-500/30"
          style={{ background: 'linear-gradient(135deg, #7f1d1d, #991b1b, #b91c1c)' }}
        >
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,.2) 20px, rgba(255,255,255,.2) 21px)' }}></div>
          <div className="relative flex items-center gap-1">
            <span className="relative flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-300 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-400"></span>
            </span>
          </div>
          <div className="flex-1 relative z-10">
            <p className="text-red-200 text-xs font-bold uppercase tracking-widest">🔴 Live Test in Progress</p>
            <p className="text-white font-extrabold text-lg leading-tight mt-0.5">{liveTest.title}</p>
            <p className="text-red-200 text-xs mt-1">{liveTest.totalQuestions} Questions · {liveTest.duration}m · Time Remaining: <span className="font-black text-white">{fmtCountdown(liveCountdown)}</span></p>
          </div>
          <button
            onClick={e => { e.stopPropagation(); navigate(`/test/${liveTest.id}/lobby`); }}
            className="relative z-10 bg-white text-red-600 font-black text-sm px-5 py-2.5 rounded-xl whitespace-nowrap shadow-lg hover:bg-red-50 transition-colors flex-shrink-0"
          >
            Join Now →
          </button>
        </div>
      )}

      {/* ── Unread Notifications Modal Popup ── */}
      {activeNotifications.length > 0 && (() => {
        const notif = activeNotifications[0];
        const notifData = parseNotifData(notif);
        return (
          <div className="modal-overlay" style={{ zIndex: 100000 }}>
            <div className="modal-content animate-scale max-w-lg w-full !p-0 overflow-hidden shadow-2xl">
              <div className="bg-gradient-to-r from-indigo-600 to-violet-700 p-5 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-full flex-shrink-0">
                    <BellRing size={20} className="animate-pulse" />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg leading-tight">New Announcement</h2>
                    <p className="text-indigo-100 text-[10px] uppercase tracking-widest font-medium">From {notifData.sender || 'Institute'}</p>
                  </div>
                </div>
                <button onClick={() => dismissNotification(notif.id)} className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-colors">
                  <X size={18} />
                </button>
              </div>

              {notifData.image && (
                <div className="w-full h-72 bg-slate-100 border-b border-slate-100">
                  <img
                    src={getImageUrl(notifData.image)}
                    alt="Announcement"
                    className="w-full h-full object-cover"
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                </div>
              )}

              <div className="p-6 bg-white">
                <h3 className="text-xl font-semibold text-slate-800 mb-2">{notif.title}</h3>
                <p className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed">
                  {notif.message}
                </p>

                <div className="mt-6 flex items-center justify-between">
                  {activeNotifications.length > 1 && (
                    <p className="text-xs text-slate-400">{activeNotifications.length - 1} more notification{activeNotifications.length > 2 ? 's' : ''}</p>
                  )}
                  <button onClick={() => dismissNotification(notif.id)} className="ml-auto bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-2.5 rounded-xl shadow-lg shadow-indigo-200 transition-all text-sm">
                    Got it ✓
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Subscription / Access Banner ── */}
      {isProActive ? (
        // Own Pro subscription
        <div style={{ background:'linear-gradient(135deg,#7c3aed,#6366f1)', borderRadius:14, padding:'14px 20px', display:'flex', alignItems:'center', gap:14 }}>
          <Crown style={{ color:'#fbbf24', width:22, height:22, flexShrink:0 }} />
          <div style={{ flex:1 }}>
            <p style={{ fontWeight:800, fontSize:14, color:'#fff', margin:0 }}>✅ {planName || 'Pro'} Plan Active ⚡</p>
            <p style={{ fontSize:12, color:'rgba(255,255,255,0.7)', margin:0 }}>
              Valid until {new Date(user.studentSubscriptionEndDate).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })} — Enjoy unlimited access to all premium tests!
            </p>
          </div>
          <Link to="/exam-series" style={{ background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.3)', color:'#fff', padding:'7px 16px', borderRadius:10, fontSize:12, fontWeight:700, textDecoration:'none', whiteSpace:'nowrap' }}>
            Browse Tests →
          </Link>
        </div>
      ) : isTrial ? (
        // Free trial active — nudge to upgrade
        <div style={{ background: trialDaysLeft <= 3 ? 'linear-gradient(135deg,#dc2626,#ef4444)' : 'linear-gradient(135deg,#d97706,#f59e0b)', borderRadius:14, padding:'14px 20px', display:'flex', alignItems:'center', gap:14 }}>
          <span style={{ fontSize:22, flexShrink:0 }}>
            {trialDaysLeft <= 3 ? '⏳' : '🎁'}
          </span>
          <div style={{ flex:1 }}>
            <p style={{ fontWeight:800, fontSize:14, color:'#fff', margin:0 }}>
              {trialDaysLeft <= 3 ? `Trial Expiring Soon — ${trialDaysLeft} day${trialDaysLeft !== 1 ? 's' : ''} left` : `🎁 ${planName || 'Pro'} Trial — ${trialDaysLeft} day${trialDaysLeft !== 1 ? 's' : ''} left`}
            </p>
            <p style={{ fontSize:12, color:'rgba(255,255,255,0.85)', margin:0 }}>
              {trialDaysLeft <= 3
                ? `Your trial expires on ${new Date(user.studentSubscriptionEndDate).toLocaleDateString('en-IN', { day:'numeric', month:'long' })}. Buy a plan now to continue your access!`
                : `Trial ends ${new Date(user.studentSubscriptionEndDate).toLocaleDateString('en-IN', { day:'numeric', month:'long' })} · Upgrade now to keep unlimited premium access!`
              }
            </p>
          </div>
          <Link to="/student/subscription" style={{ background:'#fff', color: trialDaysLeft <= 3 ? '#dc2626' : '#d97706', padding:'8px 18px', borderRadius:10, fontSize:12, fontWeight:900, textDecoration:'none', whiteSpace:'nowrap', boxShadow:'0 3px 10px rgba(0,0,0,0.15)' }}>
            {trialDaysLeft <= 3 ? 'Buy a Plan →' : 'Upgrade Now →'}
          </Link>
        </div>
      ) : isInstitutePlanActive ? (
        // Institute plan covers this student
        <div style={{ background:'linear-gradient(135deg,#0f766e,#0d9488)', borderRadius:14, padding:'14px 20px', display:'flex', alignItems:'center', gap:14 }}>
          <Building2 style={{ color:'#99f6e4', width:22, height:22, flexShrink:0 }} />
          <div style={{ flex:1 }}>
            <p style={{ fontWeight:800, fontSize:14, color:'#fff', margin:0 }}>
              🏫 {inst.name} — Institute Plan Active
            </p>
            <p style={{ fontSize:12, color:'rgba(255,255,255,0.75)', margin:0 }}>
              Your institute ({inst.subscriptionPlan === 'enterprise' ? 'Enterprise' : inst.subscriptionPlan === 'pro' ? 'Pro' : 'Basic'} plan) covers your premium test access. Valid until {new Date(inst.subscriptionEndDate).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}.
            </p>
          </div>
          <Link to="/exam-series" style={{ background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.3)', color:'#fff', padding:'7px 16px', borderRadius:10, fontSize:12, fontWeight:700, textDecoration:'none', whiteSpace:'nowrap' }}>
            Start Test →
          </Link>
        </div>
      ) : (
        // Free plan
        <div style={{ background:'linear-gradient(135deg,#fef3c7,#fffbeb)', border:'2px solid #fde68a', borderRadius:14, padding:'14px 20px', display:'flex', alignItems:'center', gap:14 }}>
          <Zap style={{ color:'#d97706', width:22, height:22, flexShrink:0 }} />
          <div style={{ flex:1 }}>
            <p style={{ fontWeight:800, fontSize:14, color:'#92400e', margin:0 }}>🔒 You're on the Free Plan</p>
            <p style={{ fontSize:12, color:'#78350f', margin:0 }}>
              {cheapestPlan
                ? `Upgrade to ${cheapestPlan.name} for ₹${cheapestPlan.price}/${cheapestPlan.interval} — unlock ALL premium tests!`
                : 'Upgrade to a plan to unlock ALL premium tests across UPSC, SSC, Banking & more!'}
            </p>
          </div>
          <Link to="/student/subscription" style={{ background:'linear-gradient(135deg,#d97706,#b45309)', color:'#fff', padding:'8px 18px', borderRadius:10, fontSize:12, fontWeight:800, textDecoration:'none', whiteSpace:'nowrap', boxShadow:'0 4px 12px rgba(217,119,6,0.3)' }}>
            {cheapestPlan ? `Upgrade ₹${cheapestPlan.price} →` : 'View Plans →'}
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={BookOpen} label="Tests Taken" value={stats?.totalTests || 0}
          color="bg-gradient-to-br from-primary-500 to-primary-600" />
        <StatCard icon={Target} label="Avg Accuracy" value={`${Math.round(stats?.avgAccuracy || 0)}%`}
          color="bg-gradient-to-br from-emerald-500 to-emerald-600" />
        <StatCard icon={BarChart3} label="Avg Score" value={Math.round(stats?.avgScore || 0)}
          color="bg-gradient-to-br from-blue-500 to-blue-600" />
        <StatCard icon={Clock} label="Study Time"
          value={`${Math.floor((stats?.totalTime || 0) / 3600)}h ${Math.floor(((stats?.totalTime || 0) % 3600) / 60)}m`}
          color="bg-gradient-to-br from-amber-500 to-amber-600" />
      </div>

      {/* ─── Live Tests Section ─── */}
      {liveTest && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <h2 className="font-black text-red-600 text-base uppercase tracking-widest">Live Session In Progress</h2>
          </div>
          <div
            onClick={() => setShowLiveModal(true)}
            className="cursor-pointer relative overflow-hidden rounded-2xl flex items-center gap-5 p-5 shadow-xl border border-red-300"
            style={{ background: 'linear-gradient(135deg, #7f1d1d, #991b1b)' }}
          >
            {/* diagonal stripe texture */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 18px, rgba(255,255,255,.3) 18px, rgba(255,255,255,.3) 19px)' }} />
            {/* pulsing dot */}
            <div className="relative flex-shrink-0 z-10">
              <span className="relative flex h-6 w-6">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-300 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-6 w-6 bg-red-400 items-center justify-center">
                  <span className="text-white text-xs font-black">🔴</span>
                </span>
              </span>
            </div>
            {/* Info */}
            <div className="flex-1 relative z-10 min-w-0">
              <p className="text-red-300 text-[11px] font-black uppercase tracking-widest mb-0.5">Live Test · Your Batch</p>
              <p className="text-white font-extrabold text-lg leading-tight truncate">{liveTest.title}</p>
              <div className="flex items-center gap-3 text-red-300 text-xs mt-1">
                <span>📝 {liveTest.totalQuestions} Qs</span>
                <span>⏱ {liveTest.duration} min</span>
                <span>🏆 {liveTest.totalMarks} Marks</span>
              </div>
              {/* countdown */}
              <div className="mt-2 flex items-center gap-2">
                <span className="text-red-300 text-xs font-semibold">Time Remaining:</span>
                <span className="text-white font-black text-base tabular-nums">{fmtCountdown(liveCountdown)}</span>
              </div>
            </div>
            {/* CTA */}
            <button
              onClick={e => { e.stopPropagation(); navigate(`/test/${liveTest.id}/lobby`); }}
              className="relative z-10 flex-shrink-0 bg-white text-red-700 font-black text-sm px-5 py-3 rounded-xl shadow-lg hover:bg-red-50 transition-colors"
            >
              Join Now →
            </button>
          </div>
        </div>
      )}

      {/* ─── Assigned Tests (non-live) Section ─── */}
      {pendingAssignedTests.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-bold text-slate-700 text-sm uppercase tracking-widest flex items-center gap-2">
            🔔 Tests Assigned by Institute
          </h2>
          <div className="grid md:grid-cols-2 gap-3">
            {pendingAssignedTests.slice(0, 4).map(test => (
              <div key={test.id}
                className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-primary-200 hover:border-primary-400 hover:shadow-md transition-all cursor-pointer group"
                onClick={() => navigate(`/test/${test.id}/lobby`)}
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                  {test.category?.slice(0, 2) || 'T'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 text-sm truncate group-hover:text-primary-600 transition-colors">{test.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{test.totalQuestions} Qs · {test.duration}m
                    {test.deadline && <span className="text-red-500 font-semibold ml-2">⏰ Due {new Date(test.deadline).toLocaleDateString('en-IN')}</span>}
                  </p>
                </div>
                <span className="text-primary-500 text-sm font-black group-hover:translate-x-1 transition-transform">→</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Performance Trend */}
        <div className="card">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary-400" /> Performance Trend
          </h3>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '12px', fontSize: '12px' }} />
                <Line type="monotone" dataKey="Score" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Accuracy" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-slate-500 text-sm gap-2">
              <BarChart3 className="w-10 h-10 text-slate-700" />
              Take some tests to see your trend!
            </div>
          )}
        </div>

        {/* Subject Performance */}
        <div className="card">
          <h3 className="font-semibold text-slate-900 mb-4">📊 Subject Accuracy</h3>
          {subjectAnalytics.length > 0 ? (
            <div className="space-y-3">
              {subjectAnalytics.slice(0, 6).map(s => (
                <div key={s.subject} className="flex items-center gap-3">
                  <span className="text-xs text-slate-700 w-28 truncate">{s.subject}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full progress-bar ${s.avgAccuracy >= 70 ? 'bg-emerald-500' : s.avgAccuracy >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${s.avgAccuracy}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold w-10 text-right text-slate-700">{Math.round(s.avgAccuracy)}%</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-500 text-sm">Complete tests to see analytics</div>
          )}
        </div>
      </div>

      <div className={`grid ${user?.instituteId ? 'grid-cols-1' : 'lg:grid-cols-2'} gap-6`}>
        {/* Available Tests (Only for Global Students) */}
        {!user?.instituteId && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">📝 Available Tests</h3>
              <Link to="/student/tests" className="text-primary-400 text-xs hover:text-primary-300">View all →</Link>
            </div>
            {availableTests.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-6">No tests available yet</p>
            ) : (
              <div className="space-y-3">
                {availableTests.slice(0, 4).map(test => (
                  <div key={test.id}
                    className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100/60 transition-colors cursor-pointer group"
                    onClick={() => navigate(`/test/${test.id}`)}>
                    <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center text-slate-900 text-xs font-bold flex-shrink-0">
                      {test.category?.slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate group-hover:text-primary-300 transition-colors">{test.title}</p>
                      <p className="text-xs text-slate-500">{test.totalQuestions || 0} Qs · {test.duration}m</p>
                    </div>
                    <span className={test.isFree ? 'badge-success text-xs' : 'badge-info text-xs flex items-center gap-1'}>
                      {test.isFree ? 'Free' : '★ Premium'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Recent Results */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">📈 Recent Results</h3>
            <Link to="/student/results" className="text-primary-400 text-xs hover:text-primary-300">View all →</Link>
          </div>
          {recentResults.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-6">No results yet. Take a test!</p>
          ) : (
            <div className={user?.instituteId ? "grid md:grid-cols-2 gap-3" : "space-y-3"}>
              {recentResults.slice(0, user?.instituteId ? 6 : 4).map(r => (
                <Link key={r.id} to={`/student/results/${r.id}`}
                  className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100/60 transition-colors">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-slate-900 text-sm font-bold flex-shrink-0
                    ${r.accuracy >= 70 ? 'bg-emerald-600' : r.accuracy >= 50 ? 'bg-amber-600' : 'bg-red-600'}`}>
                    {r.accuracy}%
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{r.test?.title}</p>
                    <p className="text-xs text-slate-500">{r.score}/{r.totalMarks} · {new Date(r.submittedAt).toLocaleDateString('en-IN')}</p>
                  </div>
                  {r.globalRank && <span className="text-xs text-amber-400">#{r.globalRank}</span>}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Weak Areas Alert */}
      {weakSubjects.length > 0 && weakSubjects[0].avgAccuracy < 60 && (
        <div className="card border-amber-500/20 bg-amber-500/5">
          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            ⚠️ Areas to Improve
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {weakSubjects.map(s => (
              <div key={s.subject} className="bg-amber-500/10 rounded-xl p-3 text-center">
                <p className="font-semibold text-amber-400 text-lg">{Math.round(s.avgAccuracy)}%</p>
                <p className="text-xs text-slate-500 truncate">{s.subject}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 🔴 Live Test Join Modal */}
      {showLiveModal && liveTest && (
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
          <div className="modal-content animate-scale max-w-md w-full !p-0 overflow-hidden">
            <div className="relative p-6 text-center text-white" style={{ background: 'linear-gradient(135deg, #991b1b, #b91c1c)' }}>
              <button onClick={() => setShowLiveModal(false)} className="absolute top-4 right-4 text-white/70 hover:text-white text-xl">✕</button>
              <div className="flex items-center justify-center gap-2 mb-3">
                <span className="relative flex h-5 w-5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-300 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-5 w-5 bg-red-400"></span>
                </span>
                <span className="text-red-200 font-black uppercase tracking-widest text-sm">Live Test Active</span>
              </div>
              <h2 className="text-xl font-extrabold">{liveTest.title}</h2>
              <p className="text-red-200 text-sm mt-1">Your institute has started a live test session. Join immediately!</p>
              <div className="mt-4 bg-black/20 rounded-xl py-3 px-6 inline-block">
                <p className="text-red-200 text-xs">Time Remaining</p>
                <p className="text-4xl font-black tracking-tight">{fmtCountdown(liveCountdown)}</p>
              </div>
            </div>
            <div className="p-6 bg-white">
              <div className="flex justify-center gap-6 text-xs font-semibold text-slate-500 mb-5 bg-slate-50 py-2 rounded-xl border">
                <span>📝 {liveTest.totalQuestions} Questions</span>
                <span>⏱ {liveTest.duration} min</span>
                <span>🏆 {liveTest.totalMarks} Marks</span>
              </div>
              <button
                onClick={() => { setShowLiveModal(false); navigate(`/test/${liveTest.id}/lobby`); }}
                className="w-full py-3.5 rounded-xl font-black text-white text-base shadow-lg"
                style={{ background: 'linear-gradient(135deg, #b91c1c, #dc2626)' }}
              >
                🔴 Join Live Test Now
              </button>
              <button onClick={() => setShowLiveModal(false)} className="w-full mt-2 btn-secondary py-2.5 text-sm">Dismiss</button>
            </div>
          </div>
        </div>
      )}

      {/* Immediate Attend Assigned Test Modal */}
      {showAssignedModal && activeAssignedTest && !liveTest && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content animate-scale max-w-md w-full !p-0 overflow-hidden">
            <div className="bg-gradient-to-br from-primary-600 to-indigo-700 p-6 text-center text-white relative">
              <button onClick={() => setShowAssignedModal(false)} className="absolute top-4 right-4 text-white/70 hover:text-white">✕</button>
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-2xl mx-auto mb-4 border border-white/30 shadow-lg">🔔</div>
              <h2 className="text-xl font-extrabold mb-1">New Test Assigned!</h2>
              <p className="text-primary-100 text-sm">Your institute has assigned a mandatory test to your batch.</p>
            </div>
            <div className="p-6 bg-white text-center">
              <h3 className="text-lg font-bold text-slate-900 mb-2">{activeAssignedTest.title}</h3>
              <div className="flex justify-center gap-4 text-xs font-semibold text-slate-600 mb-6 bg-slate-50 py-2 rounded-xl border border-slate-100">
                <span className="flex items-center gap-1.5"><BookOpen size={13} className="text-primary-500"/> {activeAssignedTest.totalQuestions} Qs</span>
                <span className="flex items-center gap-1.5"><Clock size={13} className="text-amber-500"/> {activeAssignedTest.duration}m</span>
                <span className="flex items-center gap-1.5"><Target size={13} className="text-emerald-500"/> {activeAssignedTest.totalMarks} Marks</span>
              </div>
              {activeAssignedTest.deadline && (
                <p className="text-xs text-red-500 font-semibold mb-6 flex items-center justify-center gap-1">⏰ Deadline: {new Date(activeAssignedTest.deadline).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
              )}
              <div className="flex gap-3">
                <button onClick={() => navigate(`/test/${activeAssignedTest.id}/lobby`)} className="btn-primary flex-1 shadow-lg shadow-primary-500/30 py-3 text-sm flex items-center justify-center gap-2">🚀 Attend Now</button>
                <button onClick={() => setShowAssignedModal(false)} className="btn-secondary flex-1 py-3 text-sm">Maybe Later</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
