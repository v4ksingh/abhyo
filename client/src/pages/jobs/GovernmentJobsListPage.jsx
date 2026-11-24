import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase, Search, Calendar, Users, DollarSign, ExternalLink,
  ChevronRight, ArrowRight, ShieldCheck, Clock, Filter, Sparkles,
  Building, GraduationCap, AlertCircle, BookOpen, Layers, CheckCircle2,
  Flame, Award, MapPin, X, RotateCcw, TrendingUp, Compass, ArrowUpRight
} from 'lucide-react';
import usePageMeta from '../../hooks/usePageMeta';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const QUICK_CATEGORIES = [
  { id: 'All', label: 'All Recruitments', icon: Compass },
  { id: 'UPSC', label: 'UPSC', icon: Building },
  { id: 'SSC', label: 'SSC', icon: Award },
  { id: 'Banking', label: 'Banking', icon: DollarSign },
  { id: 'Railway', label: 'Railway', icon: Layers },
  { id: 'Defence', label: 'Defence', icon: ShieldCheck },
  { id: 'State PSC', label: 'State PSC', icon: Sparkles },
  { id: 'Police', label: 'Police', icon: ShieldCheck },
  { id: 'Teaching', label: 'Teaching', icon: GraduationCap },
  { id: 'Engineering', label: 'Engineering', icon: BookOpen },
];

const TRENDING_TAGS = [
  'LIC Apprentice', 'IBPS PO', 'UPSC Civil Services', 'SSC CGL', 'Railway RRB', 'State PCS'
];

