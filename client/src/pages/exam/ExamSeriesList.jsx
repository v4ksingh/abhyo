import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import useAuthStore from '../../store/authStore';
import usePageMeta from '../../hooks/usePageMeta';
import { toast } from 'react-hot-toast';
import {
  Search, BookOpen, Clock, Users, Brain, ArrowRight, PlayCircle,
  Zap, Star, TrendingUp, Filter, X, ChevronDown, SlidersHorizontal,
  Sparkles, Trophy, Target, Globe, ShieldCheck, CheckCircle, BarChart3,
  Calendar
} from 'lucide-react';

const DEFAULT_COLOR = { tag: 'bg-indigo-100 text-indigo-700 border-indigo-200', dot: 'bg-indigo-500', card: 'from-indigo-500 to-violet-500', glow: 'shadow-indigo-200' };

const getCategoryStyles = (categoryName) => {
  if (!categoryName) return DEFAULT_COLOR;
  const hash = Array.from(categoryName).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colorList = [
    { card: 'from-orange-500 to-amber-500' },
    { card: 'from-blue-500 to-indigo-500' },
    { card: 'from-emerald-500 to-teal-500' },
    { card: 'from-rose-500 to-pink-500' },
    { card: 'from-violet-500 to-purple-500' },
    { card: 'from-cyan-500 to-sky-500' }
  ];
  return colorList[hash % colorList.length];
};

const STATS = [
  { value: '25+', label: 'Exam Series', icon: BookOpen },
  { value: '50K+', label: 'Students Enrolled', icon: Users },
  { value: '98%', label: 'Syllabus Match', icon: ShieldCheck },
  { value: '1', label: 'Platform', icon: Target },
];

