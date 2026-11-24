import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Users, DollarSign, BookOpen, TrendingUp, Activity, Clock, Award, Plus, ArrowRight, Medal } from 'lucide-react';
import api from '../../../lib/api';

const StatCard = ({ icon: Icon, label, value, sub, color, gradient }) => (
  <div className={`relative overflow-hidden rounded-2xl p-6 ${gradient} border border-white/10 shadow-xl`}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-white/70 mb-1">{label}</p>
        <p className="text-3xl font-black text-white">{value}</p>
        {sub && <p className="text-xs text-white/60 mt-1">{sub}</p>}
      </div>
      <div className={`p-3 rounded-xl bg-white/20`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
    <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-white/5" />
  </div>
);

const StatusBadge = ({ status }) => {
  const map = {
    draft:     'bg-slate-100 text-slate-600',
    open:      'bg-green-100 text-green-700',
    closed:    'bg-yellow-100 text-yellow-700',
    ongoing:   'bg-blue-100 text-blue-700',
    completed: 'bg-purple-100 text-purple-700',
    cancelled: 'bg-red-100 text-red-700',
  };
  return <span className={`text-xs font-bold px-3 py-1 rounded-full ${map[status] || 'bg-slate-100 text-slate-600'}`}>{status?.toUpperCase()}</span>;
};

export default function OlympiadAdminDashboard() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    api.get('/olympiad/admin/analytics')
      .then(r => setAnalytics(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const d = analytics || {};

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <span className="p-2 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl">
              <Trophy className="w-6 h-6 text-white" />
            </span>
            Olympiad Dashboard
          </h1>
          <p className="text-slate-500 mt-1">Monitor and manage all olympiad activities</p>
        </div>
        <button
          onClick={() => navigate('/admin/olympiad/new')}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-indigo-500/30 transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          Create Olympiad
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Trophy}     label="Total Olympiads"     value={d.totalOlympiads || 0}      gradient="bg-gradient-to-br from-indigo-600 to-indigo-700" />
        <StatCard icon={Users}      label="Total Registrations" value={d.totalRegistrations || 0}   gradient="bg-gradient-to-br from-emerald-600 to-teal-700" />
        <StatCard icon={DollarSign} label="Total Revenue"       value={`₹${(d.totalRevenue || 0).toLocaleString('en-IN')}`} gradient="bg-gradient-to-br from-orange-500 to-pink-600" />
        <StatCard icon={Activity}   label="Active Sessions"     value={d.activeSessions || 0}       gradient="bg-gradient-to-br from-blue-600 to-cyan-600" />
      </div>

      {/* Recent Olympiads */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-500" />
            Recent Olympiads
          </h2>
          <button onClick={() => navigate('/admin/olympiad/list')} className="text-sm text-indigo-600 font-semibold hover:underline flex items-center gap-1">
            View All <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="divide-y divide-slate-100">
          {(d.recentOlympiads || []).map(o => (
            <div key={o.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors group">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black"
                style={{ background: o.subject?.color + '20', color: o.subject?.color }}>
                {o.subject?.name?.[0] || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 truncate">{o.title}</p>
                <p className="text-xs text-slate-500">{o.subject?.name} · Exam: {o.examDate ? new Date(o.examDate).toLocaleDateString('en-IN') : 'TBD'}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-slate-700">{o.totalRegistrations || 0} reg.</span>
                <span className="text-sm font-bold text-emerald-600">₹{((o.totalRegistrations || 0) * (o.registrationFee || 0)).toLocaleString('en-IN')}</span>
                <StatusBadge status={o.status} />
              </div>
            </div>
          ))}
          {!d.recentOlympiads?.length && (
            <div className="py-12 text-center text-slate-400">
              <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No olympiads yet. Create your first one!</p>
            </div>
          )}
        </div>
      </div>

      {/* Subject & Class breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Class wise */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-500" />
            Registrations by Class
          </h3>
          {(d.classStats || []).map(cs => {
            const max = Math.max(...(d.classStats || []).map(x => parseInt(x.count) || 0));
            const pct = max ? Math.round((parseInt(cs.count) / max) * 100) : 0;
            return (
              <div key={cs.classSelected} className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-slate-700">Class {cs.classSelected}</span>
                  <span className="font-bold text-slate-900">{cs.count}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
          {!d.classStats?.length && <p className="text-slate-400 text-sm">No data yet</p>}
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Create Olympiad',     path: '/admin/olympiad/new',             icon: Plus,     color: 'from-indigo-500 to-purple-600' },
              { label: 'Prizes & Rewards',    path: '/admin/olympiad/rewards',         icon: Award,    color: 'from-amber-500 to-yellow-600' },
              { label: 'Manage Questions',    path: '/admin/olympiad/questions',        icon: BookOpen, color: 'from-emerald-500 to-teal-600' },
              { label: 'View Registrations',  path: '/admin/olympiad/registrations',   icon: Users,    color: 'from-orange-500 to-pink-600' },
              { label: 'Publish Results',     path: '/admin/olympiad/results',          icon: Medal,    color: 'from-blue-500 to-cyan-600' },
              { label: 'Study Materials',     path: '/admin/olympiad/study-materials',  icon: BookOpen, color: 'from-violet-500 to-purple-600' },
            ].map(a => (

              <button
                key={a.path}
                onClick={() => navigate(a.path)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br ${a.color} text-white font-semibold hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5`}
              >
                <a.icon className="w-6 h-6" />
                <span className="text-xs text-center">{a.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
