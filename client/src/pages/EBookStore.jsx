import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  BookOpen, ArrowRight, ChevronRight, Search, Star, Globe,
  LayoutGrid, Download, Eye, FileText, ShoppingBag, Zap,
  BookMarked, Sparkles, CheckCircle, X
} from 'lucide-react';
import api from '../lib/api';
import useAuthStore from '../store/authStore';
import { getImageUrl } from '../lib/imageUrl';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');

const FALLBACK_ICONS = {
  'General':'📚','Mathematics':'📐','Science':'🔬','English':'📝','History':'🏛️',
  'Geography':'🌍','Current Affairs':'📰','Aptitude':'🧮','Reasoning':'🧠',
  'Computer':'💻','GK':'🌐','Economics':'📈','Polity':'⚖️','SSC':'🎯',
  'UPSC':'🏛️','Banking':'🏦','Railway':'🚄','Defence':'🛡️','Teaching':'👨‍🏫','Other':'📖',
};

const CATEGORY_COLORS = [
  'bg-orange-500','bg-violet-500','bg-rose-500','bg-cyan-500',
  'bg-blue-500','bg-emerald-500','bg-amber-500','bg-purple-500',
];
const getCatColor = (cat) => {
  if (!cat) return CATEGORY_COLORS[0];
  const h = Array.from(cat).reduce((a, c) => a + c.charCodeAt(0), 0);
  return CATEGORY_COLORS[h % CATEGORY_COLORS.length];
};
const getCatIcon = (cat, image) => {
  if (image) return image; // will be rendered as <img> by caller
  return FALLBACK_ICONS[cat] || '📚';
};

