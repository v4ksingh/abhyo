import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell, Calendar, Clock, ChevronRight, ExternalLink,
  BookOpen, Award, Shield, Zap, Globe, Users, TrendingUp, Filter
} from 'lucide-react';
import { EXAMS } from '../data/examsData';
import usePageMeta from '../hooks/usePageMeta';



const FALLBACK_CATEGORIES = ['All', 'SSC', 'Railway', 'Banking', 'Defence', 'State', 'Teaching', 'Police'];

const STATUS_CONFIG = {
  open: { label: 'Apply Open', color: '#10b981', bg: '#d1fae5', dot: '#10b981' },
  closing: { label: 'Closing Soon', color: '#f59e0b', bg: '#fef3c7', dot: '#f59e0b' },
  upcoming: { label: 'Coming Soon', color: '#6366f1', bg: '#eef2ff', dot: '#6366f1' },
};

const CAT_ICONS = {
  SSC: BookOpen, Railway: Zap, Banking: Award, Defence: Shield,
  State: Globe, Teaching: Users, Police: TrendingUp, All: Filter,
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

function daysLeft(dateStr) {
  const d = parseCustomDate(dateStr);
  if (!d) return 0;
  const diff = d - new Date();
  return Math.max(0, Math.ceil(diff / 86400000));
}

function fmt(dateStr) {
  const d = parseCustomDate(dateStr);
  if (!d) return dateStr || '—';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function UpcomingExams() {
  usePageMeta({
    title: 'Upcoming Government Exams 2026 – SSC, Railway, Banking, UPSC',
    description: 'Latest government exam notifications for SSC CGL, UPSC, IBPS, Railway RRB, NDA, BPSC, JSSC and more. Application dates, vacancies, and exam schedule in one place.',
    canonical: '/upcoming-exams',
  });

  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [activeStatus, setActiveStatus] = useState('all');
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);
  const [catsLoading, setCatsLoading] = useState(true);
  const [exams, setExams] = useState([]);
  const [examsLoading, setExamsLoading] = useState(true);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/categories/public`)
      .then(r => r.json())
      .then(res => {
        const list = Array.isArray(res) ? res : (res.data || []);
        const names = list
          .filter(c => !c.parentId)
          .map(c => c.name);
        setCategories(names.length ? ['All', ...names] : FALLBACK_CATEGORIES);
      })
      .catch(() => setCategories(FALLBACK_CATEGORIES))
      .finally(() => setCatsLoading(false));
  }, []);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/exam-series`)
      .then(r => r.json())
      .then(res => {
        const list = res.data || [];
        const mapped = list.map(s => {
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

          return {
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
            desc: s.tagline || s.description || '',
          };
        });
        setExams(mapped.length ? mapped : EXAMS);
      })
      .catch(() => setExams(EXAMS))
      .finally(() => setExamsLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return exams.filter(e => {
      const matchCat = activeCategory === 'All' || e.category === activeCategory;
      const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.org.toLowerCase().includes(search.toLowerCase());
      const matchStatus = activeStatus === 'all' || e.status === activeStatus;
      return matchCat && matchSearch && matchStatus;
    });
  }, [activeCategory, search, activeStatus, exams]);

  const counts = useMemo(() => ({
    open: exams.filter(e => e.status === 'open').length,
    closing: exams.filter(e => e.status === 'closing').length,
    upcoming: exams.filter(e => e.status === 'upcoming').length,
  }), [exams]);

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", minHeight: '100vh', background: 'linear-gradient(160deg, #f8faff 0%, #eef2ff 50%, #f0fdf4 100%)' }}>

      {/* ── Hero Banner ── */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 45%, #24243e 100%)' }}>

        {/* Decorative blobs */}
        <div className="absolute -top-16 -left-16 w-72 h-72 rounded-full opacity-20 blur-3xl" style={{ background: 'radial-gradient(circle, #818cf8, transparent 70%)' }} />
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-15 blur-3xl" style={{ background: 'radial-gradient(circle, #06b6d4, transparent 70%)' }} />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        <div className="relative max-w-7xl mx-auto px-4 pt-20 pb-8 sm:pt-24 sm:pb-12 flex flex-col lg:flex-row items-center gap-8">

          {/* ── LEFT: Text Content ── */}
          <div className="lg:w-1/2 text-center lg:text-left space-y-3">

            {/* Badge */}
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold"
              style={{ background: 'rgba(99,102,241,0.25)', border: '1px solid rgba(165,180,252,0.5)', color: '#c7d2fe', backdropFilter: 'blur(8px)' }}>
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Live Exam Notifications 2025
            </span>

            {/* Headline */}
            <div>
              <h1 className="text-2xl sm:text-4xl font-bold leading-tight tracking-tight" style={{ color: '#fff' }}>
                PREPARE TODAY
              </h1>
              <h1 className="text-2xl sm:text-4xl font-bold leading-tight tracking-tight" style={{ background: 'linear-gradient(90deg, #a5f3fc 0%, #818cf8 50%, #f472b6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                ACHIEVE TOMORROW
              </h1>
            </div>

            {/* Sub-heading */}
            <p className="text-indigo-300 text-xs sm:text-sm leading-relaxed max-w-md">
              SSC · Railway · Banking · Defence · State PSC — all latest notifications in one place. Never miss an exam! 🎯
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-3 justify-center lg:justify-start pt-2">
              <Link to="/government-jobs"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-bold text-xs text-white transition-all duration-200 hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 16px rgba(16,185,129,0.35)' }}>
                🏛️ Latest Govt Recruitments
              </Link>
              <Link to="/register"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-semibold text-xs text-white transition-all duration-200 hover:scale-105 hover:brightness-110"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 16px rgba(99,102,241,0.45)' }}>
                🚀 Start Free Preparation
              </Link>
              <Link to="/exam-series"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-semibold text-xs transition-all duration-200 hover:scale-105"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(165,180,252,0.4)', color: '#e0e7ff', backdropFilter: 'blur(8px)' }}>
                📚 Explore Mock Tests
              </Link>
            </div>

            {/* Stat Pills */}
            <div className="flex flex-wrap gap-3 justify-center lg:justify-start pt-1">
              {[
                { label: 'Total Exams', val: exams.length, color: '#a5f3fc', bg: 'rgba(165,243,252,0.1)' },
                { label: 'Apply Open', val: counts.open, color: '#6ee7b7', bg: 'rgba(110,231,183,0.1)' },
                { label: 'Closing Soon', val: counts.closing, color: '#fcd34d', bg: 'rgba(252,211,77,0.1)' },
                { label: 'Coming Soon', val: counts.upcoming, color: '#c4b5fd', bg: 'rgba(196,181,253,0.1)' },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                  style={{ background: s.bg, border: `1px solid ${s.color}30` }}>
                  <span className="text-base font-bold" style={{ color: s.color }}>{s.val}</span>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-indigo-300">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT: Illustration ── */}
          <div className="lg:w-1/2 flex justify-center w-full">
            <div className="relative w-full max-w-xs">
              <div className="absolute inset-0 rounded-3xl blur-2xl opacity-40" style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)' }} />
              <img
                src="/abhyo-hero.png"
                onError={e => { e.target.style.display = 'none'; }}
                alt="Abhyo AI Exam Preparation"
                className="relative w-full rounded-3xl shadow-2xl border border-white/10"
                style={{ background: 'rgba(255,255,255,0.03)' }}
              />
            </div>
          </div>

        </div>
      </div>

      {/* ── Filters ── */}
      <div className="sticky top-0 z-30 shadow-sm" style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(16px)', borderBottom: '1px solid #e8edf8' }}>
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {/* Category tabs */}
            {catsLoading ? (
              <div className="flex gap-2">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="h-8 w-20 rounded-xl bg-slate-200 animate-pulse" />
                ))}
              </div>
            ) : categories.map(cat => {
              const Icon = CAT_ICONS[cat] || Filter;
              const active = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-bold whitespace-nowrap flex-shrink-0 transition-all"
                  style={{
                    background: active ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : '#f1f5f9',
                    color: active ? '#fff' : '#64748b',
                    boxShadow: active ? '0 4px 12px rgba(99,102,241,0.35)' : 'none',
                  }}
                >
                  <Icon size={11} /> {cat}
                </button>
              );
            })}

            <div className="h-6 w-px bg-slate-200 mx-1 flex-shrink-0" />

            {/* Status filters */}
            {[
              { val: 'all', label: 'All Status' },
              { val: 'open', label: '🟢 Open' },
              { val: 'closing', label: '🟡 Closing' },
              { val: 'upcoming', label: '🔵 Upcoming' },
            ].map(s => (
              <button
                key={s.val}
                onClick={() => setActiveStatus(s.val)}
                className="px-3 py-2 rounded-xl text-[11px] font-bold whitespace-nowrap flex-shrink-0 transition-all"
                style={{
                  background: activeStatus === s.val ? '#1e293b' : '#f1f5f9',
                  color: activeStatus === s.val ? '#fff' : '#64748b',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Exam Cards Grid ── */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-black text-slate-800">
            {filtered.length} Exam{filtered.length !== 1 ? 's' : ''} Found
            {activeCategory !== 'All' && <span className="ml-2 text-indigo-500">in {activeCategory}</span>}
          </h2>
          <span className="text-[12px] text-slate-400 font-medium">Updated: May 2025</span>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🔍</p>
            <p className="text-slate-500 font-semibold">No exams found. Try different filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(exam => {
              const st = STATUS_CONFIG[exam.status];
              const lastDays = daysLeft(exam.lastDate);
              return (
                <Link
                  key={exam.id}
                  to={`/upcoming-exams/${exam.slug}`}
                  className="block rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1.5 cursor-pointer border"
                  style={{
                    background: 'rgba(255, 255, 255, 0.75)',
                    backdropFilter: 'blur(20px)',
                    borderColor: 'rgba(226, 232, 240, 0.8)',
                    boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)',
                  }}
                >
                  {/* Card Header */}
                  <div className="px-6 pt-6 pb-4 relative" style={{ background: 'linear-gradient(135deg, rgba(248, 250, 255, 0.6), rgba(238, 242, 255, 0.4))' }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-semibold text-slate-800 text-[15px] leading-tight tracking-tight">{exam.name}</p>
                          <p className="text-slate-400 text-[11px] font-light mt-1">{exam.org}</p>
                        </div>
                      </div>
                      {/* Status badge */}
                      <span className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-normal tracking-wide"
                        style={{
                          background: st.bg,
                          color: st.color,
                          border: `1px solid ${st.dot}20`
                        }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.dot }} />
                        {st.label}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="px-6 py-5 space-y-4">
                    {/* Key info grid */}
                    <div className="grid grid-cols-2 gap-2.5">
                      {[
                        { label: 'Category', val: exam.category },
                        { label: 'Level', val: exam.level },
                        { label: 'Vacancies', val: exam.vacancies ? exam.vacancies.toLocaleString() : 'TBA' },
                        { label: 'Exam Date', val: fmt(exam.examDate) },
                      ].map(d => (
                        <div key={d.label} className="rounded-2xl px-3.5 py-2.5 border" style={{ background: 'rgba(248, 250, 255, 0.35)', borderColor: 'rgba(226, 232, 240, 0.5)' }}>
                          <p className="text-[9px] text-slate-400 font-normal uppercase tracking-wider">{d.label}</p>
                          <p className="text-[12px] font-medium text-slate-700 mt-0.5">{d.val}</p>
                        </div>
                      ))}
                    </div>

                    {/* Deadline countdown */}
                    <div className="rounded-2xl px-4 py-3 flex items-center justify-between border"
                      style={{
                        background: lastDays <= 7 ? 'rgba(254, 243, 199, 0.4)' : 'rgba(240, 253, 244, 0.4)',
                        borderColor: lastDays <= 7 ? 'rgba(253, 230, 138, 0.4)' : 'rgba(187, 247, 208, 0.4)',
                      }}>
                      <div className="flex items-center gap-2.5">
                        <Clock size={12} style={{ color: lastDays <= 7 ? '#d97706' : '#16a34a' }} className="stroke-[1.5]" />
                        <div>
                          <p className="text-[9px] font-normal uppercase tracking-wider" style={{ color: lastDays <= 7 ? '#92400e' : '#14532d' }}>Last Date to Apply</p>
                          <p className="text-[12px] font-medium mt-0.5" style={{ color: lastDays <= 7 ? '#b45309' : '#15803d' }}>{fmt(exam.lastDate)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[18px] font-light leading-none" style={{ color: lastDays <= 7 ? '#dc2626' : '#16a34a' }}>{lastDays}</p>
                        <p className="text-[8px] font-normal uppercase mt-0.5" style={{ color: lastDays <= 7 ? '#dc2626' : '#16a34a' }}>days left</p>
                      </div>
                    </div>

                    {/* Notification date */}
                    <div className="flex items-center gap-2 text-[10.5px] text-slate-400 font-light pt-0.5">
                      <Calendar size={11} className="stroke-[1.5]" />
                      <span>Notified: {fmt(exam.notifyDate)}</span>
                      <span className="opacity-40">|</span>
                      <span>Apply from: {fmt(exam.startDate)}</span>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="px-6 pb-6 flex gap-2.5">
                    <a
                      href={exam.official}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-[11.5px] font-normal transition-all duration-200 hover:brightness-105 active:scale-95 text-white"
                      style={{
                        background: 'linear-gradient(135deg, #818cf8, #6366f1)',
                        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.15)',
                      }}
                    >
                      <ExternalLink size={11} className="stroke-[1.5]" /> Official Site
                    </a>
                    <span
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-[11.5px] font-normal transition-all duration-200 hover:bg-slate-50 border"
                      style={{
                        color: '#6366f1',
                        borderColor: 'rgba(99, 102, 241, 0.25)',
                      }}
                    >
                      View Details <ChevronRight size={11} className="stroke-[1.5]" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Bottom CTA ── */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        <div className="rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #4c1d95 60%, #0c4a6e 100%)' }}>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, #818cf8 0%, transparent 60%)' }} />
          <div className="relative">
            <p className="text-3xl mb-3">🚀</p>
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">Exam Ki Taiyari Abhi Shuru Karo!</h2>
            <p className="text-indigo-200 mb-7 max-w-xl mx-auto">
              Abhyo AI ke saath unlimited mock tests, doubt solving, aur study plans. Free mein start karo.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/register"
                className="px-7 py-3.5 rounded-2xl font-black text-[14px] transition-all hover:scale-105 active:scale-95"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', boxShadow: '0 6px 20px rgba(99,102,241,0.5)' }}>
                Free Account Banao →
              </Link>
              <Link to="/exam-series"
                className="px-7 py-3.5 rounded-2xl font-black text-[14px] transition-all hover:bg-white/20 border-2 border-white/30 text-white">
                Mock Tests Dekho
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
