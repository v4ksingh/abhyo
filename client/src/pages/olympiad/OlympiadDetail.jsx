import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Trophy, Calendar, Clock, Users, Award, BookOpen, CheckCircle2,
  ArrowLeft, Star, Zap, Shield, Target, FileText, ChevronRight,
  ChevronDown, DollarSign, Info, AlertCircle, BarChart2, Medal,
  Flame, ArrowRight, Laptop, Globe, Lock, Share2, Copy, Check,
  Sparkles, HelpCircle, GraduationCap, Download, Timer, Gift,
  CheckCircle, Smartphone
} from 'lucide-react';
import api from '../../lib/api';
import useAuthStore from '../../store/authStore';
import usePageMeta from '../../hooks/usePageMeta';

/* ───────────────────────────────────────────────────────────────────────────
   Custom Inline Styles for Ultra-Premium Aesthetics
   ─────────────────────────────────────────────────────────────────────────── */
const DETAIL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
  
  .oly-detail-root {
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .oly-heading {
    font-family: 'Outfit', sans-serif;
  }

  @keyframes pulseGlow {
    0%, 100% { opacity: 0.45; transform: scale(1); }
    50% { opacity: 0.75; transform: scale(1.08); }
  }

  @keyframes floatSlow {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-7px); }
  }

  @keyframes shimmerSwipe {
    0% { transform: translateX(-120%) skewX(-20deg); }
    100% { transform: translateX(240%) skewX(-20deg); }
  }

  .glow-orb {
    animation: pulseGlow 6s ease-in-out infinite;
  }

  .float-badge {
    animation: floatSlow 4.5s ease-in-out infinite;
  }

  .shimmer-btn {
    position: relative;
    overflow: hidden;
  }
  .shimmer-btn::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.28) 50%, transparent 100%);
    transform: translateX(-120%) skewX(-20deg);
  }
  .shimmer-btn:hover::after {
    animation: shimmerSwipe 0.85s ease;
  }

  .glass-card {
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(226, 232, 240, 0.8);
  }

  .glass-hero-panel {
    background: rgba(255, 255, 255, 0.04);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.12);
  }