export default function EBookStorePage() {
  const [books, setBooks]           = useState([]);
  const [categories, setCategories] = useState([]);   // fetched from API
  const [loading, setLoading]       = useState(true);
  const [catsLoading, setCatsLoading] = useState(true);
  const [total, setTotal]           = useState(0);
  const [search, setSearch]         = useState('');
  const [activeCategory, setActiveCategory] = useState(null); // null = All
  const [page, setPage]             = useState(1);
  const [searchParams]              = useSearchParams();
  const { isAuthenticated }         = useAuthStore();

  const LIMIT = 12;

  // Fetch real categories from API (same endpoint as /categories page)
  useEffect(() => {
    api.get('/categories/public')
      .then(res => {
        const dbCats = (res.data?.data || []).filter(c => c.isActive !== false);
        setCategories(dbCats);
      })
      .catch(() => setCategories([]))
      .finally(() => setCatsLoading(false));
  }, []);

  // Seed category from URL param once categories are loaded
  useEffect(() => {
    if (catsLoading || categories.length === 0) return;
    const c = searchParams.get('category');
    if (c) {
      const matched = categories.find(cat => cat.name.toLowerCase() === c.toLowerCase());
      if (matched) setActiveCategory(matched);
    }
  }, [catsLoading, categories]);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (search) params.search = search;
      // active category is now a category object; use its name for the API filter
      if (activeCategory) params.category = activeCategory.name;
      const res = await api.get('/ebooks/public', { params });
      setBooks(res.data?.data || []);
      setTotal(res.data?.total || 0);
    } catch {
      setBooks([]);
    } finally {
      setLoading(false);
    }
  }, [search, activeCategory, page]);

  useEffect(() => {
    const t = setTimeout(fetchBooks, 300);
    return () => clearTimeout(t);
  }, [fetchBooks]);

  const handleSelectCategory = (cat) => {
    setActiveCategory(cat);  // cat is now a full category object or null
    setPage(1);
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="min-h-screen bg-white font-sans pt-[76px] flex flex-col">

      {/* ── Promotional Banner ── */}
      <div className="w-full bg-gradient-to-r from-indigo-900 via-violet-900 to-indigo-900 relative overflow-hidden py-8 px-6 lg:px-12 border-b border-indigo-950">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1507842217343-583bb7270b66?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80')] bg-cover bg-center opacity-15 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/80 to-transparent" />

        <div className="max-w-[1400px] mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl text-center md:text-left">
            <span className="inline-block px-2.5 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 font-bold text-[9px] text-white uppercase tracking-widest rounded-full mb-3 shadow-lg shadow-amber-500/20 border border-amber-400">
              eBook Store — New
            </span>
            <h2 className="text-2xl md:text-4xl font-black mb-3 leading-tight text-white tracking-tight">
              Your Digital Study Library
            </h2>
            <p className="text-indigo-200 text-sm md:text-base mb-6 leading-relaxed font-medium">
              Download premium study materials, previous year papers, guides & reference books — curated for every competitive exam.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
              <Link to="/plans" className="inline-flex items-center justify-center gap-2 bg-white text-indigo-900 px-6 py-3 rounded-xl font-black text-sm hover:bg-slate-50 hover:scale-[1.02] transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                View All Plans <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          <div className="hidden lg:block relative shrink-0">
            <div className="absolute inset-0 bg-violet-500/30 blur-3xl rounded-full transform scale-150" />
            <img
              src="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
              alt="eBooks"
              className="w-[300px] h-[190px] object-cover rounded-2xl relative z-10 shadow-xl shadow-black/50 border-[4px] border-white/10 ring-1 ring-white/20 hover:-translate-y-1 transition-transform duration-500"
            />
            <div className="absolute -left-6 top-6 z-20 bg-white px-3 py-2 rounded-xl shadow-lg flex items-center gap-2 animate-bounce" style={{ animationDuration: '3s' }}>
              <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center text-violet-600">
                <BookMarked size={14} />
              </div>
              <div>
                <p className="text-[8px] font-black text-slate-400 uppercase">Premium</p>
                <p className="text-xs font-black text-slate-800">eBooks</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Top Header (Title + Search) ── */}
      <div className="bg-slate-50 border-b border-slate-100 py-6 px-6 lg:px-12">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 mb-1">Find Your eBook</h1>
            <p className="text-slate-500 text-sm font-medium tracking-tight">
              Select a category and explore available digital books &amp; study materials.
            </p>
          </div>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search eBooks, topics, authors..."
              className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={15} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Main Layout: Sidebar + Content ── */}
      <div className="flex-1 flex max-w-[1400px] mx-auto w-full px-4 lg:px-8 py-8 gap-10">

        {/* Left Sidebar — Categories */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-[100px]">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-3">
              Book Categories
            </h2>
            <nav className="space-y-1">
              {/* All */}
              <button
                onClick={() => handleSelectCategory(null)}
                className={`w-full flex items-center justify-between px-3 py-3 rounded-xl font-bold text-sm transition-all ${
                  !activeCategory
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-base ${!activeCategory ? 'bg-white/20' : 'bg-slate-100'}`}>🌐</div>
                  <span>All eBooks</span>
                </div>
                <ChevronRight size={14} className={!activeCategory ? 'opacity-100' : 'opacity-40'} />
              </button>

              {catsLoading ? (
                [...Array(6)].map((_, i) => (
                  <div key={i} className="h-11 bg-slate-100 rounded-xl animate-pulse mx-1" />
                ))
              ) : (
                categories.map((cat) => {
                  const isActive = activeCategory?.id === cat.id;
                  const icon = FALLBACK_ICONS[cat.name] || '📚';
                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleSelectCategory(cat)}
                      className={`w-full flex items-center justify-between px-3 py-3 rounded-xl font-bold text-sm transition-all ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-base ${isActive ? 'bg-white/20' : 'bg-slate-100'}`}>
                          {cat.image
                            ? <img src={getImageUrl(cat.image)} alt="" className="w-5 h-5 object-contain" />
                            : icon
                          }
                        </div>
                        <span className="truncate">{cat.name}</span>
                      </div>
                      <ChevronRight size={14} className={isActive ? 'opacity-100' : 'opacity-40'} />
                    </button>
                  );
                })
              )}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0">

          {/* Mobile back + heading */}
          <div className="flex flex-col mb-6">
            <div className="flex items-center gap-3 mb-4">
              {activeCategory && (
                <button onClick={() => handleSelectCategory(null)} className="lg:hidden w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200">
                  <ArrowRight size={16} className="rotate-180" />
                </button>
              )}
              <h2 className="text-xl font-black text-slate-900">
                {activeCategory ? `${activeCategory.name} eBooks` : 'All eBooks'}
              </h2>
            </div>

            {/* Category Browse Grid (shown when no category selected) */}
            {!activeCategory && (
              <div className="mb-10">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">Browse by Category</p>
                {catsLoading ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => <div key={i} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />)}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => handleSelectCategory(cat)}
                        className="group bg-white border border-slate-200 rounded-2xl p-5 hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300 text-left flex flex-col relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-50 to-transparent rounded-bl-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4 bg-slate-50 border border-slate-100">
                          {cat.image
                            ? <img src={getImageUrl(cat.image)} alt="" className="w-7 h-7 object-contain group-hover:scale-110 transition-transform" />
                            : (FALLBACK_ICONS[cat.name] || '📚')
                          }
                        </div>
                        <h3 className="text-base font-extrabold text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors">{cat.name}</h3>
                        <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">Explore Books →</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">
                {loading ? 'Loading...' : activeCategory ? `Found ${total} matching books` : 'Popular eBooks'}
              </p>
            </div>
          </div>

          {/* Book Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-slate-100 rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : books.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
              {books.map(book => (
                <EBookCard key={book.id} book={book} isAuthenticated={isAuthenticated} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                <Search size={32} className="text-slate-300" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">No eBooks found</h3>
              <p className="text-slate-500 font-medium">
                {search ? `No results for "${search}".` : 'No eBooks in this category yet.'}
              </p>
              {(search || activeCategory) && (
                <button
                  onClick={() => { setSearch(''); handleSelectCategory(null); }}
                  className="mt-4 text-indigo-600 font-bold text-sm hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-12">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                ← Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-10 h-10 rounded-xl text-sm font-black transition-all ${
                    page === p ? 'bg-indigo-600 text-white shadow-md' : 'border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600'
                  }`}>{p}</button>
              ))}
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                Next →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── CTA Banner ── */}
      <div className="max-w-[1400px] mx-auto w-full px-6 lg:px-8 pb-16">
        <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-700 rounded-3xl p-10 text-center">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px,white 1px,transparent 0)', backgroundSize: '20px 20px' }} />
          <div className="relative">
            <h2 className="text-3xl font-black text-white mb-3">Prepare Smarter, Score Higher</h2>
            <p className="text-indigo-200 mb-6 max-w-md mx-auto">
              Get unlimited access to all eBooks + mock test series + video courses in one premium plan.
            </p>
            <Link to="/plans" className="inline-flex items-center gap-2 bg-white text-indigo-700 font-black px-7 py-3.5 rounded-2xl hover:bg-indigo-50 transition-colors shadow-xl shadow-black/20">
              View Plans <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── EBook Card — matches CategoriesPage card style ─────────────── */
