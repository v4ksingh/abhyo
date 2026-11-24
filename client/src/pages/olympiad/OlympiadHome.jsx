import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Trophy, Calendar, Clock, ChevronRight, CheckCircle,
  BookOpen, Award, Users, Zap, ChevronDown, ArrowRight,
  Shield, TrendingUp, BarChart2, Star, Medal, Flame, Laptop
} from 'lucide-react';
import api from '../../lib/api';
import useAuthStore from '../../store/authStore';
import usePageMeta from '../../hooks/usePageMeta';

/* ─── Styles ──────────────────────────────────────────────────────────────── */
const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
  .oly-font { font-family: 'Outfit', sans-serif; }
  @keyframes floatBob    { 0%,100%{transform:translateY(0)}   50%{transform:translateY(-10px)} }
  @keyframes floatBob2   { 0%,100%{transform:translateY(0)}   50%{transform:translateY(-6px)} }
  @keyframes fadeUp      { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
  @keyframes gradShift   { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
  @keyframes orbPulse    { 0%,100%{opacity:.55;transform:scale(1)}   50%{opacity:.75;transform:scale(1.08)} }
  @keyframes shimmer     { 0%{transform:translateX(-100%) skewX(-20deg)} 100%{transform:translateX(200%) skewX(-20deg)} }
  @keyframes rotateRing  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes chipSlideL  { from{opacity:0;transform:translateX(-24px)} to{opacity:1;transform:translateX(0)} }
  @keyframes chipSlideR  { from{opacity:0;transform:translateX(24px)}  to{opacity:1;transform:translateX(0)} }
  @keyframes iconSpin    { 0%,100%{transform:rotate(-4deg) scale(1)}  50%{transform:rotate(4deg) scale(1.06)} }
  @keyframes countUp     { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  .float-bob   { animation: floatBob  5s ease-in-out infinite; }
  .float-bob2  { animation: floatBob2 4s ease-in-out infinite 0.5s; }
  .fade-in-1   { animation: fadeUp .7s cubic-bezier(.2,.8,.2,1) .1s  both; }
  .fade-in-2   { animation: fadeUp .7s cubic-bezier(.2,.8,.2,1) .25s both; }
  .fade-in-3   { animation: fadeUp .7s cubic-bezier(.2,.8,.2,1) .4s  both; }
  .fade-in-4   { animation: fadeUp .7s cubic-bezier(.2,.8,.2,1) .55s both; }
  .grad-text   { background-size:200% auto; animation: gradShift 4s linear infinite; }
  .chip-l      { animation: chipSlideL .6s cubic-bezier(.2,.8,.2,1) .8s both; }
  .chip-r      { animation: chipSlideR .6s cubic-bezier(.2,.8,.2,1) 1s  both; }
  .btn-shimmer { position:relative; overflow:hidden; }
  .btn-shimmer::after { content:''; position:absolute; inset:0; background:linear-gradient(90deg,transparent 0%,rgba(255,255,255,.25) 50%,transparent 100%); transform:translateX(-100%) skewX(-20deg); }
  .btn-shimmer:hover::after { animation: shimmer .8s ease; }
  .orb-pulse   { animation: orbPulse 6s ease-in-out infinite; }
  .stat-count  { animation: countUp .5s ease .6s both; }
`;


/* ─── Subject data ────────────────────────────────────────────────────────── */
const SUBJECTS = [
  { id: 'math', label: 'Mathematics', icon: '📐', color: '#6366f1', topics: ['Algebra', 'Geometry', 'Number Theory', 'Statistics', 'Arithmetic'] },
  { id: 'science', label: 'Science', icon: '🔬', color: '#0ea5e9', topics: ['Physics', 'Chemistry', 'Biology', 'Ecology', 'Scientific Methods'] },
  { id: 'computer', label: 'Computer Science', icon: '💻', color: '#8b5cf6', topics: ['Python Basics', 'Data Structures', 'Algorithms', 'Networking', 'AI Concepts'] },
  { id: 'english', label: 'English', icon: '📖', color: '#e11d48', topics: ['Reading Comprehension', 'Grammar', 'Vocabulary', 'Idioms', 'Writing'] },
  { id: 'gk', label: 'General Knowledge', icon: '🌏', color: '#f59e0b', topics: ['Current Affairs', 'Indian History', 'World Geography', 'Sports', 'Science Facts'] },
  { id: 'reasoning', label: 'Logical Reasoning', icon: '🧠', color: '#10b981', topics: ['Patterns & Series', 'Direction Sense', 'Coding-Decoding', 'Puzzles', 'Syllogisms'] },
];

const SAMPLE_Q = {
  math: 'If 3x + 6 = 21, find x.',
  science: 'Which gas do plants absorb during photosynthesis?',
  computer: 'What is the time complexity of Binary Search?',
  english: 'Identify the figure of speech: "The wind whispered."',
  gk: 'Which is the longest river in India?',
  reasoning: 'Next in series: 2, 4, 8, 16, __?',
};

/* ─── StatusBadge ─────────────────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const cfg = {
    open: { label: 'Registrations Open', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
    ongoing: { label: 'Exam Live', cls: 'bg-blue-50   text-blue-700   border-blue-200', dot: 'bg-blue-500 animate-pulse' },
    closed: { label: 'Registrations Closed', cls: 'bg-amber-50  text-amber-700  border-amber-200', dot: 'bg-amber-500' },
    completed: { label: 'Completed', cls: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
    upcoming: { label: 'Coming Soon', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200', dot: 'bg-indigo-500' },
  };
  const c = cfg[status] || { label: status, cls: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${c.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

/* ─── Main ────────────────────────────────────────────────────────────────── */
export default function OlympiadHome() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  usePageMeta({
    title: 'Abhyo National Olympiad – Online School Olympiad for Class 6–12',
    description: 'Compete in Maths, Science, Computer & more. Earn All-India Ranks, win cash prizes up to ₹25,000, gold medals, and QR-verified certificates. Open for Class 6–12.',
    canonical: '/olympiad',
  });

  const DEFAULT_REWARDS = {
    prizePoolBadge: '₹10 Lakh+ Prize Pool',
    heading: 'Rewards for Top Performers',
    subtitle: 'Top rankers receive cash awards, medals and national recognition. Every participant earns a verified certificate.',
    airOnePrize: '₹25,000 + Gold Medal',
    prizes: [
      { pos: '2nd Place', prize: '₹15,000', extra: 'Silver Medal + Certificate', color: '#94a3b8', border: 'border-slate-700', featured: false },
      { pos: '1st Place', prize: '₹25,000', extra: 'Gold Trophy + Medal + Certificate', color: '#fbbf24', border: 'border-amber-500/60', featured: true },
      { pos: '3rd Place', prize: '₹10,000', extra: 'Bronze Medal + Certificate', color: '#b45309', border: 'border-amber-900/50', featured: false },
    ],
    participantRewardTitle: 'Every Participant Gets a Certificate',
    participantRewardSubtitle: 'QR-code verified, downloadable from your dashboard. Accepted by schools across India.',
    registrationFee: 150,
  };

  const [olympiads, setOlympiads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSub, setActiveSub] = useState(0);
  const [openFaq, setOpenFaq] = useState(null);
  const [activeClass, setActiveClass] = useState(10);
  const [rewardsConfig, setRewardsConfig] = useState(DEFAULT_REWARDS);

  useEffect(() => {
    api.get('/olympiad/public/list')
      .then(r => setOlympiads(r.data.data || []))
      .catch(() => { })
      .finally(() => setLoading(false));

    api.get('/olympiad/public/rewards')
      .then(r => {
        if (r.data?.data) {
          setRewardsConfig(prev => ({
            ...prev,
            ...r.data.data,
            prizes: r.data.data.prizes?.length ? r.data.data.prizes : prev.prizes
          }));
        }
      })
      .catch(() => {});
  }, []);

  /* flagship fallback cards */
  const FLAGSHIPS = useMemo(() => [
    { id: 'f1', title: 'National Mathematics Olympiad 2026', subject: { name: 'Mathematics', color: '#6366f1', icon: '📐' }, status: 'open', examDate: '2026-10-18', examDurationMinutes: 60, totalQuestions: 50, eligibleClasses: [6, 7, 8, 9, 10, 11, 12], registrationFee: 150 },
    { id: 'f2', title: 'National Science Olympiad 2026', subject: { name: 'Science', color: '#0ea5e9', icon: '🔬' }, status: 'open', examDate: '2026-10-25', examDurationMinutes: 60, totalQuestions: 50, eligibleClasses: [6, 7, 8, 9, 10, 11, 12], registrationFee: 150 },
    { id: 'f3', title: 'Coding & Technology Olympiad 2026', subject: { name: 'Computer Science', color: '#8b5cf6', icon: '💻' }, status: 'upcoming', examDate: '2026-11-08', examDurationMinutes: 60, totalQuestions: 45, eligibleClasses: [6, 7, 8, 9, 10, 11, 12], registrationFee: 150 },
    { id: 'f4', title: 'National English Olympiad 2026', subject: { name: 'English', color: '#e11d48', icon: '📖' }, status: 'upcoming', examDate: '2026-11-22', examDurationMinutes: 60, totalQuestions: 50, eligibleClasses: [6, 7, 8, 9, 10, 11, 12], registrationFee: 150 },
    { id: 'f5', title: 'General Knowledge Olympiad 2026', subject: { name: 'General Knowledge', color: '#f59e0b', icon: '🌏' }, status: 'upcoming', examDate: '2026-12-06', examDurationMinutes: 60, totalQuestions: 50, eligibleClasses: [6, 7, 8, 9, 10, 11, 12], registrationFee: 150 },
    { id: 'f6', title: 'National Logical Reasoning Olympiad 2026', subject: { name: 'Logical Reasoning', color: '#10b981', icon: '🧠' }, status: 'upcoming', examDate: '2026-12-13', examDurationMinutes: 60, totalQuestions: 50, eligibleClasses: [6, 7, 8, 9, 10, 11, 12], registrationFee: 150 },
  ], []);

  // Show only real DB olympiads; fall back to FLAGSHIPS only when API returns nothing
  const cards = useMemo(() => {
    if (olympiads.length > 0) return olympiads;
    return FLAGSHIPS;
  }, [olympiads, FLAGSHIPS]);

  const sub = SUBJECTS[activeSub];

  const goRegister = (id) => {
    const dest = id ? `/student/olympiad/register/${id}` : '/student/olympiad';
    if (isAuthenticated) navigate(dest);
    else navigate(`/olympiad/register-account?redirect=${encodeURIComponent(dest)}`);
  };

  /* class info */
  const CLASS_INFO = {
    6: { tier: 'Junior I', desc: 'Foundational concepts with a focus on application and curiosity.', subjects: ['Mathematics', 'Science', 'English', 'Computer', 'GK', 'Logical Reasoning'], topics: ['Integers & Fractions', 'Plant Nutrition', 'Basic Grammar', 'Computer Fundamentals', 'Direction Sense'] },
    7: { tier: 'Junior II', desc: 'Deeper problem-solving with structured reasoning across all subjects.', subjects: ['Mathematics', 'Science', 'English', 'Computer', 'GK', 'Logical Reasoning'], topics: ['Rationals & Equations', 'Physical & Chemical Changes', 'Tenses & Comprehension', 'Python Intro', 'Number Series'] },
    8: { tier: 'Junior III', desc: 'Transition-level that bridges middle school and high school rigor.', subjects: ['Mathematics', 'Science', 'English', 'Computer', 'GK', 'Logical Reasoning'], topics: ['Algebraic Identities', 'Force & Sound', 'Error Detection', 'HTML & Python', 'Blood Relations'] },
    9: { tier: 'Senior I', desc: 'Foundation for JEE/NEET-aligned thinking with Olympiad-level challenges.', subjects: ['Mathematics', 'Science', 'English', 'Computer', 'GK', 'Logical Reasoning'], topics: ['Coordinate Geometry', 'Motion & Gravitation', 'Comprehension & Writing', 'Data Structures', 'Seating Arrangements'] },
    10: { tier: 'Senior II', desc: 'Board-integrated Olympiad prep with advanced analytical questions.', subjects: ['Mathematics', 'Science', 'English', 'Computer', 'GK', 'Logical Reasoning'], topics: ['Trigonometry & Statistics', 'Light & Electricity', 'Literature & Grammar', 'SQL Basics', 'Complex Reasoning'] },
    11: { tier: 'Pre-University', desc: 'University-preparatory level benchmarked against national peers.', subjects: ['Mathematics', 'Physics & Chemistry', 'Computer Science', 'English', 'Logical Aptitude'], topics: ['Calculus', 'Thermodynamics & Waves', 'Organic Chemistry', 'Algorithms', 'Advanced Verbal Logic'] },
    12: { tier: 'National Elite', desc: 'Highest difficulty tier for the most competitive students in India.', subjects: ['Mathematics', 'Physics & Chemistry', 'Computer Science', 'English', 'Logical Aptitude'], topics: ['Integral Calculus', 'Modern Physics', 'Coordination Compounds', 'AI & Machine Learning', 'Aptitude'] },
  };
  const ci = CLASS_INFO[activeClass];

  const FAQS = [
    { q: 'Who can participate?', a: 'Any student from Class 6 to Class 12 — CBSE, ICSE, State Board, IB, or any recognised school in India.' },
    { q: 'Do I need to go anywhere for the exam?', a: 'No. The Olympiad is 100% online. You appear from your own home or school computer, at your scheduled time.' },
    { q: 'Can I register for more than one subject?', a: 'Yes, absolutely. You can register for multiple subjects. Exam windows are staggered so there are no time conflicts.' },
    { q: 'What is the registration fee?', a: `₹${rewardsConfig.registrationFee || 150} per subject. No additional or hidden charges.` },
    { q: 'When do I get my result and rank?', a: 'Preliminary score appears immediately after submission. Official All-India Rank is published within 7 days on your dashboard.' },
    { q: 'How do I receive my certificate?', a: 'Download it directly from your Abhyo dashboard. Each certificate carries an encrypted QR code for instant verification by schools and institutions.' },
  ];

  return (
    <>
      <style>{STYLE}</style>

      <div className="oly-font min-h-screen bg-white text-slate-900">

        {/* ── HERO ──────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0a0618 0%, #0f0a2e 40%, #0d1240 70%, #080d1e 100%)', paddingTop: '80px', minHeight: '100vh' }}>

          {/* Noise texture overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }} />

          {/* Aurora orbs */}
          <div className="orb-pulse absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.35) 0%, transparent 70%)' }} />
          <div className="orb-pulse absolute top-20 right-0 w-[420px] h-[420px] rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)', animationDelay: '2s' }} />
          <div className="orb-pulse absolute bottom-0 left-1/3 w-[350px] h-[350px] rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(14,165,233,0.2) 0%, transparent 70%)', animationDelay: '1s' }} />

          {/* Dot grid */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)', backgroundSize: '36px 36px' }} />

          {/* Diagonal accent lines */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
            <div className="absolute top-0 left-1/4 w-px h-full" style={{ background: 'linear-gradient(to bottom, transparent, rgba(139,92,246,0.8), transparent)' }} />
            <div className="absolute top-0 right-1/4 w-px h-full" style={{ background: 'linear-gradient(to bottom, transparent, rgba(99,102,241,0.8), transparent)' }} />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-0">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center py-8 lg:py-0" style={{ minHeight: undefined }}>

              {/* ── LEFT CONTENT ── */}
              <div className="lg:col-span-6 pb-4 lg:pb-16 pt-4 flex flex-col justify-center">

                {/* LIVE badge */}
                <div className="fade-in-1 flex items-center gap-3 mb-7">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold tracking-wide"
                    style={{ background: 'rgba(99,102,241,0.15)', borderColor: 'rgba(99,102,241,0.4)', color: '#a5b4fc' }}>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-70" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-400" />
                    </span>
                    LIVE — Registrations Open 2026
                  </div>
                  <div className="h-px flex-1 opacity-20" style={{ background: 'linear-gradient(to right, rgba(99,102,241,1), transparent)' }} />
                </div>

                {/* Headline */}
                <h1 className="fade-in-2 font-black leading-[1.05] tracking-tight mb-6"
                  style={{ fontSize: 'clamp(2.6rem,5.5vw,4.2rem)' }}>
                  <span className="text-white block">India's Biggest</span>
                  <span className="block bg-clip-text text-transparent grad-text"
                    style={{ backgroundImage: 'linear-gradient(90deg, #818cf8, #c084fc, #f472b6, #818cf8)', backgroundSize: '200% auto' }}>
                    School Olympiad
                  </span>
                  <span className="text-white block">Platform.</span>
                </h1>

                {/* Sub-headline */}
                <p className="fade-in-3 text-base sm:text-lg leading-relaxed mb-8 max-w-lg"
                  style={{ color: 'rgba(203,213,255,0.72)' }}>
                  Compete in <span style={{ color: '#a5b4fc', fontWeight: 700 }}>Maths, Science, Computer Science</span> and more. Earn{' '}
                  <span style={{ color: '#f0abfc', fontWeight: 700 }}>All-India Ranks</span>, cash prizes up to{' '}
                  <span style={{ color: '#fbbf24', fontWeight: 700 }}>
                    {rewardsConfig.prizes?.find(p => p.featured || p.pos?.includes('1'))?.prize || rewardsConfig.airOnePrize?.split('+')[0]?.trim() || '₹25,000'}
                  </span>, and QR-verified certificates. Open for Class 6–12.
                </p>

                {/* Subject pills */}
                <div className="fade-in-3 flex flex-wrap gap-2 mb-9">
                  {[
                    { icon: '📐', label: 'Mathematics', c: '#818cf8' },
                    { icon: '🔬', label: 'Science', c: '#38bdf8' },
                    { icon: '💻', label: 'CS', c: '#a78bfa' },
                    { icon: '📖', label: 'English', c: '#f472b6' },
                    { icon: '🌏', label: 'GK', c: '#fbbf24' },
                    { icon: '🧠', label: 'Reasoning', c: '#34d399' },
                  ].map((s) => (
                    <span key={s.label}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all hover:scale-105 cursor-default"
                      style={{ background: `${s.c}18`, borderColor: `${s.c}45`, color: s.c }}>
                      {s.icon} {s.label}
                    </span>
                  ))}
                </div>

                {/* CTAs */}
                <div className="fade-in-4 flex flex-wrap gap-3 mb-12">
                  <button onClick={() => goRegister()}
                    className="btn-shimmer group flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-bold text-sm text-white transition-all hover:-translate-y-1 hover:shadow-2xl"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)', boxShadow: '0 8px 32px rgba(99,102,241,0.45)' }}>
                    <Trophy className="w-4 h-4" />
                    Register Now
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <a href="#olympiads"
                    className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm transition-all hover:-translate-y-0.5 border"
                    style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)' }}>
                    View All Exams
                    <ChevronDown className="w-4 h-4 opacity-60" />
                  </a>
                </div>

                {/* Stats strip — always 4 columns */}
                <div className="fade-in-4 grid grid-cols-4 gap-3 pt-6"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  {[
                    { value: '50K+', label: 'Students', color: '#818cf8' },
                    { value: '2,000+', label: 'Schools', color: '#c084fc' },
                    { value: '₹10L+', label: 'Prizes', color: '#fbbf24' },
                    { value: '6', label: 'Subjects', color: '#34d399' },
                  ].map((s, i) => (
                    <div key={i} className={`stat-count ${i > 0 ? 'border-l' : ''}`}
                      style={{ animationDelay: `${0.65 + i * 0.1}s`, borderColor: 'rgba(255,255,255,0.08)', paddingLeft: i > 0 ? '12px' : 0 }}>
                      <p className="text-xl sm:text-2xl font-black leading-none" style={{ color: s.color }}>{s.value}</p>
                      <p className="text-[10px] sm:text-xs font-medium mt-1 leading-tight" style={{ color: 'rgba(203,213,255,0.55)' }}>{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── RIGHT VISUAL ── */}
              <div className="lg:col-span-6 flex items-center justify-center lg:justify-end pb-12 lg:pb-0">
                <div className="relative w-full max-w-[520px] px-4 sm:px-8 lg:px-0">

                  {/* Glow ring behind card */}
                  <div className="absolute inset-0 rounded-3xl pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.25) 0%, transparent 70%)', transform: 'scale(1.15)', filter: 'blur(30px)' }} />

                  {/* Floating AIR chip — only sm+ */}
                  <div className="chip-l hidden sm:flex absolute -top-5 left-2 lg:-left-6 z-20 items-center gap-3 rounded-2xl px-4 py-3 shadow-2xl border"
                    style={{ background: 'rgba(15,10,46,0.92)', borderColor: 'rgba(99,102,241,0.4)', backdropFilter: 'blur(12px)' }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}>
                      <Trophy className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(203,213,255,0.5)' }}>AIR #1 Prize</p>
                      <p className="text-sm font-black text-white">{rewardsConfig.airOnePrize || '₹25,000 + Gold Medal'}</p>
                    </div>
                  </div>

                  {/* Hero image card */}
                  <div className="float-bob relative overflow-hidden rounded-3xl border shadow-2xl"
                    style={{ borderColor: 'rgba(139,92,246,0.35)', boxShadow: '0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05) inset' }}>

                    {/* Gradient overlay on image */}
                    <div className="absolute inset-0 z-10 pointer-events-none"
                      style={{ background: 'linear-gradient(180deg, rgba(10,6,24,0.1) 0%, rgba(10,6,24,0.0) 55%, rgba(10,6,24,0.65) 100%)' }} />

                    <img src="/images/olympiad/hero.png"
                      alt="Students winning at National Olympiad"
                      className="w-full h-auto object-cover"
                      style={{ maxHeight: '430px', objectPosition: 'center top', display: 'block' }} />

                    {/* Bottom overlay text inside image */}
                    <div className="absolute bottom-0 left-0 right-0 z-20 p-5">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                        <span className="text-xs font-bold" style={{ color: 'rgba(203,255,220,0.85)' }}>National Academic Olympiad 2026</span>
                      </div>
                      <p className="text-white font-black text-sm">Champions crowned at the Grand Final ceremony 🏆</p>
                    </div>
                  </div>

                  {/* Floating certificate chip — inside bounds on all sizes */}
                  <div className="chip-r absolute -bottom-4 right-4 lg:-right-4 z-20 flex items-center gap-2 rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3 shadow-2xl border"
                    style={{ background: 'rgba(15,10,46,0.92)', borderColor: 'rgba(52,211,153,0.4)', backdropFilter: 'blur(12px)' }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #34d399, #059669)' }}>
                      <Award className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(203,213,255,0.5)' }}>Certificate</p>
                      <p className="text-xs font-black text-white">QR-Verified Nationwide</p>
                    </div>
                  </div>

                  {/* Floating rank chip — only on desktop */}
                  <div className="float-bob2 hidden lg:flex absolute top-1/2 -right-10 z-20 flex-col items-center gap-0.5 rounded-2xl px-4 py-3 shadow-2xl border text-center"
                    style={{ background: 'rgba(15,10,46,0.92)', borderColor: 'rgba(251,191,36,0.4)', backdropFilter: 'blur(12px)', transform: 'translateY(-50%)' }}>
                    <span className="text-xl font-black" style={{ color: '#fbbf24' }}>AIR</span>
                    <span className="text-3xl font-black text-white leading-none">#1</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(203,213,255,0.5)' }}>Your Goal</span>
                  </div>

                </div>
              </div>

            </div>
          </div>

          {/* Bottom wave divider */}
          <div className="absolute bottom-0 left-0 right-0 pointer-events-none overflow-hidden" style={{ lineHeight: 0 }}>
            <svg viewBox="0 0 1440 60" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: '60px' }}>
              <path d="M0,40 C360,0 1080,60 1440,20 L1440,60 L0,60 Z" fill="#ffffff" />
            </svg>
          </div>
        </section>

        {/* ── AWARDS & SCHOLARSHIPS NOTICE / BUTTON STRIP (AFTER HERO) ────── */}
        <section className="bg-gradient-to-r from-amber-500/10 via-indigo-50/80 to-amber-500/10 border-b border-indigo-100/80 py-4 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 text-center sm:text-left">
              <div className="w-11 h-11 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-600 text-xl shadow-xs shrink-0">
                🏆
              </div>
              <div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-700 bg-amber-100/90 px-2.5 py-0.5 rounded-full border border-amber-200">
                    Official Recognition
                  </span>
                  <p className="text-sm sm:text-base font-black text-slate-900">
                    Awards, Scholarships & Recognitions Framework
                  </p>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Recognising Talent. Rewarding Excellence. Inspiring Every Learner.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <Link
                to="/olympiad/awards"
                className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs sm:text-sm shadow-md shadow-amber-500/20 hover:shadow-lg transition-all hover:scale-[1.02]"
              >
                <Trophy className="w-4 h-4 text-slate-950" />
                <span>Awards & Scholarships</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </section>

        {/* ── OLYMPIAD LISTINGS ─────────────────────────────────────────── */}
        <section id="olympiads" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">

            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
              <div>
                <p className="text-indigo-600 text-xs font-bold uppercase tracking-widest mb-1">Open for Registration</p>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Upcoming Olympiads</h2>
              </div>
              <p className="text-sm text-slate-500 max-w-xs">Register before seats fill up. Exam conducted online from home.</p>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {cards.map(o => {
                  const color = o.subject?.color || '#6366f1';
                  const done = o.status === 'completed' || o.status === 'closed';
                  return (
                    <div key={o.id}
                      className="group flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-indigo-200 hover:shadow-lg transition-all duration-300">
                      {/* Thin accent bar */}
                      <div className="h-1 w-full" style={{ background: color }} />

                      <div className="flex flex-col flex-1 p-5">
                        {/* Header row */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                              style={{ background: color + '14' }}>
                              {o.subject?.icon || '🏆'}
                            </div>
                            <div>
                              <p className="text-xs font-bold" style={{ color }}>{o.subject?.name}</p>
                              <h3 className="text-sm font-black text-slate-900 leading-snug line-clamp-2">{o.title}</h3>
                            </div>
                          </div>
                        </div>

                        <StatusBadge status={o.status} />

                        {/* Details */}
                        <div className="mt-4 space-y-2 text-xs text-slate-500">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              {o.examDate
                                ? new Date(o.examDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                                : 'Oct – Dec 2026'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{o.examDurationMinutes || 60} min &middot; {o.totalQuestions || 50} MCQs &middot; +2 / 0 marking</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            <span>Class {(o.eligibleClasses?.length > 5) ? '6 to 12' : (o.eligibleClasses || [6, 12]).join(', ')}</span>
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                          <div>
                            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Entry Fee</p>
                            <p className="text-xl font-black" style={{ color }}>₹{o.registrationFee || 150}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Link
                              to={`/olympiad/${o.id}`}
                              className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-bold border transition-all hover:shadow-sm hover:-translate-y-0.5"
                              style={{ borderColor: color + '50', color, background: color + '0d' }}
                            >
                              Details
                            </Link>
                            <button
                              onClick={() => goRegister(o.id)}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-xs font-bold transition-all hover:opacity-90 hover:-translate-y-0.5"
                              style={{ background: done ? '#475569' : color }}>
                              {done ? 'View Result' : 'Register'}
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* ── SUBJECT EXPLORER ──────────────────────────────────────────── */}
        <section className="py-20 px-4 sm:px-6 lg:px-8"
          style={{ background: 'linear-gradient(180deg, #fafafa 0%, #fff 100%)' }}>
          <div className="max-w-7xl mx-auto">

            <div className="text-center max-w-2xl mx-auto mb-10">
              <p className="text-indigo-600 text-xs font-bold uppercase tracking-widest mb-1">6 Subjects Available</p>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Choose Your Subject</h2>
              <p className="text-slate-500 text-sm mt-2">Select a subject to explore topics, syllabus scope, and exam format.</p>
            </div>

            {/* Subject tabs */}
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {SUBJECTS.map((s, i) => (
                <button key={s.id} onClick={() => setActiveSub(i)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 border"
                  style={activeSub === i
                    ? { background: s.color, color: '#fff', borderColor: s.color, boxShadow: `0 4px 16px ${s.color}40` }
                    : { background: '#fff', color: '#475569', borderColor: '#e2e8f0' }}>
                  {s.icon} {s.label}
                </button>
              ))}
            </div>

            {/* Active subject card */}
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              <div className="grid grid-cols-1 lg:grid-cols-5">

                {/* Left panel */}
                <div className="lg:col-span-2 p-8 sm:p-10 relative overflow-hidden flex flex-col justify-between"
                  style={{ background: `linear-gradient(135deg, ${sub.color} 0%, ${sub.color}dd 100%)` }}>
                  <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10 pointer-events-none" />
                  <div className="absolute -bottom-12 -left-12 w-60 h-60 rounded-full bg-white/10 pointer-events-none" />

                  <div className="relative z-10">
                    <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold mb-6">
                      National Championship · Class 6–12
                    </span>
                    <div className="text-6xl mb-5">{sub.icon}</div>
                    <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight mb-2">
                      Abhyo {sub.label}<br />Olympiad
                    </h3>
                    <p className="text-white/75 text-sm">Online · 40–50 MCQs · 60 minutes · ₹{rewardsConfig.registrationFee || 150}</p>
                  </div>

                  <div className="relative z-10 mt-8 grid grid-cols-2 gap-3">
                    {['Instant Scorecard', 'All-India Rank', 'QR Certificate', 'Free Mock Tests'].map(f => (
                      <div key={f} className="flex items-center gap-1.5 text-white text-xs font-medium">
                        <CheckCircle className="w-3.5 h-3.5 text-white/70 shrink-0" /> {f}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right panel */}
                <div className="lg:col-span-3 p-8 sm:p-10 flex flex-col gap-6">

                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Core Topics</p>
                    <div className="flex flex-wrap gap-2">
                      {sub.topics.map(t => (
                        <span key={t}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border-l-4 bg-amber-50 border-amber-400">
                    <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider mb-1">Sample Question</p>
                    <p className="text-sm text-slate-800 font-medium italic">"{SAMPLE_Q[sub.id]}"</p>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Marking Scheme</p>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      {[
                        { label: 'Correct', value: '+2', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                        { label: 'Wrong', value: '0', cls: 'bg-slate-100  text-slate-600  border-slate-200' },
                        { label: 'Skipped', value: '0', cls: 'bg-slate-100  text-slate-600  border-slate-200' },
                      ].map(m => (
                        <div key={m.label} className={`rounded-xl border py-3 ${m.cls}`}>
                          <p className="text-xl font-black">{m.value}</p>
                          <p className="text-[10px] font-bold uppercase tracking-wider mt-0.5">{m.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Registrations open now
                    </div>
                    <button onClick={() => goRegister()}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold hover:opacity-90 hover:-translate-y-0.5 transition-all shadow-md"
                      style={{ background: sub.color }}>
                      Register for {sub.label.split(' ')[0]}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── PRIZES ─────────────────────────────────────────────────────── */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-950 text-white">
          <div className="max-w-5xl mx-auto">

            <div className="text-center mb-12">
              <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-1">
                {rewardsConfig.prizePoolBadge || '₹10 Lakh+ Prize Pool'}
              </p>
              <h2 className="text-2xl sm:text-4xl font-black">
                {rewardsConfig.heading || 'Rewards for Top Performers'}
              </h2>
              <p className="text-slate-400 text-sm mt-2 max-w-lg mx-auto">
                {rewardsConfig.subtitle || 'Top rankers receive cash awards, medals and national recognition. Every participant earns a verified certificate.'}
              </p>
            </div>

            <div className={`grid grid-cols-1 ${rewardsConfig.prizes?.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-3'} gap-5 mb-8`}>
              {rewardsConfig.prizes?.map((p, i) => (
                <div key={i}
                  className={`rounded-2xl border p-6 ${p.border || 'border-slate-800'} ${p.featured ? 'bg-slate-900 border-amber-500/60 sm:-translate-y-3 shadow-xl shadow-amber-500/10' : 'bg-slate-900/60'} transition-all`}>
                  <p className="text-xs font-semibold text-slate-400 mb-1">{p.pos}</p>
                  <p className="text-4xl font-black mb-1 truncate" style={{ color: p.color || '#fbbf24' }}>{p.prize}</p>
                  <p className="text-xs text-slate-400">{p.extra}</p>
                </div>
              ))}
            </div>

            {/* Every participant row */}
            <div className="rounded-2xl border border-indigo-500/30 bg-indigo-900/20 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
              <div>
                <p className="text-sm font-bold text-white">
                  {rewardsConfig.participantRewardTitle || 'Every Participant Gets a Certificate'}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {rewardsConfig.participantRewardSubtitle || 'QR-code verified, downloadable from your dashboard. Accepted by schools across India.'}
                </p>
              </div>
              <button onClick={() => goRegister()}
                className="px-5 py-2.5 rounded-xl bg-white text-slate-900 text-xs font-bold hover:bg-slate-100 transition-colors shrink-0">
                Register Now
              </button>
            </div>

            {/* Detailed guidelines banner */}
            <div className="mt-5 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-slate-900 to-indigo-500/10 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300 text-xl shrink-0">
                  🏆
                </div>
                <div>
                  <p className="text-sm sm:text-base font-bold text-white">Awards, Scholarships & Recognitions Policy</p>
                  <p className="text-xs text-slate-300 mt-0.5">National & State ranks, subject toppers, school awards, tie-break rules, and scholarship disbursement.</p>
                </div>
              </div>
              <Link to="/olympiad/awards"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition-all shrink-0 shadow-lg shadow-amber-400/20 hover:scale-[1.02]">
                <span>Read Full Guidelines</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* ── EXAM STRUCTURE ─────────────────────────────────────────────── */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-5xl mx-auto">

            <div className="text-center mb-12">
              <p className="text-indigo-600 text-xs font-bold uppercase tracking-widest mb-1">3-Tier Format</p>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">How the Championship Works</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { num: '01', label: 'School Preliminary', who: 'All registered students', qns: '40 MCQs', time: '60 min', mark: '+2 / 0', color: '#6366f1', reward: 'Instant rank + certificate' },
                { num: '02', label: 'State & Zonal Round', who: 'Top 5% from Level 1', qns: '50 MCQs', time: '75 min', mark: '+3 / −0.5', color: '#8b5cf6', reward: 'State rank + silver medal' },
                { num: '03', label: 'National Grand Final', who: 'Top 1% from Level 2', qns: '60 MCQs', time: '90 min', mark: '+4 / −1', color: '#fbbf24', reward: 'Cash prize + gold trophy' },
              ].map((l, i) => (
                <div key={i} className="rounded-2xl border border-slate-200 bg-slate-50 p-6 hover:border-indigo-200 hover:bg-white hover:shadow-md transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-xs font-black text-white px-2 py-0.5 rounded-md"
                      style={{ background: l.color }}>
                      {l.num}
                    </span>
                    <h3 className="text-sm font-black text-slate-900">{l.label}</h3>
                  </div>

                  <p className="text-xs text-slate-500 mb-4">{l.who}</p>

                  <div className="space-y-1.5 text-xs mb-4">
                    {[['Questions', l.qns], ['Duration', l.time], ['Marking', l.mark]].map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="text-slate-400">{k}</span>
                        <span className="font-bold text-slate-800">{v}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-slate-200">
                    <p className="text-xs font-semibold" style={{ color: l.color }}>{l.reward}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Key facts */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
              {[
                { icon: Laptop, label: '100% Online', desc: 'From home or school lab' },
                { icon: Shield, label: 'Proctored', desc: 'Secure & tamper-proof' },
                { icon: Zap, label: 'Instant Score', desc: 'Right after submission' },
                { icon: Award, label: 'QR Certificate', desc: 'Verified & downloadable' },
              ].map((f, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                    <f.icon className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{f.label}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* ── CLASS SELECTOR ─────────────────────────────────────────────── */}
        <section className="py-20 px-4 sm:px-6 lg:px-8"
          style={{ background: 'linear-gradient(180deg, #fafafa 0%, #fff 100%)' }}>
          <div className="max-w-4xl mx-auto">

            <div className="text-center mb-10">
              <p className="text-indigo-600 text-xs font-bold uppercase tracking-widest mb-1">Your Grade</p>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Select Your Class</h2>
              <p className="text-slate-500 text-sm mt-2">See subjects and syllabus for your grade.</p>
            </div>

            <div className="flex flex-wrap justify-center gap-2.5 mb-8">
              {[6, 7, 8, 9, 10, 11, 12].map(c => (
                <button key={c} onClick={() => setActiveClass(c)}
                  className="w-14 h-14 rounded-xl font-black text-lg transition-all duration-200"
                  style={activeClass === c
                    ? { background: '#6366f1', color: '#fff', boxShadow: '0 6px 20px #6366f140', transform: 'scale(1.08)' }
                    : { background: '#f1f5f9', color: '#475569' }}>
                  {c}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 mb-6">
                <div>
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">{ci.tier}</span>
                  <h3 className="text-lg font-black text-slate-900">Class {activeClass} Olympiad Suite</h3>
                </div>
                <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1.5 rounded-lg whitespace-nowrap">
                  40–50 MCQs · 60 min · +2 / 0
                </span>
              </div>

              <p className="text-slate-600 text-sm mb-6">{ci.desc}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Subjects Available</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ci.subjects.map(s => (
                      <span key={s} className="px-3 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700">{s}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Focus Topics</p>
                  <div className="space-y-1.5">
                    {ci.topics.map(t => (
                      <div key={t} className="flex items-center gap-2 text-xs text-slate-700">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> {t}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-400">Aligned with CBSE, ICSE & State Board curriculum</p>
                <button onClick={() => goRegister()}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors">
                  Register for Class {activeClass}
                </button>
              </div>
            </div>

          </div>
        </section>

        {/* ── HOW IT WORKS ───────────────────────────────────────────────── */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white border-t border-slate-100">
          <div className="max-w-5xl mx-auto">

            <div className="text-center mb-12">
              <p className="text-indigo-600 text-xs font-bold uppercase tracking-widest mb-1">Simple Process</p>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">How to Participate</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { n: '1', icon: Users, title: 'Create Account', desc: 'Sign up with your mobile or email. Takes under a minute.' },
                { n: '2', icon: BookOpen, title: 'Pick Subject & Class', desc: 'Browse upcoming Olympiads, select your grade and subject.' },
                { n: '3', icon: Star, title: 'Prepare', desc: 'Get free mock tests and revision material in your dashboard.' },
                { n: '4', icon: Laptop, title: 'Appear for Exam', desc: 'Log in on exam day. Full-screen online test from home.' },
                { n: '5', icon: Trophy, title: 'Get Your Results', desc: 'Download your rank card and QR-verified certificate.' },
              ].map((s, i) => (
                <div key={i}
                  className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-indigo-200 hover:shadow-md transition-all group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
                      <s.icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-3xl font-black text-slate-100">{s.n}</span>
                  </div>
                  <h3 className="text-sm font-black text-slate-900 mb-1.5 group-hover:text-indigo-600 transition-colors">{s.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── WHY ABHYO OLYMPIAD ─────────────────────────────────────────── */}
        <section className="py-20 px-4 sm:px-6 lg:px-8"
          style={{ background: 'linear-gradient(180deg, #fafafa 0%, #fff 100%)' }}>
          <div className="max-w-6xl mx-auto">

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left image */}
              <div className="lg:col-span-5">
                <div className="relative">
                  <div className="absolute inset-0 bg-indigo-100 rounded-3xl blur-2xl transform scale-105 opacity-50" />
                  <img src="/images/olympiad/study.png"
                    alt="Student preparing for Olympiad"
                    className="relative z-10 w-full rounded-3xl object-cover shadow-lg border border-slate-100"
                    style={{ maxHeight: '380px', objectFit: 'cover', objectPosition: 'top' }} />
                </div>
              </div>

              {/* Right text */}
              <div className="lg:col-span-7">
                <p className="text-indigo-600 text-xs font-bold uppercase tracking-widest mb-1">Why Students Choose Us</p>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-3">
                  More than just an exam.<br />A launchpad.
                </h2>
                <p className="text-slate-500 text-sm leading-relaxed mb-8 border-l-2 border-indigo-200 pl-4">
                  Abhyo Olympiad helps students identify their academic strengths, earn verified recognition, and build a competitive profile that stands out in school admissions and scholarship applications.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { icon: TrendingUp, title: 'All-India & State Rank', desc: 'Compare with 50,000+ students nationally and by state.' },
                    { icon: Award, title: 'QR-Verified Certificate', desc: 'Instantly verifiable by any school or institution.' },
                    { icon: Medal, title: 'Cash Prizes & Gold Medals', desc: 'Win up to ₹25,000 and receive physical medals and trophies.' },
                    { icon: BarChart2, title: 'Performance Analytics', desc: 'Topic-wise accuracy and time analytics to guide preparation.' },
                    { icon: Shield, title: 'Fair, Proctored Exam', desc: 'Randomised questions, secure browser, auto-submit timer.' },
                    { icon: BookOpen, title: 'Free Study Resources', desc: 'Practice tests and notes included with registration.' },
                  ].map((b, i) => (
                    <div key={i}
                      className="flex gap-3 p-3.5 rounded-xl border border-slate-200 bg-white hover:border-indigo-200 hover:shadow-sm transition-all group">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0 group-hover:bg-indigo-100 transition-colors">
                        <b.icon className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900 group-hover:text-indigo-700 transition-colors">{b.title}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{b.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ ────────────────────────────────────────────────────────── */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white border-t border-slate-100">
          <div className="max-w-3xl mx-auto">

            <div className="text-center mb-10">
              <p className="text-indigo-600 text-xs font-bold uppercase tracking-widest mb-1">FAQ</p>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Common Questions</h2>
            </div>

            <div className="space-y-2">
              {FAQS.map((faq, i) => {
                const open = openFaq === i;
                return (
                  <div key={i}
                    className={`rounded-xl border overflow-hidden transition-all ${open ? 'border-indigo-300 shadow-sm' : 'border-slate-200'}`}>
                    <button onClick={() => setOpenFaq(open ? null : i)}
                      className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors">
                      <span className="text-sm font-semibold text-slate-900 pr-4">{faq.q}</span>
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${open ? 'rotate-180 text-indigo-600' : ''}`} />
                    </button>
                    {open && (
                      <div className="px-5 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4 bg-slate-50/50">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── DOWNLOAD FORM STRIP ─────────────────────────────────────────── */}
        <div className="bg-indigo-50 border-y border-indigo-100 px-4 sm:px-6 lg:px-8 py-4">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center text-lg flex-shrink-0">📋</span>
              <div>
                <p className="text-sm font-bold text-slate-800">Student Registration Form</p>
                <p className="text-xs text-slate-500">Download the offline registration form (PDF)</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link to="/olympiad/awards"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold transition-all">
                🏆 Awards & Recognitions
              </Link>
              <a href="/Abhyo_Olympiad_Student_Registration_Form.pdf"
                download="Abhyo_Olympiad_Student_Registration_Form.pdf"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all">
                ⬇️ Download
              </a>
              <a href="/Abhyo_Olympiad_Student_Registration_Form.pdf"
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-indigo-200 bg-white text-indigo-600 hover:bg-indigo-50 text-xs font-semibold transition-all">
                👁️ Preview
              </a>
            </div>
          </div>
        </div>


        {/* ── FINAL CTA ──────────────────────────────────────────────────── */}
        <section className="py-20 px-4 sm:px-6 lg:px-8"
          style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #6d28d9 50%, #4f46e5 100%)' }}>

          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left */}
            <div className="lg:col-span-7 text-center lg:text-left">
              <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-3">Registration Open</p>
              <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-4">
                Ready to prove yourself on the national stage?
              </h2>
              <p className="text-indigo-200 text-sm sm:text-base mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                Join 50,000+ students. Register today for ₹150, access free practice material, and earn a certificate recognised across India.
              </p>

              <div className="flex flex-wrap gap-3 justify-center lg:justify-start mb-6">
                <button onClick={() => goRegister()}
                  className="group flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-indigo-700 font-black text-base shadow-xl hover:-translate-y-0.5 hover:shadow-white/20 transition-all">
                  Register for Olympiad
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              <div className="flex flex-wrap gap-5 justify-center lg:justify-start text-xs text-indigo-200 font-medium">
                {['Free mock tests included', 'Exam from home', 'Results in 7 days', 'QR certificate for all'].map(t => (
                  <span key={t} className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Right illustration */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-sm">
                <div className="absolute inset-0 bg-white/10 rounded-3xl blur-2xl scale-105" />
                <img src="/images/olympiad/award.png"
                  alt="Olympiad award ceremony"
                  className="relative z-10 w-full rounded-3xl object-cover border border-white/20 shadow-2xl"
                  style={{ maxHeight: '360px', objectFit: 'cover', objectPosition: 'center' }} />
              </div>
            </div>
          </div>
        </section>

      </div>
    </>
  );
}
