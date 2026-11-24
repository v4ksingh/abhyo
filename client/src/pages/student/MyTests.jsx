import React, { useEffect, useState } from 'react';
import { BookOpen, Clock, ArrowRight, Search, Radio, Folder, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { toast } from 'react-hot-toast';
import useAuthStore from '../../store/authStore';

const CATEGORIES = ['All', 'SSC', 'Banking', 'Railway', 'UPSC', 'State PSC', 'Defence'];

const statusConfig = {
  'not-attempted': { label: 'Start Test',   cls: 'btn-primary',   color: 'text-blue-500 bg-blue-50 border-blue-100' },
  'in-progress':   { label: 'Continue',     cls: 'btn-success',   color: 'text-amber-600 bg-amber-50 border-amber-100' },
  'completed':     { label: 'View Result',  cls: 'btn-secondary', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
  'auto-submitted':{ label: 'View Result',  cls: 'btn-secondary', color: 'text-rose-600 bg-rose-50 border-rose-100' },
};

const fmtCountdown = (secs) => {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${h > 0 ? h + ':' : ''}${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
};

export default function MyTests() {
  const [tests,        setTests]        = useState([]);
  const [assignedTests, setAssignedTests] = useState([]);
  const [liveTests,    setLiveTests]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [search,       setSearch]       = useState('');
  const [, setTick] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isInstituteStudent = !!user?.instituteId;

  // Tick every second for live countdown
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const loadAll = async () => {
      try {
        // Load tests (primary) — load all for client-side grouping
        const testsRes = await api.get('/student/my-tests', {
          params: { limit: 200 }
        });
        setTests(testsRes.data.data || []);
      } catch {
        toast.error('Failed to load tests');
      } finally {
        setLoading(false);
      }

      // Load assigned / live tests from dashboard (secondary, non-blocking)
      try {
        const dashRes = await api.get('/student/dashboard');
        const assigned = dashRes.data.data?.assignedTests || [];
        const now = new Date();

        const live = assigned.filter(t => {
          if (!t.startTime || t.attemptStatus === 'completed' || t.attemptStatus === 'auto-submitted') return false;
          const start = new Date(t.startTime);
          const end   = new Date(start.getTime() + (t.duration || 60) * 60000);
          return start <= now && end > now;
        });

        const pending = assigned.filter(t => {
          if (t.attemptStatus === 'completed' || t.attemptStatus === 'auto-submitted') return false;
          if (!t.startTime) return true;
          const start = new Date(t.startTime);
          const end   = new Date(start.getTime() + (t.duration || 60) * 60000);
          return !(start <= now && end > now);
        });

        setLiveTests(live);
        setAssignedTests(pending);
      } catch (e) {
        console.warn('Live/assigned fetch failed:', e.message);
      }
    };
    loadAll();
  }, []);

  const filtered = tests.filter(t => t.title.toLowerCase().includes(search.toLowerCase()));

  const groupedByCategory = filtered.reduce((acc, test) => {
    const cat = test.category || 'Uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(test);
    return acc;
  }, {});

  const sortedCategories = Object.keys(groupedByCategory).sort();

  const handleAction = (test) => {
    if (test.attemptStatus === 'completed' || test.attemptStatus === 'auto-submitted') {
      navigate('/student/results');
    } else if (test.attemptStatus === 'in-progress') {
      navigate(`/test/${test.id}`);
    } else {
      navigate(`/test/${test.id}/lobby`);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">

      <div>
        <h1 className="section-header">📚 {isInstituteStudent ? 'Assigned' : 'My'} Tests</h1>
        <p className="section-subheader">
          {isInstituteStudent ? 'Tests assigned to you by your institute' : 'All available and platform tests'}
        </p>
      </div>

      {/* ═══ LIVE TESTS ═══ */}
      {liveTests.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <h2 className="font-black text-red-600 uppercase tracking-widest text-sm">Live Session — Active Now</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {liveTests.map(test => {
              const start    = new Date(test.startTime);
              const end      = new Date(start.getTime() + (test.duration || 60) * 60000);
              const remaining = Math.max(0, Math.floor((end - new Date()) / 1000));
              const progress  = Math.min(100, ((test.duration * 60 - remaining) / (test.duration * 60)) * 100);
              return (
                <div key={test.id}
                  className="relative overflow-hidden rounded-2xl border border-red-300 shadow-xl"
                  style={{ background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 60%, #b91c1c 100%)' }}
                >
                  <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 18px, rgba(255,255,255,.3) 18px, rgba(255,255,255,.3) 19px)' }} />
                  <div className="relative z-10 p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-300 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-300"></span>
                          </span>
                          <span className="text-red-300 text-[11px] font-black uppercase tracking-widest">LIVE</span>
                        </div>
                        <h3 className="text-white font-extrabold text-base leading-tight line-clamp-2">{test.title}</h3>
                      </div>
                      <div className="flex-shrink-0 text-center bg-black/30 rounded-xl px-3 py-2">
                        <p className="text-red-300 text-[10px] font-bold uppercase">Remaining</p>
                        <p className="text-white font-black text-xl tabular-nums leading-tight">{fmtCountdown(remaining)}</p>
                      </div>
                    </div>

                    <div className="flex gap-4 text-red-200 text-xs mb-3">
                      <span>📝 {test.totalQuestions} Qs</span>
                      <span>⏱ {test.duration} min</span>
                      <span>🏆 {test.totalMarks} Marks</span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-black/30 rounded-full h-1.5 mb-4">
                      <div className="h-1.5 rounded-full bg-red-300 transition-all" style={{ width: `${progress}%` }} />
                    </div>

                    <button
                      onClick={() => navigate(`/test/${test.id}/lobby`)}
                      className="w-full bg-white text-red-700 font-black text-sm py-2.5 rounded-xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2 shadow-lg"
                    >
                      <Radio size={15} /> Join Live Test Now
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ═══ ASSIGNED TESTS (non-live) ═══ */}
      {assignedTests.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-bold text-slate-600 uppercase tracking-widest text-sm flex items-center gap-2">
            🔔 Assigned by Institute
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {assignedTests.map(test => (
              <div key={test.id}
                className="flex items-center gap-3 p-4 bg-white rounded-2xl border-2 border-indigo-100 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group"
                onClick={() => navigate(`/test/${test.id}/lobby`)}
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-primary-600 flex items-center justify-center text-white font-black text-xs flex-shrink-0">
                  {test.category?.slice(0, 2) || 'T'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 text-sm truncate group-hover:text-indigo-600 transition-colors">{test.title}</p>
                  <p className="text-xs text-slate-400">{test.totalQuestions} Qs · {test.duration}m
                    {test.deadline && <span className="text-red-500 font-semibold ml-1">· Due {new Date(test.deadline).toLocaleDateString('en-IN')}</span>}
                  </p>
                </div>
                <ArrowRight size={16} className="text-indigo-400 group-hover:translate-x-1 transition-transform flex-shrink-0" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ═══ ALL TESTS / FILTERABLE LIST ═══ */}
      <section className="space-y-4">
        <h2 className="font-bold text-slate-600 uppercase tracking-widest text-sm flex items-center gap-2">
          {isInstituteStudent ? '📁 All Assignments' : '🌐 Test Library'}
        </h2>
        <div className="relative flex-1 mb-4">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input type="text" placeholder="Search tests..." value={search}
            onChange={e => setSearch(e.target.value)} className="input-field !pl-9 w-full bg-white shadow-sm" />
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-52" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-16">
            <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-500">No tests available in this category</p>
          </div>
        ) : !selectedCategory ? (
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4 pb-10">
              {sortedCategories.map(cat => (
                <div 
                  key={cat} 
                  onClick={() => setSelectedCategory(cat)}
                  className="bg-white rounded-3xl border border-slate-200 p-6 cursor-pointer hover:border-indigo-400 hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col items-center justify-center text-center space-y-3"
                >
                  <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                    <Folder size={28} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 text-base group-hover:text-indigo-600 transition-colors uppercase tracking-wide">{cat}</h3>
                    <p className="text-xs font-semibold text-slate-500 mt-1.5 bg-slate-100 inline-block px-2.5 py-0.5 rounded-full">{groupedByCategory[cat].length} Tests Available</p>
                  </div>
                </div>
              ))}
            </div>
        ) : (
          <div className="space-y-6 pb-10">
            <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm animate-fade-in">
              <button 
                onClick={() => setSelectedCategory(null)}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors shrink-0"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">{selectedCategory}</h2>
                <p className="text-xs font-semibold text-slate-500">
                  {groupedByCategory[selectedCategory]?.length || 0} relative tests in this category
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
              {(groupedByCategory[selectedCategory] || []).map(test => {
                const statusInfo = statusConfig[test.attemptStatus] || statusConfig['not-attempted'];
                const isCompleted = test.attemptStatus === 'completed' || test.attemptStatus === 'auto-submitted';
                return (
                  <div key={test.id} className="card group hover:border-primary-300 hover:shadow-md transition-all duration-200 flex flex-col bg-white h-full">
                    <div className="flex items-center justify-between mb-3">
                      <span className="badge-primary text-xs">{test.category}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${statusInfo.color}`}>
                        {test.attemptStatus?.replace('-', ' ')}
                      </span>
                    </div>
                    <h3 className="font-semibold text-slate-900 text-sm leading-snug mb-3 flex-1">{test.title}</h3>
                    <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                      <div className="bg-slate-50 rounded-lg p-2 text-center border border-slate-100">
                        <p className="text-slate-400">Questions</p>
                        <p className="font-bold text-slate-800">{test.totalQuestions || '?'}</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-2 text-center border border-slate-100">
                        <p className="text-slate-400">Duration</p>
                        <p className="font-bold text-slate-800">{test.duration}m</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-2 text-center border border-slate-100">
                        <p className="text-slate-400">Attempts</p>
                        <p className="font-bold text-slate-800">{test.totalAttempts || 0}</p>
                      </div>
                    </div>
                    {isCompleted && (
                      <div className="flex items-center justify-between text-xs bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2 mb-3">
                        <span className="text-slate-500">Your Score</span>
                        <span className="font-bold text-emerald-600">{test.lastScore} · {test.lastAccuracy}% acc</span>
                      </div>
                    )}
                    <button onClick={() => handleAction(test)}
                      className={`${statusInfo.cls} w-full !py-2 !text-sm flex items-center justify-center gap-2 mt-auto`}>
                      {statusInfo.label} <ArrowRight size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
