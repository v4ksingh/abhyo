import React, { useEffect, useState, useCallback } from 'react';
import {
  Users, BookOpen, Target, Award, Activity, RefreshCw,
  ArrowUpRight, TrendingUp, BarChart2, Brain, Layers,
  GraduationCap, Clock, CheckCircle,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, Legend,
} from 'recharts';
import api from '../../lib/api';

const COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6'];
const TYPE_COLOR = { mock: '#6366f1', pyp: '#f59e0b', daily_quiz: '#10b981', sectional: '#06b6d4' };
const TYPE_LABEL = { mock: 'Mock', pyp: 'PYP', daily_quiz: 'Daily Quiz', sectional: 'Sectional' };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-lg text-sm">
      <p className="text-slate-400 text-xs mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">
          {p.name}: {p.value}
          {p.name?.toLowerCase().includes('accuracy') ? '%' : ''}
        </p>
      ))}
    </div>
  );
};

function KpiCard({ label, value, icon: Icon, gradient, sub, change }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-shadow">
      <div className={`w-11 h-11 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-md mb-3`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className="text-xs text-slate-500 font-medium">{label}</p>
      <p className="text-2xl font-extrabold text-slate-900 mt-0.5 tracking-tight">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      {change !== undefined && (
        <div className="flex items-center gap-1 mt-1">
          <ArrowUpRight size={12} className="text-emerald-500" />
          <span className="text-xs text-emerald-500 font-semibold">live</span>
        </div>
      )}
      <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-[0.07] bg-gradient-to-br ${gradient} group-hover:opacity-10 transition-opacity`} />
    </div>
  );
}

function EmptyChart({ icon: Icon, label }) {
  return (
    <div className="h-52 flex flex-col items-center justify-center text-slate-300 gap-3">
      <Icon className="w-10 h-10" />
      <p className="text-sm font-medium text-slate-400">{label}</p>
    </div>
  );
}

export default function InstituteAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await api.get('/institute/analytics', { params: { period } });
      setData(res.data.data || null);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const dailyData = (data?.dailyAttempts || []).map(d => ({
    date: (d.date || '').split('-').slice(1).join('/'),
    Attempts: d.count || 0,
  }));

  const batchData = (data?.batchStats || []).map(b => ({
    name: b.name,
    Attempts: parseInt(b.attempts) || 0,
    'Avg Accuracy': parseFloat(b.avgAccuracy) || 0,
  }));

  const radarData = (data?.subjectAccuracy || []).map(s => ({
    subject: s.subject,
    Accuracy: s.accuracy,
    fullMark: 100,
  }));

  const kpis = data ? [
    {
      label: 'Total Students', value: data.kpis.totalStudents?.toLocaleString() || '0',
      icon: GraduationCap, gradient: 'from-indigo-500 to-violet-600',
      sub: `${data.kpis.activeStudents} active this period`,
    },
    {
      label: 'Total Attempts', value: data.kpis.totalAttempts?.toLocaleString() || '0',
      icon: BookOpen, gradient: 'from-purple-500 to-pink-600',
      sub: 'All-time completed tests',
    },
    {
      label: 'Avg. Accuracy', value: `${data.kpis.avgAccuracy || 0}%`,
      icon: Target, gradient: 'from-emerald-500 to-teal-600',
      sub: `Avg score: ${data.kpis.avgScore || 0} pts`,
    },
    {
      label: 'Total Batches', value: data.kpis.totalBatches?.toLocaleString() || '0',
      icon: Layers, gradient: 'from-amber-500 to-orange-500',
      sub: 'Active batch groups',
    },
  ] : [];

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="skeleton h-72 rounded-2xl" />
          <div className="skeleton h-72 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            Student Analytics
          </h1>
          <p className="text-sm text-slate-500 mt-0.5 ml-11">Performance insights for your institute's students</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 rounded-xl p-1 gap-0.5">
            {['7d', '30d', '90d', '1y'].map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  period === p ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}>
                {p}
              </button>
            ))}
          </div>
          <button onClick={fetchData} disabled={refreshing}
            className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(kpi => <KpiCard key={kpi.label} {...kpi} />)}
      </div>

      {/* Row 1: Daily Attempts + Batch Performance */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Daily Attempts Area Chart */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" />
              Daily Test Attempts
            </h3>
            <span className="text-xs font-semibold bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full border border-indigo-100">
              Last {period}
            </span>
          </div>
          {dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="Attempts" stroke="#6366f1" strokeWidth={2.5}
                  fill="url(#attGrad)" dot={{ fill: '#6366f1', r: 3 }} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart icon={Activity} label="No attempt data in this period" />
          )}
        </div>

        {/* Score Distribution */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-purple-400" />
              Score Distribution
            </h3>
            <span className="text-xs font-semibold bg-purple-50 text-purple-600 px-2.5 py-1 rounded-full border border-purple-100">
              All Time
            </span>
          </div>
          {data?.scoreDist?.some(d => d.count > 0) ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.scoreDist} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                <YAxis dataKey="range" type="category" tick={{ fill: '#94a3b8', fontSize: 11 }} width={55} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {(data.scoreDist || []).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart icon={BarChart2} label="No score data yet" />
          )}
        </div>
      </div>

      {/* Row 2: Batch Stats + Subject Radar */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Batch Bar Chart */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              Batch-wise Performance
            </h3>
          </div>
          {batchData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={batchData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: '#94a3b8', fontSize: 11 }} unit="%" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar yAxisId="left" dataKey="Attempts" fill="#6366f1" radius={[5, 5, 0, 0]} />
                <Bar yAxisId="right" dataKey="Avg Accuracy" fill="#10b981" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart icon={Layers} label="No batch data yet" />
          )}
        </div>

        {/* Subject Radar */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Brain className="w-4 h-4 text-emerald-400" />
              Subject Accuracy Radar
            </h3>
          </div>
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8, fill: '#94a3b8' }} />
                <Radar name="Accuracy" dataKey="Accuracy" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart icon={Brain} label="No subject data yet" />
          )}
        </div>
      </div>

      {/* Row 3: Top Students Leaderboard */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            Top Performing Students
          </h3>
          <span className="text-xs text-slate-400">by average score</span>
        </div>
        {data?.topStudents?.length > 0 ? (
          <div className="divide-y divide-slate-50">
            {data.topStudents.map((s, i) => (
              <div key={s.id} className="flex items-center gap-4 px-6 py-3 hover:bg-slate-50 transition-colors">
                {/* Rank */}
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-extrabold flex-shrink-0 ${
                  i === 0 ? 'bg-amber-100 text-amber-600' :
                  i === 1 ? 'bg-slate-200 text-slate-600' :
                  i === 2 ? 'bg-orange-100 text-orange-600' :
                  'bg-slate-100 text-slate-500'
                }`}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                </div>

                {/* Avatar */}
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {s.name?.charAt(0)?.toUpperCase() || 'S'}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-sm truncate">{s.name}</p>
                  <p className="text-xs text-slate-400 truncate">{s.email}</p>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6 flex-shrink-0">
                  <div className="text-center">
                    <p className="text-sm font-bold text-slate-800">{parseInt(s.totalTests)}</p>
                    <p className="text-[10px] text-slate-400">Tests</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-indigo-600">{parseFloat(s.avgScore).toFixed(1)}</p>
                    <p className="text-[10px] text-slate-400">Avg Score</p>
                  </div>
                  <div className="text-center hidden sm:block">
                    <div className="flex items-center gap-1">
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${Math.min(100, parseFloat(s.avgAccuracy))}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-emerald-600">
                        {parseFloat(s.avgAccuracy).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 text-right">Accuracy</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
            <GraduationCap className="w-12 h-12 opacity-30" />
            <p className="text-sm font-medium">No student attempts yet</p>
          </div>
        )}
      </div>

      {/* Row 4: Top Tests */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            Most Attempted Tests
          </h3>
          <span className="text-xs text-slate-400">by your students</span>
        </div>
        {data?.testPerformance?.length > 0 ? (
          <div className="divide-y divide-slate-50">
            {data.testPerformance.map((t, i) => (
              <div key={t.id} className="flex items-center gap-4 px-6 py-3 hover:bg-slate-50 transition-colors">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 text-xs font-extrabold flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-sm truncate">{t.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: `${TYPE_COLOR[t.type]}20`, color: TYPE_COLOR[t.type] }}>
                      {TYPE_LABEL[t.type] || t.type}
                    </span>
                    <span className="text-[10px] text-slate-400">{t.category}</span>
                  </div>
                </div>
                <div className="flex items-center gap-6 flex-shrink-0 text-right">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{parseInt(t.attempts)}</p>
                    <p className="text-[10px] text-slate-400">Attempts</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-indigo-600">{parseFloat(t.avgScore).toFixed(1)}</p>
                    <p className="text-[10px] text-slate-400">Avg Score</p>
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-sm font-bold text-emerald-600">{parseFloat(t.avgAccuracy).toFixed(0)}%</p>
                    <p className="text-[10px] text-slate-400">Accuracy</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
            <BookOpen className="w-12 h-12 opacity-30" />
            <p className="text-sm font-medium">No test data yet</p>
          </div>
        )}
      </div>

    </div>
  );
}
