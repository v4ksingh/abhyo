import React, { useEffect, useState } from 'react';
import { BookOpen, Clock, Users, Radio, Search, CheckCircle, Zap, ArrowLeft, Folder } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../lib/api';
import ExportButtons from '../../components/shared/ExportButtons';

const typeLabels = { mock: 'Mock', pyp: 'PYP', daily_quiz: 'Daily Quiz', sectional: 'Sectional' };
const typeBadge  = { mock: 'badge-primary', pyp: 'badge-warning', daily_quiz: 'badge-success', sectional: 'badge-info' };

export default function InstituteTests() {
  const [tests,    setTests]    = useState([]);
  const [batches,  setBatches]  = useState([]);
  const [liveTests, setLiveTests] = useState([]); // currently live assigned tests
  const [loading,  setLoading]  = useState(true);
  const [activeTab, setActiveTab] = useState('mock'); // 'mock' | 'live'
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Assign panel state
  const [assigning,     setAssigning]     = useState(null);
  const [assignBatchId, setAssignBatchId] = useState('');
  const [isLiveMode,    setIsLiveMode]    = useState(false);
  const [scheduledTime, setScheduledTime] = useState('');

  // Search / filter (mock tab only)
  const [search,     setSearch]     = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const fetchData = async () => {
    try {
      const [testsRes, batchesRes] = await Promise.all([
        api.get('/tests', { params: { limit: 100 } }),
        api.get('/institute/batches'),
      ]);
      setTests(testsRes.data.data || []);
      const batchData = batchesRes.data.data || [];
      setBatches(batchData);

      // Derive live tests: startTime set within last 3 hours
      const now = new Date();
      const live = [];
      batchData.forEach(batch => {
        (batch.tests || []).forEach(t => {
          const st = t.BatchTest?.startTime;
          if (st) {
            const start = new Date(st);
            const end   = new Date(start.getTime() + (t.duration || 60) * 60000);
            if (end > now) {
              live.push({ ...t, batchName: batch.name, batchId: batch.id, startTime: st });
            }
          }
        });
      });
      setLiveTests(live);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Countdown state (ticks every second for live tab)
  const [, setTick] = useState(0);

  useEffect(() => {
    fetchData();
    // Poll every 30s when on live tab to auto-refresh sessions
    const poll = setInterval(fetchData, 30000);
    return () => clearInterval(poll);
  }, []);

  // Tick every second so countdown stays live
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const handleStopLive = async (testId, batchId) => {
    if (!window.confirm('Stop this live session? Students will no longer see it as live.')) return;
    try {
      // Re-assign without isLive → clears startTime by setting it to null via a patch
      await api.post(`/institute/batches/${batchId}/assign-test`, { testId, isLive: false });
      toast.success('Live session ended.');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to stop session');
    }
  };

  const handleAssign = async (testId) => {
    if (!assignBatchId) { toast.error('Select a batch first'); return; }
    try {
      const payload = { testId, isLive: isLiveMode };
      if (isLiveMode && scheduledTime) {
        payload.startTime = new Date(scheduledTime).toISOString();
      }
      await api.post(`/institute/batches/${assignBatchId}/assign-test`, payload);
      if (isLiveMode) {
        if (scheduledTime) {
          toast.success('Test scheduled successfully!');
        } else {
          toast.success('🔴 Test is now LIVE for students!');
        }
        setActiveTab('live');
      } else {
        toast.success('Test assigned to batch!');
      }
      setAssigning(null); setAssignBatchId(''); setIsLiveMode(false); setScheduledTime('');
      fetchData(); // refresh to pick up new live tests
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to assign test');
    }
  };

  const filtered = tests.filter(t => {
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase());
    const matchType   = !typeFilter || t.type === typeFilter;
    return matchSearch && matchType;
  });

  const groupedByCategory = filtered.reduce((acc, test) => {
    const cat = test.category || 'Uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(test);
    return acc;
  }, {});

  const sortedCategories = Object.keys(groupedByCategory).sort();

  const tabs = [
    { id: 'mock', label: '📝 Test Library', count: tests.length },
    { id: 'live', label: '🔴 Live Sessions', count: liveTests.length, alert: liveTests.length > 0 },
  ];

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Institute Tests</h1>
          <p className="text-slate-500 mt-1">Assign tests to batches or host live proctored sessions.</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButtons 
            data={tests} 
            filename="tests_library" 
            title="Institute Test Library Report" 
            headers={['Title', 'Category', 'Type', 'Questions', 'Duration (min)', 'Access']}
            pdfDataMapping={(t) => [
              t.title,
              t.category,
              typeLabels[t.type] || t.type,
              t.totalQuestions || 0,
              t.duration,
              t.isFree ? 'Free' : 'Premium'
            ]}
          />
          {liveTests.length > 0 && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-xl text-sm font-bold animate-pulse">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              {liveTests.length} Live Session{liveTests.length > 1 ? 's' : ''} Active
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab.id
                ? tab.id === 'live' ? 'bg-red-600 text-white shadow-lg shadow-red-500/30' : 'bg-white text-slate-900 shadow-md'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-black ${
              activeTab === tab.id
                ? tab.id === 'live' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                : 'bg-slate-200 text-slate-500'
            }`}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* ─── LIVE SESSIONS TAB ─── */}
      {activeTab === 'live' && (
        <div className="space-y-4">
          {/* Info banner */}
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
            <Radio className="text-red-500 mt-0.5 flex-shrink-0" size={18} />
            <div>
              <p className="text-sm font-bold text-red-700">About Live Sessions</p>
              <p className="text-xs text-red-600 mt-0.5">When you assign a test as "Live", all students in the selected batch get an instant alert on their dashboard with a live countdown. Sessions expire automatically after the test duration.</p>
            </div>
          </div>

          {liveTests.length === 0 ? (
            <div className="card text-center py-20 border-dashed border-2 border-slate-200">
              <Radio className="w-14 h-14 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-500 mb-2">No Live Sessions Active</h3>
              <p className="text-slate-400 text-sm mb-4">Go to the <b>Test Library</b> tab, click "Assign to Batch" on any test, check "Host as Live Test 🔴" and press "Go Live"</p>
              <button onClick={() => setActiveTab('mock')} className="btn-primary mx-auto inline-flex items-center gap-2">
                <BookOpen size={16} /> Browse Test Library
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveTests.map((test, i) => {
                const start = new Date(test.startTime);
                const end   = new Date(start.getTime() + (test.duration || 60) * 60000);
                const now   = new Date();
                const isScheduled = start > now;
                const remaining = isScheduled ? Math.max(0, Math.floor((start - now) / 1000)) : Math.max(0, Math.floor((end - now) / 1000));
                
                const formatTime = (secs) => {
                  if (secs > 86400) return `${Math.floor(secs / 86400)}d ${Math.floor((secs % 86400) / 3600)}h`;
                  if (secs >= 3600) return `${Math.floor(secs / 3600)}h ${Math.floor((secs % 3600) / 60)}m`;
                  return `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;
                };

                return (
                  <div key={i} className={`rounded-2xl overflow-hidden border shadow-lg bg-white ${isScheduled ? 'border-amber-200' : 'border-red-200'}`}>
                    {/* Header */}
                    <div className={`p-4 flex items-center justify-between ${isScheduled ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-red-600 to-rose-600'}`}>
                      <div className="flex items-center gap-2">
                        {!isScheduled && (
                          <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-200 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                          </span>
                        )}
                        <span className="text-white text-xs font-black uppercase tracking-widest">
                          {isScheduled ? 'Scheduled Live' : 'Live Session'}
                        </span>
                      </div>
                      <span className="bg-black/20 text-white text-sm font-black px-3 py-1 rounded-lg tabular-nums">
                        {isScheduled ? `Starts in ${formatTime(remaining)}` : `${formatTime(remaining)} left`}
                      </span>
                    </div>
                    {/* Body */}
                    <div className="p-4">
                      <span className={`badge text-xs mb-2 inline-block ${typeBadge[test.type] || 'badge-primary'}`}>{typeLabels[test.type] || test.type}</span>
                      <h3 className="font-bold text-slate-900 text-base mb-1 line-clamp-2">{test.title}</h3>
                      <p className="text-xs text-slate-500 mb-3">Batch: <span className="font-semibold text-slate-700">{test.batchName}</span></p>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mb-4">
                        <span className="flex items-center gap-1"><BookOpen size={11} />{test.totalQuestions || 0} Qs</span>
                        <span className="flex items-center gap-1"><Clock size={11} />{test.duration}m</span>
                        <span>{test.category}</span>
                      </div>
                      {/* Timings */}
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        <div className={`text-center rounded-xl py-2 border ${isScheduled ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
                          <p className={`text-[10px] font-bold uppercase ${isScheduled ? 'text-amber-600' : 'text-red-500'}`}>Starts</p>
                          <p className={`text-xs font-bold ${isScheduled ? 'text-amber-700' : 'text-red-700'}`}>{start.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}</p>
                        </div>
                        <div className="text-center bg-slate-50 border border-slate-200 rounded-xl py-2">
                          <p className="text-[10px] text-slate-500 font-bold uppercase">Ends At</p>
                          <p className="text-xs font-bold text-slate-700">{end.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}</p>
                        </div>
                      </div>
                      {/* Progress bar */}
                      {!isScheduled && (
                        <div className="w-full bg-slate-100 rounded-full h-1.5 mb-4">
                          <div
                            className="bg-gradient-to-r from-red-500 to-rose-500 h-1.5 rounded-full transition-all"
                            style={{ width: `${Math.max(0, Math.min(100, (1 - remaining / ((test.duration || 60) * 60)) * 100))}%` }}
                          />
                        </div>
                      )}
                      <button
                        onClick={() => handleStopLive(test.id, test.batchId)}
                        className={`w-full py-2 text-xs font-bold border-2 rounded-xl transition-colors flex items-center justify-center gap-1.5 ${
                          isScheduled 
                            ? 'border-amber-200 text-amber-600 hover:bg-amber-50' 
                            : 'border-red-200 text-red-600 hover:bg-red-50'
                        }`}
                      >
                        ⏹ {isScheduled ? 'Cancel Scheduled Session' : 'Stop Live Session'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── TEST LIBRARY TAB ─── */}
      {activeTab === 'mock' && (
        <div className="space-y-4">
          {/* Search + Type Filters */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input type="text" placeholder="Search tests..." value={search}
                onChange={e => setSearch(e.target.value)}
                className="input-field !pl-10 w-full" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {['', 'mock', 'pyp', 'daily_quiz', 'sectional'].map(t => (
                <button key={t} onClick={() => setTypeFilter(t)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all ${typeFilter === t ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'}`}>
                  {t === '' ? 'All' : typeLabels[t]}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-44" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="card text-center py-16">
              <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-500">No tests match your search</p>
            </div>
          ) : !selectedCategory ? (
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4 pb-10">
              {sortedCategories.map(category => (
                <div 
                  key={category} 
                  onClick={() => setSelectedCategory(category)}
                  className="bg-white rounded-3xl border border-slate-200 p-6 cursor-pointer hover:border-indigo-400 hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col items-center justify-center text-center space-y-3"
                >
                  <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                    <Folder size={28} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 text-base group-hover:text-indigo-600 transition-colors uppercase tracking-wide">{category}</h3>
                    <p className="text-xs font-semibold text-slate-500 mt-1.5 bg-slate-100 inline-block px-2.5 py-0.5 rounded-full">{groupedByCategory[category].length} Tests Available</p>
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
                    {groupedByCategory[selectedCategory]?.length || 0} active tests in this category
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
                {(groupedByCategory[selectedCategory] || []).map(test => (
                  <div key={test.id} className="card hover:border-primary-300 hover:shadow-md transition-all group bg-white flex flex-col h-full">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`badge text-xs ${typeBadge[test.type] || 'badge-primary'}`}>
                        {typeLabels[test.type] || test.type}
                      </span>
                      {test.isFree
                        ? <span className="badge-success badge text-xs">Free</span>
                        : <span className="badge-info badge text-xs flex items-center gap-1">★ Premium</span>}
                    </div>

                    <h3 className="font-semibold text-slate-900 text-sm mb-1 line-clamp-2">{test.title}</h3>
                    {test.type === 'pyp' && test.year && (
                      <p className="text-xs text-amber-600 font-medium mb-2">📅 {test.examName} {test.year}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                      <span className="flex items-center gap-1"><BookOpen size={11} />{test.totalQuestions || 0} Qs</span>
                      <span className="flex items-center gap-1"><Clock size={11} />{test.duration}m</span>
                    </div>

                    {/* Assign Panel */}
                    <div className="mt-auto">
                      {assigning === test.id ? (
                        <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                          <select value={assignBatchId} onChange={e => setAssignBatchId(e.target.value)}
                            className="input-field text-sm w-full bg-white">
                            <option value="">Select batch...</option>
                            {batches.map(b => (
                              <option key={b.id} value={b.id}>{b.name} ({b.students?.length || 0} students)</option>
                            ))}
                          </select>

                          {/* Live toggle */}
                          <label className={`flex items-center gap-2 text-xs font-semibold cursor-pointer p-2 rounded-lg border transition-all ${isLiveMode ? 'bg-red-50 border-red-300 text-red-700' : 'bg-white border-slate-200 text-slate-600'}`}>
                            <input type="checkbox" checked={isLiveMode} onChange={e => setIsLiveMode(e.target.checked)}
                              className="rounded text-red-500 focus:ring-red-500 w-4 h-4 cursor-pointer" />
                            <span className="flex items-center gap-1.5">
                              <span className="relative flex h-2.5 w-2.5">
                                {isLiveMode && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>}
                                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isLiveMode ? 'bg-red-500' : 'bg-slate-300'}`}></span>
                              </span>
                              Host Live
                            </span>
                          </label>

                          {isLiveMode && (
                            <div className="animate-fade-in">
                              <input 
                                type="datetime-local" 
                                value={scheduledTime}
                                onChange={e => setScheduledTime(e.target.value)}
                                className="input-field text-xs w-full py-1.5 bg-white"
                                placeholder="Schedule for later (Optional)"
                              />
                              <p className="text-[10px] text-slate-500 mt-1 pl-1">Leave empty to go live immediately</p>
                            </div>
                          )}

                          <div className="flex gap-2 pt-1">
                            <button onClick={() => handleAssign(test.id)}
                              className={`flex-1 py-1.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                                isLiveMode
                                  ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30'
                                  : 'btn-primary'
                              }`}>
                              {isLiveMode ? <><Radio size={12} /> Live</> : <><CheckCircle size={12} /> Assign</>}
                            </button>
                            <button onClick={() => { setAssigning(null); setAssignBatchId(''); setIsLiveMode(false); }}
                              className="flex-1 py-1.5 text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 rounded-xl transition-all">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => { setAssigning(test.id); setAssignBatchId(''); setIsLiveMode(false); }}
                          className="w-full btn-secondary !py-1.5 !text-xs flex items-center justify-center gap-1.5 hover:border-primary-300">
                          <Users size={12} /> Assign to Batch
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
