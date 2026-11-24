import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, BookOpen, TrendingUp, Award, BarChart3, GraduationCap,
  Megaphone, UserPlus, FileText, Zap, Video, Clock, ArrowUpRight,
  Activity, ChevronRight, Calendar, Target, Layers, Star
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar, PolarAngleAxis, Cell
} from 'recharts';
import api from '../../lib/api';
import { getImageUrl } from '../../lib/imageUrl';

/* ─── KPI Card ─── */
const KpiCard = ({ title, value, sub, icon: Icon, iconBg, iconColor }) => (
  <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-3">
    <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
      <Icon size={18} className={iconColor} />
    </div>
    <div className="min-w-0">
      <p className="text-xl font-semibold text-slate-700 leading-none">{value}</p>
      <p className="text-[9px] font-medium text-slate-400 uppercase tracking-widest mt-0.5 truncate">{title}</p>
      {sub && <p className="text-[8px] text-slate-300 font-normal mt-0.5">{sub}</p>}
    </div>
  </div>
);

/* ─── Quick Action ─── */
const QuickBtn = ({ to, icon: Icon, label, iconBg, iconColor }) => (
  <Link to={to} className="group flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-md border border-transparent hover:border-slate-100 transition-all duration-200">
    <div className={`w-9 h-9 ${iconBg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
      <Icon size={16} className={iconColor} />
    </div>
    <span className="text-[8px] font-medium text-slate-400 uppercase tracking-widest text-center leading-tight">{label}</span>
  </Link>
);

/* ─── Custom Tooltip ─── */
const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 text-white px-3 py-2 rounded-xl shadow-2xl text-xs border border-white/10">
      <p className="font-medium text-slate-400 text-[9px] uppercase tracking-widest mb-0.5">{label}</p>
      {payload.map((p, i) => <p key={i} className="font-medium" style={{ color: p.color }}>{p.name}: {p.value}</p>)}
    </div>
  );
};

/* ─── Main Dashboard ─── */
export default function InstituteDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingStudents, setPendingStudents] = useState([]);
  const [activeChart, setActiveChart] = useState('score');
  const [instituteModules, setInstituteModules] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [dashRes, pendingRes, subRes] = await Promise.all([
          api.get('/institute/dashboard'),
          api.get('/institute/students/pending'),
          api.get('/institute/subscription'),
        ]);
        setData(dashRes.data.data);
        setPendingStudents(pendingRes.data.data || []);
        if (subRes.data.data && subRes.data.data.activeModules) {
          setInstituteModules(subRes.data.data.activeModules);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-24 bg-slate-100 rounded-2xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-slate-100 rounded-2xl" />)}
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <div key={i} className="h-52 bg-slate-100 rounded-2xl" />)}
      </div>
    </div>
  );

  const { institute, stats, recentResults = [], topStudents = [], testPerformance = [] } = data || {};
  const logoUrl = getImageUrl(institute?.logo);
  const bannerUrl = getImageUrl(institute?.bannerImage);

  const isTrial = institute?.subscriptionStatus === 'trial' &&
    institute?.subscriptionEndDate && new Date(institute.subscriptionEndDate) > new Date();
  const trialDaysLeft = isTrial
    ? Math.max(0, Math.ceil((new Date(institute.subscriptionEndDate) - new Date()) / 86400000))
    : 0;

  const testPerfData = testPerformance.slice(0, 7).map(t => ({
    name: (t.title || t.test?.title || 'Test').slice(0, 10),
    'Avg Score': Math.round(t.avgScore || 0),
    Attempts: t.attempts || 0,
  }));

  const enrollPct = Math.min(100, Math.round(((stats?.totalStudents || 0) / (stats?.subscription?.maxStudents || 50)) * 100));
  const batchPct  = Math.min(100, Math.round(((stats?.totalBatches  || 0) / (stats?.subscription?.maxBatches  || 3))  * 100));

  const activityFeed = recentResults.slice(0, 5);

  return (
    <div className="space-y-4 pb-10">

      {/* ── Pending Banner ── */}
      {pendingStudents.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-950 to-violet-900 px-5 py-4 shadow-lg border border-white/5 flex flex-col sm:flex-row items-center gap-4">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_70%_50%,_#818cf8,_transparent_60%)]" />
          <div className="relative flex-shrink-0 flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center">
                <Clock className="text-indigo-300" size={18} />
              </div>
              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center text-[9px] font-medium text-white border-2 border-indigo-950 animate-pulse">
                {pendingStudents.length}
              </div>
            </div>
            <div>
              <p className="text-white font-medium text-sm leading-tight">Enrollment Requests</p>
              <p className="text-indigo-300/80 text-[9px] font-normal uppercase tracking-widest">
                {pendingStudents.length} student{pendingStudents.length > 1 ? 's' : ''} awaiting approval
              </p>
            </div>
          </div>
          <div className="flex-1" />
          <Link to="/institute/students" className="flex items-center gap-1.5 bg-white text-indigo-700 font-medium text-[9px] uppercase tracking-widest px-5 py-2.5 rounded-xl shadow-lg hover:bg-indigo-50 active:scale-95 transition-all whitespace-nowrap">
            Review <ArrowUpRight size={12} />
          </Link>
        </div>
      )}

      {/* ── Hero Header ── */}
      {institute && (
        <div className="relative overflow-hidden rounded-2xl bg-slate-900 shadow-xl group">
          {bannerUrl
            ? <img src={bannerUrl} alt="banner" className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-overlay" />
            : <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-900 to-violet-950" />
          }
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/15 rounded-full blur-[60px] -mr-16 -mt-16" />

          <div className="relative z-10 p-5 flex items-center gap-5">
            {/* Logo */}
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-white p-1.5 shadow-xl overflow-hidden ring-2 ring-white/10">
                {logoUrl
                  ? <img src={logoUrl} alt="logo" className="w-full h-full rounded-xl object-cover" />
                  : <div className="w-full h-full rounded-xl bg-slate-100 flex items-center justify-center text-indigo-600 text-2xl font-semibold italic">{institute.name?.charAt(0)}</div>
                }
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-900" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[8px] font-medium px-2 py-0.5 rounded-lg uppercase tracking-widest border ${
                  isTrial ? 'bg-amber-500/20 text-amber-300 border-amber-400/30' : 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30'
                }`}>
                  {isTrial ? `Trial · ${trialDaysLeft}d left` : `${institute.subscriptionPlan || 'Free'} Plan`}
                </span>
                <span className="text-[8px] font-medium px-2 py-0.5 rounded-lg uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-400/20">● Live</span>
              </div>
              <h1 className="text-2xl font-semibold text-white tracking-tight leading-none truncate">{institute.name}</h1>
              <p className="text-slate-400 text-xs mt-1 leading-relaxed line-clamp-1 font-normal">
                {institute.description || 'Intelligent assessment and adaptive learning platform.'}
              </p>
            </div>

            {/* Inline mini-stats */}
            <div className="hidden md:flex items-center gap-5 flex-shrink-0">
              {[
                { label: 'Students', value: stats?.totalStudents || 0, icon: GraduationCap },
                { label: 'Batches',  value: stats?.totalBatches  || 0, icon: Layers },
                { label: 'Tests',    value: testPerformance?.length || 0, icon: FileText },
              ].map(item => (
                <div key={item.label} className="text-center">
                  <p className="text-white font-semibold text-lg leading-none">{item.value}</p>
                  <p className="text-[8px] font-normal text-slate-400 uppercase tracking-widest mt-0.5">{item.label}</p>
                </div>
              ))}
            </div>

            <Link to="/institute/subscription" className="hidden md:flex flex-shrink-0 items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-[9px] uppercase tracking-widest px-4 py-2.5 rounded-xl shadow-lg transition-all">
              <Zap size={12} /> Upgrade
            </Link>
          </div>
        </div>
      )}

      {/* ── Trial Warning ── */}
      {isTrial && (
        <div className={`${trialDaysLeft <= 3 ? 'bg-rose-600' : 'bg-amber-500'} rounded-xl px-5 py-3 flex items-center gap-3 shadow-md`}>
          <span className="text-xl">{trialDaysLeft <= 3 ? '⏳' : '🚀'}</span>
          <div className="flex-1">
            <p className="text-white font-medium text-sm">{trialDaysLeft <= 3 ? `Only ${trialDaysLeft} days left!` : `Trial ends in ${trialDaysLeft} days`}</p>
            <p className="text-white/70 text-[9px] font-normal uppercase tracking-wider">Upgrade to keep full access</p>
          </div>
          <Link to="/institute/subscription" className="bg-white text-slate-700 font-medium text-[9px] px-5 py-2 rounded-xl uppercase tracking-widest shadow-md hover:scale-105 transition-all whitespace-nowrap">
            Upgrade →
          </Link>
        </div>
      )}

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard title="Total Students" value={stats?.totalStudents || 0}
          sub={`of ${stats?.subscription?.maxStudents || 50} seats`}
          icon={GraduationCap} iconBg="bg-indigo-50" iconColor="text-indigo-600" />
        <KpiCard title="Active Batches" value={stats?.totalBatches || 0}
          sub={`of ${stats?.subscription?.maxBatches || 3} allowed`}
          icon={Users} iconBg="bg-violet-50" iconColor="text-violet-600" />
        <KpiCard title="Tests Assigned" value={testPerformance?.length || 0}
          icon={BookOpen} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
        <KpiCard title="Top Score" value={`${Math.round(topStudents?.[0]?.avgScore || 0)}%`}
          sub="highest avg this month"
          icon={Star} iconBg="bg-amber-50" iconColor="text-amber-500" />
      </div>

      {/* ── Middle Row: Quick Actions | Capacity | Chart ── */}
      <div className="grid lg:grid-cols-12 gap-4">

        {/* Quick Actions */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <p className="text-[9px] font-medium text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-1.5">
            <Zap size={12} className="text-indigo-600" /> Quick Actions
          </p>
          <div className="grid grid-cols-3 gap-2">
            <QuickBtn to="/institute/students"     icon={UserPlus}  label="Students"  iconBg="bg-indigo-50"  iconColor="text-indigo-600" />
            <QuickBtn to="/institute/batches"      icon={Users}     label="Batches"   iconBg="bg-violet-50"  iconColor="text-violet-600" />
            <QuickBtn to="/institute/tests"        icon={FileText}  label="Tests"     iconBg="bg-emerald-50" iconColor="text-emerald-600" />
            <QuickBtn to="/institute/announcements" icon={Megaphone} label="Announce" iconBg="bg-amber-50"   iconColor="text-amber-600" />
            {(!instituteModules || instituteModules.liveClasses !== false) && (
              <QuickBtn to="/institute/live-classes"  icon={Video}    label="Live"      iconBg="bg-rose-50"    iconColor="text-rose-600" />
            )}
            {(!instituteModules || instituteModules.erp !== false) && (
              <QuickBtn to="/institute/accounts"     icon={Activity}  label="Reports"   iconBg="bg-cyan-50"    iconColor="text-cyan-600" />
            )}
          </div>
        </div>

        {/* Capacity */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[9px] font-medium text-slate-400 uppercase tracking-[0.2em] flex items-center gap-1.5">
              <Target size={12} className="text-indigo-600" /> Capacity
            </p>
            <Link to="/institute/subscription" className="text-[8px] font-medium text-indigo-600 uppercase bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 hover:bg-indigo-100 transition-colors">
              Upgrade
            </Link>
          </div>

          <ResponsiveContainer width="100%" height={130}>
            <RadialBarChart cx="50%" cy="50%" innerRadius="30%" outerRadius="85%"
              data={[
                { name: 'Students', value: enrollPct, fill: '#6366f1' },
                { name: 'Batches',  value: batchPct,  fill: '#10b981' },
              ]}
              startAngle={180} endAngle={-180}>
              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
              <RadialBar dataKey="value" background={{ fill: '#f1f5f9' }} cornerRadius={6} />
              <Tooltip content={<ChartTip />} />
            </RadialBarChart>
          </ResponsiveContainer>

          <div className="space-y-2.5 mt-2">
            {[
              { label: 'Students', used: stats?.totalStudents || 0, max: stats?.subscription?.maxStudents || 50, color: 'bg-indigo-500', pct: enrollPct },
              { label: 'Batches',  used: stats?.totalBatches  || 0, max: stats?.subscription?.maxBatches  || 3,  color: 'bg-emerald-500', pct: batchPct },
            ].map(g => (
              <div key={g.label}>
                <div className="flex justify-between text-[9px] font-medium uppercase tracking-widest mb-1">
                  <span className="text-slate-500">{g.label}</span>
                  <span className="text-slate-400">{g.used}/{g.max}</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${g.color} rounded-full transition-all duration-1000`} style={{ width: `${g.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Chart */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[9px] font-medium text-slate-400 uppercase tracking-[0.2em] flex items-center gap-1.5">
              <BarChart3 size={12} className="text-indigo-600" /> Test Performance
            </p>
            <div className="flex gap-1 bg-slate-100 p-0.5 rounded-xl">
              {['score', 'attempts'].map(tab => (
                <button key={tab} onClick={() => setActiveChart(tab)}
                  className={`px-3 py-1.5 rounded-lg text-[8px] font-medium uppercase tracking-widest transition-all ${activeChart === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>
                  {tab}
                </button>
              ))}
            </div>
          </div>
          {testPerfData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={testPerfData} barCategoryGap="35%">
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 8, fontWeight: 500 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip content={<ChartTip />} cursor={{ fill: '#f8fafc', radius: 8 }} />
                {activeChart === 'score'
                  ? <Bar dataKey="Avg Score" radius={[6, 6, 2, 2]} barSize={20}>
                      {testPerfData.map((_, i) => <Cell key={i} fill={i % 2 === 0 ? '#6366f1' : '#8b5cf6'} />)}
                    </Bar>
                  : <Bar dataKey="Attempts" radius={[6, 6, 2, 2]} barSize={20} fill="#10b981" />
                }
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex flex-col items-center justify-center gap-2 text-slate-200">
              <BarChart3 size={36} strokeWidth={1} />
              <p className="text-[9px] font-normal uppercase tracking-widest text-slate-400">No test data yet</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom Row: Top Students | Activity Feed ── */}
      <div className="grid lg:grid-cols-2 gap-4">

        {/* Top Performers */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[9px] font-medium text-slate-400 uppercase tracking-[0.2em] flex items-center gap-1.5">
              <Award size={12} className="text-amber-500" /> Top Performers
            </p>
            <Link to="/institute/students" className="text-[8px] font-medium text-indigo-600 flex items-center gap-0.5 uppercase tracking-widest hover:underline">
              All <ChevronRight size={10} />
            </Link>
          </div>

          {topStudents.length === 0 ? (
            <div className="h-36 flex items-center justify-center text-slate-200">
              <p className="text-[9px] font-normal uppercase tracking-widest text-slate-300">No data yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {topStudents.slice(0, 5).map((s, i) => {
                const pct = Math.round(s.avgScore || 0);
                return (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                      i === 0 ? 'bg-amber-400 text-white' :
                      i === 1 ? 'bg-slate-300 text-white' :
                      i === 2 ? 'bg-amber-700 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-700 truncate">{s.name || s.user?.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[8px] font-normal text-slate-400">{pct}%</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-semibold text-indigo-500 leading-none">{Math.round(s.avgScore || 0)}</p>
                      <p className="text-[8px] text-slate-400 font-normal">{s.totalTests || 0} tests</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[9px] font-medium text-slate-400 uppercase tracking-[0.2em] flex items-center gap-1.5">
              <Activity size={12} className="text-indigo-600" /> Recent Attempts
            </p>
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          </div>

          {activityFeed.length === 0 ? (
            <div className="h-36 flex items-center justify-center">
              <p className="text-[9px] font-normal uppercase tracking-widest text-slate-300">No recent activity</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activityFeed.map((r, i) => (
                <Link to={`/institute/results/${r.id}`} key={i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group hover:border-indigo-100 border border-transparent">
                  <div className="w-8 h-8 bg-slate-700 text-white rounded-xl flex items-center justify-center font-medium text-sm flex-shrink-0 group-hover:bg-indigo-500 transition-colors">
                    {(r.user?.name || 'S').charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-700 truncate group-hover:text-indigo-600 transition-colors">{r.user?.name}</p>
                    <p className="text-[8px] font-normal text-slate-400 truncate uppercase tracking-wider">{r.test?.title}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-slate-600">{r.score}/{r.totalMarks}</p>
                    <span className={`text-[8px] font-medium px-2 py-0.5 rounded-full uppercase ${
                      r.accuracy >= 70 ? 'bg-emerald-50 text-emerald-600' :
                      r.accuracy >= 50 ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-500'
                    }`}>{r.accuracy}%</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
