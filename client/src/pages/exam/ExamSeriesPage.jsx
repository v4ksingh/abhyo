import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Brain, ArrowRight, BookOpen, Clock, Users, Star, ChevronRight, Play, FileText, Link2, Download } from 'lucide-react';
import api from '../../lib/api';
import useAuthStore from '../../store/authStore';
import usePageMeta from '../../hooks/usePageMeta';
import { getImageUrl } from '../../lib/imageUrl';

const fmt = (m) => m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}m` : ''}` : `${m}m`;

const typeIcon = { pdf: '📄', doc: '📝', image: '🖼️', link: '🔗', none: '📋' };
const typeColor = { pdf: 'text-red-600 bg-red-50 border-red-200', doc: 'text-blue-600 bg-blue-50 border-blue-200', image: 'text-violet-600 bg-violet-50 border-violet-200', link: 'text-emerald-600 bg-emerald-50 border-emerald-200', none: 'text-slate-600 bg-slate-50 border-slate-200' };
const typeDl = { pdf: 'text-red-600', doc: 'text-blue-600', image: 'text-violet-600', link: 'text-emerald-600', none: 'text-slate-600' };

const typeStyles = {
  mock: { bg: 'bg-indigo-50/70', border: 'border-indigo-100', text: 'text-indigo-700', badge: 'bg-indigo-50 text-indigo-700' },
  pyp: { bg: 'bg-amber-50/70', border: 'border-amber-100', text: 'text-amber-700', badge: 'bg-amber-50 text-amber-700' },
  daily_quiz: { bg: 'bg-emerald-50/70', border: 'border-emerald-100', text: 'text-emerald-700', badge: 'bg-emerald-50 text-emerald-700' },
  sectional: { bg: 'bg-cyan-50/70', border: 'border-cyan-100', text: 'text-cyan-700', badge: 'bg-cyan-50 text-cyan-700' },
  slate: { bg: 'bg-slate-50/70', border: 'border-slate-100', text: 'text-slate-700', badge: 'bg-slate-50 text-slate-700' }
};

function SectionCard({ title, children, id }) {
  return (
    <div id={id} className="bg-white rounded-[24px] border border-slate-100 hover:border-slate-200 shadow-[0_4px_24px_-4px_rgba(148,163,184,0.06)] hover:shadow-[0_12px_36px_rgba(99,102,241,0.04)] transition-all duration-500 p-6 sm:p-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-14 bg-gradient-to-b from-indigo-500 via-violet-500 to-fuchsia-500 rounded-r-md" />
      <h3 className="text-[14px] sm:text-base font-black text-slate-900 mb-6 flex items-center gap-2.5 tracking-tight">{title}</h3>
      {children}
    </div>
  );
}

