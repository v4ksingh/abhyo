import React, { useEffect, useState } from 'react';
import {
  TrendingUp, Users, BookOpen, Award, Target,
  ArrowUpRight, ArrowDownRight, Minus, RefreshCw,
  BarChart2, PieChart as PieIcon, Activity
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import api from '../../lib/api';

const COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-lg text-sm">
      <p className="text-slate-500 text-xs mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">
          {p.name}: {typeof p.value === 'number' && p.name?.toLowerCase().includes('revenue')
            ? `₹${p.value.toLocaleString()}` : p.value}
        </p>
      ))}
    </div>
  );
};

const StatChange = ({ change }) => {
  if (change > 0) return <span className="flex items-center gap-0.5 text-emerald-500 text-xs font-medium"><ArrowUpRight size={12} />+{change}%</span>;
  if (change < 0) return <span className="flex items-center gap-0.5 text-red-400 text-xs font-medium"><ArrowDownRight size={12} />{change}%</span>;
  return <span className="flex items-center gap-0.5 text-slate-400 text-xs"><Minus size={12} />0%</span>;
};

// Category distribution mock
const categoryData = [
  { name: 'SSC', value: 35 },
  { name: 'Banking', value: 25 },
  { name: 'UPSC', value: 20 },
  { name: 'Railway', value: 12 },
  { name: 'Others', value: 8 },
];

// Subject performance radar mock
const subjectRadar = [
  { subject: 'Math', A: 78, fullMark: 100 },
  { subject: 'Reasoning', A: 65, fullMark: 100 },
  { subject: 'English', A: 82, fullMark: 100 },
  { subject: 'GK', A: 71, fullMark: 100 },
  { subject: 'Science', A: 59, fullMark: 100 },
  { subject: 'History', A: 74, fullMark: 100 },
];

// Score distribution mock
const scoreDistribution = [
  { range: '0-20%', count: 12 },
  { range: '20-40%', count: 28 },
  { range: '40-60%', count: 65 },
  { range: '60-80%', count: 89 },
  { range: '80-100%', count: 34 },
];

