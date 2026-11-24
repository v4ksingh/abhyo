import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, BookOpen, Video, PlayCircle, Clock, Layers,
  GraduationCap, ArrowRight, XCircle, CheckCircle,
  Building2, Flame, Users, Star, TrendingUp, Award,
  Zap, ChevronRight, Filter, BarChart2, Globe,
  Monitor, Cpu, Scale, Stethoscope, Train, Shield,
  Landmark, FlaskConical, BookMarked, Briefcase,
} from 'lucide-react';
import api from '../lib/api';
import { getImageUrl } from '../lib/imageUrl';

/* ─────────────────────────────────────────────
   Category icon map
───────────────────────────────────────────── */
const CAT_ICON = {
  'Banking':          <Landmark    size={14} />,
  'SSC':              <Award       size={14} />,
  'Railways':         <Train       size={14} />,
  'Defence':          <Shield      size={14} />,
  'UPSC':             <Globe       size={14} />,
  'State PSC':        <BarChart2   size={14} />,
  'Teaching':         <BookMarked  size={14} />,
  'Engineering':      <Cpu         size={14} />,
  'Medical':          <Stethoscope size={14} />,
  'Law':              <Scale       size={14} />,
  'CA / CS':          <Briefcase   size={14} />,
  'Computer':         <Monitor     size={14} />,
  'Science':          <FlaskConical size={14} />,
  'BCA':              <Monitor     size={14} />,
  'MCA':              <Cpu         size={14} />,
  'INFORMATION TECHNOLOGY': <Monitor size={14} />,
};
const getCatIcon = (cat) => CAT_ICON[cat] || <BookOpen size={14} />;

/* ─────────────────────────────────────────────
   Star Rating helper
───────────────────────────────────────────── */
function Stars({ n = 4.5 }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={10}
          className={i <= Math.round(n) ? 'text-amber-400' : 'text-gray-200'}
          fill={i <= Math.round(n) ? 'currentColor' : 'none'}
        />
      ))}
      <span className="ml-1 text-[10px] font-semibold text-amber-500">{n}</span>
    </span>
  );
}

/* ─────────────────────────────────────────────
   Course Card
───────────────────────────────────────────── */
function CourseCard({ course, index }) {
  const thumb    = getImageUrl(course.thumbnail);
  const instLogo = getImageUrl(course.institute?.logo);
  const isFree   = Number(course.price) === 0;
  const mods     = course.modules?.length || 0;
  const rating   = 4.3 + (index % 3) * 0.2;           // placeholder rating

  const gradients = [
    'from-violet-500 to-indigo-600',
    'from-indigo-500 to-blue-600',
    'from-blue-500 to-cyan-600',
    'from-rose-500 to-pink-600',
    'from-amber-500 to-orange-600',
    'from-emerald-500 to-teal-600',
  ];
  const grad = gradients[index % gradients.length];

  return (
    <Link
      to={`/c/${course.slug}`}
      className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-100/80 shadow-[0_2px_16px_rgba(99,102,241,0.07)] hover:shadow-[0_8px_40px_rgba(99,102,241,0.18)] hover:border-indigo-200 transition-all duration-300 hover:-translate-y-1.5"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* ── Thumbnail ── */}
      <div className="relative aspect-[16/9] overflow-hidden flex-shrink-0">
        {thumb ? (
          <img
            src={thumb}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-700"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${grad} flex items-center justify-center`}>
            <BookOpen size={44} className="text-white/40" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Price pill */}
        <div className="absolute top-3 left-3">
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-lg backdrop-blur-sm
            ${isFree
              ? 'bg-emerald-500 text-white'
              : 'bg-white/95 text-gray-900 border border-white/50'}`}>
            {isFree ? '🎁 FREE' : `₹${parseFloat(course.price).toLocaleString()}`}
          </span>
        </div>

        {/* Category chip */}
        {course.category && (
          <div className="absolute top-3 right-3">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md bg-gradient-to-r ${grad} text-white shadow-md`}>
              {course.category}
            </span>
          </div>
        )}

        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-2xl flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform duration-300">
            <PlayCircle size={24} className="text-indigo-600 ml-0.5" fill="currentColor" />
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="p-4 flex flex-col flex-1">

        {/* Institute row */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 overflow-hidden flex-shrink-0 flex items-center justify-center shadow-sm">
            {instLogo
              ? <img src={instLogo} alt="" className="w-full h-full object-cover" />
              : <span className="text-[10px] font-extrabold text-indigo-500">{course.institute?.name?.charAt(0) || 'I'}</span>
            }
          </div>
          <span className="text-[11px] text-gray-500 truncate font-semibold">
            {course.institute?.name || 'Institute'}
          </span>
          {course.institute?.city && (
            <span className="ml-auto text-[10px] text-gray-400 flex-shrink-0">
              📍 {course.institute.city}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-[14px] font-bold text-gray-900 leading-snug line-clamp-2 mb-2 group-hover:text-indigo-600 transition-colors duration-200 flex-1">
          {course.title}
        </h3>

        {/* Instructor */}
        {(course.instructorName || course.creator?.name) && (
          <p className="flex items-center gap-1.5 text-[11px] text-gray-500 mb-2">
            <span className="w-4 h-4 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <GraduationCap size={9} className="text-indigo-500" />
            </span>
            {course.instructorName || course.creator?.name}
          </p>
        )}

        {/* Rating */}
        <div className="mb-3">
          <Stars n={parseFloat(rating.toFixed(1))} />
        </div>

        {/* Divider */}
        <div className="border-t border-gray-50 pt-3 mt-auto">
          {/* Stats chips */}
          <div className="flex flex-wrap gap-x-3 gap-y-1.5">
            {course.liveClasses > 0 && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                {course.liveClasses} Live
              </span>
            )}
            {course.recordedClasses > 0 && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
                <PlayCircle size={10} /> {course.recordedClasses} Recorded
              </span>
            )}
            {mods > 0 && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                <Layers size={10} /> {mods} Modules
              </span>
            )}
            {course.courseDuration && (
              <span className="flex items-center gap-1 text-[11px] text-gray-400 ml-auto">
                <Clock size={10} /> {course.courseDuration}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Enroll CTA footer */}
      <div className="mx-4 mb-4">
        <div className={`w-full py-2 rounded-xl text-center text-[12px] font-bold bg-gradient-to-r ${grad} text-white opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300 shadow-md`}>
          View Course →
        </div>
      </div>
    </Link>
  );
}

