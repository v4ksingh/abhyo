import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import usePageMeta from '../hooks/usePageMeta';
import {
  Search, BookOpen, Clock, Users, Brain, ArrowRight, PlayCircle,
  Zap, Star, TrendingUp, Filter, X, ChevronDown, SlidersHorizontal,
  Sparkles, Trophy, Target, Globe, ShieldCheck, CheckCircle, BarChart3
} from 'lucide-react';

/* ─── Data ──────────────────────────────────────────────────────────────── */
const ALL_CATEGORIES = [
  { name: 'All', icon: '🌐', color: 'from-slate-600 to-slate-700' },
  { name: 'UPSC', icon: '🏛️', color: 'from-orange-500 to-amber-500' },
  { name: 'BPSC', icon: '⚡', color: 'from-blue-500 to-indigo-500' },
  { name: 'JSSC', icon: '🌿', color: 'from-emerald-500 to-teal-500' },
  { name: 'SSC', icon: '🎯', color: 'from-rose-500 to-pink-500' },
  { name: 'Banking', icon: '🏦', color: 'from-violet-500 to-purple-500' },
  { name: 'Railway', icon: '🚄', color: 'from-cyan-500 to-sky-500' },
  { name: 'Defence', icon: '🛡️', color: 'from-slate-600 to-slate-700' },
];

const TYPE_FILTERS = ['All Types', 'Full Length', 'Sectional', 'Subjective'];

const DUMMY_TESTS = [
  { id: 1, title: 'UPSC CSE GS Paper 1 — All India Mega Mock 2025', category: 'UPSC', questions: 100, duration: 120, students: '24.1k', type: 'Full Length', isLive: true, difficulty: 'Hard', rating: 4.9, attempts: 241 },
  { id: 2, title: 'BPSC 70th Prelims Target Full Mock Test', category: 'BPSC', questions: 150, duration: 120, students: '8.2k', type: 'Full Length', isLive: true, difficulty: 'Medium', rating: 4.7, attempts: 82 },
  { id: 3, title: 'JSSC CGL Pre — State Level Grand Mock', category: 'JSSC', questions: 150, duration: 120, students: '12.4k', type: 'Full Length', isLive: false, difficulty: 'Medium', rating: 4.6, attempts: 124 },
  { id: 4, title: 'SSC CGL Tier 1 Complete Mock 2025', category: 'SSC', questions: 100, duration: 60, students: '45.8k', type: 'Full Length', isLive: true, difficulty: 'Medium', rating: 4.8, attempts: 458 },
  { id: 5, title: 'IBPS PO Prelims Speed Booster Series', category: 'Banking', questions: 100, duration: 60, students: '18.9k', type: 'Sectional', isLive: false, difficulty: 'Easy', rating: 4.5, attempts: 189 },
  { id: 6, title: 'RRB NTPC CBT 1 Grand Mega Mock', category: 'Railway', questions: 100, duration: 90, students: '32.1k', type: 'Full Length', isLive: true, difficulty: 'Medium', rating: 4.7, attempts: 321 },
  { id: 7, title: 'UPSC CSAT Paper 2 Sectional Practice', category: 'UPSC', questions: 80, duration: 120, students: '11.5k', type: 'Sectional', isLive: false, difficulty: 'Hard', rating: 4.8, attempts: 115 },
  { id: 8, title: 'JSSC Constable Written Selection Mock', category: 'JSSC', questions: 100, duration: 120, students: '5.6k', type: 'Full Length', isLive: false, difficulty: 'Easy', rating: 4.4, attempts: 56 },
  { id: 9, title: 'BPSC Mains Essay & GS Practice Paper', category: 'BPSC', questions: 3, duration: 180, students: '2.1k', type: 'Subjective', isLive: false, difficulty: 'Hard', rating: 4.6, attempts: 21 },
  { id: 10, title: 'NDA Mathematics Sectional Drill', category: 'Defence', questions: 120, duration: 150, students: '6.7k', type: 'Sectional', isLive: true, difficulty: 'Hard', rating: 4.7, attempts: 67 },
  { id: 11, title: 'SBI Clerk Prelims Full Mock Drill', category: 'Banking', questions: 100, duration: 60, students: '22.3k', type: 'Full Length', isLive: false, difficulty: 'Easy', rating: 4.5, attempts: 223 },
  { id: 12, title: 'SSC CHSL Tier 1 Expected Paper 2025', category: 'SSC', questions: 100, duration: 60, students: '38.4k', type: 'Full Length', isLive: true, difficulty: 'Medium', rating: 4.9, attempts: 384 },
];

