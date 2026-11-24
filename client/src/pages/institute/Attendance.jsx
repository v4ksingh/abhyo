import React, { useState, useEffect } from 'react';
import { 
  UserCheck, Search, Calendar, Filter, Download, 
  ChevronRight, Users, BookOpen, Layers, BarChart3, TrendingUp
} from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'react-hot-toast';
import useAuthStore from '../../store/authStore';

export default function Attendance() {
  const { user } = useAuthStore();
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState([]);
  const [courses, setCourses] = useState([]);
  const [filters, setFilters] = useState({
    batchId: '',
    courseId: '',
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const fetchFilters = async () => {
    if (user?.role === 'student') return;
    try {
      const [batchRes, courseRes] = await Promise.all([
        api.get('/institute/batches'),
        api.get('/lms/courses')
      ]);
      setBatches(batchRes.data.data || []);
      setCourses(courseRes.data.data || []);
    } catch (e) {
      console.error('Failed to load filters');
    }
  };

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams(filters).toString();
      const res = await api.get(`/lms/attendance?${query}`);
      setAttendance(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load attendance report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [filters]);

  const stats = {
    total: attendance.length,
    present: attendance.filter(a => a.status === 'present').length,
    absent: attendance.filter(a => a.status === 'absent').length,
    late: attendance.filter(a => a.status === 'late').length,
    percentage: attendance.length > 0 
      ? ((attendance.filter(a => a.status === 'present').length / attendance.length) * 100).toFixed(1)
      : 0
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-slate-900 via-primary-900 to-slate-900 rounded-[2rem] p-8 md:p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-10 w-48 h-48 bg-primary-500/20 rounded-full blur-3xl translate-y-1/2"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/10 shadow-inner">
              <UserCheck size={28} className="text-primary-100" />
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-0">
              {user?.role === 'student' ? 'My Attendance' : 'Attendance Reports'}
            </h1>
          </div>
          <p className="text-primary-100/70 font-medium text-lg max-w-xl md:pl-16">
            {user?.role === 'student' 
              ? 'Track your daily presence and engagement records.' 
              : 'Monitor student engagement and track daily presence across your institution.'}
          </p>
        </div>
        
        <button className="relative z-10 bg-white/10 hover:bg-white/20 backdrop-blur-lg border border-white/20 text-white font-bold px-6 py-3.5 rounded-xl transition-all duration-300 flex items-center gap-3">
          <Download size={20} /> Export Report
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Records', value: stats.total, icon: Layers, color: 'primary' },
          { label: 'Present Today', value: stats.present, icon: UserCheck, color: 'emerald' },
          { label: 'Absent Today', value: stats.absent, icon: Filter, color: 'red' },
          { label: 'Attendance %', value: `${stats.percentage}%`, icon: TrendingUp, color: 'blue' }
        ].map((stat, i) => (
          <div key={i} className="card relative overflow-hidden group hover:scale-105 transition-transform duration-300">
            <div className={`absolute top-0 right-0 w-24 h-24 bg-${stat.color}-500/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500`}></div>
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className={`w-12 h-12 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600 flex items-center justify-center mb-4 shadow-sm border border-${stat.color}-100`}>
                <stat.icon size={24} />
              </div>
              <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">{stat.label}</p>
              <h4 className="text-2xl font-black text-slate-800">{stat.value}</h4>
            </div>
          </div>
        ))}
      </div>

      {/* Filters Toolbar */}
      <div className="glass p-6 rounded-[2rem] border border-slate-200/60 shadow-xl shadow-slate-200/20 flex flex-wrap gap-4 items-end">
        {user?.role !== 'student' && (
          <>
            <div className="flex-1 min-w-[200px] space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Filter by Batch</label>
              <div className="relative">
                <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <select 
                  value={filters.batchId}
                  onChange={(e) => setFilters({ ...filters, batchId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all appearance-none cursor-pointer"
                >
                  <option value="">All Batches</option>
                  {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            </div>
            
            <div className="flex-1 min-w-[200px] space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Filter by Course</label>
              <div className="relative">
                <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <select 
                  value={filters.courseId}
                  onChange={(e) => setFilters({ ...filters, courseId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all appearance-none cursor-pointer"
                >
                  <option value="">All Courses</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
            </div>
          </>
        )}

        <div className="flex-1 min-w-[200px] space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Start Date</label>
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all cursor-pointer"
            />
          </div>
        </div>

        <div className="flex-1 min-w-[200px] space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">End Date</label>
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="card !p-0 overflow-hidden border-2 border-slate-100 shadow-xl shadow-slate-200/40 relative z-10">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Date</th>
                {user?.role !== 'student' && <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Student Name</th>}
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Course / Batch</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Marked By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan="5" className="p-4"><div className="skeleton h-12 w-full rounded-xl" /></td>
                  </tr>
                ))
              ) : attendance.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-8 py-5 uppercase">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-slate-800">{new Date(record.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      <span className="text-[10px] font-bold text-slate-400">{new Date(record.date).toLocaleDateString('en-GB', { weekday: 'long' })}</span>
                    </div>
                  </td>
                  {user?.role !== 'student' && (
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-500 font-bold border border-slate-300 shadow-sm">
                          {record.student?.name?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{record.student?.name}</p>
                          <p className="text-[10px] font-medium text-slate-500">{record.student?.email}</p>
                        </div>
                      </div>
                    </td>
                  )}
                  <td className="px-8 py-5">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-500"></span>
                        <span className="text-xs font-bold text-slate-700">{record.course?.title || 'General Course'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                        <span className="text-[11px] font-medium text-slate-500">{record.batch?.name}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                      record.status === 'present' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                      record.status === 'absent' ? 'bg-red-50 text-red-600 border-red-100' :
                      'bg-amber-50 text-amber-600 border-amber-100'
                    }`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <p className="text-xs font-bold text-slate-600">{record.marker?.name || 'Automated'}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {!loading && attendance.length === 0 && (
          <div className="py-24 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <BarChart3 size={32} className="text-slate-200" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No Records Found</h3>
            <p className="text-slate-500 max-w-sm mx-auto">Adjust your filters or date range to see attendance data for your students.</p>
          </div>
        )}
      </div>
    </div>
  );
}
