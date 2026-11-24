import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { EXAMS } from '../data/examsData';
import {
  ArrowLeft, ExternalLink, Calendar, Users, BookOpen,
  CheckCircle, Clock, Shield, ChevronRight, Bell, Award,
  Download, FileText
} from 'lucide-react';

const STATUS_CONFIG = {
  open:    { label: 'Apply Open',   color: '#10b981', bg: '#d1fae5' },
  closing: { label: 'Closing Soon', color: '#f59e0b', bg: '#fef3c7' },
  upcoming:{ label: 'Coming Soon',  color: '#6366f1', bg: '#eef2ff' },
};

const CAT_COLORS = {
  SSC:     { from: '#6366f1', to: '#8b5cf6' },
  Railway: { from: '#06b6d4', to: '#0ea5e9' },
  Banking: { from: '#10b981', to: '#059669' },
  Defence: { from: '#f59e0b', to: '#d97706' },
  State:   { from: '#8b5cf6', to: '#7c3aed' },
  Teaching:{ from: '#ec4899', to: '#db2777' },
  Police:  { from: '#64748b', to: '#475569' },
};

function parseCustomDate(dateStr) {
  if (!dateStr) return null;
  const str = String(dateStr).trim();
  
  // Try parsing DD/MM/YYYY or DD-MM-YYYY format
  const dmyRegex = /^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})$/;
  const match = str.match(dmyRegex);
  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);
    const d = new Date(year, month - 1, day);
    if (!isNaN(d.getTime())) return d;
  }
  
  // Try standard date parsing
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) return parsed;
  
  return null;
}

function fmt(d) {
  const parsed = parseCustomDate(d);
  if (!parsed) return (typeof d === 'string' && d.trim()) ? d : '—';
  return parsed.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
}

function daysLeft(dateStr) {
  const d = parseCustomDate(dateStr);
  if (!d) return 0;
  const diff = d - new Date();
  return Math.max(0, Math.ceil(diff / 86400000));
}

