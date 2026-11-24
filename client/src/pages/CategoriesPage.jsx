import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  BookOpen, ArrowRight, LayoutGrid, ChevronRight, 
  Search, Globe, Star
} from 'lucide-react';
import api from '../lib/api';
import { getImageUrl } from '../lib/imageUrl';

const defaultCategories = [
  { name: 'UPSC CSE', icon: '🏛️', color: 'bg-orange-500' },
  { name: 'SSC', icon: '🎯', color: 'bg-rose-500' },
  { name: 'Banking', icon: '🏦', color: 'bg-violet-500' },
  { name: 'Railway', icon: '🚄', color: 'bg-cyan-500' },
  { name: 'BPSC', icon: '⚡', color: 'bg-blue-500' },
  { name: 'Engineering', icon: '⚙️', color: 'bg-gray-600' },
  { name: 'Medical', icon: '⚕️', color: 'bg-red-500' },
  { name: 'Teaching', icon: '👨‍🏫', color: 'bg-purple-500' },
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null); // null means 'All'
  const [activeSubCategory, setActiveSubCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchParams] = useSearchParams();
  const urlCategory = searchParams.get('category');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, seriesRes] = await Promise.all([
          api.get('/categories/public'),
          api.get('/exam-series')
        ]);

        const dbCats = catRes.data.data.filter(c => c.isActive !== false);
        setCategories(dbCats);
        setSeries(seriesRes.data.data || []);

        if (urlCategory) {
          const matched = dbCats.find(c => c.name.toLowerCase() === urlCategory.toLowerCase());
          if (matched) {
             setActiveCategory(matched);
             setActiveSubCategory(null);
          } else {
             // Maybe it's a subcategory in the URL
             let foundSub = null;
             let foundParent = null;
             for (const parent of dbCats) {
                 const sub = parent.subCategories?.find(s => s.name.toLowerCase() === urlCategory.toLowerCase());
                 if (sub) {
                     foundSub = sub;
                     foundParent = parent;
                     break;
                 }
             }
             if (foundSub) {
                 setActiveCategory(foundParent);
                 setActiveSubCategory(foundSub);
             }
          }
        }
      } catch (err) {
        console.error("Error fetching data", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [urlCategory]);

  const mainCategories = categories; // Because backend already filters parentId=null
  const currentSubCategories = activeCategory?.subCategories || [];

  const filteredSeries = series.filter(s => {
    // Search match
    const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (s.examName && s.examName.toLowerCase().includes(searchQuery.toLowerCase()));
    if (!matchesSearch) return false;

    // Category match
    if (!activeCategory) return true; // 'All'

    if (activeSubCategory) {
       // Match strict subcategory
       return s.category === activeSubCategory.name || s.subCategory === activeSubCategory.name;
    }

    // Match main category or any of its subcategories
    const validNames = [activeCategory.name, ...currentSubCategories.map(sub => sub.name)];
    return validNames.includes(s.category) || validNames.includes(s.subCategory);
  });

  const handleSelectMain = (cat) => {
    setActiveCategory(cat);
    setActiveSubCategory(null);
  };

  return (
    <div className="min-h-screen bg-white font-sans pt-[76px] flex flex-col">
      {/* Promotional Banner */}
      <div className="w-full bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-900 relative overflow-hidden py-8 px-6 lg:px-12 border-b border-indigo-950">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/80 to-transparent"></div>
        
        <div className="max-w-[1400px] mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl text-center md:text-left">
            <span className="inline-block px-2.5 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 font-bold text-[9px] text-white uppercase tracking-widest rounded-full mb-3 shadow-lg shadow-amber-500/20 border border-amber-400">Limited Time Offer</span>
            <h2 className="text-2xl md:text-4xl font-black mb-3 leading-tight text-white tracking-tight">Supercharge Your Preparation.</h2>
            <p className="text-indigo-200 text-sm md:text-base mb-6 leading-relaxed font-medium">Unlock full access to our premium Mock Tests, Video Series, and Live Classes. Start your Free Trial and experience the Abhyo advantage!</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
              <Link to="/register" className="inline-flex items-center justify-center gap-2 bg-white text-indigo-900 px-6 py-3 rounded-xl font-black text-sm hover:bg-slate-50 hover:scale-[1.02] transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                Start 7-Day Free Trial <ArrowRight size={16} />
              </Link>
            </div>
          </div>
          
          <div className="hidden lg:block relative shrink-0">
             <div className="absolute inset-0 bg-indigo-500/30 blur-3xl rounded-full transform scale-150"></div>
             <img src="https://images.unsplash.com/photo-1516321497487-e288fb19713f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Students Learning" className="w-[320px] h-[200px] object-cover rounded-2xl relative z-10 shadow-xl shadow-black/50 border-[4px] border-white/10 ring-1 ring-white/20 transform hover:-translate-y-1 transition-transform duration-500" />
             <div className="absolute -left-6 top-6 z-20 bg-white px-3 py-2 rounded-xl shadow-lg flex items-center gap-2 animate-bounce" style={{ animationDuration: '3s' }}>
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600"><Star size={14} className="fill-emerald-500" /></div>
                <div><p className="text-[8px] font-black text-slate-400 uppercase">Premium</p><p className="text-xs font-black text-slate-800">Unlocked</p></div>
             </div>
          </div>
        </div>
      </div>

      {/* Top Header */}
      <div className="bg-slate-50 border-b border-slate-100 py-6 px-6 lg:px-12">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 mb-1">Find Your Exam</h1>
            <p className="text-slate-500 text-sm font-medium tracking-tight">Select your target category and explore available mocked tests.</p>
          </div>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search for exam series..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 flex max-w-[1400px] mx-auto w-full px-4 lg:px-8 py-8 gap-10">
        
        {/* Left Sidebar - Main Categories */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-[100px]">
             <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-3">Exam Categories</h2>
             <nav className="space-y-1">
                <button 
                  onClick={() => handleSelectMain(null)}
                  className={`w-full flex items-center justify-between px-3 py-3 rounded-xl font-bold text-sm transition-all ${
                    !activeCategory 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' 
                    : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-base ${!activeCategory ? 'bg-white/20' : 'bg-slate-100'}`}>🌐</div>
                    <span>All Exams</span>
                  </div>
                  <ChevronRight size={14} className={!activeCategory ? 'opacity-100' : 'opacity-40'} />
                </button>

                {mainCategories.map((cat) => {
                  const isActive = activeCategory?.id === cat.id;
                  const def = defaultCategories.find(d => d.name === cat.name) || { icon: '🎓', color: 'bg-indigo-500' };
                  
                  return (
                    <button 
                      key={cat.id}
                      onClick={() => handleSelectMain(cat)}
                      className={`w-full flex items-center justify-between px-3 py-3 rounded-xl font-bold text-sm transition-all ${
                        isActive 
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' 
                        : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-base ${isActive ? 'bg-white/20' : 'bg-slate-100'}`}>
                          {cat.image ? <img src={getImageUrl(cat.image)} alt="" className="w-5 h-5 object-contain" /> : def.icon}
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
            <div className="flex items-center gap-3 mb-4">
               {activeCategory && (
                 <button onClick={() => handleSelectMain(null)} className="lg:hidden w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200">
                    <ArrowRight size={16} className="rotate-180" />
                 </button>
               )}
               <h2 className="text-xl font-black text-slate-900">
                 {activeCategory ? activeCategory.name : 'All Exams'}
               </h2>
            </div>
            
            {/* Sub-categories as Icon Cards */}
            {activeCategory && currentSubCategories.length > 0 && (
              <div className="mb-6">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Sub-Categories</p>
                <div className="flex flex-wrap gap-3">
                   <button 
                    onClick={() => setActiveSubCategory(null)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold border transition-all flex items-center gap-2 hover:-translate-y-0.5 ${
                      !activeSubCategory
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 shadow-sm'
                    }`}
                   >
                     <LayoutGrid size={16} className={!activeSubCategory ? 'text-indigo-500' : 'text-slate-400'} />
                     All {activeCategory.name}
                   </button>
                   
                   {currentSubCategories.map((sub, i) => {
                     const isSubActive = activeSubCategory?.id === sub.id;
                     const def = defaultCategories[i % defaultCategories.length] || { icon: '🎯' };
                     
                     return (
                       <button 
                        key={sub.id}
                        onClick={() => setActiveSubCategory(isSubActive ? null : sub)}
                        className={`px-4 py-2.5 rounded-xl text-sm font-bold border transition-all flex items-center gap-2 hover:-translate-y-0.5 ${
                          isSubActive
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 shadow-sm'
                        }`}
                       >
                         {sub.image ? (
                           <img src={getImageUrl(sub.image)} alt="" className="w-4 h-4 object-contain" />
                         ) : (
                           <span className="text-sm">{def.icon}</span>
                         )}
                         {sub.name}
                       </button>
                     );
                   })}
                </div>
              </div>
            )}
            
            
            {!activeCategory && (
              <div className="mb-10">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">Browse by Exam Category</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {mainCategories.map((cat, i) => {
                    const def = defaultCategories.find(d => d.name === cat.name) || defaultCategories[i % defaultCategories.length];
                    return (
                      <button 
                        key={cat.id} 
                        onClick={() => handleSelectMain(cat)}
                        className="group bg-white border border-slate-200 rounded-2xl p-5 hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300 text-left flex flex-col relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-50 to-transparent rounded-bl-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4 ${cat.image ? 'bg-slate-50 border border-slate-100' : 'bg-slate-50'}`}>
                          {cat.image ? <img src={getImageUrl(cat.image)} alt="" className="w-7 h-7 object-contain group-hover:scale-110 transition-transform" /> : def.icon}
                        </div>
                        <h3 className="text-base font-extrabold text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors">{cat.name}</h3>
                        <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">Explore Exams →</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">
                 {activeCategory ? `Found ${filteredSeries.length} matching series` : 'Popular Exam Series'}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-40 bg-slate-100 rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : filteredSeries.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
              {filteredSeries.map((s, i) => (
                  <Link 
                    key={s.id} 
                    to={`/exam-series/${s.slug}`}
                    className="group bg-white border border-slate-200 rounded-3xl p-5 hover:border-indigo-400 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300 flex flex-col relative"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      {/* Left Logo */}
                      <div className="w-16 h-16 shrink-0 relative flex items-center justify-center">
                        <div className="absolute inset-0 bg-indigo-50 rounded-2xl group-hover:rotate-6 transition-transform duration-300" />
                        <div className="absolute inset-0 bg-white rounded-2xl border border-indigo-100 group-hover:-rotate-3 transition-transform duration-300 shadow-sm" />
                        <div className="relative z-10 w-10 h-10 flex items-center justify-center">
                            {s.thumbnail ? (
                              <img src={getImageUrl(s.thumbnail)} alt="" className="w-full h-full object-contain drop-shadow-sm group-hover:scale-110 transition-transform duration-300" />
                            ) : (
                              <span className="text-2xl group-hover:scale-110 transition-transform duration-300">🎓</span>
                            )}
                        </div>
                      </div>

                      <div className="min-w-0 pr-6 flex-1">
                        <div className="flex items-center gap-1.5 mb-2">
                           <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-2 py-0.5 bg-slate-100 rounded-md">EN</span>
                           <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-2 py-0.5 bg-slate-100 rounded-md">HI</span>
                           <span className="ml-auto text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md flex items-center gap-1"><Star size={10} className="fill-amber-500 text-amber-500" />4.9</span>
                        </div>
                        <h3 className="text-base font-extrabold text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors line-clamp-2">
                          {s.title}
                        </h3>
                        <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-wider line-clamp-1">{s.examName || s.category}</p>
                      </div>

                      <div className="absolute right-5 top-5 w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:border-indigo-600 group-hover:text-white transition-all shadow-sm">
                        <ArrowRight size={14} strokeWidth={3} className="group-hover:translate-x-[1px] transition-transform" />
                      </div>
                    </div>
                    
                    <div className="mt-auto grid grid-cols-2 gap-2 pt-4 border-t border-slate-100">
                       <div className="bg-slate-50 rounded-xl p-2.5 text-center group-hover:bg-indigo-50/50 transition-colors border border-transparent group-hover:border-indigo-50">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Mock Tests</p>
                         <p className="text-sm font-black text-slate-800">{s.totalTests || '50+'}</p>
                       </div>
                       <div className="bg-slate-50 rounded-xl p-2.5 text-center group-hover:bg-emerald-50/50 transition-colors border border-transparent group-hover:border-emerald-50">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Includes</p>
                         <p className="text-sm font-black text-emerald-600">Free Tests</p>
                       </div>
                    </div>
                  </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                <Search size={32} className="text-slate-300" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">No exams found</h3>
              <p className="text-slate-500 font-medium">Try searching for a different keyword or selecting another category.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
