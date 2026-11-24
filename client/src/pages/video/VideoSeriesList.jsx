import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import useAuthStore from '../../store/authStore';
import {
  Search, PlayCircle, ArrowRight, Star, X, CheckCircle, SlidersHorizontal, Video, ChevronRight
} from 'lucide-react';

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

const DEFAULT_COLOR = { card: 'from-indigo-500 to-violet-500' };

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



function SeriesCard({ series }) {
  const colors = getCategoryStyles(series.category);

  return (
    <Link to={`/video-series/${series.slug}`} className="group relative bg-white border border-slate-200 rounded-3xl overflow-hidden hover:shadow-2xl hover:border-transparent hover:-translate-y-2 transition-all duration-300 flex flex-col">
      <div className={`relative h-[110px] bg-gradient-to-br ${colors.card} p-5 flex flex-col justify-between overflow-hidden`}>
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

      <div className="p-5 flex-1 flex flex-col bg-white relative pt-8">
        <div className="absolute -top-5 left-5 right-5 flex justify-center">
          <div className="w-12 h-12 bg-white rounded-xl shadow-md border border-slate-100 flex items-center justify-center text-indigo-600 bg-gradient-to-br from-white to-slate-50">
             <PlayCircle className="w-7 h-7" />
          </div>
        </div>

        <h3 className="font-black text-center text-slate-900 text-[17px] leading-snug mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
          {series.title}
        </h3>

        <p className="text-[13px] text-center text-slate-500 font-medium line-clamp-2 mb-6 flex-1 leading-relaxed">
          {series.description || 'Watch deep-dive video lessons curated by expert instructors.'}
        </p>

        <div className="flex items-center gap-3 mb-6 bg-slate-50 rounded-2xl p-3 border border-slate-100">
          <div className="flex-1 flex flex-col px-1 items-center">
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1">Videos</span>
            <div className="flex items-center gap-1.5 font-black text-slate-700 text-[13px]">
              <Video className="w-3.5 h-3.5 text-indigo-500" />
              {series.totalVideos || 0}
            </div>
          </div>
          <div className="w-px h-8 bg-slate-200" />
          <div className="flex-1 flex flex-col px-1 items-center">
             <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1">Views</span>
             <div className="flex items-center gap-1.5 font-black text-slate-700 text-[13px]">
               <PlayCircle className="w-3.5 h-3.5 text-emerald-500" />
               {series.totalViews || '10k+'}
             </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
          <div className="flex items-center gap-1.5">
            {(series.isFree || series.price === 0 || !series.price) ? (
              <span className="text-[20px] font-black text-emerald-500">Free</span>
            ) : (
              <span className="text-[20px] font-black text-slate-900">₹{series.price}</span>
            )}
          </div>
          <span className="inline-flex items-center gap-1.5 bg-slate-900 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-500/30 transition-all group-hover:-translate-y-0.5">
            Watch <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function VideoSeriesList() {
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();

  const [series, setSeries] = useState([]);
  const [categories, setCategories] = useState([{ name: 'All', icon: '🌐', color: 'from-slate-600 to-slate-700' }]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    Promise.all([
      api.get('/video-series').catch(() => ({ data: { data: [] } })),
      api.get('/categories/public').catch(() => ({ data: { data: [] } }))
    ])
    .then(([seriesRes, catRes]) => {
      setSeries(seriesRes.data.data || []);
      const dbCats = catRes.data.data || [];
      const ICONS = ['🎥','🎬','📺','📻','🎧','🎤','🎙️'];
      const dynamicCats = dbCats.map((c, i) => ({
        name: c.name,
        icon: ICONS[i % ICONS.length],
        color: getCategoryStyles(c.name).card
      }));
      setCategories([{ name: 'All', icon: '🌐', color: 'from-slate-600 to-slate-700' }, ...dynamicCats]);
    })
    .finally(() => setLoading(false));
  }, []);

  let filtered = [...series];
  if (activeCategory !== 'All') filtered = filtered.filter(s => s.category === activeCategory);
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(s => s.title.toLowerCase().includes(q));
  }
  
  if (sortBy === 'popular') filtered.sort((a, b) => b.isFeatured ? 1 : -1); 
  if (sortBy === 'newest') filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  if (sortBy === 'price') filtered.sort((a, b) => (a.price||0) - (b.price||0));

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
    <div className="min-h-screen bg-white text-slate-800 font-sans pt-[76px] flex flex-col overflow-x-hidden">
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(to right, #94a3b81a 1px, transparent 1px), linear-gradient(to bottom, #94a3b81a 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-40 pointer-events-none -z-10" />
      <div className="fixed top-1/3 right-0 w-80 h-80 bg-violet-100 rounded-full blur-3xl opacity-30 pointer-events-none -z-10" />

      {/* ── NAVBAR ──────────────────────────────────────────── */}
      {/* Nav is now handled by PublicLayout */}

      {/* Promotional Banner */}
      <div className="w-full bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-900 relative overflow-hidden py-8 px-6 lg:px-12 border-b border-indigo-950">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/80 to-transparent"></div>
        
        <div className="max-w-[1400px] mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl text-center md:text-left">
            <span className="inline-block px-2.5 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 font-bold text-[9px] text-white uppercase tracking-widest rounded-full mb-3 shadow-lg shadow-amber-500/20 border border-amber-400">Premium Video Content</span>
            <h2 className="text-2xl md:text-4xl font-black mb-3 leading-tight text-white tracking-tight">Learn Visually. Master Skills.</h2>
            <p className="text-indigo-200 text-sm md:text-base mb-6 leading-relaxed font-medium">Watch structured, high-quality video courses curated by expert instructors to crack tough subjects visually.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
              <Link to="/register" className="inline-flex items-center justify-center gap-2 bg-white text-indigo-900 px-6 py-3 rounded-xl font-black text-sm hover:bg-slate-50 hover:scale-[1.02] transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                Start 7-Day Free Trial <ArrowRight size={16} />
              </Link>
            </div>
          </div>
          
          <div className="hidden lg:block relative shrink-0">
             <div className="absolute inset-0 bg-indigo-500/30 blur-3xl rounded-full transform scale-150"></div>
             <img src="https://images.unsplash.com/photo-1516321497487-e288fb19713f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Students Learning" className="w-[320px] h-[200px] object-cover rounded-2xl relative z-10 shadow-xl shadow-black/50 border-[4px] border-white/10 ring-1 ring-white/20 transform hover:-translate-y-1 transition-transform duration-500" />
             
             {/* Floating Badges */}
             <div className="absolute -left-6 top-6 z-20 bg-white px-3 py-2 rounded-xl shadow-lg flex items-center gap-2 animate-bounce" style={{ animationDuration: '3s' }}>
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                  <Video size={14} className="fill-emerald-500 text-emerald-500" />
                </div>
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase">Premium</p>
                  <p className="text-xs font-black text-slate-800">Quality</p>
                </div>
             </div>
             
             <div className="absolute -right-4 bottom-6 z-20 bg-white px-3 py-2 rounded-xl shadow-lg flex items-center gap-2 animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                  <PlayCircle size={14} />
                </div>
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase">All Videos</p>
                  <p className="text-xs font-black text-slate-800">Included</p>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Top Banner/Header - More compact */}
      <div className="bg-slate-50 border-b border-slate-100 py-6 px-6 lg:px-12">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 mb-1">Explore Video Series</h1>
            <p className="text-slate-500 text-sm font-medium tracking-tight">Select your category and start learning visually.</p>
          </div>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search Video Series..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 flex max-w-[1400px] mx-auto w-full px-4 lg:px-8 py-8 gap-10">
        {/* Left Sidebar - Categories */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-[100px]">
             <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-3">Video Categories</h2>
             <nav className="space-y-1">
                {categories.map((cat) => {
                  const isActive = activeCategory === cat.name;
                  
                  return (
                    <button 
                      key={cat.name}
                      onClick={() => setActiveCategory(cat.name)}
                      className={`w-full flex items-center justify-between px-3 py-3 rounded-xl font-bold text-sm transition-all ${
                        isActive 
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' 
                        : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-base ${isActive ? 'bg-white/20' : 'bg-slate-100'}`}>
                           {cat.icon}
                        </div>
                        <span className="truncate">{cat.name}</span>
                      </div>
                      <ChevronRight size={14} className={isActive ? 'opacity-100' : 'opacity-40'} />
                    </button>
                  );
                })}
             </nav>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col mb-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 className="text-xl font-black text-slate-900">Collections</h2>
              
              <div className="relative shrink-0">
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="appearance-none bg-white border border-slate-200 text-xs font-bold text-slate-700 pl-3 pr-8 py-2 rounded-lg hover:border-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer transition-colors"
                >
                  <option value="popular">Most Popular</option>
                  <option value="newest">Newest First</option>
                  <option value="price">Price: Low to High</option>
                </select>
                <SlidersHorizontal className="w-3 h-3 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Sub-category Tabs (Mobile scrollable, hidden on desktop if sidebar used, but let's keep it tight) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide mb-3 lg:hidden">
               {categories.map((cat) => (
                 <button 
                  key={cat.name}
                  onClick={() => setActiveCategory(cat.name)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all whitespace-nowrap ${
                    activeCategory === cat.name
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                 >
                   {cat.name}
                 </button>
               ))}
            </div>
            
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight flex items-center justify-between">
               <span>Found {filtered.length} matching series</span>
               {activeFiltersCount > 0 && (
                  <button onClick={clearAll} className="text-red-500 hover:text-red-600 flex items-center gap-1 normal-case">
                    <X size={12} /> Clear Filters
                  </button>
               )}
            </p>
          </div>

        {/* GRID */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4" />
            <p className="text-slate-500 font-bold">Loading video collections...</p>
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map(series => <SeriesCard key={series.id} series={series} />)}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center shadow-sm">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <Video className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-3">No video series found</h3>
            <p className="text-sm text-slate-500 font-medium max-w-sm mx-auto leading-relaxed mb-6">
              We couldn't find any video series matching your criteria. Try broader search terms.
            </p>
            <button
              onClick={clearAll}
              className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold px-6 py-3 rounded-xl hover:-translate-y-0.5 transition-all shadow-lg shadow-indigo-500/20"
            >
              Clear All Filters
            </button>
          </div>
        )}
        </div>
      </div>

      {!isAuthenticated && (
        <section className="py-24 px-6 lg:px-12 text-center max-w-4xl mx-auto mt-10">
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold px-4 py-2 rounded-full mb-6 shadow-sm">
            <CheckCircle className="w-3.5 h-3.5" /> Watch on any device
          </div>
          <h2 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mb-6">
            Start Your <br />
            <span className="bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">Learning Journey</span>
          </h2>
          <p className="text-slate-500 text-lg mb-10 font-medium max-w-2xl mx-auto">
            Get unrestricted access to hundreds of video lessons designed specifically for test mastery.
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

      {/* FOOTER */}
      {/* Footer is now handled by PublicLayout */}
    </div>
  );
}
