import React, { useEffect, useState } from 'react';
import { Users, Building2, BookOpen, IndianRupee, TrendingUp, Award, Clock, AlertCircle } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../../lib/api';

const StatCard = ({ title, value, sub, icon: Icon, color, gradient }) => (
  <div className="stat-card">
    <div className={`stat-icon ${gradient}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-slate-500 text-sm font-medium">{title}</p>
      <p className="text-2xl font-bold text-slate-900 mt-0.5">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
    <div className={`absolute right-0 top-0 w-24 h-24 rounded-full -translate-y-8 translate-x-8 opacity-10 ${color}`} />
  </div>
);

const COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-sm">
      <p className="text-slate-500">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">
          {p.name}: {typeof p.value === 'number' && p.name?.toLowerCase().includes('revenue')
            ? `₹${p.value.toLocaleString()}` : p.value}
        </p>
      ))}
    </div>
  );
};

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(res => setData(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-28" />)}
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="skeleton h-64" />
          <div className="skeleton h-64" />
        </div>
      </div>
    );
  }

  const { stats, recentPayments, recentInstitutes, monthlyRevenue = [], dailyAttempts = [] } = data || {};

  const revenueData = (monthlyRevenue || []).map(m => ({
    name: `${m.year || m.month || ''}`,
    Revenue: m.total || 0,
    Transactions: m.count || 0,
  }));

  const attemptsData = (dailyAttempts || []).map(d => ({
    date: (d.date || '').split('-').slice(1).join('/'),
    Attempts: d.count || 0,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="section-header">📊 Admin Dashboard</h1>
        <p className="section-subheader">Platform overview and key metrics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Students" value={stats?.totalStudents?.toLocaleString() || '0'}
          sub="Registered students" icon={Users}
          gradient="bg-gradient-to-br from-blue-500 to-blue-600" color="bg-blue-500" />
        <StatCard title="Institutes" value={stats?.totalInstitutes || '0'}
          sub={`${stats?.pendingInstitutes || 0} pending approval`} icon={Building2}
          gradient="bg-gradient-to-br from-purple-500 to-accent-600" color="bg-purple-500" />
        <StatCard title="Active Tests" value={stats?.totalTests || '0'}
          sub={`${stats?.totalResults?.toLocaleString() || '0'} attempts`} icon={BookOpen}
          gradient="bg-gradient-to-br from-primary-500 to-primary-600" color="bg-primary-500" />
        <StatCard title="Total Revenue" value={`₹${(stats?.totalRevenue || 0).toLocaleString()}`}
          sub={`${stats?.totalTransactions || 0} transactions`} icon={IndianRupee}
          gradient="bg-gradient-to-br from-emerald-500 to-emerald-600" color="bg-emerald-500" />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Question Bank', value: stats?.totalQuestions?.toLocaleString() || '0', icon: '❓', color: 'text-amber-400' },
          { label: 'Total Users', value: stats?.totalUsers?.toLocaleString() || '0', icon: '👥', color: 'text-blue-400' },
          { label: 'Test Results', value: stats?.totalResults?.toLocaleString() || '0', icon: '📊', color: 'text-emerald-400' },
          { label: 'Pending Approval', value: stats?.pendingInstitutes || '0', icon: '⏳', color: 'text-amber-400' },
        ].map(item => (
          <div key={item.label} className="card flex items-center gap-4">
            <span className="text-2xl">{item.icon}</span>
            <div>
              <p className="text-slate-500 text-xs">{item.label}</p>
              <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary-400" /> Monthly Revenue
            </h3>
          </div>
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-52 flex items-center justify-center text-slate-400 text-sm">
              No revenue data yet
            </div>
          )}
        </div>

        {/* Daily Attempts */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" /> Daily Test Attempts (Last 7 Days)
            </h3>
          </div>
          {attemptsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={attemptsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="Attempts" stroke="#10b981" strokeWidth={2}
                  dot={{ fill: '#10b981', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-52 flex items-center justify-center text-slate-400 text-sm">
              No attempt data yet
            </div>
          )}
        </div>
      </div>

      {/* Bottom Tables */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pending Institutes */}
        <div className="card">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400" /> Pending Approvals
          </h3>
          {recentInstitutes?.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-6">No pending approvals 🎉</p>
          ) : (
            <div className="space-y-3">
              {(recentInstitutes || []).map(inst => (
                <div key={inst.id || inst._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{inst.name}</p>
                    <p className="text-xs text-slate-500">{inst.email}</p>
                  </div>
                  <span className="badge-warning">Pending</span>
                </div>
              ))}
              <a href="/admin/institutes" className="text-primary-600 text-xs hover:text-primary-700">
                View all institutes →
              </a>
            </div>
          )}
        </div>

        {/* Recent Payments */}
        <div className="card">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <IndianRupee className="w-4 h-4 text-emerald-400" /> Recent Payments
          </h3>
          {recentPayments?.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-6">No payments yet</p>
          ) : (
            <div className="space-y-3">
              {(recentPayments || []).slice(0, 5).map(p => (
                <div key={p.id || p._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{p.user?.name || 'User'}</p>
                    <p className="text-xs text-slate-500 capitalize">{p.type?.replace('_', ' ')}</p>
                  </div>
                  <span className="text-emerald-600 font-semibold text-sm">₹{p.amount}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