function EBookCard({ book, isAuthenticated }) {
  const coverUrl = book.coverImage ? getImageUrl(book.coverImage) : null;
  const isFreeAccess = book.isFree || book.accessType === 'free';
  const discountPct = book.mrp > 0 && book.price > 0
    ? Math.round(((book.mrp - book.price) / book.mrp) * 100) : 0;
  const catColor = getCatColor(book.category);

  return (
    <Link
      to={`/ebooks/${book.slug}`}
      className="group bg-white border border-slate-200 rounded-3xl p-5 hover:border-indigo-400 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300 flex flex-col relative block"
    >

      {/* Header Row — Cover + Meta */}
      <div className="flex items-start gap-4 mb-4">

        {/* Cover thumbnail (stacked card effect like CategoriesPage logo) */}
        <div className="w-16 h-20 shrink-0 relative flex items-center justify-center">
          <div className="absolute inset-0 bg-indigo-50 rounded-2xl group-hover:rotate-6 transition-transform duration-300" />
          <div className="absolute inset-0 bg-white rounded-2xl border border-indigo-100 group-hover:-rotate-3 transition-transform duration-300 shadow-sm overflow-hidden">
            {coverUrl
              ? <img src={coverUrl} alt={book.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
              : <div className="w-full h-full flex items-center justify-center text-2xl">{FALLBACK_ICONS[book.category] || '📚'}</div>
            }
          </div>
        </div>

        {/* Title + meta */}
        <div className="min-w-0 pr-6 flex-1">
          {/* Badges row */}
          <div className="flex items-center gap-1.5 mb-2 flex-wrap">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-2 py-0.5 bg-slate-100 rounded-md">
              {book.language || 'EN'}
            </span>
            {book.totalPages > 0 && (
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-2 py-0.5 bg-slate-100 rounded-md flex items-center gap-0.5">
                <FileText size={8} /> {book.totalPages}pp
              </span>
            )}
            <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
              isFreeAccess ? 'text-green-700 bg-green-50' :
              book.accessType === 'plan' ? 'text-purple-700 bg-purple-50' :
              'text-blue-700 bg-blue-50'
            }`}>
              {isFreeAccess ? '🎁 Free' : book.accessType === 'plan' ? '⚡ Plan' : '💳 Paid'}
            </span>
          </div>

          <h3 className="text-base font-extrabold text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors line-clamp-2">
            {book.title}
          </h3>
          {book.author && (
            <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-wider line-clamp-1">{book.author}</p>
          )}
        </div>

        {/* Arrow badge */}
        <div className="absolute right-5 top-5 w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:border-indigo-600 group-hover:text-white transition-all shadow-sm">
          <ArrowRight size={14} strokeWidth={3} className="group-hover:translate-x-[1px] transition-transform" />
        </div>
      </div>

      {/* Stats + Price row */}
      <div className="mt-auto grid grid-cols-2 gap-2 pt-4 border-t border-slate-100">
        {/* Price */}
        <div className="bg-slate-50 rounded-xl p-2.5 text-center group-hover:bg-indigo-50/50 transition-colors border border-transparent group-hover:border-indigo-50">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Price</p>
          {isFreeAccess ? (
            <p className="text-sm font-black text-green-600">FREE</p>
          ) : (
            <div className="flex items-center justify-center gap-1">
              <p className="text-sm font-black text-slate-800">₹{Number(book.price).toFixed(0)}</p>
              {discountPct > 0 && <span className="text-[9px] font-bold text-red-400 line-through">₹{Number(book.mrp).toFixed(0)}</span>}
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="bg-slate-50 rounded-xl p-2.5 text-center group-hover:bg-emerald-50/50 transition-colors border border-transparent group-hover:border-emerald-50 flex items-center justify-center">
          {isFreeAccess ? (
            isAuthenticated ? (
              <span
                role="button"
                onClick={e => { e.preventDefault(); e.stopPropagation(); window.open(`${API_BASE}/api/ebooks/download/${book.id}`, '_blank'); }}
                className="flex items-center gap-1 text-sm font-black text-emerald-600 cursor-pointer"
              >
                <Download size={13} /> Download
              </span>
            ) : (
              <span className="flex items-center gap-1 text-sm font-black text-emerald-600">
                <Download size={13} /> Get Free
              </span>
            )
          ) : book.accessType === 'plan' ? (
            <span className="flex items-center gap-1 text-sm font-black text-purple-600">
              <Zap size={13} /> Subscribe
            </span>
          ) : (
            <span className="flex items-center gap-1 text-sm font-black text-indigo-600">
              <ShoppingBag size={13} /> Buy Now
            </span>
          )}
        </div>
      </div>

      {/* Featured badge */}
      {book.isFeatured && (
        <div className="absolute top-3 left-3">
          <span className="flex items-center gap-0.5 bg-amber-400 text-amber-950 text-[9px] font-black px-2 py-0.5 rounded-full">
            <Star size={8} className="fill-amber-950" /> FEATURED
          </span>
        </div>
      )}
    </Link>
  );
}
