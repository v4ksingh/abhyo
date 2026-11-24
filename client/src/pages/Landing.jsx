import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import useAuthStore from '../store/authStore';
import { getImageUrl as getImgUrl } from '../lib/imageUrl';
import usePageMeta from '../hooks/usePageMeta';
import {
  Trophy, BarChart3, Users, Building2, BookOpen,
  CheckCircle, ArrowRight, Star, Sparkles, ShieldCheck, Zap,
  Clock, Award, TrendingUp, Globe, ChevronRight, Play,
  Flame, FileText, BarChart2, Languages, Target, Search,
  Calendar, GraduationCap, Medal, X, Loader2
} from 'lucide-react';

// ─── Data ────────────────────────────────────────────────────────────────────

const defaultCategories = [
  { name: 'Abhyo Olympiad', tests: 'Class 6-12', icon: '🏆', color: 'from-amber-500 to-yellow-500', bg: 'bg-amber-50', link: '/olympiad' },
  { name: 'UPSC CSE', tests: '150+', icon: '🏛️', color: 'from-orange-500 to-amber-500', bg: 'bg-orange-50' },
  { name: 'SSC', tests: '250+', icon: '🎯', color: 'from-rose-500 to-pink-500', bg: 'bg-rose-50' },
  { name: 'Banking', tests: '200+', icon: '🏦', color: 'from-violet-500 to-purple-500', bg: 'bg-violet-50' },
  { name: 'Railway', tests: '100+', icon: '🚄', color: 'from-cyan-500 to-sky-500', bg: 'bg-cyan-50' },
  { name: 'BPSC', tests: '120+', icon: '⚡', color: 'from-blue-500 to-indigo-500', bg: 'bg-blue-50' },
  { name: 'JSSC', tests: '80+', icon: '🌿', color: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50' },
  { name: 'Defence', tests: '75+', icon: '🛡️', color: 'from-slate-600 to-slate-700', bg: 'bg-slate-50' },
  { name: 'State PCS', tests: '180+', icon: '📜', color: 'from-amber-500 to-yellow-500', bg: 'bg-amber-50' },
];

const QUICK_SEARCH_CHIPS = [
  { label: 'Abhyo Olympiad 2026', url: '/olympiad', icon: '🏆', badge: 'Class 6–12 • Live' },
  { label: 'UPSC CSE Prelims', url: '/categories?category=UPSC%20CSE', icon: '🏛️', badge: 'Civil Services' },
  { label: 'SSC CGL Tier-I', url: '/categories?category=SSC', icon: '🎯', badge: 'Staff Selection' },
  { label: 'Banking & PO Exams', url: '/categories?category=Banking', icon: '🏦', badge: 'IBPS / SBI' },
  { label: 'Railways RRB Group D', url: '/categories?category=Railway', icon: '🚄', badge: 'Railway Exams' },
  { label: 'BPSC & State PCS', url: '/categories?category=BPSC', icon: '⚡', badge: 'State PSC' },
  { label: 'Online Courses', url: '/courses', icon: '🎓', badge: 'Live & Recorded' },
  { label: 'Video Series', url: '/video-series', icon: '🎥', badge: 'Video Lectures' },
];

const stats = [
  { value: '10K+', label: 'Active Students', icon: Users },
  { value: '500+', label: 'Mock Tests', icon: BookOpen },
  { value: '200+', label: 'Institutes', icon: Building2 },
  { value: '95%', label: 'Success Rate', icon: Trophy },
];

const features = [
  { icon: BarChart3, title: 'Deep Analytics', desc: 'Pinpoint weak areas with subject-level & question-level insights. Compare with national percentile rankings.', color: 'indigo' },
  { icon: Zap, title: 'Smart Test Engine', desc: 'Auto-submit, sectional timers, negative marking, and shuffle — exactly like the real CBT interface.', color: 'emerald' },
  { icon: Globe, title: 'Bilingual Support', desc: 'Switch language on the fly. Full Hindi & English support for every exam and detailed solution.', color: 'amber' },
  { icon: ShieldCheck, title: 'Institute Control Panel', desc: 'White-label ready LMS for coaching centers to manage students, batches, and automate tests.', color: 'violet' },
  { icon: BookOpen, title: 'Curated Study Notes', desc: 'High-quality PDF notes and expert-curated solution banks assigned to every test series.', color: 'rose' },
  { icon: Target, title: 'Realistic Environment', desc: 'Timed, full-screen proctored environment mirroring actual exams like UPSC, SSC, and Banking.', color: 'sky' },
];

const featureColors = {
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100', glow: 'shadow-indigo-100', groupHover: 'group-hover:text-indigo-600' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', glow: 'shadow-emerald-100', groupHover: 'group-hover:text-emerald-600' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', glow: 'shadow-amber-100', groupHover: 'group-hover:text-amber-600' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-100', glow: 'shadow-violet-100', groupHover: 'group-hover:text-violet-600' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100', glow: 'shadow-rose-100', groupHover: 'group-hover:text-rose-600' },
  sky: { bg: 'bg-sky-50', text: 'text-sky-600', border: 'border-sky-100', glow: 'shadow-sky-100', groupHover: 'group-hover:text-sky-600' },
};

const examCategoryTabs = [
  {
    id: 'upcoming', label: 'Upcoming', icon: Clock,
    description: 'Latest scheduled government exams 2026. Practice with up-to-date patterns.',
    exams: [
      { name: 'Railways RRB Group D 2026', date: 'To be Announced', icon: '🚄' },
      { name: 'SSC CGL Tier-I (2026)', date: 'May – June 2026', icon: '🎯' },
      { name: 'SSC Selection Post 2026 (HSC)', date: 'May – July 2026', icon: '📜' },
      { name: 'SSC Selection Post 2026 (Matric)', date: 'May – July 2026', icon: '📜' },
      { name: 'SSC CHSL Tier-I (2026)', date: 'July – Sep 2026', icon: '🎯' },
      { name: 'UPSC CSE Prelims 2026', date: 'May 2026', icon: '🏛️' },
    ],
  },
  {
    id: 'state', label: 'State', icon: Globe,
    description: 'State Civil Services and government recruitment with localised content.',
    exams: [
      { name: 'BPSC 70th Prelims', date: 'Ongoing', icon: '⚡' },
      { name: 'UPPSC PCS 2025', date: 'March 2025', icon: '🏛️' },
      { name: 'JSSC CGL 2025', date: 'July 2025', icon: '🌿' },
      { name: 'MPPSC Prelims', date: 'April 2025', icon: '📜' },
    ],
  },
  {
    id: 'central', label: 'Central', icon: Award,
    description: 'All-India level exams conducted by central government bodies.',
    exams: [
      { name: 'UPSC CSE Prelims 2025', date: 'May 2025', icon: '🏛️' },
      { name: 'SSC GD Constable', date: 'February 2025', icon: '🎯' },
      { name: 'UPSC NDA/NA', date: 'April 2025', icon: '🎖️' },
    ],
  },
  {
    id: 'computer', label: 'Computer', icon: Zap,
    description: 'Certification and promotion exams for IT and computer-related roles.',
    exams: [
      { name: 'CPCT MP 2025', date: 'Bi-monthly', icon: '💻' },
      { name: 'NIELIT CCC', date: 'Monthly', icon: '🖱️' },
    ],
  },
  {
    id: 'school', label: 'School & Olympiad', icon: Trophy,
    description: 'National Olympiads for Class 6-12, premier school entrances, and foundation modules.',
    exams: [
      { name: 'Abhyo National Math Olympiad', date: 'Registrations Open', icon: '📐', link: '/olympiad' },
      { name: 'Abhyo National Science Olympiad', date: 'Registrations Open', icon: '🔬', link: '/olympiad' },
      { name: 'Abhyo Coding & Tech Olympiad', date: 'Registrations Open', icon: '💻', link: '/olympiad' },
      { name: 'Abhyo Logical Reasoning Olympiad', date: 'Registrations Open', icon: '🧠', link: '/olympiad' },
      { name: 'Navodaya Entrance Exam', date: 'Jan 2026', icon: '🏫' },
      { name: 'Sainik School Entrance', date: 'Jan 2026', icon: '🪖' },
    ],
  },
];

const testimonials = [
  { name: 'Priya Sharma', role: 'UPSC Aspirant', img: 'https://i.pravatar.cc/100?img=47', text: 'Abhyo helped me identify weak spots in Geography. I improved my score by 34% in just 3 months!' },
  { name: 'Rahul Kumar', role: 'SSC CGL Selected', img: 'https://i.pravatar.cc/100?img=32', text: 'The test environment is exactly like the real exam. I cleared SSC CGL on my very first attempt.' },
  { name: 'Anjali Singh', role: 'BPSC Qualified', img: 'https://i.pravatar.cc/100?img=25', text: 'Best platform for BPSC preparation. The bilingual support made everything easy to understand.' },
];

const navLinks = [
  { label: 'Exam Series', to: '/exam-series' },
  { label: 'Video Series', to: '/video-series' },
  { label: 'Live Tests', to: '/live-test' },
  { label: 'Pricing', to: '/plans' },
  { label: 'For Institutes', to: '/#institutes' },
  { label: 'Features', to: '/#features' },
];

const footerLinks = [
  { title: 'Platform', links: [{ label: 'Exam Series', to: '/exam-series' }, { label: 'Video Series', to: '/video-series' }, { label: 'Live Tests', to: '/live-test' }, { label: 'Pricing', to: '/plans' }, { label: 'For Institutes', to: '/#institutes' }] },
  { title: 'Exams', links: [{ label: 'UPSC', to: '#' }, { label: 'SSC', to: '#' }, { label: 'Banking', to: '#' }, { label: 'Railway', to: '#' }, { label: 'State PCS', to: '#' }] },
  { title: 'Company', links: [{ label: 'About Us', to: '#' }, { label: 'Blog', to: '#' }, { label: 'Contact', to: '#' }, { label: 'Privacy Policy', to: '#' }] },
];

// ── CatIcon — shows real category image, falls back to emoji ────────────────
function CatIcon({ cat, getImageUrl }) {
  const [imgErr, setImgErr] = useState(false);
  const url = getImageUrl(cat.image);
  return (
    <div className="w-20 h-20 rounded-full border border-slate-100 shadow-sm overflow-hidden bg-white flex items-center justify-center group-hover:scale-110 group-hover:shadow-md transition-all duration-300">
      {url && !imgErr ? (
        <img
          src={url}
          alt={cat.name}
          className="w-full h-full object-contain p-1.5"
          onError={() => setImgErr(true)}
        />
      ) : (
        <div className={`w-full h-full flex items-center justify-center text-3xl bg-gradient-to-br ${cat.color}`}>
          {cat.icon}
        </div>
      )}
    </div>
  );
}

// ── InstituteMarqueeRow — infinite horizontal scroll of institute cards ────────
const PLACEHOLDER_INSTITUTES = [
  { id: 'p1', name: 'Vidya Mandir IAS', city: 'Delhi', state: 'Delhi', tagline: 'Gateway to IAS Success', subscriptionPlan: 'pro' },
  { id: 'p2', name: 'Triumph Academy', city: 'Patna', state: 'Bihar', tagline: 'Bihar\'s #1 BPSC Coaching', subscriptionPlan: 'enterprise' },
  { id: 'p3', name: 'Apex SSC Centre', city: 'Lucknow', state: 'UP', tagline: 'Crack SSC With Confidence', subscriptionPlan: 'basic' },
  { id: 'p4', name: 'BankPro Institute', city: 'Mumbai', state: 'Maharashtra', tagline: 'Banking Exams Simplified', subscriptionPlan: 'pro' },
  { id: 'p5', name: 'RailwayEdge', city: 'Ranchi', state: 'Jharkhand', tagline: 'Railway Recruitment Experts', subscriptionPlan: 'basic' },
  { id: 'p6', name: 'ShieldDefence', city: 'Chandigarh', state: 'Punjab', tagline: 'NDA, CDS & AFCAT Prep', subscriptionPlan: 'enterprise' },
  { id: 'p7', name: 'UPSCPathfinder', city: 'Jaipur', state: 'Rajasthan', tagline: 'Inspiring Civil Servants', subscriptionPlan: 'pro' },
  { id: 'p8', name: 'StatePCS Hub', city: 'Bhopal', state: 'MP', tagline: 'State PCS Specialists', subscriptionPlan: 'basic' },
];

const planGradients = {
  enterprise: 'from-amber-400 to-orange-500',
  pro: 'from-indigo-400 to-violet-500',
  basic: 'from-emerald-400 to-teal-500',
  free: 'from-slate-400 to-slate-500',
};
const planLabel = { enterprise: 'Enterprise', pro: 'Pro', basic: 'Basic', free: 'Free' };
const avatarColors = ['from-indigo-500 to-violet-500', 'from-rose-500 to-pink-500', 'from-amber-500 to-orange-500', 'from-emerald-500 to-teal-500', 'from-sky-500 to-cyan-500', 'from-fuchsia-500 to-purple-500'];

function InstituteCard({ inst, idx }) {
  const [logoErr, setLogoErr] = useState(false);
  const logoUrl = getImgUrl(inst.logo);
  const plan = inst.subscriptionPlan || 'free';
  const grad = planGradients[plan] || planGradients.free;
  const initials = (inst.name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const rating = inst.rating || (4.5 + (idx % 5) * 0.1).toFixed(1);
  const reviews = inst.reviews || 120 + (idx * 23);
  const mockExams = [['UPSC', 'State PCS'], ['SSC', 'Railways'], ['Banking', 'Insurance'], ['NDA', 'CDS'], ['BPSC', 'JSSC']];
  const exams = inst.exams || mockExams[idx % mockExams.length];
  const mockTests = inst.totalTests || (100 + idx * 50);

  return (
    <div className="flex-shrink-0 w-[300px] sm:w-[340px] h-full bg-white border border-slate-200/70 rounded-[24px] p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-indigo-200 transition-all duration-300 group cursor-pointer select-none flex flex-col justify-between">
      <div>
        <div className="flex items-start gap-4 mb-4">
          {/* Logo */}
          <div className="w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center flex-shrink-0 shadow-sm border border-slate-100 relative">
            {logoUrl && !logoErr ? (
              <img src={logoUrl} alt={inst.name} className="w-full h-full object-cover" onError={() => setLogoErr(true)} />
            ) : (
              <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${avatarColors[idx % avatarColors.length]} text-white font-black text-sm`}>
                {initials}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
              <CheckCircle className="w-3 h-3 text-white" />
            </div>
          </div>

          {/* Name + Details */}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-base font-black text-slate-900 leading-tight truncate group-hover:text-indigo-600 transition-colors" title={inst.name}>{inst.name}</h4>
              <span className={`flex-shrink-0 text-[9px] font-black uppercase tracking-widest text-white px-2 py-0.5 rounded-md bg-gradient-to-r ${grad}`}>
                {planLabel[plan] || 'Free'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 mt-1.5">
              <div className="flex items-center gap-1 bg-amber-50 px-1.5 py-0.5 rounded text-[10px] font-black text-amber-600 border border-amber-100">
                <Star className="w-2.5 h-2.5 fill-amber-500" /> {rating}
              </div>
              <span className="text-[10px] font-semibold text-slate-400 truncate">({reviews} reviews)</span>
            </div>
          </div>
        </div>

        {/* Location & Exams */}
        <div className="flex items-center gap-3 mb-4 text-xs font-semibold text-slate-500">
          <p className="flex items-center gap-1">
            <span className="text-slate-300">📍</span> {[inst.city, inst.state].filter(Boolean).join(', ') || 'India'}
          </p>
          <div className="w-1 h-1 rounded-full bg-slate-300"></div>
          <p className="truncate flex-1">Exams: <span className="text-slate-700 font-bold">{exams.join(', ')}</span></p>
        </div>

        {/* Tagline */}
        {inst.tagline && (
          <p className="text-sm text-slate-500 font-medium leading-relaxed italic line-clamp-2 mb-4">"{inst.tagline}"</p>
        )}
      </div>

      {/* Stats - pushed to bottom */}
      <div className="flex gap-4 mt-auto pt-4 border-t border-slate-100">
        <div className="text-center flex-1">
          <p className="text-sm font-black text-slate-800">{inst.totalStudents > 0 ? `${inst.totalStudents}+` : '—'}</p>
          <p className="text-[10px] text-slate-400 font-semibold">Students</p>
        </div>
        {!!inst.foundedYear && (
          <div className="text-center flex-1 border-l border-slate-100">
            <p className="text-sm font-black text-slate-800">{inst.foundedYear}</p>
            <p className="text-[10px] text-slate-400 font-semibold">Since</p>
          </div>
        )}
        <div className="text-center flex-1 border-l border-slate-100">
          <p className="text-sm font-black text-slate-800">{mockTests}+</p>
          <p className="text-[10px] text-slate-400 font-semibold">Mock Tests</p>
        </div>
      </div>
    </div>
  );
}

function InstituteMarqueeRow({ institutes }) {
  const list = institutes.length > 0 ? institutes : PLACEHOLDER_INSTITUTES;
  return (
    <div className="w-full">
      <div className="flex overflow-x-auto gap-4 sm:gap-6 px-5 sm:px-10 pb-10 pt-4 snap-x snap-mandatory" style={{ scrollbarWidth: 'none' }}>
        {list.map((inst, i) => (
          <div key={`${inst.id || i}-${i}`} className="snap-center sm:snap-start shrink-0 flex items-stretch">
            <InstituteCard inst={inst} idx={i} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LandingPage() {
  usePageMeta({
    title: 'Free Mock Tests for SSC, UPSC, Banking, Railway – Abhyo',
    description: 'Practice with 500+ free and premium mock tests for SSC, UPSC, Banking, Railway, BPSC, JSSC, and NDA. Smart analytics, bilingual support, and real exam interface.',
    canonical: '/',
  });

  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchContainerRef = useRef(null);
  const [fetchedCategories, setFetchedCategories] = useState(defaultCategories);
  const [activeCategoryTab, setActiveCategoryTab] = useState('upcoming');
  const [visibleSections, setVisibleSections] = useState(new Set());
  const [featuredInstitutes, setFeaturedInstitutes] = useState([]);
  const sectionRefs = useRef({});
  const [heroSlide, setHeroSlide] = useState(0);

  // Auto-advance hero slides every 5.5s
  useEffect(() => {
    const timer = setInterval(() => {
      setHeroSlide((prev) => (prev + 1) % 3);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  // Image URLs use the shared helper (relative paths, proxied by Vite — works on all network devices)
  const getImageUrl = (image) => getImgUrl(image);

  // Prepare marquee categories: repeat items so base set has >= 18 items, then duplicate for a seamless 0% -> -50% infinite loop
  const repeatCount = Math.max(2, Math.ceil(18 / (fetchedCategories.length || 1)));
  const baseCategoryList = [];
  for (let r = 0; r < repeatCount; r++) {
    baseCategoryList.push(...fetchedCategories);
  }
  const marqueeCategoryList = [...baseCategoryList, ...baseCategoryList];

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced live search across all content
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await api.get('/public/search', { params: { q } });
        setSearchResults(res.data?.data || []);
      } catch {
        // Instant client fallback
        const qLower = q.toLowerCase();
        const matches = [];
        if ('olympiad national school class 6 7 8 9 10 11 12'.includes(qLower) || qLower.includes('olympiad')) {
          matches.push({
            id: 'oly-quick',
            type: 'olympiad',
            title: 'Abhyo National Olympiad 2026',
            subtitle: 'Class 6–12 • ₹10 Lakh+ Prize Pool',
            icon: 'trophy',
            url: '/olympiad',
            badge: 'Olympiad Live'
          });
        }
        defaultCategories.forEach(c => {
          if (c.name.toLowerCase().includes(qLower)) {
            matches.push({
              id: `cat-${c.name}`,
              type: 'category',
              title: c.name,
              subtitle: `${c.tests || '100+'} Mock Tests available`,
              icon: 'target',
              url: c.link || `/categories?category=${encodeURIComponent(c.name)}`,
              badge: 'Exam Category'
            });
          }
        });
        setSearchResults(matches);
      } finally {
        setSearchLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle Form Submit / Search Button / Enter
  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    const q = searchQuery.trim();
    setSearchFocused(false);

    if (!q) {
      navigate('/categories');
      return;
    }

    const qLower = q.toLowerCase();

    // 1. Olympiad intent
    if (qLower.includes('olympiad') || qLower.includes('medal') || qLower.includes('prize') || qLower.includes('award') || /class\s*[6-9]|class\s*1[0-2]/i.test(qLower)) {
      navigate('/olympiad');
      return;
    }

    // 2. Exact or partial Category match
    const matchedCat = defaultCategories.find(c =>
      c.name.toLowerCase().includes(qLower) || qLower.includes(c.name.toLowerCase())
    );
    if (matchedCat) {
      navigate(matchedCat.link || `/categories?category=${encodeURIComponent(matchedCat.name)}`);
      return;
    }

    // 3. Courses intent
    if (qLower.includes('course') || qLower.includes('batch') || qLower.includes('class')) {
      navigate('/courses');
      return;
    }

    // 4. Video series intent
    if (qLower.includes('video') || qLower.includes('lecture')) {
      navigate('/video-series');
      return;
    }

    // 5. eBook / Study Notes intent
    if (qLower.includes('ebook') || qLower.includes('book') || qLower.includes('pdf') || qLower.includes('note')) {
      navigate('/ebooks');
      return;
    }

    // 6. Institute intent
    if (qLower.includes('institute') || qLower.includes('coaching') || qLower.includes('academy')) {
      navigate('/institutes');
      return;
    }

    // 7. General Mock Tests Search
    navigate(`/tests?search=${encodeURIComponent(q)}`);
  };

  const handleSelectResult = (url) => {
    setSearchFocused(false);
    navigate(url);
  };

  useEffect(() => {
    // Intersection Observer for scroll animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set([...prev, entry.target.dataset.section]));
          }
        });
      },
      { threshold: 0.1 }
    );
    Object.values(sectionRefs.current).forEach((el) => el && observer.observe(el));

    const fetchCats = async () => {
      try {
        const [catRes, statsRes] = await Promise.all([
          api.get('/categories/public'),
          api.get('/tests/category-stats'),
        ]);
        const cats = catRes.data.data || [];
        const statsData = statsRes.data.data?.byCategory || {};
        if (cats.length > 0) {
          const merged = cats.map((c, i) => {
            const fb = defaultCategories.find((d) => d.name === c.name) || defaultCategories[i % defaultCategories.length];
            return { name: c.name, tests: `${statsData[c.name]?.total || 0}+`, icon: fb.icon, color: fb.color, bg: fb.bg, image: c.image || null, link: fb.link || null };
          });
          // Ensure Abhyo Olympiad is always prominently in the category list
          const hasOly = merged.some((c) => c.name.toLowerCase().includes('olympiad'));
          if (!hasOly) {
            merged.unshift(defaultCategories[0]);
          }
          setFetchedCategories(merged);
        }
      } catch { /* keep defaults */ }
    };
    fetchCats();

    const fetchInstitutes = async () => {
      try {
        const res = await api.get('/public/institutes', { params: { limit: 20 } });
        const list = res.data?.data || [];
        if (list.length > 0) setFeaturedInstitutes(list);
      } catch { /* keep placeholder institutes */ }
    };
    fetchInstitutes();

    return () => {
      observer.disconnect();
    };
  }, []);

  const ref = (key) => (el) => { sectionRefs.current[key] = el; if (el) el.dataset.section = key; };
  const visible = (key) => visibleSections.has(key);
  const fadeUp = (key, delay = 0) =>
    `transition-all duration-700 ${delay ? `delay-[${delay}ms]` : ''} ${visible(key) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`;

  const activeTab = examCategoryTabs.find((t) => t.id === activeCategoryTab);

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans overflow-x-hidden">

      {/* ── AMBIENT BG ──────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 -left-32 w-[600px] h-[600px] bg-indigo-100 rounded-full blur-[120px] opacity-40" />
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-violet-100 rounded-full blur-3xl opacity-30" />
        <div className="absolute bottom-0 left-1/3 w-[500px] h-[500px] bg-emerald-50 rounded-full blur-[100px] opacity-50" />
      </div>

      {/* Nav is now handled by PublicLayout */}

      {/* ═══════════════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════════════════ */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@800;900&display=swap');
        @keyframes floatUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes floatDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes floatLeft { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes floatBob { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-6px); } }
        @keyframes marqueeLeft { 0% { transform: translateX(0%); } 100% { transform: translateX(-50%); } }
        @keyframes marqueeRight { 0% { transform: translateX(-50%); } 100% { transform: translateX(0%); } }
        @keyframes textReveal { 0% { opacity: 0; transform: translateY(30px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes gradientMove { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        
        .hero-card-1 { animation: floatDown 0.7s ease-out 0.3s both, floatBob 4s ease-in-out 1.2s infinite; }
        .hero-card-2 { animation: floatUp 0.7s ease-out 0.5s both, floatBob 4s ease-in-out 1.6s infinite; }
        .hero-card-3 { animation: floatLeft 0.7s ease-out 0.7s both, floatBob 4s ease-in-out 2s infinite; }
        .marquee-left { animation: marqueeLeft 35s linear infinite; }
        .marquee-right { animation: marqueeRight 35s linear infinite; }
        .marquee-left:hover, .marquee-right:hover { animation-play-state: paused; }

        @keyframes marqueeCatsSlow {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .marquee-cats-track {
          display: flex;
          width: max-content;
          will-change: transform;
          animation: marqueeCatsSlow 55s linear infinite;
        }
        .marquee-cats-track:hover {
          animation-play-state: paused;
        }
        
        .hero-headline { font-family: 'Outfit', sans-serif; }
        .animate-text-reveal-1 { animation: textReveal 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; opacity: 0; }
        .animate-text-reveal-2 { animation: textReveal 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) 0.2s forwards; opacity: 0; }
        .animate-gradient-text { background-size: 200% auto; animation: gradientMove 3s linear infinite; }
      `}</style>
      <section className="relative pt-24 sm:pt-28 lg:pt-32 pb-6 overflow-visible" style={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 30%, #e0e7ff 60%, #f0f9ff 100%)' }}>
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 pointer-events-none opacity-30 overflow-hidden" style={{ backgroundImage: 'radial-gradient(circle, #c4b5fd 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        {/* Two-column layout: left padded, right bleeds to edge */}
        <div className="flex flex-col lg:flex-row items-stretch lg:min-h-[520px]">

          {/* LEFT CONTENT — padded with high z-index for dropdowns */}
          <div className="flex-1 px-6 lg:pl-14 xl:pl-20 lg:pr-6 pt-2 pb-6 sm:py-4 lg:py-6 relative z-40 flex flex-col justify-center">

            {/* Top Badges */}
            <div className="flex flex-wrap items-center gap-2.5 mb-4 md:mb-6 animate-text-reveal-1">
              <div className="inline-flex items-center justify-center px-3 py-1.5 md:px-3.5 md:py-1.5 rounded-full bg-indigo-100 text-[#6366f1] text-[10px] md:text-xs font-bold tracking-wide">
                Empowering Learners
              </div>
              <Link
                to="/olympiad"
                className="inline-flex items-center gap-2 pl-2 pr-3.5 py-1 md:py-1.5 rounded-full bg-white/90 hover:bg-white border border-amber-200/80 hover:border-amber-400 text-slate-800 text-[10px] md:text-xs font-semibold shadow-xs hover:shadow-md hover:scale-[1.01] transition-all group backdrop-blur-sm"
              >
                <span className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-xs">
                  <Trophy className="w-3 h-3 group-hover:rotate-12 transition-transform" />
                </span>
                <span className="font-bold text-slate-900">Abhyo Olympiad 2026 is LIVE!</span>
                <span className="text-amber-600 font-extrabold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">Explore →</span>
              </Link>
            </div>

            {/* Headline */}
            <h1 className="hero-headline text-[2rem] leading-tight sm:text-4xl md:text-5xl lg:text-[4rem] font-black lg:leading-[1.1] tracking-tight mb-4 md:mb-6 text-[#1e1b4b]">
              <span className="block animate-text-reveal-1">Practice Today,</span>
              <span className="block animate-text-reveal-2"><span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 text-transparent bg-clip-text animate-gradient-text">Achieve</span> Tomorrow.</span>
            </h1>

            {/* Description */}
            <div className="relative mb-6 md:mb-10 max-w-lg">
              <div className="absolute -left-6 -top-4 animate-[floatBob_4s_ease-in-out_infinite] opacity-60">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L14.2426 9.75736L22 12L14.2426 14.2426L12 22L9.75736 14.2426L2 12L9.75736 9.75736L12 2Z" fill="url(#paint0_linear_desc)" />
                  <defs>
                    <linearGradient id="paint0_linear_desc" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#818CF8" />
                      <stop offset="1" stopColor="#C084FC" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <p className="text-slate-500 text-sm sm:text-base md:text-[17px] leading-relaxed font-light tracking-wide relative z-10 pl-3 md:pl-4 border-l-2 border-indigo-200">
                Abhyo helps students learn smarter with <span className="font-medium text-slate-700">personalized practice</span>, <span className="font-medium text-slate-700">interactive lessons</span>, and <span className="font-medium text-slate-700">real progress tracking</span>.
              </p>
              <div className="absolute right-10 -bottom-6 animate-[floatBob_5s_ease-in-out_infinite_1s] opacity-40">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="#818CF8" strokeWidth="1.5" strokeDasharray="4 4" />
                  <circle cx="12" cy="12" r="4" fill="#C084FC" />
                </svg>
              </div>
            </div>

            {/* BUTTONS */}
            <div className="flex flex-wrap items-center gap-3 md:gap-3.5 mb-8 md:mb-12">
              <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('open-reg-modal'));
                }}
                className="group flex items-center justify-center gap-2 bg-[#6366f1] hover:bg-indigo-600 text-white font-bold px-5 py-3.5 md:px-6 md:py-4 rounded-xl shadow-lg shadow-indigo-500/30 hover:-translate-y-0.5 transition-all text-sm whitespace-nowrap cursor-pointer"
              >
                <span>Explore Courses</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <Link
                to="/olympiad"
                className="group flex items-center justify-center gap-2.5 bg-white/95 hover:bg-white text-slate-800 font-bold px-4 py-3.5 md:px-5 md:py-4 rounded-xl border border-amber-200/90 hover:border-amber-400 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all text-sm whitespace-nowrap"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                  <Trophy className="w-3.5 h-3.5" />
                </div>
                <span className="text-slate-900 font-extrabold text-xs sm:text-sm">Abhyo Olympiad</span>
                <span className="text-[10px] bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Live
                </span>
              </Link>
              {/* SEARCH BOX WITH UNIFIED ALL-CONTENT LIVE AUTOCOMPLETE */}
              <div ref={searchContainerRef} className="relative z-50 flex-1 min-w-[240px] max-w-sm">
                <form
                  onSubmit={handleSearchSubmit}
                  className="relative w-full"
                >
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    {searchLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onFocus={() => setSearchFocused(true)}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setSearchFocused(true);
                    }}
                    placeholder="Search Olympiad, UPSC, SSC, Courses..."
                    className="w-full bg-white border border-gray-200 text-slate-700 text-sm font-medium rounded-xl pl-10 pr-24 py-3.5 md:py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm transition-all"
                    autoComplete="off"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                      className="absolute inset-y-0 right-20 flex items-center pr-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      title="Clear search"
                    >
                      <X size={15} />
                    </button>
                  )}
                  <button
                    type="submit"
                    className="absolute inset-y-1.5 right-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 md:px-5 text-[13px] font-bold transition-colors flex items-center shadow-sm"
                  >
                    Search
                  </button>
                </form>

                {/* Floating All-Content Autocomplete Panel */}
                {searchFocused && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-slate-200/90 z-[100] overflow-hidden max-h-[320px] sm:max-h-[360px] overflow-y-auto divide-y divide-slate-100">
                    {/* When user typed and has results */}
                    {searchQuery.trim() ? (
                      searchResults.length > 0 ? (
                        <div>
                          <div className="px-3.5 py-2 bg-slate-50 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            <span>Matching Content ({searchResults.length})</span>
                            <span className="text-[10px] text-indigo-600 font-semibold lowercase">click to open</span>
                          </div>
                          <div className="py-1">
                            {searchResults.map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => handleSelectResult(item.url)}
                                className="w-full text-left px-3.5 py-2.5 hover:bg-indigo-50/60 flex items-center justify-between gap-3 group transition-colors cursor-pointer"
                              >
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                  <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-indigo-100 flex items-center justify-center shrink-0 text-slate-600 group-hover:text-indigo-600 transition-colors">
                                    {item.type === 'olympiad' ? <Trophy size={16} className="text-amber-500" /> :
                                      item.type === 'course' ? <BookOpen size={16} className="text-blue-500" /> :
                                        item.type === 'video' ? <Play size={16} className="text-purple-500" /> :
                                          item.type === 'institute' ? <Building2 size={16} className="text-emerald-500" /> :
                                            item.type === 'ebook' ? <FileText size={16} className="text-rose-500" /> :
                                              <Target size={16} className="text-indigo-500" />}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors truncate">
                                      {item.title}
                                    </p>
                                    {item.subtitle && (
                                      <p className="text-[10px] text-slate-400 truncate">
                                        {item.subtitle}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${item.type === 'olympiad' ? 'bg-amber-100 text-amber-800' :
                                      item.type === 'course' ? 'bg-blue-100 text-blue-700' :
                                        item.type === 'video' ? 'bg-purple-100 text-purple-700' :
                                          'bg-slate-100 text-slate-600'
                                    }`}>
                                    {item.badge || item.type}
                                  </span>
                                  <ArrowRight size={13} className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                                </div>
                              </button>
                            ))}
                          </div>
                          <div className="p-2 bg-slate-50 border-t border-slate-100 text-center">
                            <button
                              type="button"
                              onClick={handleSearchSubmit}
                              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1 cursor-pointer"
                            >
                              <span>View all results for "{searchQuery}"</span>
                              <ArrowRight size={12} />
                            </button>
                          </div>
                        </div>
                      ) : !searchLoading ? (
                        <div className="p-5 text-center">
                          <p className="text-xs font-semibold text-slate-600">No direct matches for "{searchQuery}"</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Try searching for Olympiad, UPSC, SSC, Banking, or Courses</p>
                          <div className="mt-3 flex justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleSelectResult('/olympiad')}
                              className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 cursor-pointer"
                            >
                              🏆 Abhyo Olympiad
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSelectResult('/categories')}
                              className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 cursor-pointer"
                            >
                              All Exam Categories
                            </button>
                          </div>
                        </div>
                      ) : null
                    ) : (
                      /* When query is empty: Popular Searches & Quick Links */
                      <div className="p-3">
                        <div className="flex items-center justify-between mb-2 px-1">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <Sparkles size={12} className="text-amber-500" /> Popular Programs & Exams
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {QUICK_SEARCH_CHIPS.map((chip, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleSelectResult(chip.url)}
                              className="w-full text-left p-2 rounded-xl hover:bg-slate-50 flex items-center justify-between group transition-colors cursor-pointer border border-transparent hover:border-slate-100"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-base shrink-0">{chip.icon}</span>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors truncate">
                                    {chip.label}
                                  </p>
                                  <p className="text-[10px] text-slate-400 truncate">{chip.badge}</p>
                                </div>
                              </div>
                              <ArrowRight size={12} className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* SOCIAL PROOF */}
            <div className="flex items-center gap-3 md:gap-4">
              <div className="flex -space-x-2.5 md:-space-x-3">
                {[47, 32, 25, 55].map((n) => (
                  <img key={n} src={`https://i.pravatar.cc/60?img=${n}`} alt="" className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white shadow-sm" />
                ))}
              </div>
              <div className="text-[11px] md:text-sm">
                <p className="text-slate-900 font-black">Join 50,000+ learners</p>
                <p className="text-slate-500 font-medium">who are improving every day with Abhyo.</p>
              </div>
            </div>
          </div>

          {/* RIGHT — Hero Interactive Showcase (Mock Tests, Olympiad, eBooks) */}
          <div className="hidden lg:flex relative items-end justify-end w-[52%] xl:w-[55%] flex-shrink-0 pt-0 min-h-[520px]">

            {/* Background Glow Effects (Dynamically change tint per slide) */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[70%] blur-[100px] rounded-full pointer-events-none z-0 transition-colors duration-700 ${heroSlide === 1 ? 'bg-amber-500/20' : heroSlide === 2 ? 'bg-emerald-500/20' : 'bg-indigo-500/20'
              }`} />
            <div className={`absolute bottom-0 right-10 w-[60%] h-[60%] blur-[80px] rounded-full pointer-events-none z-0 transition-colors duration-700 ${heroSlide === 1 ? 'bg-orange-400/20' : heroSlide === 2 ? 'bg-teal-400/20' : 'bg-blue-400/20'
              }`} />


            {/* Decorative Transparent Shapes */}
            <div className="absolute inset-0 z-0 pointer-events-none">
              <div className="absolute top-[15%] right-[15%] w-12 h-12 rounded-full border-4 border-indigo-400/30 hero-card-1" />
              <div className="absolute bottom-[35%] right-[5%] w-20 h-20 rounded-full border-[6px] border-violet-400/20 hero-card-3" style={{ animationDelay: '1.5s' }} />
              <div className="absolute bottom-[20%] left-[10%] w-6 h-6 rounded-full bg-amber-400/40 hero-card-2" />
              <div className="absolute top-[35%] left-[5%] text-indigo-500/30 hero-card-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M2 12h20" /></svg>
              </div>
              <div className="absolute top-[20%] left-[25%] text-amber-500/30 hero-card-2" style={{ animationDelay: '0.8s' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M2 12h20" /></svg>
              </div>
              <div className="absolute top-[45%] right-[-2%] w-24 h-24 opacity-30 hero-card-1" style={{ backgroundImage: 'radial-gradient(#4f46e5 2px, transparent 2px)', backgroundSize: '16px 16px', animationDelay: '0.4s' }} />
            </div>

            {/* ═══ SLIDE 0: MOCK TESTS ═══ */}
            <div className={`absolute inset-0 transition-all duration-700 ease-in-out ${heroSlide === 0 ? 'opacity-100 scale-100 translate-y-0 z-10 pointer-events-auto' : 'opacity-0 scale-95 translate-y-2 z-0 pointer-events-none'}`}>
              {/* Floating Stats Cards */}
              <div className="absolute inset-0 z-20 pointer-events-none">
                {/* Card 1: Rank */}
                <div className="absolute top-[18%] left-[18%] bg-white/95 backdrop-blur-md border border-white/60 p-3 rounded-2xl shadow-[0_15px_30px_rgba(0,0,0,0.08)] flex items-center gap-3 hero-card-2">
                  <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600 shadow-sm">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-semibold mb-0.5 uppercase tracking-wider">AIR Rank</p>
                    <p className="text-sm font-black text-slate-800 leading-none">152</p>
                  </div>
                </div>

                {/* Card 2: Timer */}
                <div className="absolute top-[25%] right-[12%] bg-white/95 backdrop-blur-md border border-white/60 p-3 rounded-2xl shadow-[0_15px_30px_rgba(0,0,0,0.08)] flex items-center gap-3 hero-card-1">
                  <div>
                    <p className="text-[10px] text-slate-500 font-semibold mb-0.5 uppercase tracking-wider">Mock Test Time</p>
                    <p className="text-sm font-black text-slate-800 leading-none tracking-tight">09:28:47</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>

                {/* Card 3: Performance */}
                <div className="absolute top-[45%] left-[10%] bg-white/95 backdrop-blur-md border border-white/60 p-3 rounded-2xl shadow-[0_15px_30px_rgba(0,0,0,0.08)] flex items-center gap-3 hero-card-3">
                  <div className="relative w-10 h-10">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path className="text-slate-100" strokeWidth="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      <path className="text-emerald-500" strokeDasharray="83, 100" strokeWidth="3.5" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-slate-700">83%</div>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-semibold mb-0.5 uppercase tracking-wider">Performance</p>
                    <p className="text-[11px] font-black text-emerald-500 leading-none">Excellent</p>
                  </div>
                </div>

                {/* Card 4: Analytics */}
                <div className="absolute bottom-[28%] right-[8%] bg-white/95 backdrop-blur-md border border-white/60 p-3 rounded-2xl shadow-[0_15px_30px_rgba(0,0,0,0.08)] flex flex-col gap-2 hero-card-2" style={{ animationDelay: '0.8s' }}>
                  <div className="flex justify-between items-center gap-5">
                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">AI Analytics</p>
                    <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                  </div>
                  <div className="w-24 h-8 flex items-end">
                    <svg viewBox="0 0 100 30" className="w-full h-full text-indigo-500 stroke-current drop-shadow-sm" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M0 25 Q 10 15, 20 20 T 40 10 T 60 15 T 80 5 T 100 15" />
                    </svg>
                  </div>
                </div>

                {/* Card 5: AI Assistant */}
                <div className="absolute bottom-[14%] left-[22%] bg-white/95 backdrop-blur-md border border-white/60 p-3 rounded-2xl shadow-[0_15px_30px_rgba(0,0,0,0.08)] flex items-center gap-3 hero-card-1" style={{ animationDelay: '1.2s' }}>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-inner">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-semibold mb-0.5 uppercase tracking-wider">AI Assistant</p>
                    <p className="text-[11px] font-black text-slate-800 leading-none">Active</p>
                  </div>
                </div>
              </div>

              {/* Slide 0 Girl Image */}
              <div className="relative w-full h-full min-h-[400px] lg:min-h-[500px] z-10 flex items-end justify-end">
                <img
                  src="/hero_illustration.png?v=2"
                  alt="Student using Abhyo Mock Tests"
                  className="w-full h-full object-contain object-bottom select-none pointer-events-none drop-shadow-[0_20px_30px_rgba(79,70,229,0.15)]"
                  style={{
                    maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 75%, rgba(0,0,0,0.3) 90%, rgba(0,0,0,0) 100%)',
                    WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 75%, rgba(0,0,0,0.3) 90%, rgba(0,0,0,0) 100%)'
                  }}
                />
              </div>
            </div>

            {/* ═══ SLIDE 1: ABHYO OLYMPIAD ═══ */}
            <div className={`absolute inset-0 transition-all duration-700 ease-in-out ${heroSlide === 1 ? 'opacity-100 scale-100 translate-y-0 z-10 pointer-events-auto' : 'opacity-0 scale-95 translate-y-2 z-0 pointer-events-none'}`}>
              {/* Floating Olympiad Cards */}
              <div className="absolute inset-0 z-20 pointer-events-none">
                {/* Card 1: Gold Rank 1 */}
                <div className="absolute top-[18%] left-[16%] bg-white/95 backdrop-blur-md border border-amber-200/90 p-3 rounded-2xl shadow-[0_15px_30px_rgba(245,158,11,0.15)] flex items-center gap-3 hero-card-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-white shadow-md shadow-amber-400/30">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-amber-700 font-bold mb-0.5 uppercase tracking-wider">National Rank</p>
                    <p className="text-sm font-black text-slate-900 leading-none">AIR #1 Gold</p>
                  </div>
                </div>

                {/* Card 2: Prize Pool */}
                <div className="absolute top-[25%] right-[12%] bg-white/95 backdrop-blur-md border border-orange-200/90 p-3 rounded-2xl shadow-[0_15px_30px_rgba(249,115,22,0.15)] flex items-center gap-3 hero-card-1">
                  <div>
                    <p className="text-[10px] text-orange-600 font-bold mb-0.5 uppercase tracking-wider">Annual Prize Pool</p>
                    <p className="text-sm font-black text-slate-900 leading-none tracking-tight">₹10 Lakh+</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-400/30">
                    <Medal className="w-5 h-5" />
                  </div>
                </div>

                {/* Card 3: QR Certificate */}
                <div className="absolute top-[45%] left-[10%] bg-white/95 backdrop-blur-md border border-white/60 p-3 rounded-2xl shadow-[0_15px_30px_rgba(0,0,0,0.08)] flex items-center gap-3 hero-card-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600 shadow-sm">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-semibold mb-0.5 uppercase tracking-wider">Merit Certificate</p>
                    <p className="text-[11px] font-black text-violet-700 leading-none">QR-Verified</p>
                  </div>
                </div>

                {/* Card 4: Class 6-12 Live */}
                <div className="absolute bottom-[28%] right-[8%] bg-white/95 backdrop-blur-md border border-amber-200/90 p-3 rounded-2xl shadow-[0_15px_30px_rgba(245,158,11,0.12)] flex items-center gap-2.5 hero-card-2" style={{ animationDelay: '0.8s' }}>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <div>
                    <p className="text-[10px] text-amber-700 font-bold uppercase tracking-wider">Class 6–12 Live</p>
                    <p className="text-xs font-black text-slate-800">Registration Open</p>
                  </div>
                </div>

                {/* Card 5: Scholarship */}
                <div className="absolute bottom-[14%] left-[22%] bg-white/95 backdrop-blur-md border border-amber-200/90 p-3 rounded-2xl shadow-[0_15px_30px_rgba(245,158,11,0.15)] flex items-center gap-3 hero-card-1" style={{ animationDelay: '1.2s' }}>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-inner">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-semibold mb-0.5 uppercase tracking-wider">Top Cash Prize</p>
                    <p className="text-[11px] font-black text-amber-700 leading-none">₹25,000 Cash</p>
                  </div>
                </div>
              </div>

              {/* Slide 1 Girl Image */}
              <div className="relative w-full h-full min-h-[400px] lg:min-h-[500px] z-10 flex items-end justify-end">
                <img
                  src="/hero_olympiad.png?v=2"
                  alt="Student Champion Abhyo Olympiad"
                  className="w-full h-full object-contain object-bottom select-none pointer-events-none drop-shadow-[0_20px_30px_rgba(245,158,11,0.2)]"
                  style={{
                    maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 75%, rgba(0,0,0,0.3) 90%, rgba(0,0,0,0) 100%)',
                    WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 75%, rgba(0,0,0,0.3) 90%, rgba(0,0,0,0) 100%)'
                  }}
                />
              </div>
            </div>

            {/* ═══ SLIDE 2: EBOOKS & STUDY MATERIAL ═══ */}
            <div className={`absolute inset-0 transition-all duration-700 ease-in-out ${heroSlide === 2 ? 'opacity-100 scale-100 translate-y-0 z-10 pointer-events-auto' : 'opacity-0 scale-95 translate-y-2 z-0 pointer-events-none'}`}>
              {/* Floating eBook Cards */}
              <div className="absolute inset-0 z-20 pointer-events-none">
                {/* Card 1: 1,200+ eBooks */}
                <div className="absolute top-[18%] left-[16%] bg-white/95 backdrop-blur-md border border-emerald-200/90 p-3 rounded-2xl shadow-[0_15px_30px_rgba(16,185,129,0.15)] flex items-center gap-3 hero-card-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-400/30">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-emerald-700 font-bold mb-0.5 uppercase tracking-wider">Curated Library</p>
                    <p className="text-sm font-black text-slate-900 leading-none">1,200+ eBooks</p>
                  </div>
                </div>

                {/* Card 2: Bilingual Notes */}
                <div className="absolute top-[25%] right-[12%] bg-white/95 backdrop-blur-md border border-sky-200/90 p-3 rounded-2xl shadow-[0_15px_30px_rgba(14,165,233,0.15)] flex items-center gap-3 hero-card-1">
                  <div>
                    <p className="text-[10px] text-sky-600 font-bold mb-0.5 uppercase tracking-wider">Bilingual Reader</p>
                    <p className="text-sm font-black text-slate-900 leading-none tracking-tight">Hindi & English</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white shadow-md shadow-sky-400/30">
                    <Languages className="w-5 h-5" />
                  </div>
                </div>

                {/* Card 3: Rating 4.9 */}
                <div className="absolute top-[45%] left-[10%] bg-white/95 backdrop-blur-md border border-white/60 p-3 rounded-2xl shadow-[0_15px_30px_rgba(0,0,0,0.08)] flex items-center gap-3 hero-card-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shadow-sm">
                    <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-semibold mb-0.5 uppercase tracking-wider">Reader Rating</p>
                    <p className="text-[11px] font-black text-amber-600 leading-none">4.9 ★ (50K+)</p>
                  </div>
                </div>

                {/* Card 4: Offline Access */}
                <div className="absolute bottom-[28%] right-[8%] bg-white/95 backdrop-blur-md border border-emerald-200/90 p-3 rounded-2xl shadow-[0_15px_30px_rgba(16,185,129,0.12)] flex items-center gap-3 hero-card-2" style={{ animationDelay: '0.8s' }}>
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">Offline Access</p>
                    <p className="text-xs font-black text-slate-800">Instant Download</p>
                  </div>
                </div>

                {/* Card 5: Chapter Tests */}
                <div className="absolute bottom-[14%] left-[22%] bg-white/95 backdrop-blur-md border border-teal-200/90 p-3 rounded-2xl shadow-[0_15px_30px_rgba(20,184,166,0.15)] flex items-center gap-3 hero-card-1" style={{ animationDelay: '1.2s' }}>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center text-white shadow-inner">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-semibold mb-0.5 uppercase tracking-wider">Solved Papers</p>
                    <p className="text-[11px] font-black text-teal-700 leading-none">Solutions Included</p>
                  </div>
                </div>
              </div>

              {/* Slide 2 Girl Image */}
              <div className="relative w-full h-full min-h-[400px] lg:min-h-[500px] z-10 flex items-end justify-end">
                <img
                  src="/hero_ebook.png?v=2"
                  alt="Student using Abhyo eBooks"
                  className="w-full h-full object-contain object-bottom select-none pointer-events-none drop-shadow-[0_20px_30px_rgba(16,185,129,0.2)]"
                  style={{
                    maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 75%, rgba(0,0,0,0.3) 90%, rgba(0,0,0,0) 100%)',
                    WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 75%, rgba(0,0,0,0.3) 90%, rgba(0,0,0,0) 100%)'
                  }}
                />
              </div>
            </div>

          </div>

        </div>

        {/* BOTTOM FEATURES */}
        <div className="w-full px-5 lg:px-14 xl:px-24 pb-8 mt-8 lg:mt-6 relative z-10">
          <div className="bg-white/90 backdrop-blur-3xl rounded-3xl p-5 md:p-8 shadow-2xl shadow-indigo-200/40 border border-white grid grid-cols-2 lg:flex lg:flex-row gap-6 md:gap-4 lg:justify-between">
            {[
              { icon: BookOpen, title: 'Expert Courses', desc: 'Learn from top educators and industry experts.', color: 'from-blue-500 to-indigo-500' },
              { icon: Target, title: 'Interactive Practice', desc: 'Practice with quizzes, exercises and real-time feedback.', color: 'from-emerald-400 to-teal-500' },
              { icon: BarChart3, title: 'Track Progress', desc: 'Monitor your performance and improve every day.', color: 'from-amber-400 to-orange-500' },
              { icon: Award, title: 'Achieve Goals', desc: 'Build skills, gain confidence, achieve success.', color: 'from-fuchsia-500 to-pink-500' },
            ].map((item, i) => (
              <div
                key={i}
                className={`group flex flex-col sm:flex-row items-start gap-3 sm:gap-4 flex-1 cursor-pointer transition-all duration-500 hover:-translate-y-1.5 ${i !== 3 ? 'lg:border-r border-slate-100 lg:pr-6' : ''}`}
                style={{ animation: 'floatUp 0.8s ease-out forwards', animationDelay: `${0.8 + i * 0.15}s`, opacity: 0 }}
              >
                <div className="relative w-11 h-11 md:w-14 md:h-14 rounded-2xl bg-slate-50 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all duration-500">
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-10 group-hover:opacity-100 transition-opacity duration-500`} />
                  <item.icon className="w-5 h-5 md:w-6 md:h-6 text-slate-600 group-hover:text-white transition-colors duration-500 relative z-10" strokeWidth={1} />
                </div>
                <div className="pt-0.5">
                  <h4 className="text-[13px] md:text-[15px] font-normal text-slate-800 mb-1 leading-tight tracking-wide group-hover:text-indigo-600 transition-colors duration-300">{item.title}</h4>
                  <p className="text-[11px] md:text-[13px] text-slate-400 font-light leading-relaxed pr-1 md:pr-2">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          FLOATING CATEGORY BAR
      ════════════════════════════════════════════════════════ */}
      <section className="relative z-20 w-full px-4 sm:px-6 lg:px-8 -mt-4 mb-12" ref={ref('cats')} data-section="cats">
        <div className="w-full">
          <div className={`bg-white rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.05)] border border-slate-100/80 px-6 sm:px-8 py-5 sm:py-6 ${fadeUp('cats')}`}>
            {/* Header row */}
            <div className="flex flex-col sm:flex-row items-center justify-between mb-4 px-1 gap-2">
              <div className="flex items-center gap-2.5">
                <h2 className="text-base sm:text-lg font-black text-slate-800 tracking-tight uppercase tracking-wider">Browse Categories</h2>
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  Hover to pause
                </span>
              </div>
              <Link to="/categories" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-4 py-2 rounded-full flex items-center gap-1.5 transition-all">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Slow Infinite Marquee */}
            <div className="relative overflow-hidden w-full py-1">
              {/* Left & Right gradient fade masks for smooth visual blending */}
              <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-10 sm:w-20 bg-gradient-to-r from-white via-white/80 to-transparent z-10" />
              <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 sm:w-20 bg-gradient-to-l from-white via-white/80 to-transparent z-10" />

              <div className="marquee-cats-track flex items-center gap-4 sm:gap-6 py-2">
                {marqueeCategoryList.map((cat, i) => (
                  <Link
                    key={`${cat.name}-${i}`}
                    to={cat.link || `/categories?category=${encodeURIComponent(cat.name)}`}
                    className="flex-shrink-0 flex flex-col items-center gap-2.5 w-28 md:w-32 p-2.5 rounded-2xl hover:bg-slate-50 transition-all group hover:-translate-y-1 hover:shadow-sm"
                  >
                    <CatIcon cat={cat} getImageUrl={getImageUrl} />
                    <div className="text-center w-full">
                      <p className="text-[11px] sm:text-[13px] font-medium text-slate-700 tracking-wide mb-0.5 group-hover:text-indigo-600 transition-colors truncate w-full">{cat.name}</p>
                      <p className="text-[10px] text-slate-400 font-normal">{cat.tests || '100+'} Exams</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          INSTITUTES MARQUEE
      ════════════════════════════════════════════════════════ */}
      <section className="py-10 md:py-16 overflow-hidden bg-white relative" ref={ref('inst-marquee')} data-section="inst-marquee">
        <div className={`text-center mb-6 md:mb-8 px-5 transition-all duration-700 ${visible('inst-marquee') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <div className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-violet-50 border border-violet-100 text-violet-600 text-[10px] font-black uppercase tracking-widest mb-3 md:mb-4">
            <Building2 className="w-3 h-3" /> Trusted By Institutes
          </div>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 mb-2 md:mb-3">200+ Institutes Trust Us</h2>
          <p className="text-slate-500 max-w-lg mx-auto text-[13px] md:text-sm font-medium">Leading coaching institutes across India use Abhyo to manage students, deliver tests, and grow their business</p>
        </div>

        {/* Institutes Marquee */}
        <InstituteMarqueeRow institutes={featuredInstitutes} />

        <div className="text-center mt-4 md:mt-8 px-5">
          <Link
            to="/institutes"
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 md:py-3.5 px-6 md:px-8 rounded-xl md:rounded-2xl shadow-lg hover:-translate-y-0.5 transition-all text-sm"
          >
            Explore All Institutes <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          ABHYO OLYMPIAD HIGHLIGHT BANNER
      ════════════════════════════════════════════════════════ */}
      <section className="py-6 px-4 sm:px-6 lg:px-10 bg-white" ref={ref('olympiad-banner')} data-section="olympiad-banner">
        <div className="max-w-7xl mx-auto">
          <div className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-indigo-600 p-6 md:p-8 text-white shadow-xl shadow-orange-500/15 flex flex-col lg:flex-row items-center justify-between gap-6">
            {/* Decorative background glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-60 h-60 bg-black/10 rounded-full blur-2xl pointer-events-none" />

            {/* Left Content */}
            <div className="relative z-10 flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-black uppercase tracking-wider mb-3 border border-white/30">
                <Trophy size={14} className="text-yellow-200" />
                <span>Abhyo National Olympiad 2026</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                <span className="text-[10px] bg-white text-amber-700 px-1.5 py-0.5 rounded-full font-bold">Class 6–12</span>
              </div>

              <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-2">
                Compete Nationally • Win Cash Prizes & Medals
              </h3>

              <p className="text-white/90 text-sm md:text-base max-w-2xl font-medium leading-relaxed">
                Test your skills in <span className="font-bold underline decoration-amber-200">Maths, Science, Computer, English & Reasoning</span>. Earn All-India Ranks, win cash awards up to ₹25,000, and get QR-verified national certificates.
              </p>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mt-3 text-xs font-semibold text-white/90">
                <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-amber-200" /> ₹10 Lakh+ Prize Pool</span>
                <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-amber-200" /> 100% Online from Home</span>
                <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-amber-200" /> Just ₹150 / Subject</span>
              </div>
            </div>

            {/* Right Action: Redirect to Olympiad */}
            <div className="relative z-10 flex flex-col sm:flex-row items-center gap-3 shrink-0">
              <Link
                to="/olympiad"
                className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-900 font-black px-6 py-3.5 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all text-sm group"
              >
                <span>Go to Olympiad Portal</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform text-amber-600" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          EXAM CATEGORY TABS
      ════════════════════════════════════════════════════════ */}
      <section className="py-12 md:py-16 px-5 lg:px-10 bg-slate-50 relative overflow-hidden" ref={ref('examtabs')} data-section="examtabs">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
          <div className="absolute -right-32 top-10 w-72 h-72 bg-indigo-100 rounded-full blur-3xl opacity-20" />
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className={`text-center mb-8 ${fadeUp('examtabs')}`}>
            <div className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-bold uppercase tracking-widest mb-3">
              <Star className="w-3 h-3" /> Exam Categories
            </div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-slate-800 mb-2">Prepare for 150+ Exams</h2>
            <p className="text-slate-500 max-w-xl mx-auto text-[13px] md:text-sm font-normal">Practice with the latest pattern mock tests across all major Central and State Government exams</p>
          </div>

          {/* Tabs */}
          <div className={`flex flex-wrap justify-center gap-2 md:gap-3 mb-6 md:mb-8 ${fadeUp('examtabs', 150)}`}>
            {examCategoryTabs.map((tab) => {
              const active = activeCategoryTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategoryTab(tab.id)}
                  className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 rounded-xl text-[12px] md:text-[13px] font-medium tracking-wide transition-all duration-300 ${active ? 'bg-indigo-600 text-white shadow-md shadow-indigo-300/50 scale-[1.02]' : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600'}`}
                >
                  <tab.icon size={14} /> {tab.label}
                </button>
              );
            })}
          </div>

          {/* Active Tab Panel */}
          {activeTab && (
            <div className="bg-white rounded-[24px] md:rounded-[32px] border border-slate-200/60 shadow-xl shadow-slate-200/30 p-5 md:p-8 lg:p-10">
              <div className="grid lg:grid-cols-5 gap-6 lg:gap-8 items-start">
                <div className="lg:col-span-2">
                  <h3 className="text-xl md:text-2xl font-semibold text-slate-800 mb-2">{activeTab.label}</h3>
                  <p className="text-slate-500 text-[13px] md:text-sm leading-relaxed mb-5 italic">{activeTab.description}</p>
                  <Link to={activeTab.id === 'school' ? '/olympiad' : '/exam-series'} className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-medium py-2.5 px-5 rounded-xl shadow-md hover:-translate-y-0.5 transition-all text-[13px]">
                    {activeTab.id === 'school' ? 'Explore Olympiads' : 'Start Practicing'} <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <div className="lg:col-span-3 grid sm:grid-cols-2 gap-2.5">
                  {activeTab.exams.map((exam, idx) => (
                    <Link key={idx} to={exam.link || "/exam-series"} className="group flex items-center gap-3 p-3 bg-slate-50 hover:bg-white border border-transparent hover:border-indigo-100 hover:shadow-md rounded-xl transition-all duration-300">
                      <span className="text-xl md:text-2xl w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">{exam.icon}</span>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[13px] md:text-sm font-medium text-slate-700 truncate">{exam.name}</h4>
                        <p className="text-[10px] font-normal text-slate-400 group-hover:text-indigo-500 transition-colors">{exam.date}</p>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                    </Link>
                  ))}
                  <div className="sm:col-span-2 pt-2 text-center">
                    <Link to={activeTab.id === 'school' ? '/olympiad' : '/exam-series'} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-indigo-600 hover:gap-2.5 transition-all">
                      View all {activeTab.label} exams <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          FEATURES
      ════════════════════════════════════════════════════════ */}
      <section id="features" className="py-12 md:py-16 px-5 lg:px-10" ref={ref('features')} data-section="features">
        <div className="max-w-7xl mx-auto">
          <div className={`text-center mb-8 ${fadeUp('features')}`}>
            <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-4 py-1.5 rounded-full text-[10px] font-bold text-emerald-700 uppercase tracking-widest mb-3 md:mb-4">
              <Zap className="w-3 h-3" /> Platform Features
            </div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-slate-800 mb-2 md:mb-3">Everything to Ace Your Prep</h2>
            <p className="text-slate-500 max-w-lg mx-auto text-[13px] md:text-sm font-normal">Professional tools used by top institutes and serious aspirants across India</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {features.map((f, i) => {
              const c = featureColors[f.color];
              return (
                <div
                  key={i}
                  className={`group relative bg-white border border-slate-200 rounded-2xl md:rounded-[24px] p-5 md:p-6 hover:shadow-xl ${c.glow} hover:-translate-y-1.5 transition-all duration-300 overflow-hidden ${visible('features') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                  style={{ transitionDelay: `${i * 80}ms` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent to-slate-50/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className={`relative w-11 h-11 md:w-12 md:h-12 ${c.bg} ${c.text} rounded-xl md:rounded-2xl flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform shadow-sm`}>
                    <f.icon className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  {/* Use pre-declared static class string — Tailwind can't detect dynamic class strings */}
                  <h3 className={`relative text-[15px] md:text-[17px] font-semibold text-slate-800 mb-1.5 transition-colors ${c.groupHover}`}>{f.title}</h3>
                  <p className="relative text-[13px] md:text-sm text-slate-500 leading-relaxed font-normal">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          EXAM SERIES PROMO
      ════════════════════════════════════════════════════════ */}
      <section className="py-12 md:py-16 px-5 lg:px-10 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 relative overflow-hidden" ref={ref('series')} data-section="series">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-violet-800 rounded-full blur-3xl -ml-20 -mb-20" />
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        </div>
        <div className="max-w-7xl mx-auto relative z-10 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className={fadeUp('series')}>
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-3 py-1 md:px-4 md:py-1.5 rounded-full text-white/90 text-[10px] font-semibold uppercase tracking-widest mb-4">
              <Sparkles className="w-3 h-3" /> Exam Series
            </div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-white mb-3 md:mb-4">Master Your Exam with<br />Targeted Series</h2>
            <p className="text-indigo-100 text-[13px] md:text-[15px] mb-5 md:mb-6 font-normal leading-relaxed max-w-md">
              Structured <span className="text-amber-300 font-medium">Exam Series</span> designed to systematically cover entire syllabi from basics to advanced levels.
            </p>
            <div className="space-y-3 mb-6 md:mb-8">
              {[
                { t: 'Curated Question Banks', d: 'Verified by toppers and expert faculty.' },
                { t: 'Downloadable Series Notes', d: 'High-quality PDF study materials with every series.' },
                { t: 'Section-wise Preparation', d: 'Focus on weak spots with targeted sectional mocks.' },
              ].map((item) => (
                <div key={item.t} className="flex gap-3 md:gap-4">
                  <div className="w-8 h-8 md:w-9 md:h-9 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium text-[13px] md:text-[14px]">{item.t}</p>
                    <p className="text-indigo-200 text-[11px] md:text-[12px] font-normal">{item.d}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link to="/exam-series" className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-amber-950 font-semibold py-3 px-6 rounded-xl shadow-lg hover:-translate-y-0.5 transition-all text-[13px]">
              Explore Exam Series <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-6 lg:mt-0">
            {[
              { icon: Trophy, value: '98%', label: 'Syllabus Match', color: 'text-amber-400' },
              { icon: Users, value: '50K+', label: 'Enrolled Students', color: 'text-sky-400' },
              { icon: BookOpen, value: '200+', label: 'Test Series', color: 'text-emerald-400' },
              { icon: Sparkles, value: 'AI', label: 'Progress Tracker', color: 'text-violet-400' },
            ].map((s, i) => (
              <div key={i} className="bg-white/10 border border-white/10 rounded-2xl md:rounded-[24px] p-5 hover:bg-white/15 transition-all">
                <s.icon className={`w-6 h-6 md:w-7 md:h-7 ${s.color} mb-3`} />
                <p className="text-white font-bold text-xl md:text-2xl mb-1">{s.value}</p>
                <p className="text-indigo-200 text-[11px] md:text-[12px] font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          HOW IT WORKS
      ════════════════════════════════════════════════════════ */}
      <section className="py-12 md:py-16 px-5 lg:px-10 bg-white" ref={ref('how')} data-section="how">
        <div className="max-w-6xl mx-auto">
          <div className={`text-center mb-8 ${fadeUp('how')}`}>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-slate-800 mb-2 md:mb-3">Start in 3 Simple Steps</h2>
            <p className="text-slate-500 font-normal text-[13px] md:text-sm">From signup to national rank in under 10 minutes</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5 md:gap-6">
            {[
              { step: '01', icon: Users, title: 'Create Account', desc: 'Sign up free as a student or register your institute. No credit card required.', color: 'from-indigo-500 to-violet-500' },
              { step: '02', icon: Play, title: 'Pick & Attempt', desc: 'Choose from 500+ mock tests. Full-screen, timed, realistic CBT mode.', color: 'from-emerald-500 to-teal-500' },
              { step: '03', icon: TrendingUp, title: 'Analyze & Improve', desc: 'Get instant results, analytics, solutions, and your national rank.', color: 'from-amber-500 to-orange-500' },
            ].map((s, i) => (
              <div key={i} className={`relative bg-slate-50 border border-slate-100 rounded-2xl md:rounded-[24px] p-6 md:p-8 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group ${visible('how') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`} style={{ transitionDelay: `${i * 150}ms` }}>
                <div className={`w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br ${s.color} rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-5 shadow-sm group-hover:scale-110 transition-transform`}>
                  <s.icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <div className="text-6xl md:text-7xl font-bold text-slate-900/[0.03] absolute top-4 right-5 select-none">{s.step}</div>
                <h3 className="text-[17px] md:text-lg font-semibold text-slate-800 mb-1.5 md:mb-2">{s.title}</h3>
                <p className="text-slate-500 text-[13px] md:text-sm leading-relaxed font-normal">{s.desc}</p>
                {i < 2 && <ChevronRight className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          TESTIMONIALS
      ════════════════════════════════════════════════════════ */}
      <section className="py-12 md:py-16 px-5 lg:px-10 bg-slate-50/30" ref={ref('testimonials')} data-section="testimonials">
        <div className="max-w-6xl mx-auto">
          <div className={`text-center mb-8 ${fadeUp('testimonials')}`}>
            <div className="flex justify-center gap-1 mb-3">{[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 md:w-5 md:h-5 fill-amber-400 text-amber-400" />)}</div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-slate-800 mb-2 md:mb-3">Students Love Abhyo</h2>
            <p className="text-slate-500 text-[13px] md:text-sm font-normal">Real results from real aspirants across India</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className={`bg-white border border-slate-200 rounded-2xl md:rounded-[24px] p-5 md:p-6 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 ${visible('testimonials') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: `${i * 100}ms` }}>
                <div className="flex gap-1 mb-3">{[...Array(5)].map((_, j) => <Star key={j} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}</div>
                <p className="text-[13px] md:text-[14px] text-slate-600 leading-relaxed mb-4 md:mb-5 italic">"{t.text}"</p>
                <div className="flex items-center gap-3 pt-3 md:pt-4 border-t border-slate-100">
                  <img src={t.img} alt={t.name} className="w-9 h-9 md:w-10 md:h-10 rounded-full border-2 border-slate-100 shadow-sm" />
                  <div>
                    <p className="text-[13px] md:text-[14px] font-medium text-slate-800">{t.name}</p>
                    <p className="text-[11px] md:text-xs text-slate-500 font-normal">{t.role}</p>
                  </div>
                  <CheckCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-500 ml-auto" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          INSTITUTES CTA
      ════════════════════════════════════════════════════════ */}
      <section id="institutes" className="py-12 md:py-16 px-5 lg:px-10 bg-slate-50/50" ref={ref('institutes')} data-section="institutes">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-[2rem] p-8 md:p-12 relative overflow-hidden mb-10 md:mb-12 shadow-2xl">
            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600 rounded-full blur-[100px] opacity-20" />
            <div className="absolute bottom-0 left-10 w-72 h-72 bg-violet-600 rounded-full blur-[100px] opacity-20" />

            <div className={`relative z-10 grid lg:grid-cols-2 gap-10 lg:gap-12 items-center ${fadeUp('institutes')}`}>
              <div>
                <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 md:px-4 md:py-1.5 rounded-full text-indigo-300 text-[10px] font-semibold uppercase tracking-widest mb-4 md:mb-5">
                  <Building2 className="w-3 h-3 md:w-3.5 md:h-3.5" /> For Coaching Institutes
                </div>
                <h2 className="text-3xl lg:text-4xl font-semibold text-white leading-tight mb-4 tracking-tight">Scale Your Coaching<br /><span className="bg-gradient-to-r from-indigo-400 to-fuchsia-400 bg-clip-text text-transparent">Business Online</span></h2>
                <p className="text-slate-300 text-[13px] md:text-[14px] leading-relaxed mb-6 md:mb-8 max-w-md font-normal">A complete white-label LMS to manage students, schedule test series, track batch performance, and dramatically grow your institute's revenue.</p>

                <div className="grid sm:grid-cols-2 gap-3 md:gap-4 mb-8">
                  {['Unlimited students & batches', 'Auto-grading & deadlines', 'Automated billing & accounting', 'Detailed performance reports', 'Branded Android/iOS UI', 'Drip content scheduling'].map((item) => (
                    <div key={item} className="flex items-start gap-2.5 md:gap-3">
                      <div className="w-4 h-4 md:w-5 md:h-5 mt-0.5 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-2.5 h-2.5 md:w-3 md:h-3 text-emerald-400" />
                      </div>
                      <span className="text-slate-200 text-[12px] md:text-[13px] font-medium">{item}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-3 md:gap-4">
                  <Link to="/register?role=institute" className="inline-flex items-center gap-2 bg-white text-slate-900 font-semibold py-2.5 md:py-3 px-6 md:px-7 rounded-xl md:rounded-2xl shadow-xl hover:shadow-white/20 hover:-translate-y-1 transition-all duration-300 text-[13px] md:text-sm">
                    Register Free Institute <ArrowRight className="w-4 h-4" />
                  </Link>
                  <a href="#features" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white border border-white/10 font-medium py-2.5 md:py-3 px-6 md:px-7 rounded-xl md:rounded-2xl transition-all duration-300 text-[13px] md:text-sm">
                    View Demo
                  </a>
                </div>
              </div>
              <div className="hidden lg:block relative perspective-1000">
                <div className="bg-white/10 border border-white/20 rounded-[24px] p-5 md:p-6 backdrop-blur-md transform hover:-translate-y-2 hover:-rotate-1 transition-all duration-500 shadow-2xl">
                  <div className="flex items-center justify-between mb-5 pb-5 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-indigo-500/20 rounded-xl flex items-center justify-center"><Building2 className="w-4 h-4 text-indigo-300" /></div>
                      <div>
                        <span className="text-white font-semibold text-[13px] block">Institute Dashboard</span>
                        <span className="text-indigo-300 font-normal text-[10px]">Admin View</span>
                      </div>
                    </div>
                    <span className="flex items-center gap-1.5 text-[9px] text-emerald-400 font-bold bg-emerald-400/10 px-2.5 py-1 rounded-full border border-emerald-400/20 uppercase tracking-wider">
                      <span className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse px-0" /> Active
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {[{ label: 'Total Students', val: '1,248', icon: Users, color: 'indigo' }, { label: 'Tests Assigned', val: '34', icon: BookOpen, color: 'fuchsia' }, { label: 'Avg. Score', val: '78.4%', icon: TrendingUp, color: 'emerald' }, { label: 'Revenue', val: '₹1.2L', icon: Flame, color: 'amber' }].map((r) => (
                      <div key={r.label} className="bg-slate-900/40 rounded-xl p-3 border border-white/5">
                        <div className="flex items-center gap-2 text-slate-400 text-[10px] font-semibold uppercase tracking-wider mb-1.5">
                          <r.icon className={`w-3 h-3 text-${r.color}-400`} />{r.label}
                        </div>
                        <span className="text-white font-bold text-xl md:text-2xl">{r.val}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
                    <p className="text-emerald-400 text-[11px] font-semibold tracking-wide">🎉 Top 3 Institute this month in India!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Deep dive feature cards for Institutes */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {[
              { icon: Globe, title: 'White-Label Branding', desc: 'Your exact logo, brand themes, and custom domain name. Deliver a completely personalized experience to your students without them ever knowing it is Abhyo powering it.' },
              { icon: Users, title: 'Smart Batch Management', desc: 'Create infinite cohorts, assign specific exams or video series to particular batches seamlessly, and strictly monitor aggregate batch performances over time.' },
              { icon: BarChart3, title: 'Deep Analytics Engine', desc: 'Get granular details on student performance—track every second they spend on a specific question, analyze their weakest subjects natively, and deliver personalized mentoring.' },
              { icon: ShieldCheck, title: 'Anti-Cheat Protection', desc: 'Enterprise-grade security features including randomized high-quality question banks, rigorous tab-switch tracking, and secure media streaming protocols to protect your IP.' },
              { icon: Sparkles, title: 'Course Monetization', desc: 'Easily set up your own paywalls. Sell unlimited test series, premium video courses, and intensive PDF materials directly to students with automated secure payments.' },
              { icon: Languages, title: 'Bilingual Engine Support', desc: 'Instantly support content delivery in multiple languages like English and Hindi simultaneously, broadening your institute\'s national target audience effortlessly.' },
            ].map((f, i) => (
              <div key={i} className={`bg-white rounded-[20px] md:rounded-[24px] p-5 md:p-6 shadow-sm border border-slate-200/60 hover:shadow-lg hover:-translate-y-1.5 hover:border-indigo-100 transition-all duration-300 ${fadeUp('institutes', i * 100)}`}>
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4 md:mb-5">
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="text-[15px] md:text-[16px] font-semibold text-slate-800 mb-2 tracking-tight">{f.title}</h3>
                <p className="text-[12.5px] md:text-[13px] font-normal text-slate-500 leading-relaxed text-pretty">{f.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          FINAL CTA
      ════════════════════════════════════════════════════════ */}
      <section className="py-16 md:py-20 px-5 text-center" ref={ref('cta')} data-section="cta">
        <div className={`max-w-3xl mx-auto ${fadeUp('cta')}`}>
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-3 py-1 md:px-4 md:py-1.5 rounded-full text-indigo-600 text-[10px] font-semibold uppercase tracking-widest mb-4 md:mb-5">
            <Flame className="w-3 h-3" /> Join 10,000+ Aspirants
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-slate-800 mb-3 md:mb-4">
            Ready to start your<br />
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">success journey?</span>
          </h2>
          <p className="text-slate-500 text-[13px] md:text-[14px] mb-8 font-normal max-w-xl mx-auto">Sign up free today and take your first mock test. No credit card required.</p>
          <div className="flex flex-wrap gap-3 md:gap-4 justify-center">
            <Link to="/register" className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold py-3 px-8 rounded-xl md:rounded-2xl shadow-lg shadow-indigo-500/20 hover:-translate-y-1 transition-all text-[13px] md:text-sm">
              Get Started — It's Free <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link to="/tests" className="flex items-center gap-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 font-medium py-3 px-8 rounded-xl md:rounded-2xl hover:shadow-sm hover:-translate-y-0.5 transition-all text-[13px] md:text-sm">
              Browse All Tests
            </Link>
          </div>
        </div>
      </section>

      {/* Footer is now handled by PublicLayout */}

      {/* Duplicate keyframe block removed — animations are defined in the hero <style> above */}

    </div>
  );
}