export default function ExamDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [related, setRelated] = useState([]);

  useEffect(() => {
    setLoading(true);
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/exam-series/${slug}`)
      .then(r => r.json())
      .then(res => {
        const s = res.data;
        if (!s) {
          const staticExam = EXAMS.find(e => e.slug === slug);
          setExam(staticExam || null);
          return;
        }

        const ed = s.examDetails || {};
        
        const levelObj = s.eligibility?.find(e => 
          e.label?.toLowerCase() === 'education' || 
          e.label?.toLowerCase() === 'level'
        );
        const levelVal = levelObj ? levelObj.value : 'Graduate';

        const endObj = s.importantDates?.find(d => 
          d.event?.toLowerCase().includes('last') || 
          d.event?.toLowerCase().includes('end') || 
          d.event?.toLowerCase().includes('close') || 
          d.event?.toLowerCase().includes('deadline')
        );
        const lastDateVal = ed.lastDate || (endObj ? endObj.date : '');

        let status = 'upcoming';
        if (s.isActive) {
          const lastDate = parseCustomDate(lastDateVal);
          const now = new Date();
          if (lastDate) {
            const diffTime = lastDate - now;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays <= 0) {
              status = 'upcoming';
            } else if (diffDays <= 7) {
              status = 'closing';
            } else {
              status = 'open';
            }
          } else {
            status = 'open';
          }
        }

        const selProc = Array.isArray(s.selectionProcess)
          ? s.selectionProcess
              .map(sp => typeof sp === 'string' ? sp : (sp.stage || ''))
              .filter(val => typeof val === 'string' && val.trim() !== '')
          : [];
        const syl = Array.isArray(s.syllabus)
          ? s.syllabus
              .map(sp => typeof sp === 'string' ? sp : (sp.subject || ''))
              .filter(val => typeof val === 'string' && val.trim() !== '')
          : [];
        const eligDesc = Array.isArray(s.eligibility)
          ? s.eligibility
              .filter(e => e.label?.trim() && e.value?.trim())
              .map(e => `${e.label}: ${e.value}`)
              .join('; ')
          : '';

        const BASE_API = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
        const notifUrl = ed.notificationFileUrl ? `${BASE_API}${ed.notificationFileUrl}` : '';
        const thumbUrl = s.thumbnail || s.thumbnailImage ? `${BASE_API}${s.thumbnail || s.thumbnailImage}` : '';

        const mapped = {
          id: s.id,
          slug: s.slug,
          name: s.examName || s.title,
          category: s.category || 'Custom',
          org: ed.organizer || 'Conducting Body',
          notifyDate: ed.notificationDate || '',
          startDate: ed.applicationDate || '',
          lastDate: lastDateVal,
          examDate: ed.examDate || '',
          vacancies: ed.vacancy ? parseInt(String(ed.vacancy).replace(/,/g, '')) || ed.vacancy : 'TBA',
          level: levelVal,
          status: status,
          official: ed.website || 'https://...',
          icon: s.category === 'Defence' ? '🛡️' : s.category === 'UPSC' ? '🏛️' : s.category === 'SSC' ? '📋' : '📚',
          desc: s.description || s.tagline || '',
          thumbnail: thumbUrl,
          notificationUrl: notifUrl,
          eligibility: eligDesc || 'Refer to notification for eligibility requirements.',
          ageLimit: Array.isArray(s.eligibility) ? s.eligibility.find(e => e.label?.toLowerCase() === 'age')?.value || '18-27 years' : '18-27 years',
          examMode: s.examPattern?.[0]?.paper ? 'Online/Offline' : 'Online (CBT)',
          applicationFee: s.price > 0 ? `₹${s.price}` : 'Free',
          importantDates: {
            notify: ed.notificationDate || '',
            applyStart: ed.applicationDate || '',
            applyEnd: lastDateVal,
            examDate: ed.examDate || '',
          },
          selectionProcess: selProc.length ? selProc : ['Written Examination', 'Document Verification'],
          syllabus: syl.length ? syl : ['General Studies', 'Aptitude & Reasoning'],
        };
        setExam(mapped);
      })
      .catch(() => {
        const staticExam = EXAMS.find(e => e.slug === slug);
        setExam(staticExam || null);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!exam) return;
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/exam-series`)
      .then(r => r.json())
      .then(res => {
        const list = res.data || [];
        const relatedMapped = list
          .filter(s => s.category === exam.category && s.slug !== exam.slug)
          .slice(0, 3)
          .map(s => ({
            id: s.id,
            slug: s.slug,
            name: s.examName || s.title,
            org: s.examDetails?.organizer || 'Conducting Body',
            icon: s.category === 'Defence' ? '🛡️' : s.category === 'UPSC' ? '🏛️' : s.category === 'SSC' ? '📋' : '📚',
          }));
        setRelated(relatedMapped.length ? relatedMapped : EXAMS.filter(e => e.category === exam.category && e.slug !== exam.slug).slice(0, 3));
      })
      .catch(() => {
        setRelated(EXAMS.filter(e => e.category === exam.category && e.slug !== exam.slug).slice(0, 3));
      });
  }, [exam]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center flex-col gap-4">
        <div className="w-10 h-10 rounded-full border-3 border-indigo-100 border-t-indigo-600 animate-spin" style={{ border: '3px solid #312e81', borderTopColor: '#6366f1' }} />
        <p className="text-sm text-indigo-200 font-medium">Loading exam details…</p>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        <p className="text-6xl">🔍</p>
        <h1 className="text-2xl font-bold text-slate-700">Exam not found</h1>
        <Link to="/upcoming-exams" className="text-indigo-600 font-semibold hover:underline">← Back to All Exams</Link>
      </div>
    );
  }

  const st = STATUS_CONFIG[exam.status] || STATUS_CONFIG.upcoming;
  const grad = CAT_COLORS[exam.category] || { from: '#6366f1', to: '#8b5cf6' };
  const dl = daysLeft(exam.lastDate);

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", minHeight: '100vh', background: '#f8faff' }}>

      {/* ── Hero ── */}
      <div className="relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, #0f0c29 0%, #302b63 60%, #24243e 100%)` }}>

        {/* Decorative blobs */}
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full opacity-20 blur-3xl"
          style={{ background: `radial-gradient(circle, ${grad.from}, transparent 70%)` }} />
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-15 blur-3xl"
          style={{ background: 'radial-gradient(circle, #06b6d4, transparent 70%)' }} />

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.1) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 pb-10">

          {/* Breadcrumb */}
          <div className="flex flex-wrap items-center gap-1.5 text-indigo-300/80 text-xs font-light mb-6">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight size={11} className="opacity-70" />
            <Link to="/upcoming-exams" className="hover:text-white transition-colors">Upcoming Exams</Link>
            <ChevronRight size={11} className="opacity-70" />
            <span className="text-white/95 truncate max-w-[180px] sm:max-w-none">{exam.name}</span>
          </div>

          {/* Hero body */}
          <div className="flex flex-col md:flex-row items-start gap-8">

            {/* Text */}
            <div className="flex-1">
              {/* Status + Category badges */}
              <div className="flex flex-wrap gap-2.5 mb-4">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-normal tracking-wide"
                  style={{
                    background: st.bg,
                    color: st.color,
                    border: `1px solid ${st.color}20`
                  }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.color }} />
                  {st.label}
                </span>
                <span className="px-3 py-1 rounded-full text-[10px] font-light tracking-wide text-indigo-200"
                  style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(165,180,252,0.2)' }}>
                  {exam.category}
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-light text-white mb-2 leading-tight tracking-wide">{exam.name}</h1>
              <p className="text-indigo-200/80 text-sm font-light tracking-wide mb-6">{exam.org}</p>

              {/* Quick stats row */}
              <div className="flex flex-wrap gap-3">
                {exam.vacancies && (
                  <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-indigo-200 text-xs font-light backdrop-blur-sm shadow-sm">
                    <Users size={12} className="stroke-[1.5]" />
                    <span className="font-normal text-white">{exam.vacancies.toLocaleString()}</span> Vacancies
                  </div>
                )}
                <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-indigo-200 text-xs font-light backdrop-blur-sm shadow-sm">
                  <BookOpen size={12} className="stroke-[1.5]" />
                  <span className="font-normal text-white">{exam.level}</span>
                </div>
                <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-indigo-200 text-xs font-light backdrop-blur-sm shadow-sm">
                  <Clock size={12} className="stroke-[1.5]" />
                  {dl === 0
                    ? <span className="text-red-300 font-light">Deadline passed</span>
                    : <span><span className="text-yellow-200 font-normal">{dl} days</span> left to apply</span>}
                </div>
              </div>
            </div>

            {/* Apply CTA */}
            <div className="flex flex-col gap-2.5 w-full md:w-auto flex-shrink-0">
              <a href={exam.official} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-light text-sm text-white transition-all hover:scale-105 active:scale-95 border border-white/10 hover:shadow-lg"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 16px rgba(99,102,241,0.3)' }}>
                <ExternalLink size={14} className="stroke-[1.5]" /> Apply on Official Site
              </a>
              <Link to="/exam-series"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-light text-sm text-indigo-200 border border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/15 hover:text-white transition-all active:scale-95">
                <BookOpen size={14} className="stroke-[1.5]" /> Practice Mock Tests
              </Link>
            </div>
          </div>

          {/* Bottom stat strip */}
          <div className="mt-10 p-5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md grid grid-cols-2 sm:grid-cols-4 gap-6 shadow-sm">
            {[
              { label: 'Notification', val: exam.importantDates.notify },
              { label: 'Apply Start',  val: exam.importantDates.applyStart },
              { label: 'Last Date',    val: exam.importantDates.applyEnd },
              { label: 'Exam Date',    val: exam.importantDates.examDate },
            ].map(s => (
              <div key={s.label}>
                <p className="text-[10px] font-light uppercase tracking-widest text-indigo-300 mb-1">{s.label}</p>
                <p className="text-sm font-light text-white/95">{s.val ? fmt(s.val) : '—'}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">

          {/* Thumbnail Banner / Fallback Graphic (800x450px Recommended 16:9 Aspect Ratio) */}
          <div className="rounded-3xl overflow-hidden border border-slate-100 shadow-sm relative w-full aspect-[16/9] flex flex-col justify-between p-6 sm:p-8"
            style={{
              background: exam.thumbnail 
                ? 'none' 
                : `linear-gradient(135deg, ${grad.from}dd 0%, ${grad.to}ee 100%)`
            }}>
            {exam.thumbnail ? (
              <img src={exam.thumbnail} alt={exam.name} className="w-full h-full object-cover" />
            ) : (
              <>
                {/* Visual accents */}
                <div className="absolute inset-0 opacity-10" 
                  style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-xl" />
                
                {/* Category & Badge */}
                <div className="relative flex justify-between items-center">
                  <span className="text-[10px] uppercase font-semibold tracking-widest text-white/80 bg-white/15 px-3 py-1 rounded-full backdrop-blur-sm">
                    {exam.category} EXAMINATION
                  </span>
                </div>
                
                {/* Title and Conducting Body */}
                <div className="relative space-y-1.5">
                  <h2 className="text-xl sm:text-2xl font-light text-white tracking-wide leading-tight">{exam.name}</h2>
                  <p className="text-xs font-light text-white/70 tracking-wide">{exam.org}</p>
                </div>
              </>
            )}
          </div>

          {/* About */}
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-base font-black text-slate-800 mb-3 flex items-center gap-2">
              <Bell size={16} className="text-indigo-500" /> About This Notification
            </h2>
            <div 
              className="text-slate-600 text-sm leading-relaxed space-y-4"
              style={{
                fontSize: '13px',
                color: '#475569',
              }}
            >
              <style>{`
                .rich-desc h1 {
                  display: block;
                  font-size: 14px;
                  font-weight: 500;
                  color: #334155;
                  margin-top: 0;
                  margin-bottom: 12px;
                  line-height: 1.6;
                }
                .rich-desc h2, .rich-desc h3 {
                  display: block;
                  font-size: 14px;
                  font-weight: 700;
                  color: #1e293b;
                  margin-top: 20px;
                  margin-bottom: 10px;
                  line-height: 1.4;
                }
                .rich-desc p {
                  display: block;
                  margin-top: 0;
                  margin-bottom: 12px;
                  line-height: 1.6;
                  color: #475569;
                  font-size: 13px;
                }
                .rich-desc ul, .rich-desc ol {
                  display: block;
                  list-style-type: none;
                  padding-left: 0;
                  margin-top: 6px;
                  margin-bottom: 12px;
                }
                .rich-desc li {
                  display: block;
                  position: relative;
                  padding-left: 20px;
                  margin-bottom: 6px;
                  line-height: 1.5;
                  color: #475569;
                  font-size: 13px;
                }
                .rich-desc li::before {
                  content: "•";
                  position: absolute;
                  left: 6px;
                  color: #6366f1;
                  font-weight: bold;
                }
                .rich-desc strong {
                  font-weight: 600;
                  color: #0f172a;
                }
                .rich-desc hr {
                  display: block;
                  border: 0;
                  height: 1px;
                  background: #e2e8f0;
                  margin: 24px 0;
                }
                .rich-desc a {
                  color: #4f46e5;
                  text-decoration: underline;
                  font-weight: 500;
                }
              `}</style>
              <div 
                className="rich-desc"
                dangerouslySetInnerHTML={{ __html: exam.desc }} 
              />
            </div>
          </section>

          {/* Official Notification Card */}
          {exam.notificationUrl && (
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ background: 'linear-gradient(135deg, rgba(248, 250, 255, 0.4), rgba(238, 242, 255, 0.2))' }}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0 border border-indigo-100">
                  <FileText size={22} className="stroke-[1.5]" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800">Official Exam Notification Released</h3>
                  <p className="text-slate-500 text-xs mt-1 leading-normal">Get the official PDF document directly from the conducting body for full schedule, criteria, and guidelines.</p>
                </div>
              </div>
              <a href={exam.notificationUrl} target="_blank" rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl font-bold text-xs text-white transition-all hover:brightness-105 active:scale-95 whitespace-nowrap"
                style={{ background: 'linear-gradient(135deg, #818cf8, #6366f1)', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)' }}>
                <Download size={13} className="stroke-[1.5]" /> Download PDF
              </a>
            </section>
          )}

          {/* Important Dates */}
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-base font-black text-slate-800 mb-4 flex items-center gap-2">
              <Calendar size={16} className="text-indigo-500" /> Important Dates
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Notification Date', val: exam.importantDates.notify },
                { label: 'Application Start', val: exam.importantDates.applyStart },
                { label: 'Last Date to Apply', val: exam.importantDates.applyEnd, highlight: true },
                { label: 'Exam Date',          val: exam.importantDates.examDate },
              ].map(r => (
                <div key={r.label} className={`p-3 rounded-xl border ${r.highlight ? 'border-orange-200 bg-orange-50' : 'border-slate-100 bg-slate-50'}`}>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{r.label}</p>
                  <p className={`text-sm font-bold ${r.highlight ? 'text-orange-600' : 'text-slate-700'}`}>{fmt(r.val)}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Selection Process */}
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-base font-black text-slate-800 mb-4 flex items-center gap-2">
              <Shield size={16} className="text-indigo-500" /> Selection Process
            </h2>
            <div className="flex flex-wrap gap-3">
              {exam.selectionProcess.map((step, i) => (
                <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 border border-indigo-100">
                  <span className="w-5 h-5 rounded-full bg-indigo-500 text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">{i + 1}</span>
                  <span className="text-sm font-semibold text-indigo-700">{step}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Syllabus */}
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-base font-black text-slate-800 mb-4 flex items-center gap-2">
              <BookOpen size={16} className="text-indigo-500" /> Key Syllabus Topics
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {exam.syllabus.map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle size={14} className="text-green-500 flex-shrink-0" /> {s}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column */}
        <div className="space-y-5">

          {/* Eligibility Card */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h3 className="text-sm font-black text-slate-800 mb-3 flex items-center gap-2">
              <Award size={14} className="text-indigo-500" /> Eligibility
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">{exam.eligibility}</p>
            <div className="mt-3 pt-3 border-t border-slate-100">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Age Limit</p>
              <p className="text-sm font-semibold text-slate-700">{exam.ageLimit}</p>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Exam Mode</p>
              <p className="text-sm font-semibold text-slate-700">{exam.examMode}</p>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Application Fee</p>
              <p className="text-sm font-semibold text-slate-700">{exam.applicationFee}</p>
            </div>
          </div>

          {/* Apply Now */}
          <div className="rounded-2xl p-5 text-center"
            style={{ background: `linear-gradient(135deg, ${grad.from}, ${grad.to})` }}>
            <p className="text-white font-black text-base mb-1">{exam.vacancies ? `${exam.vacancies.toLocaleString()} Posts` : 'Eligibility Test'}</p>
            <p className="text-white/80 text-xs mb-4">{exam.org}</p>
            <a href={exam.official} target="_blank" rel="noopener noreferrer"
              className="block w-full py-2.5 rounded-xl bg-white font-black text-sm transition-all hover:scale-105"
              style={{ color: grad.from }}>
              Apply Now →
            </a>
          </div>

          {/* Back button */}
          <button onClick={() => navigate(-1)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-all">
            <ArrowLeft size={14} /> Back to Exams
          </button>

          {/* Related Exams */}
          {related.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <h3 className="text-sm font-black text-slate-800 mb-3">More {exam.category} Exams</h3>
              <div className="space-y-2">
                {related.map(r => (
                  <Link key={r.id} to={`/upcoming-exams/${r.slug}`}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-indigo-50 transition-all group">
                    <span className="text-xl">{r.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 truncate">{r.name}</p>
                      <p className="text-[11px] text-slate-400">{r.org}</p>
                    </div>
                    <ChevronRight size={14} className="text-slate-300 group-hover:text-indigo-400" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