`;

export default function OlympiadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const [olympiad, setOlympiad] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [copied, setCopied] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  usePageMeta(
    olympiad ? `${olympiad.title} – National Olympiad` : 'Olympiad Details',
    olympiad?.tagline || 'Compete in national Olympiad examination with All-India ranking and awards.'
  );

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchOlympiad();
  }, [id]);

  const fetchOlympiad = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/olympiad/public/${id}`);
      if (res.data?.success && res.data.data) {
        setOlympiad(res.data.data);
      } else {
        setError('Olympiad not found');
      }
    } catch (err) {
      console.error('Failed to fetch olympiad detail:', err);
      setError(err.response?.data?.error || 'Unable to load olympiad details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    }
  };

  const handleRegister = () => {
    if (!olympiad) return;
    const dest = `/student/olympiad/register/${olympiad.id}`;
    if (isAuthenticated) {
      navigate(dest);
    } else {
      navigate(`/olympiad/register-account?redirect=${encodeURIComponent(dest)}`);
    }
  };

  const handleTakeExam = () => {
    if (!olympiad) return;
    const dest = `/student/olympiad/exam/${olympiad.id}`;
    if (isAuthenticated) {
      navigate(dest);
    } else {
      navigate(`/olympiad/register-account?redirect=${encodeURIComponent(dest)}`);
    }
  };

  const handleViewResult = () => {
    if (!olympiad) return;
    const dest = `/student/olympiad/result/${olympiad.id}`;
    if (isAuthenticated) {
      navigate(dest);
    } else {
      navigate(`/login?redirect=${encodeURIComponent(dest)}`);
    }
  };

  // Safe Parsers
  const subjectColor = olympiad?.subject?.color || '#6366f1';
  const subjectName = olympiad?.subject?.name || 'Olympiad';

  const classesList = useMemo(() => {
    if (!olympiad?.eligibleClasses) return [6, 7, 8, 9, 10, 11, 12];
    if (Array.isArray(olympiad.eligibleClasses)) return olympiad.eligibleClasses;
    try {
      return JSON.parse(olympiad.eligibleClasses);
    } catch {
      return [6, 7, 8, 9, 10, 11, 12];
    }
  }, [olympiad?.eligibleClasses]);

  const prizesList = useMemo(() => {
    if (!olympiad?.prizeDetails) return [];
    if (Array.isArray(olympiad.prizeDetails)) return olympiad.prizeDetails;
    try {
      const parsed = JSON.parse(olympiad.prizeDetails);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [olympiad?.prizeDetails]);

  // Format Dates
  const formatDate = (dateStr) => {
    if (!dateStr) return 'TBA';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const statusConfig = useMemo(() => {
    const s = olympiad?.status || 'upcoming';
    switch (s) {
      case 'open':
        return {
          label: 'Registrations Open',
          bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
          dot: 'bg-emerald-400'
        };
      case 'ongoing':
        return {
          label: 'Exam In Progress',
          bg: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
          dot: 'bg-amber-400'
        };
      case 'completed':
        return {
          label: 'Exam Completed',
          bg: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
          dot: 'bg-indigo-400'
        };
      case 'closed':
        return {
          label: 'Registration Closed',
          bg: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
          dot: 'bg-rose-400'
        };
      default:
        return {
          label: 'Upcoming Competition',
          bg: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
          dot: 'bg-sky-400'
        };
    }
  }, [olympiad?.status]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white px-4">
        <style>{DETAIL_STYLES}</style>
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 animate-ping" />
          <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
        </div>
        <p className="text-slate-400 text-sm font-medium tracking-wide">Loading Olympiad information...</p>
      </div>
    );
  }

  if (error || !olympiad) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white px-4">
        <style>{DETAIL_STYLES}</style>
        <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2 oly-heading">Olympiad Not Found</h2>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            {error || "The requested Olympiad could not be located or may have been removed."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/olympiad"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all"
            >
              Browse All Olympiads
            </Link>
            <button
              onClick={() => fetchOlympiad()}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition-all"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isCompleted = olympiad.status === 'completed';
  const isOngoing = olympiad.status === 'ongoing';
  const isOpen = olympiad.status === 'open';

  return (
    <div className="oly-detail-root min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white pb-24">
      <style>{DETAIL_STYLES}</style>

      {/* ─────────────────────────────────────────────────────────────────────
          TOP NAVBAR / NAVIGATION STRIP
          ───────────────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/olympiad"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-all text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Olympiads</span>
            </Link>

            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
              <span>/</span>
              <span className="text-slate-400 capitalize">{subjectName}</span>
              <span>/</span>
              <span className="text-slate-200 font-medium truncate max-w-[200px]">{olympiad.title}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-medium transition-all"
              title="Share Olympiad link"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden xs:inline">Share</span>
                </>
              )}
            </button>

            {/* Quick Action Button in Header */}
            {isOpen && (
              <button
                onClick={handleRegister}
                className="hidden md:inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-white text-xs font-bold transition-all hover:brightness-110 active:scale-95 shimmer-btn shadow-md"
                style={{ background: subjectColor }}
              >
                <span>Register · ₹{olympiad.registrationFee || 150}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
            {isOngoing && (
              <button
                onClick={handleTakeExam}
                className="hidden md:inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold transition-all hover:bg-emerald-400 active:scale-95 shadow-md"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Enter Exam Now</span>
              </button>
            )}
            {isCompleted && (
              <button
                onClick={handleViewResult}
                className="hidden md:inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold transition-all hover:bg-indigo-500 active:scale-95 shadow-md"
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>View Results</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────────────
          DRAMATIC HERO SECTION WITH CINEMATIC BACKGROUND IMAGE & AURORA GLOWS
          ───────────────────────────────────────────────────────────────────── */}
      <section className="relative bg-slate-950 text-white pt-12 pb-20 sm:pb-28 overflow-hidden">
        {/* Cinematic Background Image Layer */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <img
            src={olympiad?.bannerImage || '/images/olympiad/hero-detail-bg.jpg'}
            alt={olympiad?.title || 'Olympiad Banner'}
            className="w-full h-full object-cover object-center scale-105 opacity-35 sm:opacity-40 transition-transform duration-1000 ease-out"
          />

          {/* Deep Dark Multilayered Gradient Overlays for Ultra-Crisp Legibility */}
          <div
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(ellipse 95% 70% at 50% 15%, rgba(15, 23, 42, 0.45) 0%, rgba(2, 6, 23, 0.92) 85%),
                linear-gradient(180deg, rgba(2, 6, 23, 0.72) 0%, rgba(2, 6, 23, 0.85) 55%, #020617 100%)
              `
            }}
          />

          {/* Dynamic Subject Accent Tint */}
          <div
            className="absolute inset-0 opacity-25 mix-blend-color"
            style={{ backgroundColor: subjectColor }}
          />

          {/* Subtle Grid Texture */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)',
              backgroundSize: '28px 28px'
            }}
          />
        </div>

        {/* Glow ambient orbs */}
        <div
          className="absolute -top-32 left-1/4 w-[520px] h-[520px] rounded-full blur-[140px] pointer-events-none glow-orb z-[1]"
          style={{ background: `${subjectColor}38` }}
        />
        <div className="absolute top-1/3 -right-24 w-[420px] h-[420px] rounded-full bg-cyan-500/10 blur-[130px] pointer-events-none z-[1]" />
        <div className="absolute -bottom-24 left-10 w-[380px] h-[380px] rounded-full bg-amber-500/10 blur-[120px] pointer-events-none z-[1]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            
            {/* Left Column (8 cols): Badges, Title, Meta, Fast Pills */}
            <div className="lg:col-span-8 flex flex-col space-y-6">
              
              {/* Top Badges Strip */}
              <div className="flex flex-wrap items-center gap-2.5">
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-sm"
                  style={{
                    backgroundColor: `${subjectColor}20`,
                    borderColor: `${subjectColor}40`,
                    color: subjectColor
                  }}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {subjectName} Olympiad
                </span>

                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${statusConfig.bg}`}>
                  <span className={`w-2 h-2 rounded-full ${statusConfig.dot} animate-pulse`} />
                  {statusConfig.label}
                </span>

                <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-900/90 text-slate-300 border border-slate-800">
                  <Shield className="w-3 h-3 text-emerald-400" />
                  National Benchmark
                </span>
              </div>

              {/* Main Grand Title */}
              <div>
                <h1 className="oly-heading text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-[1.15]">
                  {olympiad.title}
                </h1>
                {olympiad.tagline && (
                  <p className="mt-3 text-lg sm:text-xl text-slate-300 font-medium leading-relaxed max-w-2xl">
                    {olympiad.tagline}
                  </p>
                )}
              </div>

              {/* Highlight Badges / Value Props */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="glass-hero-panel p-3.5 rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Top Award</p>
                    <p className="text-sm font-bold text-white">Cash & Medals</p>
                  </div>
                </div>

                <div className="glass-hero-panel p-3.5 rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Duration</p>
                    <p className="text-sm font-bold text-white">{olympiad.examDurationMinutes || 60} Minutes</p>
                  </div>
                </div>

                <div className="glass-hero-panel p-3.5 rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Eligibility</p>
                    <p className="text-sm font-bold text-white">
                      {classesList.length > 5 ? 'Class 6 to 12' : `Class ${classesList.join(', ')}`}
                    </p>
                  </div>
                </div>

                <div className="glass-hero-panel p-3.5 rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0">
                    <Laptop className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Format</p>
                    <p className="text-sm font-bold text-white">Online CBT</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column (4 cols): Floating Hero Action Card */}
            <div className="lg:col-span-4">
              <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl relative overflow-hidden backdrop-blur-xl">
                {/* Glow bar at top of card */}
                <div
                  className="absolute top-0 left-0 right-0 h-1.5"
                  style={{ background: `linear-gradient(90deg, ${subjectColor}, #06b6d4)` }}
                />

                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Registration Fee</p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-3xl font-black text-white oly-heading">
                        ₹{olympiad.registrationFee || 150}
                      </span>
                      <span className="text-xs text-slate-400 line-through">₹299</span>
                      <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                        50% OFF
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-block p-2 rounded-xl bg-slate-800 text-slate-300">
                      <Gift className="w-5 h-5" style={{ color: subjectColor }} />
                    </span>
                  </div>
                </div>

                {/* Important Dates Quick Box */}
                <div className="py-4 space-y-3 text-xs">
                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Exam Date
                    </span>
                    <span className="font-semibold text-slate-200">
                      {formatDate(olympiad.examDate)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Timer className="w-3.5 h-3.5 text-slate-400" />
                      Exam Time
                    </span>
                    <span className="font-semibold text-slate-200">
                      {olympiad.examStartTime || '10:00 AM'} IST
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      Last Date to Register
                    </span>
                    <span className="font-semibold text-amber-300">
                      {formatDate(olympiad.registrationEndDate)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-slate-400" />
                      Result Declaration
                    </span>
                    <span className="font-semibold text-slate-200">
                      {formatDate(olympiad.resultDate)}
                    </span>
                  </div>
                </div>

                {/* Main Action Call To Action */}
                <div className="pt-2">
                  {isOpen && (
                    <button
                      onClick={handleRegister}
                      className="w-full py-3.5 px-6 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xl hover:brightness-110 active:scale-[0.98] transition-all shimmer-btn"
                      style={{
                        background: `linear-gradient(135deg, ${subjectColor} 0%, #4f46e5 100%)`,
                        boxShadow: `0 10px 25px -5px ${subjectColor}66`
                      }}
                    >
                      <span>Register for Olympiad</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}

                  {isOngoing && (
                    <button
                      onClick={handleTakeExam}
                      className="w-full py-3.5 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition-all shimmer-btn"
                    >
                      <Zap className="w-4 h-4 fill-current" />
                      <span>Start Your Exam Now</span>
                    </button>
                  )}

                  {isCompleted && (
                    <button
                      onClick={handleViewResult}
                      className="w-full py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/25 active:scale-[0.98] transition-all shimmer-btn"
                    >
                      <Trophy className="w-4 h-4" />
                      <span>Check Result & Rank</span>
                    </button>
                  )}

                  {!isOpen && !isOngoing && !isCompleted && (
                    <button
                      disabled
                      className="w-full py-3.5 px-6 rounded-2xl bg-slate-800 text-slate-400 font-bold text-sm flex items-center justify-center gap-2 cursor-not-allowed"
                    >
                      <span>Registration Opens {formatDate(olympiad.registrationStartDate)}</span>
                    </button>
                  )}
                </div>

                {/* Micro checklist under button */}
                <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-2">
                  {[
                    'Instant Admit Card generation',
                    '2 Free preparatory Mock Tests',
                    'QR-Verifiable National Certificate'
                  ].map((perk, i) => (
                    <div key={i} className="flex items-center gap-2 text-[11px] text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{perk}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────
          STATS RIBBON STRIP
          ───────────────────────────────────────────────────────────────────── */}
      <section className="-mt-10 relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card rounded-2xl p-5 shadow-sm border border-slate-200/90 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Questions</span>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Target className="w-4 h-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-black text-slate-900 oly-heading">
              {olympiad.totalQuestions || 40} MCQs
            </p>
            <p className="text-xs text-slate-500 mt-1">Single Choice Objective Format</p>
          </div>

          <div className="glass-card rounded-2xl p-5 shadow-sm border border-slate-200/90 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Marks</span>
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <BarChart2 className="w-4 h-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-black text-slate-900 oly-heading">
              {(olympiad.totalQuestions || 40) * (olympiad.marksPerQuestion || 1)} Marks
            </p>
            <p className="text-xs text-slate-500 mt-1">+{olympiad.marksPerQuestion || 1} mark per correct answer</p>
          </div>

          <div className="glass-card rounded-2xl p-5 shadow-sm border border-slate-200/90 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Negative Marking</span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-black text-slate-900 oly-heading">
              {olympiad.negativeMarks > 0 ? `-${olympiad.negativeMarks} Marks` : 'No Negative Marks'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {olympiad.negativeMarks > 0 ? 'Deducted on incorrect choice' : 'Zero penalty for wrong answers'}
            </p>
          </div>

          <div className="glass-card rounded-2xl p-5 shadow-sm border border-slate-200/90 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Passing Criteria</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-black text-slate-900 oly-heading">
              {olympiad.passingMarks ? `${olympiad.passingMarks}% Score` : 'Merit Based'}
            </p>
            <p className="text-xs text-slate-500 mt-1">National Percentile & Rank Sheet</p>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────
          TAB NAVIGATION STRIP
          ───────────────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="border-b border-slate-200 flex overflow-x-auto no-scrollbar gap-2 sm:gap-4">
          {[
            { id: 'overview', label: 'Overview & Syllabus', icon: BookOpen },
            { id: 'pattern', label: 'Exam Pattern', icon: Target },
            { id: 'prizes', label: 'Prizes & Scholarships', icon: Trophy },
            { id: 'schedule', label: 'Important Schedule', icon: Calendar },
            { id: 'guidelines', label: 'Guidelines & FAQs', icon: HelpCircle },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-3 sm:px-4 text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────
          MAIN CONTENT AREA (2-Column Grid)
          ───────────────────────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">

          {/* Left Column (8 cols): Active Tab Views */}
          <div className="lg:col-span-8 space-y-8">

            {/* TAB 1: OVERVIEW & SYLLABUS */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* About Box */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm">
                  <h2 className="oly-heading text-xl sm:text-2xl font-black text-slate-900 mb-4 flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm">
                      📖
                    </span>
                    About {olympiad.title}
                  </h2>
                  <div className="text-slate-600 leading-relaxed text-sm sm:text-base whitespace-pre-line space-y-3">
                    {olympiad.description || `The ${olympiad.title} is designed to assess conceptual mastery, logical aptitude, and creative problem-solving skills among aspiring students across India. Benchmarked against national standards, it empowers students with invaluable competitive exposure.`}
                  </div>

                  <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Exam Level</p>
                      <p className="text-sm font-bold text-slate-800 mt-1">All-India National Level</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Medium</p>
                      <p className="text-sm font-bold text-slate-800 mt-1">English / Standard Curriculum</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Device Support</p>
                      <p className="text-sm font-bold text-slate-800 mt-1">Laptop, PC, Tablet, Phone</p>
                    </div>
                  </div>
                </div>

                {/* Eligibility & Class Breakdown */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm">
                  <h2 className="oly-heading text-xl sm:text-2xl font-black text-slate-900 mb-2 flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-sm">
                      🎓
                    </span>
                    Eligible Classes & Age Bracket
                  </h2>
                  <p className="text-slate-500 text-sm mb-6">
                    Students currently enrolled in the following classes from any recognized board (CBSE, ICSE, State Boards, IB) are eligible:
                  </p>

                  <div className="flex flex-wrap gap-2.5">
                    {classesList.map(c => (
                      <div
                        key={c}
                        className="px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold flex items-center gap-2 shadow-sm"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>Class {c}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 p-4 rounded-2xl bg-amber-50/70 border border-amber-200/70 flex items-start gap-3">
                    <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-900 leading-relaxed">
                      <strong className="font-bold">Note for Students:</strong> Separate rank lists and percentiles are computed class-wise so that every student competes fairly with peers in the same educational grade.
                    </div>
                  </div>
                </div>

                {/* Core Competency Pillars */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm">
                  <h2 className="oly-heading text-xl sm:text-2xl font-black text-slate-900 mb-6 flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm">
                      ⚡
                    </span>
                    Core Skills Evaluated
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      {
                        title: 'Foundational Knowledge',
                        desc: 'Rigorous grasp of syllabus fundamentals and mathematical/scientific principles.',
                        icon: '🧠'
                      },
                      {
                        title: 'Analytical Deduction',
                        desc: 'Ability to break down complex unfamiliar scenarios into solvable steps.',
                        icon: '🔍'
                      },
                      {
                        title: 'Speed & Accuracy',
                        desc: 'Strategic time management under realistic competitive examination conditions.',
                        icon: '⏱️'
                      },
                      {
                        title: 'Critical Problem Solving',
                        desc: 'Application of theory to novel multi-concept questions and real-world patterns.',
                        icon: '🎯'
                      }
                    ].map((item, idx) => (
                      <div key={idx} className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/60 flex items-start gap-3.5">
                        <span className="text-2xl">{item.icon}</span>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: EXAM PATTERN & MARKING */}
            {activeTab === 'pattern' && (
              <div className="space-y-8">
                {/* Marking Breakdown */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm">
                  <h2 className="oly-heading text-xl sm:text-2xl font-black text-slate-900 mb-2 flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm">
                      🎯
                    </span>
                    Marking Scheme
                  </h2>
                  <p className="text-slate-500 text-sm mb-6">
                    Detailed distribution of marks per question and penalty policies:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-5 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-center">
                      <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Correct Answer</p>
                      <p className="text-3xl font-black text-emerald-600 oly-heading mt-2">
                        +{olympiad.marksPerQuestion || 1}
                      </p>
                      <p className="text-xs text-emerald-700 mt-1">Full marks awarded</p>
                    </div>

                    <div className="p-5 rounded-2xl bg-rose-50/80 border border-rose-200 text-center">
                      <p className="text-xs font-bold text-rose-800 uppercase tracking-wider">Incorrect Answer</p>
                      <p className="text-3xl font-black text-rose-600 oly-heading mt-2">
                        {olympiad.negativeMarks > 0 ? `-${olympiad.negativeMarks}` : '0'}
                      </p>
                      <p className="text-xs text-rose-700 mt-1">
                        {olympiad.negativeMarks > 0 ? 'Deducted as negative mark' : 'No negative mark penalty'}
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                      <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Unattempted</p>
                      <p className="text-3xl font-black text-slate-700 oly-heading mt-2">
                        0
                      </p>
                      <p className="text-xs text-slate-500 mt-1">No penalty for skipping</p>
                    </div>
                  </div>
                </div>

                {/* Structure Specification Table */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm">
                  <h2 className="oly-heading text-xl sm:text-2xl font-black text-slate-900 mb-6 flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center text-sm">
                      📋
                    </span>
                    Exam Structure Specifications
                  </h2>

                  <div className="divide-y divide-slate-100">
                    {[
                      { label: 'Mode of Examination', value: '100% Online Computer-Based Test (CBT)' },
                      { label: 'Total Questions', value: `${olympiad.totalQuestions || 40} Multiple Choice Questions (MCQs)` },
                      { label: 'Total Duration', value: `${olympiad.examDurationMinutes || 60} Minutes with automated timer` },
                      { label: 'Total Maximum Marks', value: `${(olympiad.totalQuestions || 40) * (olympiad.marksPerQuestion || 1)} Marks` },
                      { label: 'Proctoring Mode', value: 'AI Proctored, tab-switch tracking & browser fullscreen lockdown' },
                      { label: 'Auto-Submit', value: 'Auto-saved periodically and submitted automatically when timer ends' }
                    ].map((row, idx) => (
                      <div key={idx} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-sm">
                        <span className="font-medium text-slate-500">{row.label}</span>
                        <span className="font-bold text-slate-900">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: PRIZES & SCHOLARSHIPS */}
            {activeTab === 'prizes' && (
              <div className="space-y-8">
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                      <h2 className="oly-heading text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-sm">
                          🏆
                        </span>
                        Awards, Medals & Recognition
                      </h2>
                      <p className="text-slate-500 text-sm mt-1">
                        Merit-based rewards curated to celebrate outstanding academic excellence:
                      </p>
                    </div>

                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold shrink-0">
                      <Sparkles className="w-3.5 h-3.5" />
                      Class-Wise Awards
                    </span>
                  </div>

                  {/* Render Custom DB Prize List if Available */}
                  {prizesList.length > 0 ? (
                    <div className="space-y-3">
                      {prizesList.map((p, idx) => {
                        const isFirst = p.rank?.toLowerCase().includes('1st') || p.rank?.includes('1');
                        const isSecond = p.rank?.toLowerCase().includes('2nd') || p.rank?.includes('2');
                        const isThird = p.rank?.toLowerCase().includes('3rd') || p.rank?.includes('3');

                        return (
                          <div
                            key={idx}
                            className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                              isFirst
                                ? 'bg-gradient-to-r from-amber-50 to-amber-100/50 border-amber-300 shadow-sm'
                                : isSecond
                                ? 'bg-gradient-to-r from-slate-50 to-slate-100/60 border-slate-300'
                                : isThird
                                ? 'bg-gradient-to-r from-amber-50/40 to-orange-50/30 border-amber-200'
                                : 'bg-slate-50/60 border-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-3.5">
                              <div className="text-2xl shrink-0">
                                {isFirst ? '🥇' : isSecond ? '🥈' : isThird ? '🥉' : '📜'}
                              </div>
                              <div>
                                <h3 className="font-black text-slate-900 text-base">{p.rank}</h3>
                                <p className="text-xs text-slate-500">Official National Recognition</p>
                              </div>
                            </div>

                            <div className="sm:text-right">
                              <span className="inline-block px-3 py-1.5 rounded-xl bg-white/90 border border-slate-200/80 font-black text-slate-800 text-sm shadow-2xs">
                                {p.prize}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* Fallback default rich prize tiers */
                    <div className="space-y-3">
                      <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-300 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">🥇</span>
                          <div>
                            <h3 className="font-black text-slate-900 text-base">1st National Rank</h3>
                            <p className="text-xs text-slate-500">Gold Medal + Cash Award + National Champion Trophy</p>
                          </div>
                        </div>
                        <span className="font-black text-amber-700 text-sm bg-white px-3 py-1.5 rounded-xl border border-amber-200">
                          ₹5,000 + Gold Medal
                        </span>
                      </div>

                      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-300 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">🥈</span>
                          <div>
                            <h3 className="font-black text-slate-900 text-base">2nd National Rank</h3>
                            <p className="text-xs text-slate-500">Silver Medal + Cash Award + Certificate of Excellence</p>
                          </div>
                        </div>
                        <span className="font-black text-slate-700 text-sm bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                          ₹3,000 + Silver Medal
                        </span>
                      </div>

                      <div className="p-5 rounded-2xl bg-gradient-to-r from-orange-50/50 to-amber-50/40 border border-amber-200 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">🥉</span>
                          <div>
                            <h3 className="font-black text-slate-900 text-base">3rd National Rank</h3>
                            <p className="text-xs text-slate-500">Bronze Medal + Cash Award + Certificate of Merit</p>
                          </div>
                        </div>
                        <span className="font-black text-amber-800 text-sm bg-white px-3 py-1.5 rounded-xl border border-amber-200">
                          ₹1,000 + Bronze Medal
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Certificate Assurance */}
                  <div className="mt-8 p-6 rounded-2xl bg-indigo-50/60 border border-indigo-200 flex flex-col sm:flex-row items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
                      <Award className="w-7 h-7" />
                    </div>
                    <div className="text-center sm:text-left">
                      <h3 className="font-bold text-indigo-950 text-base">
                        Every Participant Receives an Official Certificate
                      </h3>
                      <p className="text-xs sm:text-sm text-indigo-800 mt-1 leading-relaxed">
                        All registered students who complete the examination will receive an authenticated Abhyo National Olympiad certificate equipped with a tamper-proof verification QR code.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: SCHEDULE & MILESTONES */}
            {activeTab === 'schedule' && (
              <div className="space-y-8">
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm">
                  <h2 className="oly-heading text-xl sm:text-2xl font-black text-slate-900 mb-2 flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm">
                      🗓️
                    </span>
                    Important Dates & Milestones
                  </h2>
                  <p className="text-slate-500 text-sm mb-8">
                    Mark these important deadlines in your calendar to stay ahead:
                  </p>

                  <div className="relative pl-6 sm:pl-8 border-l-2 border-indigo-100 space-y-8">
                    {/* Step 1 */}
                    <div className="relative">
                      <div className="absolute -left-[31px] sm:-left-[39px] top-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold ring-4 ring-white">
                        ✓
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Phase 1</span>
                        <h3 className="font-bold text-slate-900 text-base">Registration Window Opens</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{formatDate(olympiad.registrationStartDate)}</p>
                        <p className="text-xs text-slate-600 mt-1.5">Students can register online and receive immediate confirmation.</p>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="relative">
                      <div className="absolute -left-[31px] sm:-left-[39px] top-1 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold ring-4 ring-white">
                        2
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Phase 2</span>
                        <h3 className="font-bold text-slate-900 text-base">Registration Closes</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{formatDate(olympiad.registrationEndDate)}</p>
                        <p className="text-xs text-slate-600 mt-1.5">Last opportunity to secure exam seat and download admit card.</p>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="relative">
                      <div className="absolute -left-[31px] sm:-left-[39px] top-1 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold ring-4 ring-white">
                        3
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Main Event</span>
                        <h3 className="font-bold text-slate-900 text-base">Examination Day</h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {formatDate(olympiad.examDate)} at {olympiad.examStartTime || '10:00 AM'} IST
                        </p>
                        <p className="text-xs text-slate-600 mt-1.5">
                          Login 15 minutes early on Abhyo to complete browser system check.
                        </p>
                      </div>
                    </div>

                    {/* Step 4 */}
                    <div className="relative">
                      <div className="absolute -left-[31px] sm:-left-[39px] top-1 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold ring-4 ring-white">
                        4
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">Final Phase</span>
                        <h3 className="font-bold text-slate-900 text-base">Results & Merit Certificates</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{formatDate(olympiad.resultDate)}</p>
                        <p className="text-xs text-slate-600 mt-1.5">
                          Scorecards, rank analysis, and downloadable QR certificates published.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: GUIDELINES & FAQS */}
            {activeTab === 'guidelines' && (
              <div className="space-y-8">
                {/* Guidelines */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm">
                  <h2 className="oly-heading text-xl sm:text-2xl font-black text-slate-900 mb-6 flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm">
                      🛡️
                    </span>
                    Exam Day Rules & Proctoring
                  </h2>

                  <div className="space-y-3.5 text-xs sm:text-sm text-slate-600">
                    <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-900">Supported Devices:</strong> A desktop, laptop, tablet, or smartphone equipped with Chrome, Firefox, Safari, or Edge browser.
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-900">Stable Internet:</strong> A minimum 1 Mbps internet connection is recommended for smooth question loading and auto-saving.
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-900">Fullscreen Proctoring:</strong> Switching tabs or opening secondary windows is monitored. Exceeding warnings will submit test automatically.
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-900">Automatic Submission:</strong> Once the 60-minute duration expires, all answered questions are automatically finalized.
                      </div>
                    </div>
                  </div>
                </div>

                {/* FAQs Accordion */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm">
                  <h2 className="oly-heading text-xl sm:text-2xl font-black text-slate-900 mb-6 flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-sm">
                      💬
                    </span>
                    Frequently Asked Questions
                  </h2>

                  <div className="divide-y divide-slate-100">
                    {[
                      {
                        q: 'Can students from any school or board apply?',
                        a: 'Yes! Students from CBSE, ICSE, IB, Cambridge, and all State Boards are welcomed and eligible to register.'
                      },
                      {
                        q: 'How do I access the exam on exam day?',
                        a: 'Simply log in to your Abhyo account, navigate to the Olympiad Dashboard, and click "Start Exam" 10 minutes prior to the scheduled start time.'
                      },
                      {
                        q: 'Are preparatory mock tests provided?',
                        a: 'Yes, once registered, students unlock free online practice mock tests to familiarize themselves with the question pattern and user interface.'
                      },
                      {
                        q: 'What if my internet disconnects during the test?',
                        a: 'The test platform auto-saves each question response immediately. If your connection drops, reconnect promptly and continue from where you left off.'
                      },
                      {
                        q: 'When and how will I receive my certificate?',
                        a: 'Certificates will be available for digital download in your student dashboard on the result declaration date with an instant verifiable QR code.'
                      }
                    ].map((item, idx) => {
                      const isOpen = openFaq === idx;
                      return (
                        <div key={idx} className="py-4">
                          <button
                            onClick={() => setOpenFaq(isOpen ? null : idx)}
                            className="w-full flex items-center justify-between text-left text-sm font-bold text-slate-900 hover:text-indigo-600 transition-colors"
                          >
                            <span>{item.q}</span>
                            <ChevronDown
                              className={`w-4 h-4 text-slate-400 transition-transform ${
                                isOpen ? 'rotate-180 text-indigo-600' : ''
                              }`}
                            />
                          </button>
                          {isOpen && (
                            <p className="mt-2.5 text-xs sm:text-sm text-slate-500 leading-relaxed pr-6">
                              {item.a}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Right Column (4 cols): Sticky Sidebar */}
          <div className="lg:col-span-4 space-y-6">

            {/* Quick Benefits Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm">
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-600" />
                Why Take This Olympiad?
              </h3>

              <div className="space-y-3.5 text-xs text-slate-600">
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 font-bold">
                    1
                  </div>
                  <p><strong className="text-slate-800">All-India Benchmarking:</strong> Compare your skills with top students nationwide.</p>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 font-bold">
                    2
                  </div>
                  <p><strong className="text-slate-800">Detailed Diagnostic:</strong> Pinpoint subject strengths and improvement areas with topic-wise analytics.</p>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 font-bold">
                    3
                  </div>
                  <p><strong className="text-slate-800">Prestige & Recognition:</strong> Boost your academic portfolio with verifiable certificates and cash prizes.</p>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 font-bold">
                    4
                  </div>
                  <p><strong className="text-slate-800">Exam Hall Confidence:</strong> Build speed and composure for future competitive exams (JEE, NEET, NTSE).</p>
                </div>
              </div>
            </div>

            {/* Support / Help Card */}
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center mb-3">
                  <HelpCircle className="w-5 h-5 text-indigo-300" />
                </div>
                <h3 className="font-bold text-base text-white oly-heading">Have Questions?</h3>
                <p className="text-xs text-indigo-200 mt-1 leading-relaxed">
                  Need assistance with registration, syllabus, or payment? Our student support desk is available 7 days a week.
                </p>
                <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs">
                  <span className="text-indigo-300">Email Helpdesk</span>
                  <a href="mailto:support@abhyo.com" className="font-bold text-white hover:underline">
                    support@abhyo.com
                  </a>
                </div>
              </div>
            </div>

            {/* Browse Other Olympiads Button */}
            <div className="text-center">
              <Link
                to="/olympiad"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                <span>View all other upcoming Olympiads</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

          </div>

        </div>
      </main>

      {/* ─────────────────────────────────────────────────────────────────────
          STICKY BOTTOM BAR (Mobile / Desktop conversion)
          ───────────────────────────────────────────────────────────────────── */}
      <aside aria-label="Quick registration actions" className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-3 px-4 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black text-white shrink-0 shadow-sm"
              style={{ background: subjectColor }}
            >
              🏆
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 truncate max-w-[200px] sm:max-w-md">
                {olympiad.title}
              </p>
              <p className="text-[11px] text-slate-500">
                Exam on {formatDate(olympiad.examDate)} &middot; {olympiad.examDurationMinutes || 60} Mins
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] uppercase font-bold text-slate-400">Entry Fee</p>
              <p className="text-lg font-black text-slate-900">₹{olympiad.registrationFee || 150}</p>
            </div>

            {isOpen && (
              <button
                onClick={handleRegister}
                className="px-6 py-2.5 rounded-xl text-white font-bold text-sm shadow-md hover:brightness-110 active:scale-95 transition-all shimmer-btn"
                style={{ background: subjectColor }}
              >
                Register Now
              </button>
            )}

            {isOngoing && (
              <button
                onClick={handleTakeExam}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-md active:scale-95 transition-all"
              >
                Enter Exam
              </button>
            )}

            {isCompleted && (
              <button
                onClick={handleViewResult}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md active:scale-95 transition-all"
              >
                View Result
              </button>
            )}
          </div>
        </div>
      </aside>

    </div>
  );
}