const CATEGORY_THEMES = {
  UPSC: { bg: 'bg-amber-500/10 text-amber-700 border-amber-200/80', iconBg: 'from-amber-500 to-orange-500', pill: 'bg-amber-50 text-amber-700 border-amber-200' },
  SSC: { bg: 'bg-rose-500/10 text-rose-700 border-rose-200/80', iconBg: 'from-rose-500 to-pink-500', pill: 'bg-rose-50 text-rose-700 border-rose-200' },
  Banking: { bg: 'bg-violet-500/10 text-violet-700 border-violet-200/80', iconBg: 'from-violet-500 to-purple-600', pill: 'bg-violet-50 text-violet-700 border-violet-200' },
  Railway: { bg: 'bg-sky-500/10 text-sky-700 border-sky-200/80', iconBg: 'from-cyan-500 to-blue-600', pill: 'bg-sky-50 text-sky-700 border-sky-200' },
  Defence: { bg: 'bg-emerald-500/10 text-emerald-700 border-emerald-200/80', iconBg: 'from-emerald-500 to-teal-600', pill: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  'State PSC': { bg: 'bg-amber-500/10 text-amber-800 border-amber-200/80', iconBg: 'from-yellow-500 to-amber-600', pill: 'bg-yellow-50 text-amber-800 border-amber-200' },
  Police: { bg: 'bg-blue-500/10 text-blue-700 border-blue-200/80', iconBg: 'from-blue-600 to-indigo-600', pill: 'bg-blue-50 text-blue-700 border-blue-200' },
  Teaching: { bg: 'bg-teal-500/10 text-teal-700 border-teal-200/80', iconBg: 'from-teal-500 to-emerald-600', pill: 'bg-teal-50 text-teal-700 border-teal-200' },
  Engineering: { bg: 'bg-indigo-500/10 text-indigo-700 border-indigo-200/80', iconBg: 'from-indigo-500 to-violet-600', pill: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  Apprenticeship: { bg: 'bg-purple-500/10 text-purple-700 border-purple-200/80', iconBg: 'from-purple-500 to-indigo-600', pill: 'bg-purple-50 text-purple-700 border-purple-200' },
  default: { bg: 'bg-indigo-500/10 text-indigo-700 border-indigo-200/80', iconBg: 'from-indigo-600 to-violet-600', pill: 'bg-indigo-50 text-indigo-700 border-indigo-200' }
};

export default function GovernmentJobsListPage() {
  usePageMeta({
    title: 'Latest Government Jobs 2026 – Sarkari Naukri, Notifications & Vacancies | Abhyo',
    description: 'Explore verified Indian Government job recruitments for SSC, UPSC, Banking, Railways, Defence, and State PSC. Real-time application dates, vacancy counts, and official application links on Abhyo.com.',
    canonical: '/government-jobs',
  });

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [deadlineFilter, setDeadlineFilter] = useState('all'); // all, closingSoon, highVacancies
  const [sortBy, setSortBy] = useState('latest'); // latest, deadline, vacancies
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 1 });
  const [dbCategories, setDbCategories] = useState([]);

  // Fetch dynamic categories from /categories/public (managed at /admin/categories)
  useEffect(() => {
    fetch(`${API_BASE}/categories/public`)
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data) {
          setDbCategories(res.data);
        }
      })
      .catch(err => console.error('Failed to load categories:', err));
  }, []);

  // Compute dynamic category pills
  const displayCategories = useMemo(() => {
    const list = [{ id: 'All', label: 'All Recruitments', icon: Compass }];
    const seen = new Set(['All']);

    dbCategories.forEach(c => {
      if (c.name && !seen.has(c.name)) {
        seen.add(c.name);
        const iconMatch = QUICK_CATEGORIES.find(q => q.id.toLowerCase() === c.name.toLowerCase());
        list.push({
          id: c.name,
          label: c.name,
          icon: iconMatch?.icon || Building,
        });
      }
    });

    QUICK_CATEGORIES.forEach(q => {
      if (!seen.has(q.id)) {
        seen.add(q.id);
        list.push(q);
      }
    });

    return list;
  }, [dbCategories]);

  // Fetch published jobs
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const params = new URLSearchParams({
      page: pagination.page,
      limit: pagination.limit,
    });

    if (search.trim()) params.append('search', search.trim());
    if (selectedCategory && selectedCategory !== 'All') params.append('category', selectedCategory);

    fetch(`${API_BASE}/government-jobs?${params.toString()}`)
      .then(r => r.json())
      .then(res => {
        if (isMounted && res.success) {
          setJobs(res.data || []);
          if (res.pagination) {
            setPagination(p => ({
              ...p,
              total: res.pagination.total || (res.data ? res.data.length : 0),
              pages: res.pagination.pages || 1,
            }));
          }
        }
      })
      .catch(err => console.error('Failed to load public government jobs:', err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [pagination.page, pagination.limit, search, selectedCategory]);

  // Client-side quick filter and sorting
  const filteredJobs = useMemo(() => {
    let list = [...jobs];
    const now = new Date();

    if (deadlineFilter === 'closingSoon') {
      list = list.filter(j => {
        if (!j.applicationLastDate) return false;
        const d = new Date(j.applicationLastDate);
        if (isNaN(d.getTime())) return false;
        const diffDays = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 7;
      });
    } else if (deadlineFilter === 'highVacancies') {
      list = list.filter(j => (j.totalVacancies || 0) >= 100);
    }

    // Sorting
    if (sortBy === 'vacancies') {
      list.sort((a, b) => (b.totalVacancies || 0) - (a.totalVacancies || 0));
    } else if (sortBy === 'deadline') {
      list.sort((a, b) => {
        if (!a.applicationLastDate) return 1;
        if (!b.applicationLastDate) return -1;
        return new Date(a.applicationLastDate) - new Date(b.applicationLastDate);
      });
    }

    return list;
  }, [jobs, deadlineFilter, sortBy]);

  // Total active vacancies count across loaded jobs
  const totalVacanciesCount = useMemo(() => {
    return jobs.reduce((sum, j) => sum + (parseInt(j.totalVacancies) || 0), 0);
  }, [jobs]);

  // Urgency badge helper
  const getDeadlineBadge = (lastDateStr) => {
    if (!lastDateStr) {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 bg-slate-100/80 px-2.5 py-1 rounded-full border border-slate-200">
          <Clock className="w-3 h-3 text-slate-400" /> Closing: Ongoing / TBA
        </span>
      );
    }

    const d = new Date(lastDateStr);
    if (isNaN(d.getTime())) {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200">
          Last Date: {lastDateStr}
        </span>
      );
    }

    const now = new Date();
    const diffDays = Math.ceil((d - now) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
          Application Closed
        </span>
      );
    } else if (diffDays <= 3) {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-300 shadow-sm animate-pulse">
          <Flame className="w-3.5 h-3.5 text-rose-600 fill-rose-500" /> Ends in {diffDays === 0 ? 'Today' : `${diffDays} days`}
        </span>
      );
    } else if (diffDays <= 7) {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-300 shadow-xs">
          <Clock className="w-3.5 h-3.5 text-amber-600" /> Closing in {diffDays} days
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 shadow-xs">
          <Calendar className="w-3 h-3 text-emerald-600" /> {d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
      );
    }
  };

  const getTheme = (cat) => CATEGORY_THEMES[cat] || CATEGORY_THEMES.default;

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-800 font-sans">
      
      {/* ── HERO BANNER ────────────────────────────────────────── */}
      <section className="relative pt-28 sm:pt-32 lg:pt-36 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-br from-[#0c0f24] via-[#161a3f] to-[#1e1b4b] text-white">
        
        {/* Ambient Gradient Glows & Grid Pattern */}
        <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #818cf8 1px, transparent 1px)', backgroundSize: '36px 36px' }} />
        <div className="absolute top-0 -left-20 w-96 h-96 bg-indigo-500/25 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-60 bg-blue-500/15 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-5xl mx-auto relative z-10 text-center">
          
          {/* Official Badge Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-white/10 backdrop-blur-xl border border-white/20 mb-6 text-amber-200 shadow-lg shadow-black/20 ring-1 ring-white/10">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>100% Verified Government Gazettes & Notifications</span>
            <span className="hidden sm:inline-block text-[10px] bg-amber-400 text-slate-900 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ml-1">Live 2026</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15] text-white max-w-4xl mx-auto">
            Government Jobs &{' '}
            <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-orange-300 bg-clip-text text-transparent">
              Sarkari Recruitments
            </span>{' '}
            2026
          </h1>

          {/* Subtitle */}
          <p className="mt-4 sm:mt-5 text-sm sm:text-base lg:text-lg text-indigo-100/90 max-w-3xl mx-auto font-normal leading-relaxed">
            Real-time notifications, application deadlines, eligibility criteria, and direct application links for UPSC, SSC, Banking, Railways & State PSC exams.
          </p>

          {/* ── Search Container ────────────────────────────── */}
          <div className="mt-8 sm:mt-10 max-w-3xl mx-auto">
            <div className="relative flex flex-col sm:flex-row items-center bg-white p-2 rounded-2xl sm:rounded-full shadow-2xl shadow-indigo-950/40 border-2 border-indigo-200/40 backdrop-blur-md">
              <div className="flex items-center w-full px-3 py-2 sm:py-0">
                <Search className="w-5 h-5 text-indigo-500 ml-1 shrink-0" />
                <input
                  type="text"
                  placeholder="Search recruitment, post, or organization (e.g. SSC CGL, IBPS, UPSC)..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-3 py-2 text-sm text-slate-900 placeholder-slate-400 bg-transparent focus:outline-none font-medium"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <button
                type="button"
                className="w-full sm:w-auto px-7 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black text-xs sm:text-sm rounded-xl sm:rounded-full shadow-lg shadow-indigo-500/40 hover:shadow-indigo-500/60 transition-all flex items-center justify-center gap-2 shrink-0 group active:scale-95"
              >
                <span>Find Jobs</span>
                <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Trending Tags */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-xs">
              <span className="text-indigo-200/80 font-bold flex items-center gap-1 text-[11px] uppercase tracking-wider">
                <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> Trending:
              </span>
              {TRENDING_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSearch(tag)}
                  className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-indigo-100 border border-white/15 text-[11px] font-medium transition-all hover:scale-105"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-10 max-w-4xl mx-auto pt-6 border-t border-white/10 text-left">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0">
                <Briefcase size={20} />
              </div>
              <div>
                <span className="text-lg sm:text-xl font-black text-white block leading-tight">500+</span>
                <span className="text-[11px] text-indigo-200/80 font-medium">Active Notifications</span>
              </div>
            </div>
            
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
                <Users size={20} />
              </div>
              <div>
                <span className="text-lg sm:text-xl font-black text-white block leading-tight">
                  {totalVacanciesCount > 0 ? `${totalVacanciesCount.toLocaleString('en-IN')}+` : '1,50,000+'}
                </span>
                <span className="text-[11px] text-amber-200/80 font-medium">Open Vacancies</span>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                <Clock size={20} />
              </div>
              <div>
                <span className="text-lg sm:text-xl font-black text-white block leading-tight">Hourly</span>
                <span className="text-[11px] text-emerald-200/80 font-medium">Gazette Updates</span>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-300 flex items-center justify-center shrink-0">
                <ShieldCheck size={20} />
              </div>
              <div>
                <span className="text-lg sm:text-xl font-black text-white block leading-tight">Direct Links</span>
                <span className="text-[11px] text-rose-200/80 font-medium">Official Portals</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── MAIN CONTENT SECTION ─────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 space-y-8">
        
        {/* Category Pills & Quick Filter Controls */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-sm space-y-4">
          
          {/* Category Tabs */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Filter size={13} className="text-indigo-600" /> Browse by Department & Exam Board
              </span>
              {selectedCategory !== 'All' && (
                <button
                  onClick={() => setSelectedCategory('All')}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
                >
                  <RotateCcw size={12} /> Clear Filter
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {displayCategories.map((cat) => {
                const Icon = cat.icon;
                const active = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setPagination(p => ({ ...p, page: 1 }));
                    }}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 flex items-center gap-2 ${
                      active
                        ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-300 scale-[1.02]'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80'
                    }`}
                  >
                    <Icon size={14} className={active ? 'text-indigo-200' : 'text-slate-400'} />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Secondary Filter & Sort Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
            {/* Quick Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500 mr-1">Quick Filters:</span>
              <button
                onClick={() => setDeadlineFilter(deadlineFilter === 'closingSoon' ? 'all' : 'closingSoon')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  deadlineFilter === 'closingSoon'
                    ? 'bg-rose-50 text-rose-700 border border-rose-300 shadow-sm ring-2 ring-rose-200'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-rose-500" />
                Closing in 7 Days
              </button>
              
              <button
                onClick={() => setDeadlineFilter(deadlineFilter === 'highVacancies' ? 'all' : 'highVacancies')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  deadlineFilter === 'highVacancies'
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-300 shadow-sm ring-2 ring-indigo-200'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                100+ Vacancies
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs font-medium text-slate-500">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="latest">Latest Released</option>
                <option value="deadline">Closing Soonest</option>
                <option value="vacancies">Highest Vacancies</option>
              </select>
            </div>
          </div>

        </div>

        {/* Results Counter Header */}
        <div className="flex items-center justify-between text-xs sm:text-sm text-slate-500 px-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>
              Showing <strong className="text-slate-900 font-extrabold">{filteredJobs.length}</strong> of{' '}
              <strong className="text-slate-900 font-extrabold">{pagination.total || filteredJobs.length}</strong> active opportunities
            </span>
          </div>
          {selectedCategory !== 'All' && (
            <span className="inline-flex items-center gap-1 font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
              Department: {selectedCategory}
            </span>
          )}
        </div>

        {/* ── JOBS GRID ────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-80 bg-white rounded-3xl border border-slate-200/80 p-6 animate-pulse space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <div className="h-5 bg-slate-200 rounded-full w-24" />
                    <div className="h-5 bg-slate-200 rounded-full w-32" />
                  </div>
                  <div className="h-6 bg-slate-200 rounded-lg w-4/5" />
                  <div className="h-4 bg-slate-200 rounded-md w-1/2" />
                </div>
                <div className="h-20 bg-slate-100 rounded-2xl" />
                <div className="h-10 bg-slate-200 rounded-xl" />
              </div>
            ))}
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-12 sm:p-16 text-center max-w-lg mx-auto shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Briefcase className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-900">No Recruitments Found</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
              We couldn&apos;t find any active notifications matching your filters. Try clearing your search keyword or switching category tabs.
            </p>
            <button
              onClick={() => {
                setSearch('');
                setSelectedCategory('All');
                setDeadlineFilter('all');
                setSortBy('latest');
              }}
              className="mt-6 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-xs rounded-xl shadow-md transition-all inline-flex items-center gap-2"
            >
              <RotateCcw size={14} /> Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job) => {
              const theme = getTheme(job.category);
              return (
                <div
                  key={job.id}
                  className="group bg-white rounded-3xl border-2 border-slate-200/70 hover:border-indigo-400 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300 p-6 flex flex-col justify-between relative overflow-hidden"
                >
                  {/* Subtle top card glow line on hover */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div>
                    {/* Top Row: Category & Urgency Badge */}
                    <div className="flex items-center justify-between gap-2 mb-3.5">
                      <span className={`px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider border ${theme.pill}`}>
                        {job.category || 'Government Job'}
                      </span>
                      {getDeadlineBadge(job.applicationLastDate)}
                    </div>

                    {/* Organization Banner */}
                    <div className="flex items-center gap-2.5 mb-2.5">
                      <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${theme.iconBg} text-white flex items-center justify-center font-black text-xs shadow-sm shrink-0`}>
                        {job.organization ? job.organization.charAt(0) : 'G'}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-600 truncate block flex items-center gap-1" title={job.organization}>
                          <span className="truncate">{job.organization || 'Government Department'}</span>
                          <CheckCircle2 size={13} className="text-blue-500 shrink-0 fill-blue-50" />
                        </span>
                      </div>
                    </div>

                    {/* Job Title */}
                    <Link to={`/government-jobs/${job.slug}`}>
                      <h3 className="font-black text-slate-900 text-lg group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug tracking-tight">
                        {job.title}
                      </h3>
                    </Link>

                    {/* Tagline / Subtitle if available */}
                    {job.tagline && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1 font-medium">
                        {job.tagline}
                      </p>
                    )}

                    {/* Key Info Metrics Box */}
                    <div className="grid grid-cols-2 gap-2 mt-4 p-3.5 bg-slate-50/90 rounded-2xl border border-slate-100 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block flex items-center gap-1">
                          <Users size={11} className="text-indigo-500" /> Vacancies
                        </span>
                        <span className="font-black text-indigo-600 text-sm mt-0.5 block">
                          {job.totalVacancies ? `${job.totalVacancies.toLocaleString('en-IN')} Posts` : 'Refer Notice'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block flex items-center gap-1">
                          <DollarSign size={11} className="text-emerald-500" /> Salary / Pay
                        </span>
                        <span className="font-bold text-slate-800 text-xs mt-0.5 block truncate" title={job.salary}>
                          {job.salary || 'As per 7th CPC'}
                        </span>
                      </div>
                    </div>

                    {/* Eligibility & Mode Tags */}
                    <div className="mt-3.5 space-y-1.5 text-xs text-slate-600">
                      {Array.isArray(job.qualification) && job.qualification.length > 0 && (
                        <div className="flex items-start gap-1.5">
                          <GraduationCap className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                          <span className="line-clamp-1 text-[11px] font-semibold text-slate-700">
                            {job.qualification.join(' • ')}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Mode: <strong className="text-slate-700">{job.applicationMode || 'Online'}</strong></span>
                        <span className="text-slate-300">•</span>
                        <span>All India / State</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom CTA Buttons */}
                  <div className="mt-6 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-3">
                    <Link
                      to={`/categories`}
                      className="text-[11px] font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition-colors"
                    >
                      <BookOpen size={12} /> Practice Mock Test
                    </Link>

                    <Link
                      to={`/government-jobs/${job.slug}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white font-extrabold text-xs transition-all duration-200 group-hover:bg-indigo-600 group-hover:text-white shadow-xs group-hover:shadow-md"
                    >
                      <span>View Notification</span>
                      <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="pt-8 border-t border-slate-200 flex items-center justify-center gap-3">
            <button
              disabled={pagination.page <= 1}
              onClick={() => {
                setPagination(p => ({ ...p, page: p.page - 1 }));
                window.scrollTo({ top: 400, behavior: 'smooth' });
              }}
              className="px-5 py-2.5 border-2 border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-white hover:border-indigo-400 disabled:opacity-40 transition-all shadow-xs"
            >
              ← Previous Page
            </button>
            <span className="text-xs font-extrabold text-slate-600 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-xs">
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              disabled={pagination.page >= pagination.pages}
              onClick={() => {
                setPagination(p => ({ ...p, page: p.page + 1 }));
                window.scrollTo({ top: 400, behavior: 'smooth' });
              }}
              className="px-5 py-2.5 border-2 border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-white hover:border-indigo-400 disabled:opacity-40 transition-all shadow-xs"
            >
              Next Page →
            </button>
          </div>
        )}

        {/* ── HIGH-CONVERTING BOTTOM BANNER ─────────────────────── */}
        <div className="mt-16 relative overflow-hidden bg-gradient-to-br from-indigo-900 via-indigo-800 to-violet-900 rounded-[32px] p-8 sm:p-12 text-white shadow-xl shadow-indigo-950/20 border border-white/10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="space-y-3 max-w-2xl text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-amber-300 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                <Sparkles size={13} /> Official Exam Preparation
              </div>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight">
                Preparing for these Government Exams?
              </h3>
              <p className="text-sm sm:text-base text-indigo-100 font-normal leading-relaxed">
                Practice with 500+ full-length bilingual mock tests crafted as per latest CBT exam patterns with All-India Rank, sectional timers, and AI analytics.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full sm:w-auto">
              <Link
                to="/categories"
                className="w-full sm:w-auto px-7 py-3.5 bg-white text-indigo-900 hover:bg-amber-300 hover:text-slate-950 font-black text-sm rounded-2xl shadow-xl transition-all text-center flex items-center justify-center gap-2 group active:scale-95"
              >
                <span>Explore All Test Series</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/olympiad"
                className="w-full sm:w-auto px-6 py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-sm rounded-2xl backdrop-blur-md transition-all text-center"
              >
                Abhyo Olympiad 2026
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