export default function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const [dashboard, revenue] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/revenue', { params: { period } }),
      ]);
      setData({
        stats: dashboard.data.data?.stats || {},
        monthlyRevenue: dashboard.data.data?.monthlyRevenue || [],
        dailyAttempts: dashboard.data.data?.dailyAttempts || [],
        revenue: revenue.data.data || {},
      });
    } catch {
      // Use mock data on error
      setData({ stats: {}, monthlyRevenue: [], dailyAttempts: [], revenue: {} });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, [period]);

  const attemptsData = (data?.dailyAttempts || []).map(d => ({
    date: (d.date || '').split('-').slice(1).join('/'),
    Attempts: d.count || 0,
  }));

  const revenueData = (data?.monthlyRevenue || []).map(m => ({
    name: `${m.year || ''}-${String(m.month || 1).padStart(2, '0')}`,
    Revenue: m.total || 0,
    Transactions: m.count || 0,
  }));

  const dailyRevData = (data?.revenue?.daily || []).map(d => ({
    date: (d.date || '').split('-').slice(1).join('/'),
    Revenue: d.total || 0,
    Orders: d.count || 0,
  }));

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-28" />)}
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="skeleton h-72" /><div className="skeleton h-72" />
        </div>
      </div>
    );
  }

  const { stats } = data || {};

  const kpis = [
    {
      label: 'Total Students', value: stats?.totalStudents?.toLocaleString() || '0',
      icon: Users, gradient: 'from-blue-500 to-indigo-600', change: 12,
    },
    {
      label: 'Test Attempts', value: stats?.totalResults?.toLocaleString() || '0',
      icon: BookOpen, gradient: 'from-purple-500 to-violet-600', change: 8,
    },
    {
      label: 'Avg. Accuracy', value: '68.4%',
      icon: Target, gradient: 'from-emerald-500 to-teal-600', change: 3,
    },
    {
      label: 'Active Institutes', value: stats?.totalInstitutes || '0',
      icon: Award, gradient: 'from-amber-500 to-orange-500', change: -2,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-header">📈 Platform Analytics</h1>
          <p className="section-subheader">Deep dive into platform performance and student metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 rounded-xl p-1 gap-0.5">
            {['7d', '30d', '90d', '1y'].map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  period === p ? 'bg-primary-600 text-white' : 'text-slate-500 hover:text-slate-800'
                }`}>
                {p}
              </button>
            ))}
          </div>
          <button onClick={fetchData} disabled={refreshing}
            className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(kpi => (
          <div key={kpi.label} className="card relative overflow-hidden">
            <div className={`w-10 h-10 bg-gradient-to-br ${kpi.gradient} rounded-xl flex items-center justify-center shadow-md mb-3`}>
              <kpi.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-slate-500 text-xs font-medium">{kpi.label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{kpi.value}</p>
            <div className="flex items-center gap-1 mt-1">
              <StatChange change={kpi.change} />
              <span className="text-xs text-slate-400">vs last period</span>
            </div>
            <div className={`absolute right-0 top-0 w-20 h-20 rounded-full -translate-y-8 translate-x-8 opacity-10 bg-gradient-to-br ${kpi.gradient}`} />
          </div>
        ))}
      </div>

      {/* Main Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Area Chart - Daily Attempts */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary-400" />
              Daily Test Attempts
            </h3>
            <span className="badge-info text-xs">Last 7 Days</span>
          </div>
          {attemptsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={attemptsData}>
                <defs>
                  <linearGradient id="attemptsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="Attempts" stroke="#6366f1" strokeWidth={2.5}
                  fill="url(#attemptsGrad)" dot={{ fill: '#6366f1', r: 4 }} activeDot={{ r: 6 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-52 flex flex-col items-center justify-center text-slate-400">
              <Activity className="w-10 h-10 mb-2 opacity-40" />
              <p className="text-sm">No attempt data yet</p>
            </div>
          )}
        </div>

        {/* Bar Chart - Monthly Revenue */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Monthly Revenue
            </h3>
            <span className="badge-success text-xs">Last 6 Months</span>
          </div>
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Revenue" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-52 flex flex-col items-center justify-center text-slate-400">
              <TrendingUp className="w-10 h-10 mb-2 opacity-40" />
              <p className="text-sm">No revenue data yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Second Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Pie Chart - Category Distribution */}
        <div className="card">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-amber-400" />
            Test Category Distribution
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                paddingAngle={3} dataKey="value">
                {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(val) => [`${val}%`, '']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 mt-2">
            {categoryData.map((item, i) => (
              <span key={item.name} className="flex items-center gap-1 text-xs text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i] }} />
                {item.name} ({item.value}%)
              </span>
            ))}
          </div>
        </div>

        {/* Score Distribution Bar */}
        <div className="card">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-purple-400" />
            Score Distribution
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={scoreDistribution} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <YAxis dataKey="range" type="category" tick={{ fill: '#94a3b8', fontSize: 10 }} width={55} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Radar - Subject Performance */}
        <div className="card">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-400" />
            Avg Subject Performance
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={subjectRadar}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8, fill: '#94a3b8' }} />
              <Radar name="Avg Score" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Stats Table */}
      <div className="card">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-400" />
          Performance Summary
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Best Performing Category', value: 'SSC CGL', badge: 'badge-success' },
            { label: 'Most Active Day', value: 'Monday', badge: 'badge-primary' },
            { label: 'Peak Hour', value: '6–9 PM', badge: 'badge-info' },
            { label: 'Avg. Completion Rate', value: '87.3%', badge: 'badge-warning' },
          ].map(item => (
            <div key={item.label} className="bg-slate-50 rounded-xl p-4 text-center">
              <p className="text-xs text-slate-500 mb-2">{item.label}</p>
              <span className={`${item.badge} text-sm font-semibold`}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