function TestCard({ test, onStart, user }) {
  const colMap = { mock: 'indigo', pyp: 'amber', daily_quiz: 'emerald', sectional: 'cyan' };
  const labelMap = { mock: 'Mock Test', pyp: 'Previous Year', daily_quiz: 'Daily Quiz', sectional: 'Sectional' };
  const styles = typeStyles[test.type] || typeStyles.slate;
  const isPaid = !test.isFree && test.price > 0;
  const hasActiveSub = user?.studentSubscriptionStatus === 'active' && user?.studentSubscriptionEndDate && new Date(user.studentSubscriptionEndDate) > new Date();
  const inst = user?.institute;
  const isInstitutePlanActive = !user?.institutePremiumBlocked && inst && ['basic', 'pro', 'enterprise'].includes(inst.subscriptionPlan) && inst.subscriptionStatus === 'active' && inst.subscriptionEndDate && new Date(inst.subscriptionEndDate) > new Date();
  const isLocked = isPaid && !hasActiveSub && !isInstitutePlanActive && user?.role !== 'superadmin';

  return (
    <div className={`group flex items-center gap-4 bg-white border rounded-2xl p-4 sm:p-5 hover:shadow-lg hover:border-indigo-200 transition-all duration-300 cursor-pointer relative overflow-hidden ${isLocked ? 'border-amber-200 bg-amber-50/[0.02] hover:border-amber-300' : 'border-slate-100 hover:bg-slate-50/20'}`}>
      {isLocked && <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] font-black tracking-wider px-3 py-1 rounded-bl-xl shadow-sm uppercase">🔒 PREMIUM</div>}
      <div className={`w-12 h-12 rounded-xl ${styles.bg} border ${styles.border} flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-105 transition-transform`}>
        {test.type === 'pyp' ? '📅' : test.type === 'daily_quiz' ? '⚡' : test.type === 'sectional' ? '📖' : '📝'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-extrabold text-slate-800 text-[13.5px] tracking-tight group-hover:text-indigo-600 transition-colors truncate">{test.title}</p>
        <div className="flex flex-wrap gap-2 mt-2">
          <span className={`text-[9.5px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded-md ${styles.badge}`}>{labelMap[test.type]}</span>
          <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-0.5"><BookOpen className="w-3 h-3 text-slate-300" /> {test.totalQuestions} Qs</span>
          <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-0.5"><Clock className="w-3 h-3 text-slate-300" /> {fmt(test.duration)}</span>
          <span className="text-[10px] text-slate-400 font-semibold">🎯 {test.totalMarks} m</span>
          {test.difficultyTag && (
            <span className={`text-[9.5px] font-bold uppercase px-1.5 py-0.5 rounded-md ${
              test.difficultyTag === 'hard' ? 'bg-red-50 text-red-600' : test.difficultyTag === 'easy' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
            }`}>
              {test.difficultyTag}
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end gap-2.5 flex-shrink-0">
        <span className={`text-[10px] font-black tracking-wider uppercase ${test.isFree ? 'text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md' : 'text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md'}`}>{test.isFree ? 'FREE' : '★ Premium'}</span>
        {isLocked ? (
          <button onClick={() => onStart(test)} className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[11px] font-extrabold rounded-xl hover:shadow-[0_4px_15px_rgba(245,158,11,0.3)] transition-all">Unlock →</button>
        ) : (
          <button onClick={() => onStart(test)} className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[11px] font-extrabold rounded-xl hover:shadow-[0_4px_15px_rgba(99,102,241,0.3)] hover:from-indigo-700 transition-all flex items-center gap-1.5"><Play className="w-3.5 h-3.5 fill-current" /> Start</button>
        )}
      </div>
    </div>
  );
}

export default function ExamSeriesPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [series, setSeries] = useState(null);
  const [notes, setNotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [faqOpen, setFaqOpen] = useState(null);
  const [noteOpen, setNoteOpen] = useState(null);
  const [showFullDesc, setShowFullDesc] = useState(false);

  // Dynamic SEO — updates after series loads
  usePageMeta({
    title: series ? `${series.title} – Mock Tests & Study Material` : 'Exam Series – Abhyo',
    description: series
      ? `Prepare for ${series.examName || series.title} with ${series.totalTests || 0}+ mock tests, study notes, and detailed analytics on Abhyo. ${series.tagline || ''}`
      : 'Comprehensive exam series with mock tests, study notes, and analytics.',
    canonical: series ? `/exam-series/${series.slug}` : '/exam-series',
    image: series?.thumbnail ? `https://abhyo.com/uploads/${series.thumbnail}` : undefined,
    type: 'article',
  });

  useEffect(() => {
    api.get(`/exam-series/${slug}`)
      .then(r => {
        const s = r.data.data;
        setSeries(s);
        if (s?.id) {
          api.get(`/exam-series/${s.id}/notes/public`)
            .then(nr => setNotes(nr.data.grouped || {}))
            .catch(() => { });
        }
      })
      .catch(() => toast.error('Series not found'))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleStartTest = (test) => {
    if (!isAuthenticated) { toast.error('Please login to attempt tests'); navigate('/login'); return; }
    const isPaid = !test.isFree && test.price > 0;
    const hasActiveSub = user?.studentSubscriptionStatus === 'active' && user?.studentSubscriptionEndDate && new Date(user.studentSubscriptionEndDate) > new Date();
    const inst = user?.institute;
    const isInstitutePlanActive = !user?.institutePremiumBlocked && inst && ['basic', 'pro', 'enterprise'].includes(inst.subscriptionPlan) && inst.subscriptionStatus === 'active' && inst.subscriptionEndDate && new Date(inst.subscriptionEndDate) > new Date();
    if (isPaid && !hasActiveSub && !isInstitutePlanActive && user?.role !== 'superadmin') {
      toast('🔒 Premium test — upgrade to unlock!', { icon: '⚡', duration: 4000 });
      navigate('/student/subscription');
      return;
    }
    navigate(`/test/${test.id}/lobby`);
  };

  /* ── Loading ── */
  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center flex-col gap-4">
      <div className="w-10 h-10 rounded-full border-3 border-indigo-100 border-t-indigo-600 animate-spin" style={{ border: '3px solid #e0e7ff', borderTopColor: '#6366f1' }} />
      <p className="text-sm text-slate-500 font-medium">Loading exam series…</p>
    </div>
  );

  if (!series) return (
    <div className="min-h-screen bg-white flex items-center justify-center flex-col gap-3">
      <div className="text-5xl">😕</div>
      <p className="font-bold text-slate-800 text-base">Exam series not found</p>
      <Link to="/" className="text-indigo-600 font-semibold text-sm hover:underline">← Go Home</Link>
    </div>
  );

  const ed = series.examDetails || {};
  const catColorMap = { Defence: 'bg-blue-100 text-blue-700', UPSC: 'bg-amber-100 text-amber-700', SSC: 'bg-emerald-100 text-emerald-700', Banking: 'bg-sky-100 text-sky-700' };
  const catCls = catColorMap[series.category] || 'bg-indigo-100 text-indigo-700';
  const totalNotes = Object.values(notes).reduce((a, arr) => a + arr.length, 0);
  const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans overflow-x-hidden">

      {/* Ambient background */}
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(to right,#94a3b81a 1px,transparent 1px),linear-gradient(to bottom,#94a3b81a 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-30 pointer-events-none -z-10" />
      <div className="fixed top-1/3 right-0 w-80 h-80 bg-violet-100 rounded-full blur-3xl opacity-20 pointer-events-none -z-10" />

      {/* ── Navbar — always white, matches Landing.jsx ── */}
      {/* Nav is now handled by PublicLayout */}

      {/* ── HERO — Premium Dark Theme ── */}
      <section className="relative overflow-hidden bg-slate-950" style={{ paddingTop: 110, paddingBottom: 40, paddingLeft: 'max(24px, calc((100vw - 1280px)/2 + 24px))', paddingRight: 'max(24px, calc((100vw - 1280px)/2 + 24px))' }}>
        {/* Universal Banner Image Background */}
        <div className="absolute inset-0 z-0">
          <img src={series.thumbnail ? getImageUrl(series.thumbnail) : "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80"} alt="Background" className="w-full h-full object-cover opacity-20 mix-blend-luminosity" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/50" />
        </div>

        {/* Brand Glows */}
        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none z-0" />
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-violet-500/20 rounded-full blur-[80px] pointer-events-none z-0" />

        <div className="max-w-7xl mx-auto relative z-10 flex flex-col items-start gap-4">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[11px] text-indigo-400 font-semibold tracking-wide">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3 text-indigo-500/50" />
            <Link to="/categories" className="hover:text-white transition-colors">Exam Series</Link>
            <ChevronRight className="w-3 h-3 text-indigo-500/50" />
            <span className="text-indigo-200 truncate max-w-[300px]">{series.title}</span>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2.5">
            <span className="text-[9.5px] font-black tracking-widest uppercase px-3.5 py-1.5 rounded-full border bg-indigo-500/10 border-indigo-400/20 text-indigo-200 backdrop-blur-md shadow-sm">{series.category}</span>
            {series.isFeatured && <span className="text-[9.5px] font-black tracking-widest uppercase px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-400/20 text-amber-200 backdrop-blur-md shadow-sm">⭐ Featured</span>}
            <span className={`text-[9.5px] font-black tracking-widest uppercase px-3.5 py-1.5 rounded-full border backdrop-blur-md shadow-sm ${series.isFree ? 'bg-emerald-500/10 border-emerald-400/20 text-emerald-200' : 'bg-violet-500/10 border-violet-400/20 text-violet-200'}`}>
              {series.isFree ? '🆓 Free Access' : '⭐ Premium'}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl lg:text-[2.6rem] font-black text-white leading-tight tracking-tight max-w-4xl drop-shadow-sm mt-1">
            <span className="bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">{series.title}</span>
          </h1>

          {/* Covered Upcoming Exams */}
          {Array.isArray(series.linkedExams) && series.linkedExams.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap mt-1">
              <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">Prepares For:</span>
              {series.linkedExams.map(slug => (
                <Link
                  key={slug}
                  to={`/upcoming-exams/${slug}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/10 hover:bg-white/20 text-indigo-100 border border-white/15 transition-all backdrop-blur-md shadow-sm"
                >
                  <span>🏛️ {slug.replace(/-/g, ' ').toUpperCase()}</span>
                  <span className="text-[10px] text-amber-300 font-normal">Exam Dates &amp; Notice →</span>
                </Link>
              ))}
            </div>
          )}

          {/* CTA row */}
          <div className="flex flex-wrap gap-3 mt-2">
            <a href="#tests" className="bg-white text-indigo-950 hover:bg-indigo-50 font-extrabold py-2.5 px-6 rounded-xl text-sm flex items-center gap-2 hover:-translate-y-0.5 transition-all shadow-[0_4px_20px_rgba(255,255,255,0.12)] hover:shadow-[0_8px_30px_rgba(255,255,255,0.22)]">
              🚀 Start Practicing
            </a>
            {totalNotes > 0 && (
              <a href="#notes" className="bg-slate-900/60 border border-slate-700/80 hover:border-indigo-400/50 text-white font-bold py-2.5 px-5 rounded-xl transition-all text-sm flex items-center gap-2 hover:bg-slate-800 backdrop-blur-md">
                <FileText className="w-4 h-4 opacity-70" /> Study Notes ({totalNotes})
              </a>
            )}
          </div>

          {/* Stat pills & Materials preview */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-5 mt-4 border-t border-slate-800/50 pt-5 w-full max-w-5xl">
            <div className="flex flex-wrap gap-2">
              {[
                { icon: '📝', label: 'Tests', val: series.totalTests || series.tests?.length || 0 },
                { icon: '👥', label: 'Students', val: series.totalStudents || '1000+' },
                ...(totalNotes > 0 ? [{ icon: '📒', label: 'Notes', val: totalNotes }] : []),
              ].map(({ icon, label, val }) => (
                <div key={label} className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-900/50 border border-slate-800/50 backdrop-blur-sm rounded-lg">
                  <span className="text-lg opacity-80">{icon}</span>
                  <div>
                    <div className="text-xs font-bold text-white leading-none">{val}</div>
                    <div className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">{label}</div>
                  </div>
                </div>
              ))}
            </div>

            {Object.keys(notes).length > 0 && (
              <div className="hidden lg:block w-px h-8 bg-slate-800" />
            )}

            {Object.keys(notes).length > 0 && (
              <div>
                <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider mb-2">📚 Included Materials</p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(notes).slice(0, 4).map(([subj, arr]) => (
                    <a key={subj} href="#notes" className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-full text-xs no-underline transition-all backdrop-blur-md">
                      <span className="text-[10px] opacity-70">{typeIcon[arr[0]?.fileType || 'none']}</span>
                      <span className="font-medium text-indigo-100">{subj}</span>
                      <span className="text-[9px] font-bold text-indigo-900 bg-indigo-300 px-1 py-0.5 rounded-full">{arr.length}</span>
                    </a>
                  ))}
                  {Object.entries(notes).length > 4 && (
                    <a href="#notes" className="inline-flex items-center px-2 py-1 text-[11px] font-medium text-indigo-300 hover:text-white transition-colors">
                      +{Object.entries(notes).length - 4} more
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── BODY ── */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-10 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start relative z-10">

        {/* LEFT */}
        <div className="flex flex-col gap-6">

          {/* Preparation Roadmap */}
          <SectionCard title="🚀 Your Preparation Roadmap">
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Accelerate your preparation by following this systematic, expert-recommended preparation path.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
              {[
                { step: '1', title: 'Study Notes', desc: 'Read curated, subject-wise study material & short notes.', icon: '📖', col: 'from-blue-500 to-indigo-500' },
                { step: '2', title: 'Practice Tests', desc: 'Practice with mock tests under real exam conditions.', icon: '⏱️', col: 'from-indigo-500 to-violet-500' },
                { step: '3', title: 'Deep Analysis', desc: 'Review detailed performance metrics & explanations.', icon: '📊', col: 'from-violet-500 to-fuchsia-500' },
                { step: '4', title: 'Rank Boost', desc: 'Re-attempt weak areas to top the leaderboard.', icon: '🏆', col: 'from-fuchsia-500 to-pink-500' }
              ].map((s, idx) => (
                <div key={idx} className="group relative bg-slate-50 border border-slate-100 rounded-2xl p-5 hover:bg-white hover:shadow-lg hover:border-indigo-100 transition-all duration-300">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${s.col} text-white flex items-center justify-center font-bold text-sm shadow-md mb-4 group-hover:scale-110 transition-transform`}>
                    {s.icon}
                  </div>
                  <div className="absolute top-4 right-4 text-xs font-black text-slate-200 group-hover:text-indigo-100 transition-colors">0{s.step}</div>
                  <h4 className="font-extrabold text-slate-800 text-sm mb-1.5">{s.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </SectionCard>


          {/* Notes */}
          {Object.keys(notes).length > 0 && (
            <SectionCard title={<span id="notes">📝 Study Notes &amp; Materials</span>}>
              <div className="flex flex-col gap-4">
                {Object.entries(notes).map(([subject, subjectNotes]) => (
                  <div key={subject}>
                    <p className="text-[11px] font-extrabold text-indigo-600 uppercase tracking-widest mb-2">📚 {subject}</p>
                    <div className="flex flex-col gap-2">
                      {subjectNotes.map(note => {
                        const isExpanded = noteOpen === note.id;
                        const tIcon = typeIcon[note.fileType] || '📋';
                        const tCls = typeColor[note.fileType] || typeColor.none;
                        const tDl = typeDl[note.fileType] || 'text-slate-600';
                        const isLocked = !note.isFree && !(
                          user?.studentSubscriptionStatus === 'active' && user?.studentSubscriptionEndDate && new Date(user.studentSubscriptionEndDate) > new Date()
                        ) && user?.role !== 'superadmin';

                        return (
                          <div key={note.id} className={`border rounded-xl overflow-hidden transition-all ${isExpanded ? 'border-indigo-200 bg-indigo-50/40' : 'border-slate-200 bg-white'}`}>
                            <button
                              onClick={() => setNoteOpen(isExpanded ? null : note.id)}
                              className="w-full flex items-center gap-5 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
                            >
                              {note.thumbnail ? (
                                <div className="w-24 h-20 sm:w-32 sm:h-24 rounded-xl overflow-hidden flex-shrink-0 border border-slate-200 shadow-sm bg-slate-50 flex items-center justify-center">
                                  <img src={`${BASE_URL}${note.thumbnail}`} alt="" className="w-full h-full object-contain" />
                                </div>
                              ) : (
                                <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200 flex-shrink-0">
                                  <span className="text-2xl sm:text-3xl">{tIcon}</span>
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-slate-800 text-[13px] truncate">{note.title}</p>
                                {note.description && <p className="text-[11px] text-slate-400 truncate mt-0.5">{note.description}</p>}
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {!note.isFree && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700">⭐ PRO</span>}
                                {note.fileType !== 'none' && (
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tCls}`}>{note.fileType.toUpperCase()}</span>
                                )}
                                <span className="text-slate-300 text-base font-bold">{isExpanded ? '−' : '+'}</span>
                              </div>
                            </button>

                            {isExpanded && (
                              <div className="px-4 pb-4 border-t border-slate-100">
                                {!isAuthenticated ? (
                                  <div className="mt-3 p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-center">
                                    <p className="font-extrabold text-indigo-800 text-sm mb-1">🔐 Login Required</p>
                                    <p className="text-xs text-indigo-700 mb-3">Please login or register to access this study material.</p>
                                    <div className="flex gap-2 justify-center">
                                      <button onClick={() => navigate('/login')} className="px-5 py-2 bg-indigo-600 text-white font-bold text-xs rounded-lg hover:bg-indigo-700 transition-all">Login</button>
                                      <button onClick={() => navigate('/register')} className="px-5 py-2 bg-white text-indigo-600 font-bold text-xs rounded-lg border border-indigo-200 hover:bg-indigo-50 transition-all">Register Free</button>
                                    </div>
                                  </div>
                                ) : isLocked ? (
                                  <div className="mt-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-center">
                                    <p className="font-extrabold text-amber-800 text-sm mb-1">🔒 Pro Content</p>
                                    <p className="text-xs text-amber-700 mb-3">Upgrade to access this premium study material</p>
                                    <button onClick={() => navigate('/student/subscription')}
                                      className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs py-2 px-5 rounded-lg hover:shadow-md transition-all">
                                      ⚡ Upgrade to Pro
                                    </button>
                                  </div>
                                ) : (
                                  <div className="pt-3 flex flex-col gap-3">
                                    {note.content && <div className="text-sm text-slate-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: note.content }} />}
                                    <div className="flex flex-wrap gap-2">
                                      {note.fileUrl && (
                                        <a href={`${BASE_URL}${note.fileUrl}`} target="_blank" rel="noopener noreferrer"
                                          className={`inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg border ${tCls} hover:shadow-sm transition-all`}>
                                          <Download className="w-3.5 h-3.5" /> Download {note.fileType.toUpperCase()}
                                        </a>
                                      )}
                                      {note.externalLink && (
                                        <a href={note.externalLink} target="_blank" rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg border bg-emerald-50 border-emerald-200 text-emerald-700 hover:shadow-sm transition-all">
                                          <Link2 className="w-3.5 h-3.5" /> Open Link
                                        </a>
                                      )}
                                      {!note.content && !note.fileUrl && !note.externalLink && (
                                        <p className="text-xs text-slate-400 italic">No content yet.</p>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Tests */}
          {series.tests?.length > 0 && (
            <SectionCard title={<span id="tests">📝 Mock Tests in This Series ({series.tests.length})</span>}>
              <div className="flex flex-col gap-3">
                {series.tests.map(t => <TestCard key={t.id} test={t} user={user} onStart={handleStartTest} />)}
              </div>
              {!isAuthenticated && (
                <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-center">
                  <p className="font-bold text-indigo-700 text-sm mb-2">🔐 Login to attempt tests</p>
                  <div className="flex gap-2 justify-center">
                    <button onClick={() => navigate('/login')} className="px-5 py-2 bg-indigo-600 text-white font-bold text-xs rounded-lg hover:bg-indigo-700 transition-all">Login</button>
                    <button onClick={() => navigate('/register')} className="px-5 py-2 bg-white text-indigo-600 font-bold text-xs rounded-lg border border-indigo-200 hover:bg-indigo-50 transition-all">Register Free</button>
                  </div>
                </div>
              )}
            </SectionCard>
          )}

          {/* Key Features of Abhyo Test Series */}
          <SectionCard title="⚡ Key Features of Abhyo Test Series">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { title: 'Real Exam Simulation', desc: 'Practice with a user interface identical to the official online testing layout.', icon: '💻' },
                { title: 'AI-Powered Insights', desc: 'Identify your strong & weak chapters with accurate subject-wise analytics.', icon: '🧠' },
                { title: 'All-India Rankings', desc: 'Compete live with thousands of other aspirants and see your percentile.', icon: '🏆' },
                { title: 'Detailed Solutions', desc: 'Every question includes step-by-step video & text answers for concept building.', icon: '💡' },
                { title: 'Unlimited Re-attempts', desc: 'Practice your incorrect answers as many times as you need to perfect them.', icon: '🔄' },
                { title: '24/7 Doubt Support', desc: 'Connect with expert mentors to clear any complex test queries instantly.', icon: '💬' }
              ].map((f, i) => (
                <div key={i} className="flex flex-col gap-2 p-4 bg-white border border-slate-100 rounded-2xl hover:shadow-md hover:border-indigo-100 transition-all duration-300">
                  <span className="text-2xl">{f.icon}</span>
                  <h4 className="font-extrabold text-slate-800 text-xs mt-1">{f.title}</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Successful Student Testimonials */}
          <SectionCard title="💬 What Our Successful Students Say">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: 'Rahul Sharma', post: 'Cleared GD 2025', text: 'The mock tests on Abhyo matched the exact current pattern. The detailed AI analytics helped me improve my time management by 20%!', rank: 'AIR 45', img: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=60' },
                { name: 'Priya Patel', post: 'Selected in Agniveer 2025', text: 'Study notes were extremely handy for quick revision in the last week, and full-length mocks gave me real exam confidence. Highly recommended!', rank: 'AIR 112', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=60' }
              ].map((t, i) => (
                <div key={i} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col justify-between gap-3 text-left">
                  <p className="text-xs text-slate-600 italic leading-relaxed">"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <img src={t.img} alt={t.name} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                        {t.name} <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">{t.rank}</span>
                      </h4>
                      <p className="text-[10px] text-slate-400 font-semibold">{t.post}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* SIDEBAR */}
        <div className="flex flex-col gap-4 lg:sticky lg:top-24">

          {/* CTA */}
          <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-5 text-center shadow-xl shadow-indigo-500/20">
            <div className="text-3xl mb-2">🎓</div>
            <p className="font-extrabold text-white text-sm mb-1">Ready to Crack {series.examName}?</p>
            <p className="text-indigo-200 text-xs mb-4">Start with a free test today</p>
            {series.tests?.length > 0 ? (
              <button onClick={() => handleStartTest(series.tests[0])}
                className="w-full py-2.5 bg-white text-indigo-600 font-extrabold text-sm rounded-xl hover:bg-indigo-50 hover:shadow-md transition-all flex items-center justify-center gap-2">
                <Play className="w-4 h-4" /> Start First Test
              </button>
            ) : <p className="text-indigo-300 text-xs">Tests coming soon</p>}
          </div>

          {/* Stats */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-4">Series Stats</p>
            {[
              ['📝', 'Total Tests', series.totalTests || series.tests?.length || 0],
              ['📒', 'Study Notes', totalNotes],
              ['👥', 'Students', series.totalStudents || '1000+'],
            ].map(([icon, label, val]) => (
              <div key={label} className="flex justify-between items-center py-2.5 border-b border-slate-50 last:border-0">
                <span className="text-xs text-slate-500 font-medium">{icon} {label}</span>
                <span className="text-sm font-extrabold text-slate-900">{val}</span>
              </div>
            ))}
          </div>

          {/* Pro Tips */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <p className="font-extrabold text-amber-800 text-sm mb-3">💡 Pro Tips</p>
            {['Attempt tests under real exam conditions', 'Review answers after every test', 'Focus on weak subjects from analytics', 'Take at least 1 test per day in final week'].map((t, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-amber-700 font-medium mb-2">
                <span className="text-emerald-600 font-bold flex-shrink-0 mt-0.5">✓</span> {t}
              </div>
            ))}
          </div>

          {/* Quick Links */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">Quick Links</p>
            {[
              ['🏠 All Exam Series', '/exam-series', false],
              ...(totalNotes > 0 ? [['📝 Study Notes', '#notes', true]] : []),
              ['📊 Leaderboard', '/student/leaderboard', false],
              ['📚 All Tests', '/student/tests', false],
            ].map(([label, href, isAnchor]) => isAnchor ? (
              <a key={href} href={href} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors no-underline">
                {label} <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              </a>
            ) : (
              <Link key={href} to={href} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors no-underline">
                {label} <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      {/* Footer is now handled by PublicLayout */}
    </div>
  );
}