const CATEGORY_COLOR_MAP = {
  UPSC:    { tag: 'bg-orange-100 text-orange-700 border-orange-200', dot: 'bg-orange-500', card: 'from-orange-500 to-amber-500', glow: 'shadow-orange-200' },
  BPSC:    { tag: 'bg-blue-100 text-blue-700 border-blue-200',       dot: 'bg-blue-500',   card: 'from-blue-500 to-indigo-500',   glow: 'shadow-blue-200' },
  JSSC:    { tag: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', card: 'from-emerald-500 to-teal-500', glow: 'shadow-emerald-200' },
  SSC:     { tag: 'bg-rose-100 text-rose-700 border-rose-200',       dot: 'bg-rose-500',   card: 'from-rose-500 to-pink-500',     glow: 'shadow-rose-200' },
  Banking: { tag: 'bg-violet-100 text-violet-700 border-violet-200', dot: 'bg-violet-500', card: 'from-violet-500 to-purple-500', glow: 'shadow-violet-200' },
  Railway: { tag: 'bg-cyan-100 text-cyan-700 border-cyan-200',       dot: 'bg-cyan-500',   card: 'from-cyan-500 to-sky-500',      glow: 'shadow-cyan-200' },
  Defence: { tag: 'bg-slate-100 text-slate-700 border-slate-200',    dot: 'bg-slate-500',  card: 'from-slate-600 to-slate-700',   glow: 'shadow-slate-200' },
};

const DEFAULT_COLOR = { tag: 'bg-indigo-100 text-indigo-700 border-indigo-200', dot: 'bg-indigo-500', card: 'from-indigo-500 to-violet-500', glow: 'shadow-indigo-200' };

const DIFF_COLOR = { Easy: 'text-emerald-600 bg-emerald-50 border-emerald-200', Medium: 'text-amber-600 bg-amber-50 border-amber-200', Hard: 'text-red-600 bg-red-50 border-red-200' };

const STATS = [
  { value: '500+', label: 'Mock Tests', icon: BookOpen },
  { value: '10K+', label: 'Students', icon: Users },
  { value: '95%', label: 'Success Rate', icon: Trophy },
  { value: '8', label: 'Exam Types', icon: Target },
];

/* ─── Test Card ─────────────────────────────────────────────────────────── */
function TestCard({ test }) {
  const colors = CATEGORY_COLOR_MAP[test.category] || DEFAULT_COLOR;

  return (
    <div className={`group relative bg-white border border-slate-200 rounded-3xl overflow-hidden hover:shadow-2xl hover:${colors.glow} hover:border-transparent hover:-translate-y-2 transition-all duration-300 flex flex-col`}>
      {/* Top accent bar */}
      <div className={`h-1.5 bg-gradient-to-r ${colors.card} w-full`} />

      {/* Live badge */}
      {test.isLive && (
        <div className="absolute top-5 right-5 flex items-center gap-1.5 bg-red-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-lg shadow-red-500/40">
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          LIVE
        </div>
      )}

      <div className="p-6 flex-1 flex flex-col">
        {/* Category + Type */}
        <div className="flex items-center gap-2 mb-4">
          <span className={`text-xs font-bold px-3 py-1 rounded-full border ${colors.tag}`}>
            {test.category}
          </span>
          <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
            {test.type}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-black text-slate-900 text-[15px] leading-snug mb-4 group-hover:text-indigo-600 transition-colors line-clamp-2 flex-1">
          {test.title}
        </h3>

        {/* Rating + difficulty */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="text-xs font-bold text-slate-700">{test.rating}</span>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${DIFF_COLOR[test.difficulty]}`}>
            {test.difficulty}
          </span>
          <span className="text-[11px] text-slate-400 font-medium ml-auto">{test.attempts}K+ attempts</span>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {[
            { icon: BookOpen, val: `${test.questions} Qns` },
            { icon: Clock,    val: `${test.duration} Min` },
            { icon: Users,    val: test.students },
          ].map(({ icon: Icon, val }) => (
            <div key={val} className="flex flex-col items-center gap-1 bg-slate-50 rounded-xl py-2 border border-slate-100">
              <Icon className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] font-bold text-slate-600">{val}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-black text-emerald-600">Free</span>
          </div>
          <Link
            to="/register"
            className={`flex items-center gap-1.5 bg-gradient-to-r ${colors.card} text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all group-hover:scale-105`}
          >
            <PlayCircle className="w-3.5 h-3.5" />
            Attempt Now
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────────────── */
export default function AvailableTests() {
  usePageMeta({
    title: 'Free & Premium Mock Tests – SSC, UPSC, Banking, Railway',
    description: 'Browse 500+ mock tests for SSC CGL, UPSC CSE, IBPS PO, RRB NTPC, BPSC, JSSC, NDA and more. Real exam interface with instant analytics and national leaderboard.',
    canonical: '/tests',
  });

  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeType, setActiveType] = useState('All Types');
  const [sortBy, setSortBy] = useState('popular');
  const [filtered, setFiltered] = useState(DUMMY_TESTS);
  const [scrolled, setScrolled] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    let result = [...DUMMY_TESTS];
    if (activeCategory !== 'All') result = result.filter(t => t.category === activeCategory);
    if (activeType !== 'All Types') result = result.filter(t => t.type === activeType);
    if (searchQuery) result = result.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()));
    if (sortBy === 'popular') result.sort((a, b) => parseFloat(b.students) - parseFloat(a.students));
    if (sortBy === 'rating') result.sort((a, b) => b.rating - a.rating);
    if (sortBy === 'newest') result.sort((a, b) => b.id - a.id);
    setFiltered(result);
  }, [activeCategory, searchQuery, activeType, sortBy]);

  const clearAll = () => {
    setSearchQuery('');
    setActiveCategory('All');
    setActiveType('All Types');
    setSortBy('popular');
  };

  const activeFiltersCount = [
    activeCategory !== 'All',
    activeType !== 'All Types',
    searchQuery.length > 0,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans overflow-x-hidden">

      {/* ── Ambient blobs ───────────────────────────────────── */}
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(to right, #94a3b81a 1px, transparent 1px), linear-gradient(to bottom, #94a3b81a 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-40 pointer-events-none -z-10" />
      <div className="fixed top-1/3 right-0 w-80 h-80 bg-violet-100 rounded-full blur-3xl opacity-30 pointer-events-none -z-10" />

      {/* Nav is now handled by PublicLayout */}
      {/* ── HERO ───────────────────────────────────────────── */}
      <section className="relative pt-36 pb-16 px-6 lg:px-12 max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold px-4 py-2 rounded-full mb-6 shadow-sm">
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
            500+ Mock Tests Available
          </div>

          <h1 className="text-5xl lg:text-7xl font-black text-slate-900 leading-[1.05] tracking-tight mb-6">
            Find Your Next<br />
            <span className="relative">
              <span className="bg-gradient-to-r from-indigo-600 via-violet-500 to-pink-500 bg-clip-text text-transparent">Perfect Mock Test</span>
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 600 12" fill="none">
                <path d="M2 10 C200 2, 400 2, 598 10" stroke="url(#ug)" strokeWidth="3" strokeLinecap="round"/>
                <defs><linearGradient id="ug" x1="0" y1="0" x2="1" y2="0"><stop stopColor="#6366f1"/><stop offset="0.5" stopColor="#8b5cf6"/><stop offset="1" stopColor="#ec4899"/></linearGradient></defs>
              </svg>
            </span>
          </h1>

          <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-10 font-medium leading-relaxed">
            Practice with India's most realistic mock tests for UPSC, SSC, Banking, Railway & more.
            Real exam environment. Instant results. National rankings.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto mb-12">
            {STATS.map(({ value, label, icon: Icon }) => (
              <div key={label} className="bg-white border border-slate-200 rounded-2xl py-4 px-3 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <Icon className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">{value}</div>
                <div className="text-xs text-slate-500 font-semibold">{label}</div>
              </div>
            ))}
          </div>

          {/* ── Search ── */}
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-violet-400 rounded-2xl blur-xl opacity-20" />
            <div className="relative flex items-center bg-white border-2 border-slate-200 hover:border-indigo-300 focus-within:border-indigo-500 focus-within:shadow-lg focus-within:shadow-indigo-500/10 rounded-2xl transition-all overflow-hidden">
              <Search className="w-5 h-5 text-slate-400 ml-5 flex-shrink-0" />
              <input
                ref={searchRef}
                type="text"
                className="flex-1 px-4 py-4 text-slate-800 placeholder-slate-400 font-medium text-base bg-transparent focus:outline-none"
                placeholder="Search UPSC, SSC, Banking, Railway..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="mr-2 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
              <button className="m-2 flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold px-5 py-2.5 rounded-xl hover:from-indigo-700 hover:to-violet-700 transition-all text-sm flex-shrink-0">
                <Search className="w-4 h-4" /> Search
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── CATEGORY PILLS ─────────────────────────────────── */}
      <section className="px-6 lg:px-12 pb-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 overflow-x-auto pb-3 scrollbar-hide">
          {ALL_CATEGORIES.map(cat => {
            const isActive = activeCategory === cat.name;
            return (
              <button
                key={cat.name}
                onClick={() => setActiveCategory(cat.name)}
                className={`flex items-center gap-2 whitespace-nowrap px-5 py-2.5 rounded-2xl text-sm font-bold transition-all duration-200 flex-shrink-0 ${
                  isActive
                    ? `bg-gradient-to-r ${cat.color} text-white shadow-lg scale-105`
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900 hover:-translate-y-0.5 hover:shadow-md'
                }`}
              >
                <span className="text-base">{cat.icon}</span>
                {cat.name}
              </button>
            );
          })}
        </div>
      </section>

      {/* ── FILTERS BAR + RESULTS ──────────────────────────── */}
      <main className="px-6 lg:px-12 py-8 max-w-7xl mx-auto">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-black text-slate-900">
              <span className="text-indigo-600">{filtered.length}</span> Tests Found
            </h2>
            {activeFiltersCount > 0 && (
              <button onClick={clearAll} className="flex items-center gap-1.5 text-xs font-bold text-red-500 bg-red-50 border border-red-200 px-3 py-1.5 rounded-full hover:bg-red-100 transition-colors">
                <X className="w-3 h-3" /> Clear filters ({activeFiltersCount})
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Type filter */}
            <div className="relative">
              <select
                value={activeType}
                onChange={e => setActiveType(e.target.value)}
                className="appearance-none bg-white border border-slate-200 text-sm font-semibold text-slate-700 pl-4 pr-9 py-2.5 rounded-xl hover:border-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer transition-colors"
              >
                {TYPE_FILTERS.map(t => <option key={t}>{t}</option>)}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Sort */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="appearance-none bg-white border border-slate-200 text-sm font-semibold text-slate-700 pl-4 pr-9 py-2.5 rounded-xl hover:border-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer transition-colors"
              >
                <option value="popular">Most Popular</option>
                <option value="rating">Top Rated</option>
                <option value="newest">Newest First</option>
              </select>
              <SlidersHorizontal className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* ── LIVE TESTS BANNER ───────────────────────────── */}
        {filtered.some(t => t.isLive) && activeCategory === 'All' && !searchQuery && (
          <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-2xl p-5 mb-8 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/30 flex-shrink-0">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-black text-red-700 text-sm flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse inline-block" />
                  {filtered.filter(t => t.isLive).length} Tests LIVE Right Now
                </p>
                <p className="text-xs text-red-500 font-medium">Join thousands of students practicing in real-time</p>
              </div>
            </div>
            <button
              onClick={() => setSortBy('popular')}
              className="flex-shrink-0 text-xs font-bold bg-red-500 text-white px-4 py-2 rounded-xl hover:bg-red-600 transition-colors"
            >
              View Live
            </button>
          </div>
        )}

        {/* ── GRID ────────────────────────────────────────── */}
        {filtered.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map(test => <TestCard key={test.id} test={test} />)}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center shadow-sm">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <Search className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-3">No tests found</h3>
            <p className="text-sm text-slate-500 font-medium max-w-sm mx-auto leading-relaxed mb-6">
              We couldn't find tests matching your filters. Try broader search terms or switch categories.
            </p>
            <button
              onClick={clearAll}
              className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold px-6 py-3 rounded-xl hover:-translate-y-0.5 transition-all shadow-lg shadow-indigo-500/20"
            >
              Clear All Filters
            </button>
          </div>
        )}

        {/* ── LOAD MORE / CTA ─────────────────────────────── */}
        {filtered.length > 0 && (
          <div className="text-center mt-12">
            <p className="text-slate-500 text-sm font-medium mb-4">
              Showing {filtered.length} of 500+ tests available
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-slate-900 to-slate-800 text-white font-bold px-8 py-4 rounded-2xl hover:-translate-y-1 hover:shadow-xl transition-all text-base"
            >
              Sign up to access all 500+ tests <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </main>

      {/* ── FEATURES STRIP ─────────────────────────────────── */}
      <section className="py-16 px-6 lg:px-12 bg-gradient-to-r from-indigo-600 to-violet-600 mt-16">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { icon: BarChart3, title: 'Deep Analytics', desc: 'Subject & question-level insights' },
            { icon: Globe, title: 'Bilingual', desc: 'Hindi & English support' },
            { icon: ShieldCheck, title: 'Realistic Env.', desc: 'Full-screen, timed, proctored' },
            { icon: TrendingUp, title: 'Live Rankings', desc: 'National & institute leaderboards' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-white font-black text-sm">{title}</p>
                <p className="text-indigo-200 text-xs font-medium mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── JOIN CTA ───────────────────────────────────────── */}
      <section className="py-24 px-6 lg:px-12 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold px-4 py-2 rounded-full mb-6 shadow-sm">
          <CheckCircle className="w-3.5 h-3.5" /> 100% Free to Start
        </div>
        <h2 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mb-6">
          Ready to crack your<br />
          <span className="bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">dream exam?</span>
        </h2>
        <p className="text-slate-500 text-lg mb-10 font-medium max-w-2xl mx-auto">
          Join 10,000+ aspirants who practice daily on Abhyo. No credit card, no setup — just sign up and start.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/register" className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-extrabold py-4 px-10 rounded-2xl shadow-xl shadow-indigo-500/30 hover:-translate-y-1 transition-all text-base flex items-center gap-2 justify-center">
            Get Started Free <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/plans" className="bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-700 font-bold py-4 px-10 rounded-2xl hover:shadow-md hover:-translate-y-0.5 transition-all text-base flex items-center gap-2 justify-center">
            View Pricing
          </Link>
        </div>
      </section>

      {/* Footer is now handled by PublicLayout */}
    </div>
  );
}
