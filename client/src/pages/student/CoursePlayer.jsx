import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Menu, ChevronLeft, Play, FileText, CheckCircle2,
  ChevronDown, ChevronUp, Download, File, MessageSquare,
  Send, AlertCircle, Clock, X, MoreVertical, Share2,
  Bell, BookOpen, Info, BarChart2,
  Copy, ExternalLink, Bookmark, BookmarkCheck, Edit3, Save, Layers,
  Target, Star, Award
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../lib/api';
import CourseQuizPlayer from './CourseQuizPlayer';
import CourseReviews from '../../components/CourseReviews';
import useAuthStore from '../../store/authStore';

function CoursePlayer() {
  const { id } = useParams();
  const { user: authUser } = useAuthStore();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const moreMenuRef = useRef(null);

  // Notes
  const [noteText, setNoteText] = useState('');
  const [noteSaved, setNoteSaved] = useState(false);
  const [noteEditing, setNoteEditing] = useState(false);

  // Q&A
  const [qaList, setQaList] = useState([]);
  const [qaLoading, setQaLoading] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [submittingQ, setSubmittingQ] = useState(false);
  const [expandedQa, setExpandedQa] = useState(null);

  // Certificates
  const [certRequest, setCertRequest] = useState(null);
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [certForm, setCertForm] = useState({ fullName: authUser?.name || '', email: authUser?.email || '', mobile: authUser?.mobile || '', address: '' });
  const [submittingCert, setSubmittingCert] = useState(false);

  const announcements = course?.announcements || [];

  useEffect(() => {
    if (!activeLesson) return;
    const saved = localStorage.getItem(`note_${id}_${activeLesson.id}`) || '';
    setNoteText(saved);
    setNoteSaved(!!saved);
    setNoteEditing(!saved);
  }, [activeLesson?.id]);

  const saveNote = () => {
    if (!activeLesson) return;
    localStorage.setItem(`note_${id}_${activeLesson.id}`, noteText);
    setNoteSaved(true);
    setNoteEditing(false);
    toast.success('Note saved!');
  };

  const fetchQA = async () => {
    setQaLoading(true);
    try {
      const res = await api.get(`/lms/courses/${id}/qa`);
      setQaList(res.data.data || []);
    } catch { } finally { setQaLoading(false); }
  };

  const handleAskQuestion = async () => {
    if (!newQuestion.trim()) return toast.error('Enter your question');
    setSubmittingQ(true);
    try {
      await api.post(`/lms/courses/${id}/qa`, { question: newQuestion.trim() });
      toast.success('Question posted!');
      setNewQuestion('');
      fetchQA();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally { setSubmittingQ(false); }
  };

  const handleToggleProgress = async () => {
    if (!activeLesson) return;
    try {
      await api.post('/student/courses/toggle-progress', { lessonId: activeLesson.id, courseId: id });
      fetchDetails();
    } catch { toast.error('Failed to update'); }
  };

  const fetchDetails = () => {
    api.get(`/lms/courses/${id}`)
      .then(res => {
        setCourse(res.data.data);
        
        // Find best first lesson (merging lessons + quizzes)
        if (!activeLesson && res.data.data.modules?.length > 0) {
          const firstMod = res.data.data.modules[0];
          const combined = [
            ...(firstMod.lessons || []),
            ...(firstMod.moduleQuizzes || []).map(q => ({ ...q, isQuiz: true })),
            ...(firstMod.quizzes || []).map(q => ({ ...q, isMockTest: true }))
          ].sort((a, b) => (a.order || 99) - (b.order || 99));
          if (combined[0]) setActiveLesson(combined[0]);
        } else if (activeLesson) {
          const updated = res.data.data.modules.flatMap(m => [
            ...(m.lessons || []),
            ...(m.moduleQuizzes || []).map(q => ({ ...q, isQuiz: true })),
            ...(m.quizzes || []).map(q => ({ ...q, isMockTest: true }))
          ]).find(l => l.id === activeLesson.id);
          if (updated) setActiveLesson(updated);
        }
      })
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  };

  const fetchCertRequest = async () => {
    try {
      const res = await api.get('/student/certificates');
      const req = res.data.data.find(r => r.courseId === id);
      if (req) setCertRequest(req);
    } catch {}
  };

  const handleRequestCertificate = async (e) => {
    e.preventDefault();
    if (!certForm.fullName) return toast.error('Full name is required');
    setSubmittingCert(true);
    try {
      await api.post('/student/certificates/request', { courseId: id, ...certForm });
      toast.success('Certificate requested successfully!');
      setCertModalOpen(false);
      fetchCertRequest();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to request certificate');
    } finally {
      setSubmittingCert(false);
    }
  };

  useEffect(() => { fetchDetails(); fetchQA(); fetchCertRequest(); }, [id]);

  useEffect(() => {
    const handler = (e) => { if (moreMenuRef.current && !moreMenuRef.current.contains(e.target)) setMoreMenuOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const getVideoId = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|live\/))([^"&?/\s]{11})/);
    return match ? match[1] : null;
  };

  const allLessons = course?.modules?.flatMap(m => [
    ...(m.lessons || []),
    ...(m.moduleQuizzes || []).map(q => ({ ...q, isQuiz: true })),
    ...(m.quizzes || []).map(q => ({ ...q, isMockTest: true }))
  ]) || [];
  
  const currentIdx = allLessons.findIndex(l => l.id === activeLesson?.id);
  const prevLesson = currentIdx > 0 ? allLessons[currentIdx - 1] : null;
  const nextLesson = currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null;
  
  // Progress computation (includes lessons, quizzes, and mock tests)
  const completedCount = allLessons.filter(l => {
    if (l.isMockTest) {
      return l.results?.some(r => r.status === 'completed' || r.status === 'auto-submitted');
    }
    if (l.isQuiz) {
      return l.attempts?.some(a => a.completedAt);
    }
    return l.progressRecords?.length > 0;
  }).length;
  const progress = allLessons.length ? Math.round((completedCount / allLessons.length) * 100) : 0;
  
  const standardLessons = allLessons.filter(l => !l.isQuiz && !l.isMockTest);
  const totalDuration = standardLessons.reduce((s, l) => s + (parseInt(l.duration) || 0), 0);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied!');
    setShareOpen(false);
  };

  if (loading) return (
    <div className="fixed inset-0 bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-400 text-xs">Loading course...</p>
      </div>
    </div>
  );
  if (!course) return <div className="text-center py-20 text-slate-400 text-sm">Course not found</div>;

  const TABS = [
    { id: 'overview', label: 'Overview', icon: Info },
    { id: 'notes',    label: 'Notes',    icon: Edit3 },
    { id: 'resources',label: 'Files',    icon: File },
    { id: 'qa',       label: `Q&A${qaList.length ? ` (${qaList.length})` : ''}`, icon: MessageSquare },
    { id: 'announcements', label: 'Updates', icon: Bell },
    { id: 'reviews',  label: 'Reviews',  icon: Star },
  ];

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-slate-50" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── TOP BAR ── */}
      <header className="h-12 bg-white border-b border-slate-200 flex items-center gap-2 px-3 flex-shrink-0 z-30 shadow-sm">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0"
        >
          <Menu size={17} />
        </button>
        <Link to="/student/courses" className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors flex-shrink-0">
          <ChevronLeft size={17} />
        </Link>

        <div className="flex-1 min-w-0 mx-1">
          <p className="text-xs text-slate-500 truncate leading-none">
            <span className="hidden sm:inline text-slate-400">{course.title} › </span>
            <span className="text-slate-800 font-semibold">{activeLesson?.title || 'Select a lesson'}</span>
          </p>
        </div>

        {/* Progress pill */}
        <div className="hidden md:flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full flex-shrink-0">
          <div className="w-20 h-1.5 bg-slate-300 rounded-full overflow-hidden">
            <div className="h-full bg-primary-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-[10px] font-bold text-slate-500">{progress}%</span>
        </div>

        {/* More menu */}
        <div className="relative flex-shrink-0" ref={moreMenuRef}>
          <button
            onClick={() => setMoreMenuOpen(!moreMenuOpen)}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <MoreVertical size={17} />
          </button>
          {moreMenuOpen && (
            <div className="absolute right-0 top-10 w-52 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden">
              {[
                { icon: Info, label: 'About this Course', action: () => { setActiveTab('overview'); setMoreMenuOpen(false); } },
                { icon: Share2, label: 'Share this Course', action: () => { setShareOpen(true); setMoreMenuOpen(false); } },
                { icon: Edit3, label: 'Notes', action: () => { setActiveTab('notes'); setMoreMenuOpen(false); } },
                { icon: File, label: 'Resources', action: () => { setActiveTab('resources'); setMoreMenuOpen(false); } },
                { icon: Bell, label: 'Announcements', action: () => { setActiveTab('announcements'); setMoreMenuOpen(false); } },
                {
                  icon: isFavorited ? BookmarkCheck : Bookmark,
                  label: isFavorited ? 'Remove Favorite' : 'Add to Favorites',
                  action: () => { setIsFavorited(!isFavorited); setMoreMenuOpen(false); toast.success(isFavorited ? 'Removed' : 'Added to favorites!'); }
                },
              ].map((item, i) => (
                <button key={i} onClick={item.action}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left border-b border-slate-50 last:border-none">
                  <item.icon size={14} className="text-slate-400 flex-shrink-0" />
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* ── SHARE MODAL ── */}
      {shareOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setShareOpen(false)}>
          <div className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-slate-900">Share Course</h3>
              <button onClick={() => setShareOpen(false)} className="p-1 text-slate-400 hover:text-slate-700"><X size={15} /></button>
            </div>
            <p className="text-xs text-slate-400 font-medium mb-3 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 truncate">{window.location.href}</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: Copy, label: 'Copy Link', action: copyLink, color: 'bg-slate-100 text-slate-700' },
                { icon: ExternalLink, label: 'Share on X', action: () => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(course.title)}`), color: 'bg-sky-50 text-sky-600' },
                { icon: ExternalLink, label: 'WhatsApp', action: () => window.open(`https://wa.me/?text=${encodeURIComponent(course.title + ' ' + window.location.href)}`), color: 'bg-green-50 text-green-600' },
              ].map((s, i) => (
                <button key={i} onClick={s.action} className={`flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-bold ${s.color} transition-all hover:opacity-80`}>
                  <s.icon size={17} />
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── CERTIFICATE MODAL ── */}
      {certModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-black text-slate-800 flex items-center gap-2"><Award size={18} className="text-primary-500" /> Request Certificate</h3>
              <button onClick={() => setCertModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700 bg-white rounded-lg border border-slate-200"><X size={15} /></button>
            </div>
            <form onSubmit={handleRequestCertificate} className="p-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Full Name (On Certificate)</label>
                  <input required type="text" value={certForm.fullName} onChange={e => setCertForm({...certForm, fullName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Email</label>
                    <input type="email" value={certForm.email} onChange={e => setCertForm({...certForm, email: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Mobile</label>
                    <input type="tel" value={certForm.mobile} onChange={e => setCertForm({...certForm, mobile: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Shipping Address (If Physical)</label>
                  <textarea value={certForm.address} onChange={e => setCertForm({...certForm, address: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 min-h-[80px]" placeholder="Optional..." />
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button type="button" onClick={() => setCertModalOpen(false)} className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">Cancel</button>
                <button type="submit" disabled={submittingCert} className="flex-[2] py-2.5 rounded-xl font-bold text-sm bg-primary-600 text-white hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50">
                  {submittingCert ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile Backdrop */}
        {sidebarOpen && (
          <div className="absolute inset-0 bg-slate-900/50 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
        )}
        {/* ── SIDEBAR ── */}
        <aside className={`${sidebarOpen ? 'translate-x-0 w-[80%] max-w-[300px] md:w-72 md:translate-x-0' : '-translate-x-full w-[80%] max-w-[300px] md:w-0 md:translate-x-0'} absolute md:relative z-40 inset-y-0 left-0 bg-white border-r border-slate-200 flex-shrink-0 transition-all duration-300 overflow-hidden flex flex-col shadow-2xl md:shadow-none`}>
          {/* Sidebar header */}
          <div className="px-3 py-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Progress</p>
              <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div className="h-full bg-primary-500 rounded-full" style={{ width: `${progress}%` }} />
                </div>
                <span className="text-xs font-bold text-slate-600">{completedCount}/{allLessons.length}</span>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 md:hidden">
              <X size={14} />
            </button>
          </div>

          {/* Lesson list */}
          <div className="flex-1 overflow-y-auto py-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#e2e8f0 transparent' }}>
            {course.modules?.sort((a, b) => a.order - b.order).map((mod, mIdx) => (
              <div key={mod.id} className="mb-4">
                <div className="px-3 mb-1.5">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Module {mIdx + 1}</p>
                  <p className="text-[11px] font-bold text-slate-700 leading-tight">{mod.title}</p>
                </div>
                <div className="space-y-px px-1.5">
                  {[
                    ...(mod.lessons || []),
                    ...(mod.moduleQuizzes || []).map(q => ({ ...q, isQuiz: true })),
                    ...(mod.quizzes || []).map(q => ({ ...q, isMockTest: true }))
                  ].sort((a, b) => (a.order || 99) - (b.order || 99)).map(lesson => {
                    const isActive = activeLesson?.id === lesson.id;
                    const isDone = lesson.isMockTest 
                      ? lesson.results?.some(r => r.status === 'completed' || r.status === 'auto-submitted')
                      : lesson.isQuiz 
                        ? lesson.attempts?.some(a => a.completedAt)
                        : (lesson.progressRecords?.length > 0);
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => { setActiveLesson(lesson); if (window.innerWidth < 768) setSidebarOpen(false); }}
                        className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center gap-2.5 transition-all ${
                          isActive
                            ? 'bg-primary-50 border border-primary-200 text-primary-800'
                            : 'hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        <span className="flex-shrink-0">
                          {isDone
                              ? <CheckCircle2 size={12} className="text-emerald-500" fill="currentColor" />
                              : lesson.isMockTest
                                ? <Target size={12} className={isActive ? 'text-emerald-500' : 'text-slate-300'} />
                                : lesson.isQuiz
                                ? <Target size={12} className={isActive ? 'text-primary-500' : 'text-slate-300'} />
                                : lesson.videoUrl
                                  ? <Play size={12} fill="currentColor" className={isActive ? 'text-primary-500' : 'text-slate-300'} />
                                  : <FileText size={12} className={isActive ? 'text-primary-500' : 'text-slate-300'} />}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-[11px] font-semibold leading-snug truncate ${isActive ? 'text-primary-700' : 'text-slate-600'}`}>{lesson.title}</p>
                          {lesson.isMockTest ? (
                            <p className={`text-[9px] mt-0.5 ${isActive ? 'text-emerald-500' : 'text-slate-400'}`}>
                              <Target size={8} className="inline mr-0.5" /> Mock Test
                            </p>
                          ) : lesson.isQuiz ? (
                            <p className={`text-[9px] mt-0.5 ${isActive ? 'text-primary-400' : 'text-slate-400'}`}>
                              <Target size={8} className="inline mr-0.5" /> Quiz
                            </p>
                          ) : lesson.duration && (
                            <p className={`text-[9px] mt-0.5 ${isActive ? 'text-primary-400' : 'text-slate-400'}`}>
                              <Clock size={8} className="inline mr-0.5" />{lesson.duration} min
                            </p>
                          )}
                        </div>
                        {isActive && <div className="w-1.5 h-1.5 rounded-full bg-primary-500 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 flex flex-col overflow-hidden min-w-0 bg-white">
          {activeLesson ? activeLesson.isMockTest ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-emerald-50 border-t border-emerald-100 overflow-y-auto">
               <div className="w-16 h-16 rounded-2xl bg-white border-2 border-emerald-200 flex items-center justify-center mb-4 shadow-sm text-emerald-500">
                  <Target size={28} />
               </div>
               <h2 className="text-xl font-black text-slate-800 mb-2">{activeLesson.title}</h2>
               <p className="text-slate-500 text-sm max-w-sm mb-6 leading-relaxed">This is a full-length Mock Test. You will be redirected to the secure testing environment where you can attempt it.</p>
               <Link to={`/test/${activeLesson.id}/lobby?courseId=${id}`} className="flex items-center gap-2 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl transition-all shadow-md shadow-emerald-600/30">
                 <Play size={16} fill="currentColor" /> Start Mock Test
               </Link>
            </div>
          ) : activeLesson.isQuiz ? (
            <div className="flex-1 overflow-y-auto">
              {/* QUIZ PLAYER ROOT */}
              <div className="bg-white border-b border-slate-100 flex items-center p-3 gap-3">
                 <span className="text-[9px] font-black uppercase tracking-widest text-primary-500 bg-primary-50 px-2 py-0.5 rounded border border-primary-100 mb-0.5">Quiz Mode</span>
                 <h1 className="text-sm font-black text-slate-900 truncate flex-1">{activeLesson.title}</h1>
              </div>
              <CourseQuizPlayer quizId={activeLesson.id} onBack={() => {}} />
            </div>
          ) : (
            <>
              {/* Video Player */}
              {activeLesson.videoUrl && (
                <div className="bg-slate-900 flex-shrink-0" style={{ maxHeight: '42vh' }}>
                  <div className="aspect-video max-h-[42vh] mx-auto">
                    <iframe
                      width="100%" height="100%"
                      src={`https://www.youtube.com/embed/${getVideoId(activeLesson.videoUrl)}?rel=0&modestbranding=1`}
                      title={activeLesson.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen className="w-full h-full"
                    />
                  </div>
                </div>
              )}

              {/* Lesson title bar */}
              <div className="bg-white border-b border-slate-100 px-4 py-2.5 flex items-center justify-between gap-3 flex-shrink-0">
                <div className="flex-1 min-w-0">
                  <span className="text-[9px] font-black uppercase tracking-widest text-primary-500 bg-primary-50 px-2 py-0.5 rounded border border-primary-100 inline-block mb-0.5">Now Studying</span>
                  <h1 className="text-sm font-black text-slate-900 leading-tight truncate">{activeLesson.title}</h1>
                </div>
                <button
                  onClick={handleToggleProgress}
                  className={`flex-shrink-0 flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all ${
                    activeLesson.progressRecords?.length > 0
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                      : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  <CheckCircle2 size={12} fill={activeLesson.progressRecords?.length > 0 ? 'currentColor' : 'none'} />
                  {activeLesson.progressRecords?.length > 0 ? 'Completed' : 'Mark Done'}
                </button>
              </div>

              {/* Tabs */}
              <div className="bg-white border-b border-slate-100 px-3 flex gap-0 overflow-x-auto flex-shrink-0" style={{ scrollbarWidth: 'none' }}>
                {TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-2.5 text-[11px] font-bold whitespace-nowrap border-b-2 transition-all flex-shrink-0 ${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-slate-400 hover:text-slate-700 hover:border-slate-200'
                    }`}
                  >
                    <tab.icon size={11} />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto bg-slate-50" style={{ scrollbarWidth: 'thin' }}>
                <div className="max-w-2xl mx-auto px-4 py-4">

                  {/* ─ OVERVIEW ─ */}
                  {activeTab === 'overview' && (
                    <div className="space-y-4">
                      {progress === 100 && (
                        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-5 text-white flex sm:items-center flex-col sm:flex-row gap-4 justify-between shadow-lg shadow-emerald-500/20">
                          <div>
                            <h3 className="font-black text-lg mb-1 flex items-center gap-2"><Award size={20} /> Course Completed!</h3>
                            <p className="text-sm font-medium text-emerald-50 opacity-90">Congratulations on finishing the course.</p>
                          </div>
                          {certRequest ? (
                            <div className="sm:text-right">
                              {certRequest.status === 'approved' && certRequest.certificateUrl ? (
                                <a href={certRequest.certificateUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-white text-emerald-600 hover:bg-emerald-50 px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors w-max">
                                  <Download size={16} /> Download Certificate
                                </a>
                              ) : certRequest.status === 'rejected' ? (
                                <span className="bg-red-500/20 text-red-100 px-3 py-1.5 rounded-lg text-xs font-bold border border-red-500/30 inline-block">Request Rejected</span>
                              ) : (
                                <span className="bg-white/20 px-3 py-1.5 rounded-lg text-xs font-bold border border-white/30 inline-block">Certificate Requested (Pending)</span>
                              )}
                            </div>
                          ) : (
                            <button onClick={() => setCertModalOpen(true)} className="flex items-center gap-2 bg-white text-emerald-600 hover:bg-emerald-50 px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors w-max">
                              <Award size={16} /> Request Certificate
                            </button>
                          )}
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-2 sm:gap-3">
                        {[
                          { icon: BookOpen, label: 'Lessons', value: allLessons.length, color: 'text-primary-500 bg-primary-50 border-primary-100' },
                          { icon: Clock,    label: 'Duration', value: `${totalDuration}m`, color: 'text-amber-500 bg-amber-50 border-amber-100' },
                          { icon: BarChart2, label: 'Progress', value: `${progress}%`, color: 'text-emerald-500 bg-emerald-50 border-emerald-100' },
                        ].map((s, i) => (
                          <div key={i} className={`rounded-xl border p-3 text-center ${s.color}`}>
                            <s.icon size={14} className="mx-auto mb-1" />
                            <p className="text-base font-black text-slate-800">{s.value}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
                          </div>
                        ))}
                      </div>

                      <div className="bg-white border border-slate-100 rounded-xl p-3">
                        <div className="flex justify-between items-center mb-1.5">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Completion</p>
                          <p className="text-[10px] font-black text-primary-500">{completedCount}/{allLessons.length} lessons</p>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-primary-500 to-indigo-400 rounded-full" style={{ width: `${progress}%` }} />
                        </div>
                      </div>

                      {course.description && (
                        <div className="bg-white border border-slate-100 rounded-xl p-4">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">About this Course</p>
                          <p className="text-xs text-slate-600 leading-relaxed">{course.description}</p>
                        </div>
                      )}

                      {course.creator && (
                        <div className="flex items-center gap-3 bg-white border border-slate-100 rounded-xl p-3">
                          <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600 font-black text-sm flex-shrink-0">
                            {course.creator.name?.charAt(0)}
                          </div>
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Instructor</p>
                            <p className="text-sm font-bold text-slate-800">{course.creator.name}</p>
                            <p className="text-[10px] text-slate-400">{course.creator.email}</p>
                          </div>
                        </div>
                      )}

                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Course Content</p>
                        <div className="space-y-1.5">
                          {course.modules?.map((mod, i) => (
                            <div key={mod.id} className="flex items-center justify-between bg-white border border-slate-100 rounded-lg px-3 py-2">
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black text-slate-500 bg-slate-100 w-5 h-5 rounded flex items-center justify-center">{i + 1}</span>
                                <p className="text-xs font-semibold text-slate-700">{mod.title}</p>
                              </div>
                              <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
                                <Layers size={9} />{mod.lessons?.length || 0}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ─ NOTES ─ */}
                  {activeTab === 'notes' && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">My Notes</p>
                          <p className="text-xs text-slate-500">For: <span className="font-semibold text-slate-700">{activeLesson.title}</span></p>
                        </div>
                        {noteSaved && !noteEditing && (
                          <button onClick={() => setNoteEditing(true)} className="flex items-center gap-1.5 text-xs font-bold text-primary-600 bg-primary-50 px-2.5 py-1.5 rounded-lg border border-primary-100 hover:bg-primary-100">
                            <Edit3 size={11} /> Edit
                          </button>
                        )}
                      </div>
                      {noteEditing ? (
                        <div>
                          <textarea
                            value={noteText}
                            onChange={e => setNoteText(e.target.value)}
                            placeholder={`Write notes for "${activeLesson.title}"...\n\nCapture key points, timestamps, ideas…`}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-3 text-xs font-medium resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all leading-relaxed shadow-sm"
                            style={{ minHeight: '200px' }}
                            autoFocus
                          />
                          <div className="flex gap-2 mt-2">
                            {noteSaved && (
                              <button onClick={() => { setNoteEditing(false); setNoteText(localStorage.getItem(`note_${id}_${activeLesson.id}`) || ''); }}
                                className="flex-1 py-2 text-xs font-bold text-slate-500 bg-white rounded-lg border border-slate-200 hover:bg-slate-50">
                                Cancel
                              </button>
                            )}
                            <button onClick={saveNote} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm">
                              <Save size={11} /> Save Note
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                          <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{noteText}</p>
                        </div>
                      )}
                      <div className="mt-4 flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl p-3">
                        <Info size={12} className="text-blue-400 flex-shrink-0 mt-0.5" />
                        <p className="text-[10px] text-blue-500 leading-relaxed font-medium">Notes are saved locally on this device per lesson and are private to you.</p>
                      </div>
                    </div>
                  )}

                  {/* ─ RESOURCES ─ */}
                  {activeTab === 'resources' && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Lesson Files</p>
                      {course.allMaterials?.filter(m => m.lessonId === activeLesson.id).length > 0 ? (
                        course.allMaterials.filter(m => m.lessonId === activeLesson.id).map(mat => (
                          <a key={mat.id} href={mat.fileUrl} target="_blank" rel="noreferrer"
                            className="flex items-center justify-between p-3 bg-white hover:bg-primary-50 border border-slate-100 hover:border-primary-200 rounded-xl transition-all group shadow-sm">
                            <div className="flex items-center gap-2.5">
                              <div className="p-2 bg-primary-50 text-primary-500 rounded-lg flex-shrink-0"><File size={13} /></div>
                              <div>
                                <p className="text-xs font-bold text-slate-700 group-hover:text-primary-700">{mat.title}</p>
                                <p className="text-[9px] text-slate-400">Tap to download</p>
                              </div>
                            </div>
                            <Download size={13} className="text-slate-300 group-hover:text-primary-500" />
                          </a>
                        ))
                      ) : (
                        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-200">
                          <Download className="mx-auto text-slate-300 mb-2" size={26} strokeWidth={1.5} />
                          <p className="text-xs font-semibold text-slate-400">No files for this lesson</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ─ Q&A ─ */}
                  {activeTab === 'qa' && (
                    <div className="space-y-3">
                      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Ask a Question</p>
                        <textarea
                          value={newQuestion}
                          onChange={e => setNewQuestion(e.target.value)}
                          placeholder="Have a doubt? Ask your instructor..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all min-h-[60px]"
                          onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleAskQuestion(); }}
                        />
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-[9px] text-slate-400">Ctrl+Enter to submit</p>
                          <button onClick={handleAskQuestion} disabled={submittingQ || !newQuestion.trim()}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                              submittingQ || !newQuestion.trim() ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700 text-white shadow-sm'
                            }`}>
                            {submittingQ ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send size={10} />}
                            Post
                          </button>
                        </div>
                      </div>
                      {qaLoading ? [1, 2].map(i => <div key={i} className="h-12 bg-slate-100 animate-pulse rounded-xl" />) :
                       qaList.length === 0 ? (
                        <div className="py-12 text-center bg-white rounded-xl border border-dashed border-slate-200">
                          <MessageSquare size={26} className="mx-auto text-slate-300 mb-2" strokeWidth={1.5} />
                          <p className="text-xs font-semibold text-slate-400">No questions yet — be the first!</p>
                        </div>
                      ) : qaList.map(qa => (
                        <div key={qa.id} className={`border rounded-xl overflow-hidden bg-white shadow-sm ${qa.isPinned ? 'border-primary-200' : 'border-slate-100'}`}>
                          <button onClick={() => setExpandedQa(expandedQa === qa.id ? null : qa.id)} className="w-full text-left px-3 py-2.5 flex items-start gap-2.5">
                            <div className="w-6 h-6 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600 font-black text-[10px] flex-shrink-0">{qa.askedBy?.name?.charAt(0)}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1 mb-0.5 flex-wrap">
                                <span className="text-[10px] font-bold text-slate-600">{qa.askedBy?.name}</span>
                                {qa.isPinned && <span className="text-[8px] bg-primary-50 text-primary-600 px-1 rounded font-black border border-primary-100">📌</span>}
                                {qa.isAnswered
                                  ? <span className="text-[8px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-1 rounded font-black">✓ Answered</span>
                                  : <span className="text-[8px] bg-amber-50 text-amber-500 border border-amber-100 px-1 rounded font-black">Pending</span>}
                              </div>
                              <p className="text-xs font-medium text-slate-800 leading-snug">{qa.question}</p>
                            </div>
                            {expandedQa === qa.id ? <ChevronUp size={12} className="text-slate-300 flex-shrink-0 mt-1" /> : <ChevronDown size={12} className="text-slate-300 flex-shrink-0 mt-1" />}
                          </button>
                          {expandedQa === qa.id && (
                            <div className="px-3 pb-3">
                              {qa.isAnswered && qa.answer ? (
                                <div className="ml-8 pl-3 border-l-2 border-emerald-300 bg-emerald-50 rounded-r-lg py-2 pr-3">
                                  <p className="text-[9px] font-black text-emerald-600 mb-1">Answer · {qa.answeredBy?.name}</p>
                                  <p className="text-xs text-slate-700 leading-relaxed">{qa.answer}</p>
                                </div>
                              ) : (
                                <div className="ml-8 pl-3 border-l-2 border-amber-200 bg-amber-50 rounded-r-lg py-2 pr-3">
                                  <p className="text-[10px] font-semibold text-amber-500 flex items-center gap-1"><AlertCircle size={10} /> Not answered yet.</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ─ REVIEWS ─ */}
                  {activeTab === 'reviews' && course && (
                    <div className="space-y-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rate & Review</p>
                      <CourseReviews
                        courseId={course.id}
                        currentUser={authUser}
                        canReply={false}
                        compact={false}
                      />
                    </div>
                  )}

                  {/* ─ ANNOUNCEMENTS ─ */}
                  {activeTab === 'announcements' && (
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Announcements</p>
                      {announcements.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-200">
                          <Bell size={26} className="mx-auto text-slate-300 mb-2" strokeWidth={1.5} />
                          <p className="text-xs font-semibold text-slate-400">No announcements yet</p>
                          <p className="text-[10px] text-slate-300 mt-1">Your instructor will post updates here</p>
                        </div>
                      ) : announcements.map((a, i) => (
                        <div key={i} className="bg-white border border-slate-100 rounded-xl p-3.5 mb-2 shadow-sm">
                          <div className="flex justify-between mb-1">
                            <p className="text-xs font-bold text-slate-800">{a.title}</p>
                            <span className="text-[9px] text-slate-400">{new Date(a.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">{a.message}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Prev / Next */}
                  <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100">
                    <button onClick={() => prevLesson && setActiveLesson(prevLesson)} disabled={!prevLesson}
                      className={`flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-lg transition-all ${prevLesson ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-300 cursor-not-allowed'}`}>
                      <ChevronLeft size={13} /> Prev
                    </button>
                    <span className="text-[10px] font-black text-slate-400">{currentIdx + 1} / {allLessons.length}</span>
                    <button onClick={() => nextLesson && setActiveLesson(nextLesson)} disabled={!nextLesson}
                      className={`flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-lg transition-all ${nextLesson ? 'text-primary-600 hover:bg-primary-50' : 'text-slate-300 cursor-not-allowed'}`}>
                      Next <ChevronLeft size={13} className="rotate-180" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50">
              <div className="w-14 h-14 rounded-2xl bg-primary-50 border border-primary-100 flex items-center justify-center mb-3">
                <Play size={22} className="text-primary-400" />
              </div>
              <h2 className="text-base font-black text-slate-800 mb-1">Start Learning</h2>
              <p className="text-slate-400 text-xs max-w-xs">Pick a lesson from the sidebar to begin.</p>
              <button onClick={() => setSidebarOpen(true)}
                className="mt-4 flex items-center gap-2 text-primary-600 hover:text-primary-700 text-xs font-bold bg-primary-50 hover:bg-primary-100 border border-primary-100 px-4 py-2 rounded-lg transition-colors">
                <Menu size={13} /> Open Sidebar
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

class CoursePlayerErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', background: 'white', overflow: 'auto', zIndex: 9999, position: 'relative' }}>
          <h1 style={{ color: 'red', fontWeight: 'bold' }}>UI Render Crash</h1>
          <p>{this.state.error?.message}</p>
          <pre style={{ fontSize: '11px', background: '#f0f0f0', padding: '10px' }}>
            {this.state.error?.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function CoursePlayerWrapper() {
  return (
    <CoursePlayerErrorBoundary>
      <CoursePlayer />
    </CoursePlayerErrorBoundary>
  );
}