/* ─── Series Card ─────────────────────────────────────────────────────────── */
function SeriesCard({ series }) {
  const colors = getCategoryStyles(series.category);

  return (
    <Link to={`/exam-series/${series.slug}`} className="group relative bg-white border border-slate-200 rounded-3xl overflow-hidden hover:shadow-2xl hover:border-transparent hover:-translate-y-2 transition-all duration-300 flex flex-col">
      {/* Banner Area */}
      <div className={`relative h-[140px] bg-gradient-to-br ${colors.card} p-5 flex flex-col justify-between overflow-hidden`}>
        {/* Subtle patterned overlay */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '12px 12px' }} />
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />

        <div className="relative z-10 flex items-start justify-between gap-2">
          <span className="bg-white/20 backdrop-blur-md text-white border border-white/20 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-sm">
            {series.category || 'General'}
          </span>
          {series.isFeatured && (
            <div className="flex items-center gap-1 bg-amber-400 text-amber-950 text-[10px] font-extrabold px-2.5 py-1 rounded-lg shadow-md">
              <Star className="w-3 h-3 fill-amber-950" /> FEATURED
            </div>
          )}
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col bg-white relative pt-12">
        {/* Exam Name Pill bridging the banner */}
        <div className="absolute -top-6 left-6 right-6">
          {series.examName ? (
            <span className="inline-flex max-w-[95%] items-center bg-slate-900 text-white text-[11px] font-bold px-3.5 py-2 rounded-xl shadow-lg border border-slate-700 whitespace-normal text-left leading-snug line-clamp-2" title={series.examName}>
              {series.examName}
            </span>
          ) : (
            <div className="w-10 h-10 bg-white rounded-xl shadow-md border border-slate-100 flex items-center justify-center text-xl">
              {series.category ? series.category.substring(0, 1).toUpperCase() : '📚'}
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="font-black text-slate-900 text-[17px] leading-snug mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
          {series.title}
        </h3>

        <p className="text-[13px] text-slate-500 font-medium line-clamp-2 mb-6 flex-1 leading-relaxed">
          {series.tagline || (series.description ? series.description.replace(/<[^>]*>?/gm, '') : null) || 'Comprehensive test series covering the complete syllabus with detailed analysis.'}
        </p>

        {/* Stats box */}
        <div className="flex items-center gap-3 mb-6 bg-slate-50 rounded-2xl p-3 border border-slate-100">
          <div className="flex-1 flex flex-col px-1">
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1">Total Tests</span>
            <div className="flex items-center gap-1.5 font-black text-slate-700 text-[13px]">
              <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
              {series.totalTests || 0}
            </div>
          </div>
          <div className="w-px h-8 bg-slate-200" />
          <div className="flex-1 flex flex-col px-1">
            {series.examDetails?.examDate ? (
              <>
                <span className="text-[9px] text-orange-400 font-bold uppercase tracking-widest mb-1">Exam Date</span>
                <div className="flex items-center gap-1.5 font-black text-orange-600 text-[13px] truncate" title={series.examDetails.examDate}>
                  <Calendar className="w-3.5 h-3.5" />
                  {series.examDetails.examDate}
                </div>
              </>
            ) : (
              <>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1">Enrolled</span>
                <div className="flex items-center gap-1.5 font-black text-slate-700 text-[13px]">
                  <Users className="w-3.5 h-3.5 text-emerald-500" />
                  {series.totalStudents || '1k+'}
                </div>
              </>
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
          <div className="flex items-center gap-1.5">
            {(series.isFree || series.price === 0 || !series.price) ? (
              <span className="text-[20px] font-black text-emerald-500">Free</span>
            ) : (
              <span className="text-[20px] font-black text-slate-900">₹{series.price}</span>
            )}
          </div>
          <span className="inline-flex items-center gap-1.5 bg-slate-900 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-500/30 transition-all group-hover:-translate-y-0.5">
            Explore <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────────────── */
export default function ExamSeriesList() {
  usePageMeta({
    title: 'Exam Series – SSC, UPSC, Banking, Railway Prep Packages',
    description: 'Complete exam series for SSC CGL, UPSC CSE, IBPS PO, NDA, BPSC, JSSC, Railway RRB and more. Structured test packages with full syllabus coverage, study notes, and analytics.',
    canonical: '/exam-series',
  });

  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();

  const [series, setSeries] = useState([]);
  const [categories, setCategories] = useState([{ name: 'All', icon: '🌐', color: 'from-slate-600 to-slate-700' }]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const [scrolled, setScrolled] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    Promise.all([
      api.get('/exam-series').catch(() => ({ data: { data: [] } })),
      api.get('/categories/public').catch(() => ({ data: { data: [] } }))
    ])
      .then(([seriesRes, catRes]) => {
        setSeries(seriesRes.data.data || []);
        const dbCats = catRes.data.data || [];
        const ICONS = ['🎯', '⚡', '🌿', '🏛️', '🛡️', '🏦', '🚄', '🧠', '🎓'];
        const dynamicCats = dbCats.map((c, i) => ({
          name: c.name,
          icon: ICONS[i % ICONS.length],
          color: getCategoryStyles(c.name).card
        }));
        setCategories([{ name: 'All', icon: '🌐', color: 'from-slate-600 to-slate-700' }, ...dynamicCats]);
      })
      .finally(() => setLoading(false));
  }, []);

  // Filter Logic
  let filtered = [...series];
  if (activeCategory !== 'All') filtered = filtered.filter(s => s.category === activeCategory);
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(s => s.title.toLowerCase().includes(q) || (s.examName || '').toLowerCase().includes(q));
  }

  if (sortBy === 'popular') filtered.sort((a, b) => b.isFeatured ? 1 : -1);
  if (sortBy === 'newest') filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  if (sortBy === 'price') filtered.sort((a, b) => (a.price || 0) - (b.price || 0));

  const clearAll = () => {
    setSearchQuery('');
    setActiveCategory('All');
    setSortBy('popular');
  };

  const activeFiltersCount = [
    activeCategory !== 'All',
    searchQuery.length > 0,
    sortBy !== 'popular'
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans overflow-x-hidden">

      {/* ── Ambient blobs ───────────────────────────────────── */}
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(to right, #94a3b81a 1px, transparent 1px), linear-gradient(to bottom, #94a3b81a 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-40 pointer-events-none -z-10" />
      <div className="fixed top-1/3 right-0 w-80 h-80 bg-violet-100 rounded-full blur-3xl opacity-30 pointer-events-none -z-10" />

      {/* ── Navbar ─────────────────────────────────────────── */}
      {/* Nav is now handled by PublicLayout */}

      {/* ── HERO ───────────────────────────────────────────── */}
      <section className="relative pt-24 pb-8 px-6 lg:px-12 max-w-7xl mx-auto mt-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold px-3 py-1.5 rounded-full mb-4 shadow-sm">
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
            Complete Preparatory Packages
          </div>

          <h1 className="text-4xl lg:text-5xl font-black text-slate-900 leading-[1.1] tracking-tight mb-4">
            Master Your Exam with<br />
            <span className="relative">
              <span className="bg-gradient-to-r from-indigo-600 via-violet-500 to-pink-500 bg-clip-text text-transparent">Targeted Series</span>
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 600 12" fill="none">
                <path d="M2 10 C200 2, 400 2, 598 10" stroke="url(#ug)" strokeWidth="3" strokeLinecap="round" />
                <defs><linearGradient id="ug" x1="0" y1="0" x2="1" y2="0"><stop stopColor="#6366f1" /><stop offset="0.5" stopColor="#8b5cf6" /><stop offset="1" stopColor="#ec4899" /></linearGradient></defs>
              </svg>
            </span>
          </h1>

          <p className="text-sm text-slate-500 max-w-2xl mx-auto mb-6 font-medium leading-relaxed">
            Curated collections of tests systematically designed to cover the entire syllabus, boost your confidence, and guarantee results.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto mb-8">
            {STATS.map(({ value, label, icon: Icon }) => (
              <div key={label} className="bg-white border border-slate-200 rounded-xl py-3 px-2 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                <div className="w-6 h-6 bg-indigo-50 rounded-lg flex items-center justify-center mx-auto mb-1.5">
                  <Icon className="w-3.5 h-3.5 text-indigo-600" />
                </div>
                <div className="text-xl font-black text-slate-900">{value}</div>
                <div className="text-[10px] text-slate-500 font-semibold uppercase">{label}</div>
              </div>
            ))}
          </div>

          {/* ── Search ── */}
          <div className="relative max-w-xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-violet-400 rounded-xl blur-lg opacity-20" />
            <div className="relative flex items-center bg-white border border-slate-200 hover:border-indigo-300 focus-within:border-indigo-500 focus-within:shadow-md focus-within:shadow-indigo-500/10 rounded-xl transition-all overflow-hidden">
              <Search className="w-4 h-4 text-slate-400 ml-4 flex-shrink-0" />
              <input
                ref={searchRef}
                type="text"
                className="flex-1 px-3 py-2.5 text-slate-800 placeholder-slate-400 font-medium text-sm bg-transparent focus:outline-none"
                placeholder="Search Exam Series (e.g. UPSC CSE)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="mr-1 p-1 text-slate-400 hover:text-slate-600 rounded drop-shadow hover:bg-slate-100 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              )}
              <button className="m-1.5 flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-violet-700 transition-all text-xs flex-shrink-0">
                <Search className="w-3 h-3" /> Search
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── CATEGORY PILLS ─────────────────────────────────── */}
      <section className="px-6 lg:px-12 pb-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 overflow-x-auto pb-3 scrollbar-hide">
          {categories.map(cat => {
            const isActive = activeCategory === cat.name;
            return (
              <button
                key={cat.name}
                onClick={() => setActiveCategory(cat.name)}
                className={`flex items-center gap-2 whitespace-nowrap px-5 py-2.5 rounded-2xl text-sm font-bold transition-all duration-200 flex-shrink-0 ${isActive
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
        <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-black text-slate-900">
              <span className="text-indigo-600">{filtered.length}</span> Series Found
            </h2>
            {activeFiltersCount > 0 && (
              <button onClick={clearAll} className="flex items-center gap-1.5 text-xs font-bold text-red-500 bg-red-50 border border-red-200 px-3 py-1.5 rounded-full hover:bg-red-100 transition-colors">
                <X className="w-3 h-3" /> Clear filters ({activeFiltersCount})
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Sort */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="appearance-none bg-white border border-slate-200 text-sm font-semibold text-slate-700 pl-4 pr-9 py-2.5 rounded-xl hover:border-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer transition-colors"
              >
                <option value="popular">Most Popular / Featured</option>
                <option value="newest">Newest First</option>
                <option value="price">Price: Low to High</option>
              </select>
              <SlidersHorizontal className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* ── GRID ────────────────────────────────────────── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4" />
            <p className="text-slate-500 font-bold">Loading brilliant series...</p>
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map(series => <SeriesCard key={series.id} series={series} />)}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center shadow-sm">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <Search className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-3">No series found</h3>
            <p className="text-sm text-slate-500 font-medium max-w-sm mx-auto leading-relaxed mb-6">
              We couldn't find any exam series matching your criteria. Try broader search terms.
            </p>
            <button
              onClick={clearAll}
              className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold px-6 py-3 rounded-xl hover:-translate-y-0.5 transition-all shadow-lg shadow-indigo-500/20"
            >
              Clear All Filters
            </button>
          </div>
        )}

      </main>

      {/* ── JOIN CTA (If logged out) ───────────────────────── */}
      {!isAuthenticated && (
        <section className="py-24 px-6 lg:px-12 text-center max-w-4xl mx-auto mt-10">
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold px-4 py-2 rounded-full mb-6 shadow-sm">
            <CheckCircle className="w-3.5 h-3.5" /> Start without a credit card
          </div>
          <h2 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mb-6">
            Get instant access to<br />
            <span className="bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">Free Series & Mocks</span>
          </h2>
          <p className="text-slate-500 text-lg mb-10 font-medium max-w-2xl mx-auto">
            Join the platform built for real serious aspirants. Track performance, analyze your mistakes, and boost your rankings globally.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-extrabold py-4 px-10 rounded-2xl shadow-xl shadow-indigo-500/30 hover:-translate-y-1 transition-all text-base flex items-center gap-2 justify-center">
              Register For Free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/login" className="bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-700 font-bold py-4 px-10 rounded-2xl hover:shadow-md hover:-translate-y-0.5 transition-all text-base flex items-center gap-2 justify-center">
              Login to Account
            </Link>
          </div>
        </section>
      )}

      {/* ── FOOTER ─────────────────────────────────────────── */}
      {/* Footer is now handled by PublicLayout */}
    </div>
  );
}