/* ─────────────────────────────────────────────
   Skeleton Card
───────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="aspect-video bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100" />
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gray-100" />
          <div className="h-3 bg-gray-100 rounded-full w-28" />
        </div>
        <div className="h-4 bg-gray-100 rounded-lg w-full" />
        <div className="h-4 bg-gray-100 rounded-lg w-3/4" />
        <div className="h-3 bg-gray-100 rounded-full w-1/3" />
        <div className="pt-2 border-t border-gray-50 flex gap-2">
          <div className="h-5 bg-gray-100 rounded-full w-16" />
          <div className="h-5 bg-gray-100 rounded-full w-20" />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Stats pill
───────────────────────────────────────────── */
function StatPill({ icon, label, value }) {
  return (
    <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl px-4 py-2.5 shadow-sm">
      <span className="text-indigo-500">{icon}</span>
      <div>
        <p className="text-[11px] text-gray-400 leading-none">{label}</p>
        <p className="text-[13px] font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main Page
───────────────────────────────────────────── */
export default function CoursesPage() {
  const [courses, setCourses]       = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [catsLoading, setCatsLoading] = useState(true);
  const [search, setSearch]         = useState('');
  const [active, setActive]         = useState('');
  const [inputVal, setInputVal]     = useState('');
  const [isFocused, setIsFocused]   = useState(false);
  const dRef = useRef(null);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    (async () => {
      setCatsLoading(true);
      try {
        const res = await api.get('/public/course-categories');
        setCategories(res.data.data || []);
      } catch { /* silent */ } finally { setCatsLoading(false); }
    })();
  }, []);

  useEffect(() => {
    clearTimeout(dRef.current);
    dRef.current = setTimeout(() => setSearch(inputVal), 350);
    return () => clearTimeout(dRef.current);
  }, [inputVal]);

  useEffect(() => { fetchCourses(); }, [search, active]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (active && active !== 'All') params.category = active;
      const res = await api.get('/public/courses', { params });
      setCourses(res.data.data || []);
    } catch { /* silent */ } finally { setLoading(false); }
  };

  const clearAll = () => { setInputVal(''); setSearch(''); setActive(''); };
  const hasFilter = search || (active && active !== 'All');
  const allCats = ['All', ...categories];

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg,#f0f4ff 0%,#f8f4ff 40%,#fff5f5 100%)', fontFamily: "'Outfit', 'Inter', sans-serif" }}>

      {/* ════ HERO ════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden">
        {/* Animated blobs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-200/40 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute -top-20 right-0 w-80 h-80 bg-violet-200/30 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
        <div className="absolute top-32 left-1/2 w-64 h-64 bg-pink-100/30 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s', animationDelay: '2s' }} />

        {/* Dot pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle,#6366f1 1px,transparent 1px)',
          backgroundSize: '28px 28px',
        }} />

        <div className="relative pt-28 pb-14 px-6">
          <div className="max-w-4xl mx-auto text-center">

            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-sm border border-indigo-100 text-indigo-600 text-xs font-bold px-4 py-1.5 rounded-full mb-6 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
              LIVE &amp; RECORDED COURSES
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] mb-5">
              <span className="text-gray-900">India's Best</span>{' '}
              <span className="relative">
                <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-500 bg-clip-text text-transparent">
                  Courses
                </span>
                <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 200 8" fill="none" preserveAspectRatio="none">
                  <path d="M0 6 Q50 0 100 4 Q150 8 200 2" stroke="url(#ul)" strokeWidth="3" strokeLinecap="round"/>
                  <defs>
                    <linearGradient id="ul" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#6366f1"/>
                      <stop offset="100%" stopColor="#ec4899"/>
                    </linearGradient>
                  </defs>
                </svg>
              </span>
              <span className="text-gray-900">, All in One Place</span>
            </h1>

            <p className="text-gray-500 text-lg max-w-xl mx-auto mb-8 leading-relaxed">
              Live batches, recorded content &amp; expert faculty — handpicked from <span className="font-semibold text-indigo-600">top coaching institutes</span> across India.
            </p>

            {/* Search bar */}
            <div className="relative max-w-2xl mx-auto mb-8">
              <div className={`absolute inset-0 rounded-2xl transition-all duration-300 ${isFocused ? 'shadow-[0_0_0_3px_rgba(99,102,241,0.2)] bg-white' : 'shadow-lg bg-white'}`} />
              <div className="relative flex items-center">
                <Search className={`absolute left-4 w-5 h-5 pointer-events-none transition-colors duration-200 ${isFocused ? 'text-indigo-500' : 'text-gray-400'}`} />
                <input
                  type="text"
                  value={inputVal}
                  onChange={e => setInputVal(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="Search courses, topics, or institutes..."
                  className="relative w-full bg-transparent rounded-2xl py-4 pl-12 pr-14 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none"
                />
                {inputVal ? (
                  <button onClick={() => setInputVal('')} className="absolute right-4 text-gray-300 hover:text-gray-500 transition-colors">
                    <XCircle size={18} />
                  </button>
                ) : (
                  <div className="absolute right-3 bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl">
                    Search
                  </div>
                )}
              </div>
            </div>

            {/* Trust stats */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <StatPill icon={<BookOpen size={15} />} label="Total Courses" value={`${courses.length > 0 ? courses.length + '+' : '...'}`} />
              <StatPill icon={<Building2 size={15} />} label="Institutes" value="50+" />
              <StatPill icon={<Users size={15} />} label="Students" value="10,000+" />
              <StatPill icon={<TrendingUp size={15} />} label="Subjects" value={`${categories.length > 0 ? categories.length : '...'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* ════ BODY ════════════════════════════════════════════════ */}
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-8 flex gap-7">

        {/* ── SIDEBAR ─────────────────────────────────────────── */}
        <aside className="hidden lg:block w-60 flex-shrink-0">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-white shadow-[0_4px_24px_rgba(99,102,241,0.08)] p-5 sticky top-28">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Filter size={12} className="text-indigo-600" />
                </div>
                <h2 className="text-xs font-extrabold text-gray-700 uppercase tracking-widest">Category</h2>
              </div>
              {hasFilter && (
                <button onClick={clearAll} className="text-[11px] text-indigo-500 font-bold hover:text-indigo-700 transition-colors">
                  Clear ✕
                </button>
              )}
            </div>

            {catsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-9 bg-gray-100 rounded-xl animate-pulse" style={{ opacity: 1 - i * 0.15 }} />
                ))}
              </div>
            ) : (
              <ul className="space-y-1">
                {allCats.map(cat => {
                  const isActive = (active === cat) || (cat === 'All' && !active);
                  return (
                    <li key={cat}>
                      <button
                        onClick={() => setActive(cat === 'All' ? '' : cat)}
                        className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2.5 transition-all duration-200 group/cat ${
                          isActive
                            ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-200'
                            : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-700'
                        }`}
                      >
                        <span className={`flex-shrink-0 transition-transform duration-200 group-hover/cat:scale-110 ${isActive ? 'text-white' : 'text-indigo-400'}`}>
                          {cat === 'All' ? <Zap size={14} /> : getCatIcon(cat)}
                        </span>
                        <span className="flex-1">{cat}</span>
                        {isActive
                          ? <CheckCircle size={13} className="flex-shrink-0 text-white/80" />
                          : <ChevronRight size={12} className="flex-shrink-0 text-gray-300 group-hover/cat:text-indigo-400 transition-colors" />
                        }
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {/* Bottom CTA in sidebar */}
            <div className="mt-5 pt-4 border-t border-gray-100">
              <Link to="/institutes" className="block text-center bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 text-indigo-700 font-bold text-xs px-4 py-2.5 rounded-xl hover:from-indigo-100 hover:to-violet-100 transition-all">
                🏫 For Institutes →
              </Link>
            </div>
          </div>
        </aside>

        {/* ── MAIN ─────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">

          {/* Mobile scroll categories */}
          <div className="lg:hidden flex gap-2 overflow-x-auto pb-2 mb-5 hide-scrollbar">
            {catsLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex-shrink-0 h-8 w-24 bg-gray-100 rounded-full animate-pulse" />
                ))
              : allCats.map(cat => {
                  const isActive = (active === cat) || (cat === 'All' && !active);
                  return (
                    <button
                      key={cat}
                      onClick={() => setActive(cat === 'All' ? '' : cat)}
                      className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md'
                          : 'bg-white border border-gray-200 text-gray-600 shadow-sm'
                      }`}
                    >
                      {getCatIcon(cat)} {cat}
                    </button>
                  );
                })
            }
          </div>

          {/* Header row */}
          <div className="flex items-center justify-between mb-6">
            <div>
              {loading
                ? <div className="h-5 w-36 bg-gray-200 animate-pulse rounded-lg" />
                : (
                  <p className="text-sm font-semibold text-gray-600">
                    <span className="text-2xl font-extrabold text-gray-900 mr-1">{courses.length}</span>
                    course{courses.length !== 1 ? 's' : ''} found
                    {active && active !== 'All' && (
                      <span> in <span className="text-indigo-600 font-bold">{active}</span></span>
                    )}
                    {search && (
                      <span> for "<span className="text-indigo-600">{search}</span>"</span>
                    )}
                  </p>
                )
              }
            </div>
            {hasFilter && (
              <button
                onClick={clearAll}
                className="flex items-center gap-1.5 text-xs font-bold text-red-500 bg-red-50 border border-red-100 px-3 py-1.5 rounded-full hover:bg-red-100 transition-colors shadow-sm"
              >
                <XCircle size={13} /> Clear filters
              </button>
            )}
          </div>

          {/* Loading skeleton */}
          {loading && (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {/* Empty state */}
          {!loading && courses.length === 0 && (
            <div className="flex flex-col items-center justify-center py-28 bg-white/80 backdrop-blur-sm rounded-3xl border border-white shadow-[0_4px_32px_rgba(99,102,241,0.08)] text-center">
              <div className="relative mb-6">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center shadow-inner">
                  <Building2 size={38} className="text-indigo-300" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center shadow-sm">
                  <Star size={14} className="text-amber-400" fill="currentColor" />
                </div>
              </div>
              <h3 className="text-2xl font-extrabold text-gray-800 mb-2">No Courses Found</h3>
              <p className="text-gray-400 text-sm max-w-xs leading-relaxed mb-6">
                {hasFilter
                  ? 'Try a different category or clear your search filters.'
                  : 'Courses will appear here once institutes publish them.'}
              </p>
              {hasFilter && (
                <button
                  onClick={clearAll}
                  className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-sm font-bold px-8 py-3 rounded-xl transition-all shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-0.5"
                >
                  Show All Courses
                </button>
              )}
            </div>
          )}

          {/* Course grid */}
          {!loading && courses.length > 0 && (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {courses.map((c, i) => <CourseCard key={c.id} course={c} index={i} />)}
            </div>
          )}
        </div>
      </div>

      {/* ════ BOTTOM CTA ════════════════════════════════════════ */}
      {!loading && (
        <div className="max-w-[1400px] mx-auto px-6 pb-16 mt-4">
          <div className="relative rounded-3xl overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-700" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.12),transparent_60%)]" />
            {/* Animated shapes */}
            <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-white/5 rounded-full" />
            <div className="absolute -top-10 right-1/3 w-32 h-32 bg-white/5 rounded-full" />
            <div className="absolute top-4 right-12 w-16 h-16 bg-white/10 rounded-2xl rotate-12" />

            <div className="relative p-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-white">
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white/90 text-xs font-bold px-3 py-1 rounded-full mb-3">
                  <Building2 size={11} /> FOR COACHING INSTITUTES
                </div>
                <h2 className="text-3xl font-extrabold mb-2 leading-tight">
                  Reach Thousands of<br />
                  <span className="text-yellow-300">Eager Learners</span> Instantly
                </h2>
                <p className="text-indigo-200 text-sm leading-relaxed max-w-sm">
                  Publish your courses on Abhyo and tap into a growing community of motivated students across India.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
                <Link
                  to="/institutes"
                  className="flex items-center justify-center gap-2 bg-white text-indigo-700 font-extrabold text-sm px-7 py-3.5 rounded-xl hover:-translate-y-0.5 hover:shadow-xl transition-all shadow-lg"
                >
                  Get Started Free <ArrowRight size={15} />
                </Link>
                <Link
                  to="/pricing"
                  className="flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border border-white/30 text-white font-bold text-sm px-7 py-3.5 rounded-xl hover:bg-white/20 transition-all"
                >
                  View Pricing
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
