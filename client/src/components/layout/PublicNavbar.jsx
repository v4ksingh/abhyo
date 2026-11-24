import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Menu, X, Trophy, FileText, BookMarked, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';
import useAuthStore from '../../store/authStore';

const navLinks = [
  { label: 'Exam Series',    to: '/categories' },
  { label: 'Govt Jobs',      to: '/government-jobs' },
  { label: 'Upcoming Exams', to: '/upcoming-exams' },
  { label: 'Video Series',   to: '/video-series' },
  { label: 'eBooks',         to: '/ebooks' },
  { label: 'Courses',        to: '/courses' },
  { label: 'Pricing',        to: '/plans' },
  { label: 'For Institutes', to: '/institutes' },
  { label: 'Olympiad',       to: '/olympiad', isOlympiad: true },
];

export default function PublicNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [showRegModal, setShowRegModal] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  // Close modal on ESC key
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') setShowRegModal(false); };
    if (showRegModal) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [showRegModal]);

  // Global listener so any button on the page (like hero Explore Courses) can open registration choice modal
  useEffect(() => {
    const handleOpen = () => setShowRegModal(true);
    window.addEventListener('open-reg-modal', handleOpen);
    if (location.search.includes('register=choice')) {
      setShowRegModal(true);
    }
    return () => window.removeEventListener('open-reg-modal', handleOpen);
  }, [location.search]);

  useEffect(() => {
    // If not on home page, maybe always keep it solid? Or let it be transparent if they all have top backgrounds.
    // For consistency with Landing, we will use the scroll effect on all.
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check on mount
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

  const isSolid = scrolled || location.pathname !== '/';

  useEffect(() => {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    const color = (isSolid || mobileMenu) ? '#ffffff' : '#f5f3ff';
    
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', color);
    } else {
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.content = color;
      document.head.appendChild(meta);
    }
    
    // Cleanup on unmount by resetting to default white
    return () => {
      if (metaThemeColor) metaThemeColor.setAttribute('content', '#ffffff');
    };
  }, [isSolid, mobileMenu]);

  const getDashboardLink = () => {
    if (!user) return '/login';
    if (user.role === 'institute') return '/institute/dashboard';
    if (user.role === 'superadmin') return '/admin/dashboard';
    if (user.role === 'instructor') return '/instructor/courses';
    return '/student/dashboard';
  };

  return (<>
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${isSolid ? 'bg-white/95 backdrop-blur-xl shadow-sm border-b border-slate-100 py-2 sm:py-2.5' : 'bg-transparent py-2.5 sm:py-3'}`}>
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center group shrink-0">
          <img src="/logo.png" alt="Abhyo" className="h-16 sm:h-20 w-auto group-hover:scale-105 transition-transform" />
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-0.5 xl:gap-1.5 2xl:gap-2">
          {navLinks.map((l) => (
            l.isOlympiad ? (
              <Link
                key={l.label}
                to={l.to}
                className="relative flex items-center gap-1 text-[10px] xl:text-[11px] font-bold px-2 xl:px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-sm shadow-amber-400/30 hover:shadow-md hover:scale-105 transition-all ml-0.5 xl:ml-1 group shrink-0"
              >
                <Trophy size={11} className="text-yellow-100 group-hover:rotate-12 transition-transform" />
                <span>{l.label}</span>
                <span className="text-[8px] bg-white text-amber-700 px-1 py-0.5 rounded-full font-black uppercase tracking-wider">Live</span>
              </Link>
            ) : l.highlight ? (
              <Link key={l.label} to={l.to}
                className="flex items-center gap-1 text-xs font-bold px-2.5 xl:px-3 py-1.5 rounded-full bg-violet-600 text-white hover:bg-violet-700 transition-all shadow-sm shadow-violet-300 ml-0.5 xl:ml-1 shrink-0"
              >
                <BookMarked size={12} /> {l.label}
              </Link>
            ) : l.to.startsWith('/') && !l.to.includes('#') ? (
              <Link key={l.label} to={l.to} className={`text-xs xl:text-sm font-medium px-2 xl:px-3 py-2 rounded-lg transition-all shrink-0 ${isSolid ? 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50' : 'text-slate-700 hover:text-indigo-600 hover:bg-white/50'}`}>{l.label}</Link>
            ) : (
              <a key={l.label} href={l.to} className={`text-xs xl:text-sm font-medium px-2 xl:px-3 py-2 rounded-lg transition-all shrink-0 ${isSolid ? 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50' : 'text-slate-700 hover:text-indigo-600 hover:bg-white/50'}`}>{l.label}</a>
            )
          ))}
        </div>


        {/* CTA */}
        <div className="flex items-center gap-2 shrink-0">
          {isAuthenticated ? (
            <Link to={getDashboardLink()} className="relative overflow-hidden hidden sm:inline-flex items-center gap-1 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold py-1.5 px-3.5 rounded-lg shadow-md shadow-indigo-500/30 hover:-translate-y-0.5 transition-all text-xs group">
              Dashboard <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </Link>
          ) : (
            <>
              <Link to="/login" className={`hidden sm:inline-flex text-xs font-semibold border py-1.5 px-3 rounded-lg transition-all ${isSolid ? 'text-slate-600 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600' : 'text-slate-700 border-slate-300 hover:bg-white/50'}`}>Sign In</Link>
              <button onClick={() => setShowRegModal(true)} className="relative overflow-hidden hidden sm:inline-flex items-center gap-1 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold py-1.5 px-3.5 rounded-lg shadow-md shadow-indigo-500/30 hover:-translate-y-0.5 transition-all text-xs group">
                <span className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-full transition-transform duration-700 skew-x-12" />
                Start Free <ArrowRight className="w-3 h-3" />
              </button>
            </>
          )}

          <button
            className={`lg:hidden p-1.5 rounded-lg border transition-all ${isSolid ? 'border-slate-200 text-slate-800 bg-white hover:bg-slate-50' : 'border-white/60 text-slate-900 bg-white/50 backdrop-blur-md hover:bg-white/80 shadow-sm'}`}
            onClick={() => setMobileMenu(!mobileMenu)}
          >
            {mobileMenu ? <X size={18} strokeWidth={2.5} /> : <Menu size={18} strokeWidth={2.5} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenu && (
        <div className="lg:hidden absolute top-full left-0 w-full bg-white border-b border-slate-100 shadow-lg px-5 py-4 flex flex-col gap-1">
          {navLinks.map((l) => (
            l.isOlympiad ? (
              <Link
                key={l.label}
                to={l.to}
                onClick={() => setMobileMenu(false)}
                className="flex items-center justify-between text-sm font-bold text-amber-900 bg-amber-50/90 px-3.5 py-2.5 rounded-xl border border-amber-200/80 my-1 shadow-sm"
              >
                <span className="flex items-center gap-2">
                  <Trophy size={16} className="text-amber-500" />
                  <span>Abhyo Olympiad 2026</span>
                </span>
                <span className="text-[10px] bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Class 6–12 • Live
                </span>
              </Link>
            ) : l.highlight ? (
              <Link key={l.label} to={l.to} onClick={() => setMobileMenu(false)}
                  className="flex items-center gap-1.5 text-sm font-bold text-violet-600 py-2.5 border-b border-slate-50"
                >
                  <BookMarked size={14} /> {l.label} <span className="text-[10px] bg-violet-600 text-white px-1.5 py-0.5 rounded-full ml-1">NEW</span>
              </Link>
            ) : l.to.startsWith('/') && !l.to.includes('#') ? (
              <Link key={l.label} to={l.to} onClick={() => setMobileMenu(false)} className="text-sm font-medium text-slate-700 hover:text-indigo-600 py-2.5 border-b border-slate-50">{l.label}</Link>
            ) : (
              <a key={l.label} href={l.to} onClick={() => setMobileMenu(false)} className="text-sm font-medium text-slate-700 hover:text-indigo-600 py-2.5 border-b border-slate-50">{l.label}</a>
            )
          ))}
          {isAuthenticated ? (
            <Link to={getDashboardLink()} className="mt-2 w-full flex justify-center bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold py-3 rounded-xl text-sm">Dashboard →</Link>
          ) : (
            <button onClick={() => { setMobileMenu(false); setShowRegModal(true); }} className="mt-2 w-full flex justify-center bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold py-3 rounded-xl text-sm">Start Free →</button>
          )}
        </div>
      )}
    </nav>

    {/* Registration Choice Modal */}
    {showRegModal && (
      <div
        className="fixed inset-0 z-[100000] overflow-y-auto overscroll-contain flex items-center justify-center p-3 sm:p-6"
        style={{ backgroundColor: 'rgba(10, 8, 30, 0.78)', backdropFilter: 'blur(8px)' }}
        onClick={() => setShowRegModal(false)}
      >
        <div
          className="relative w-full max-w-xl sm:max-w-2xl my-auto bg-white rounded-2xl sm:rounded-[32px] shadow-2xl border border-slate-100 flex flex-col max-h-[calc(100dvh-1.5rem)] sm:max-h-none overflow-hidden"
          style={{ animation: 'navModalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) both' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative shrink-0 bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-700 px-4 sm:px-10 pt-4 sm:pt-8 pb-4 sm:pb-8 text-center text-white overflow-hidden">
            {/* Ambient background glows */}
            <div className="absolute -top-16 -left-16 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-16 -right-16 w-56 h-56 bg-purple-500/30 rounded-full blur-2xl pointer-events-none" />

            {/* Close Button */}
            <button
              onClick={() => setShowRegModal(false)}
              className="absolute top-2.5 right-2.5 sm:top-4 sm:right-5 text-white/80 hover:text-white bg-white/15 hover:bg-white/25 active:scale-95 rounded-full p-1.5 sm:p-2 transition-all cursor-pointer backdrop-blur-sm z-10"
              aria-label="Close"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Tag Badge */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-white/15 backdrop-blur-md text-amber-200 text-[10px] sm:text-xs font-bold tracking-wide uppercase mb-1.5 sm:mb-2.5 ring-1 ring-white/20">
              <Sparkles size={12} className="text-amber-300" />
              <span>Start Free • Instant Access</span>
            </div>

            <h2 className="text-lg sm:text-2xl lg:text-3xl font-black tracking-tight text-white mb-1 sm:mb-2 leading-tight">
              How would you like to prepare?
            </h2>
            <p className="text-indigo-100/90 text-[11px] sm:text-xs lg:text-sm max-w-md mx-auto font-medium leading-snug">
              Choose your program below to setup your personalized student dashboard
            </p>
          </div>

          {/* Cards Body */}
          <div className="px-3 sm:px-8 py-3.5 sm:py-6 bg-slate-50/70 border-b border-slate-100 overflow-y-auto overscroll-contain flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-5">
              
              {/* Card 1: Abhyo Olympiad */}
              <div
                onClick={() => { setShowRegModal(false); navigate('/olympiad/register-account'); }}
                className="group relative flex flex-col justify-between p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white border-2 border-slate-200/80 hover:border-amber-400 active:border-amber-400 shadow-sm hover:shadow-xl hover:shadow-amber-500/10 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer text-left"
              >
                <div>
                  {/* Top Corner Ribbon / Badge */}
                  <div className="flex items-center justify-between gap-2 mb-2 sm:mb-3">
                    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
                      <Trophy className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                      Class 6–12
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-amber-600 transition-colors">
                    Abhyo Olympiad
                  </h3>
                  <p className="text-slate-500 text-[11px] sm:text-xs mt-0.5 sm:mt-1 leading-snug">
                    National competition in Maths, Science, Coding & Reasoning.
                  </p>

                  {/* Highlights */}
                  <ul className="mt-2 sm:mt-3 space-y-1 sm:space-y-1.5 text-[11px] sm:text-xs text-slate-600 font-medium">
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 size={12} className="text-amber-500 shrink-0" />
                      <span>₹10 Lakh+ Prize Pool & Medals</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 size={12} className="text-amber-500 shrink-0" />
                      <span>All-India Percentile & Rank</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 size={12} className="text-amber-500 shrink-0" />
                      <span>QR-Verified Certificates</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-2.5 sm:mt-4 pt-2 sm:pt-2.5 border-t border-slate-100">
                  <div className="w-full py-2 sm:py-2.5 px-3 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm text-center flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm shadow-orange-500/20 group-hover:from-amber-600 group-hover:to-orange-600 group-hover:shadow-md transition-all">
                    <span>Register for Olympiad</span>
                    <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>

              {/* Card 2: Mock Tests */}
              <div
                onClick={() => { setShowRegModal(false); navigate('/register'); }}
                className="group relative flex flex-col justify-between p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white border-2 border-slate-200/80 hover:border-indigo-400 active:border-indigo-400 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer text-left"
              >
                <div>
                  {/* Top Corner Ribbon / Badge */}
                  <div className="flex items-center justify-between gap-2 mb-2 sm:mb-3">
                    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                      <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                      Govt & Entrances
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                    Mock Test Series
                  </h3>
                  <p className="text-slate-500 text-[11px] sm:text-xs mt-0.5 sm:mt-1 leading-snug">
                    Practice UPSC, SSC, Banking, Railway & State PCS exams.
                  </p>

                  {/* Highlights */}
                  <ul className="mt-2 sm:mt-3 space-y-1 sm:space-y-1.5 text-[11px] sm:text-xs text-slate-600 font-medium">
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 size={12} className="text-indigo-500 shrink-0" />
                      <span>500+ Realistic Mock Tests</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 size={12} className="text-indigo-500 shrink-0" />
                      <span>Bilingual: Hindi & English</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 size={12} className="text-indigo-500 shrink-0" />
                      <span>AI Analytics & Detailed Solutions</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-2.5 sm:mt-4 pt-2 sm:pt-2.5 border-t border-slate-100">
                  <div className="w-full py-2 sm:py-2.5 px-3 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm text-center flex items-center justify-center gap-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm shadow-indigo-500/20 group-hover:from-indigo-700 group-hover:to-violet-700 group-hover:shadow-md transition-all">
                    <span>Start Mock Tests</span>
                    <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Footer */}
          <div className="shrink-0 px-4 py-2.5 sm:px-6 sm:py-3.5 bg-white flex flex-col sm:flex-row items-center justify-between gap-1 sm:gap-2 text-[11px] sm:text-xs border-t border-slate-100">
            <span className="hidden sm:flex items-center gap-1.5 text-slate-400 font-medium">
              <ShieldCheck size={14} className="text-emerald-500" /> Free to explore • No credit card required
            </span>
            <p className="w-full sm:w-auto text-center sm:text-right text-slate-500 font-medium">
              Already have an account?{' '}
              <Link
                to="/login"
                onClick={() => setShowRegModal(false)}
                className="text-indigo-600 font-bold hover:text-indigo-700 hover:underline ml-0.5"
              >
                Sign In →
              </Link>
            </p>
          </div>
        </div>

        <style>{`
          @keyframes navModalIn {
            from { opacity: 0; transform: scale(0.94) translateY(12px); }
            to   { opacity: 1; transform: scale(1) translateY(0); }
          }
        `}</style>
      </div>
    )}
  </>);
}
