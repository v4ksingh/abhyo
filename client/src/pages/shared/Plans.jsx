import React, { useEffect, useState } from 'react';
import {
  Check, X, ArrowRight, Crown, Zap, Building2, Globe, Brain,
  Star, ShieldCheck, Users, BookOpen, BarChart3, Clock,
  ChevronDown, Sparkles, BadgeCheck, Trophy, TrendingUp, HelpCircle,
  Wallet, ArrowUpRight, Target, Lock, Gift, Percent, PlayCircle,
  Award, Rocket, MessageCircle, ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import usePageMeta from '../../hooks/usePageMeta';

/* ─── Dynamically fetched from DB ────────────────────────────────────────── */

/* ─── FAQs ───────────────────────────────────────────────────────────────── */
const FAQS = [
  { q: 'Can I switch plans at any time?', a: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately and we pro-rate any billing differences.' },
  { q: 'Is there a free trial for paid plans?', a: 'Absolutely. Every paid plan comes with a 7-day free trial — no credit card required to start.' },
  { q: 'What payment methods do you accept?', a: 'We accept all major UPI apps (PhonePe, GPay, Paytm), credit/debit cards, and net banking via Razorpay.' },
  { q: 'What happens when I hit my monthly test limit?', a: 'You\'ll be notified when you\'re close to your limit. You can upgrade your plan anytime to instantly unlock more tests.' },
  { q: 'Do institute plans include student accounts?', a: 'Yes. Pro and Enterprise plans let you add student seats and manage them from your institute dashboard.' },
  { q: 'Can I cancel my subscription?', a: 'Yes, you can cancel anytime from your billing settings. You keep full access until your billing period ends.' },
];

/* ─── Plan config ────────────────────────────────────────────────────────── */
const PLAN_CONFIG = {
  free: {
    color: 'text-slate-600',
    bg: 'bg-slate-100',
    gradient: 'from-slate-400 to-slate-500',
    border: 'border-slate-200',
    btnClass: 'bg-slate-900 hover:bg-slate-800 text-white',
    Icon: Zap,
  },
  basic: {
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    gradient: 'from-blue-500 to-indigo-500',
    border: 'border-blue-200',
    btnClass: 'bg-blue-600 hover:bg-blue-700 text-white',
    Icon: BookOpen,
  },
  pro: {
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    gradient: 'from-indigo-600 to-violet-600',
    border: 'border-indigo-300',
    btnClass: 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white',
    Icon: Crown,
  },
  enterprise: {
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    gradient: 'from-amber-500 to-orange-500',
    border: 'border-amber-200',
    btnClass: 'bg-amber-600 hover:bg-amber-700 text-white',
    Icon: Building2,
  },
};

/* ─── FAQItem ────────────────────────────────────────────────────────────── */
function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`border border-slate-200 rounded-2xl overflow-hidden transition-all duration-300 ${open ? 'shadow-md' : ''}`}>
      <button
        className="w-full flex items-center justify-between gap-4 p-6 text-left bg-white hover:bg-slate-50 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <span className="font-semibold text-slate-800 text-base">{q}</span>
        <ChevronDown className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}>
        <p className="px-6 pb-6 text-slate-500 text-sm leading-relaxed">{a}</p>
      </div>
    </div>
  );
}

/* ─── Cell helper ────────────────────────────────────────────────────────── */
function Cell({ val, highlight }) {
  if (val === true) return <Check className={`w-5 h-5 mx-auto ${highlight ? 'text-indigo-500' : 'text-emerald-500'}`} />;
  if (val === false) return <X className="w-5 h-5 mx-auto text-slate-300" />;
  return <span className={`text-xs font-semibold ${highlight ? 'text-indigo-600' : 'text-slate-600'}`}>{val}</span>;
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function PlansPage() {
  usePageMeta({
    title: 'Pricing Plans – Free & Premium Mock Test Subscriptions',
    description: 'Choose from free, basic, pro, and enterprise plans for students and coaching institutes. Unlimited mock tests, analytics, bilingual support, and LMS features. Start free, no card needed.',
    canonical: '/plans',
  });

  const [allPlans, setAllPlans] = useState([]);
  const [activeTab, setActiveTab] = useState('student');
  const [scrolled, setScrolled] = useState(false);
  const [expandedPlan, setExpandedPlan] = useState(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    api.get('/plans/public')
      .then(res => setAllPlans(res.data.data))
      .catch(() => setAllPlans([]));
  }, []);

  const displayPlans = allPlans.filter(p => p.type === activeTab);
  
  // Dynamically extract union of ALL features
  const allFeaturesSet = new Set();
  const parsedPlans = displayPlans.map(plan => {
    let feats = [];
    if (Array.isArray(plan.features)) feats = plan.features;
    else if (typeof plan.features === 'string') {
      try { feats = JSON.parse(plan.features || '[]'); } catch { feats = []; }
    }
    feats.forEach(f => {
      if (f.trim()) allFeaturesSet.add(f.trim());
    });
    return { ...plan, parsedFeatures: feats };
  });
  const allUniqueFeatures = Array.from(allFeaturesSet);

  const STYLES = [
    PLAN_CONFIG.free,
    PLAN_CONFIG.basic,
    PLAN_CONFIG.pro,
    PLAN_CONFIG.enterprise
  ];

  const getPrice = (price, interval) => {
    if (price === 0) return { display: 'Free', suffix: '' };
    if (interval === 'yearly') return { display: price.toLocaleString(), suffix: '/yr' };
    if (interval === 'lifetime') return { display: price.toLocaleString(), suffix: '/lifetime' };
    return { display: price.toLocaleString(), suffix: '/mo' };
  };

  const HOW_IT_WORKS = [
    { icon: Rocket, title: 'Sign Up Free', desc: 'Create your account in 60 seconds. No credit card required to get started.', step: '01' },
    { icon: Target, title: 'Take Mock Tests', desc: 'Access curated tests with detailed analytics and performance insights.', step: '02' },
    { icon: Award, title: 'Track & Improve', desc: 'Identify weak areas, track progress, and crack your exam with confidence.', step: '03' },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans overflow-x-hidden">

      {/* ── Ambient Background ────────────────────────────────── */}
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(to right, #94a3b81a 1px, transparent 1px), linear-gradient(to bottom, #94a3b81a 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-40 pointer-events-none -z-10" />
      <div className="fixed top-1/3 right-0 w-80 h-80 bg-violet-100 rounded-full blur-3xl opacity-30 pointer-events-none -z-10" />

      {/* Nav is now handled by PublicLayout */}
      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative pt-36 pb-16 px-6 lg:px-12 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold px-4 py-2 rounded-full mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          Simple, Transparent Pricing
        </div>
        <h1 className="text-5xl lg:text-6xl font-black text-slate-900 leading-[1.08] tracking-tight mb-6">
          Invest in your <span className="relative">
            <span className="bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">success</span>
            <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none"><path d="M2 10 C100 2, 200 2, 298 10" stroke="url(#up)" strokeWidth="3" strokeLinecap="round"/><defs><linearGradient id="up" x1="0" y1="0" x2="1" y2="0"><stop stopColor="#6366f1"/><stop offset="1" stopColor="#8b5cf6"/></linearGradient></defs></svg>
          </span>
        </h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-10 font-medium leading-relaxed">
          From first-time aspirants to large coaching institutes — every plan gives you the tools to crack your exam. Start free, upgrade when you're ready.
        </p>

        {/* ── Audience Toggle ─── */}
        <div className="inline-flex items-center gap-3 bg-slate-100 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab('student')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'student' ? 'bg-white shadow-md text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
          >
            For Students
          </button>
          <button
            onClick={() => setActiveTab('institute')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'institute' ? 'bg-white shadow-md text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
          >
            For Institutes
          </button>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section className="py-12 px-6 lg:px-12 max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold px-4 py-2 rounded-full mb-4 shadow-sm">
            <PlayCircle className="w-3.5 h-3.5" /> Get Started in 3 Steps
          </div>
          <h2 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">How it works</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-indigo-200 via-violet-300 to-indigo-200" />
          {HOW_IT_WORKS.map((item, i) => (
            <div key={i} className="relative flex flex-col items-center text-center group">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center mb-5 shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 group-hover:-translate-y-1 transition-all relative z-10">
                <item.icon className="w-7 h-7 text-white" />
                <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-white border-2 border-indigo-500 rounded-full flex items-center justify-center text-[10px] font-black text-indigo-600">{item.step}</div>
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-2">{item.title}</h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── MONEY-BACK GUARANTEE ─────────────────────────────── */}
      <section className="px-6 lg:px-12 max-w-4xl mx-auto">
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-5 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0 shadow-md">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <div className="text-center sm:text-left">
            <h3 className="text-lg font-black text-slate-900 mb-1">30-Day Money-Back Guarantee</h3>
            <p className="text-sm text-slate-600 font-medium leading-relaxed">Not satisfied? Get a full refund within 30 days — no questions asked. We're that confident you'll love it.</p>
          </div>
          <Gift className="w-12 h-12 text-emerald-300 flex-shrink-0 hidden lg:block" />
        </div>
      </section>



      {/* ── PLAN CARDS ───────────────────────────────────────── */}
      <section className="px-6 lg:px-12 pb-20 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {displayPlans.length === 0 && (
            <div className="col-span-full py-12 text-slate-500 font-medium">No plans found. Admin needs to create {activeTab} plans.</div>
          )}
          {displayPlans.map((plan, index) => {
            const cfg = STYLES[index % STYLES.length];
            const { Icon } = cfg;
            const priceInfo = getPrice(plan.price, plan.interval);
            const isExpanded = expandedPlan === plan.id;

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-3xl border-2 ${cfg.border} bg-white transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${plan.popular || plan.highlight ? 'shadow-xl shadow-indigo-500/15 ring-2 ring-indigo-500/30' : 'shadow-sm'} overflow-hidden mt-8`}
              >
                {/* Popular badge with sparkle animation */}
                {(plan.popular || plan.highlight) && (
                  <div className="relative bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-bold text-center py-2 tracking-wide uppercase flex items-center justify-center gap-1.5 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                    <Sparkles className="w-3.5 h-3.5 relative z-10" />
                    <span className="relative z-10">Most Popular</span>
                  </div>
                )}

                {/* Card header */}
                <div className={`p-7 ${(plan.popular || plan.highlight) ? 'pt-5' : ''}`}>
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center mb-5 shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl font-black text-slate-900 mb-1">{plan.name}</h2>
                  <p className="text-sm text-slate-500 font-medium mb-5">{plan.maxStudents ? `Up to ${plan.maxStudents} Students` : 'For individual learners'}</p>

                  {/* Price */}
                  <div className="flex items-end gap-1 mb-1">
                    {priceInfo.display === 'Free' ? (
                      <span className="text-4xl font-black text-slate-900">Free</span>
                    ) : (
                      <>
                        <span className="text-xl font-bold text-slate-500 mb-1">₹</span>
                        <span className="text-4xl font-black text-slate-900">{priceInfo.display}</span>
                        <span className="text-slate-400 text-sm mb-1 font-medium">{priceInfo.suffix}</span>
                      </>
                    )}
                  </div>
                  <div className="mb-5" />
                </div>

                {/* Features */}
                <div className="px-7 flex-1">
                  <ul className={`space-y-3 mb-7 transition-all duration-300 ${isExpanded ? '' : ''}`}>
                    {(Array.isArray(plan.features) ? plan.features : (typeof plan.features === 'string' ? JSON.parse(plan.features || '[]') : [])).map((f, fi) => (
                      <li key={fi} className={`flex items-start gap-2.5 text-sm text-slate-700 transition-all duration-300 ${!isExpanded && fi >= 3 ? 'h-0 opacity-0 overflow-hidden' : ''}`}>
                        <span className={`w-5 h-5 rounded-full bg-gradient-to-br ${cfg.gradient} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                          <Check className="w-3 h-3 text-white" />
                        </span>
                        <span className="font-medium">{f}</span>
                      </li>
                    ))}
                  </ul>
                  {(Array.isArray(plan.features) ? plan.features : (typeof plan.features === 'string' ? JSON.parse(plan.features || '[]') : [])).length > 3 && (
                    <button
                      onClick={() => setExpandedPlan(isExpanded ? null : plan.id)}
                      className={`flex items-center gap-1.5 text-xs font-bold ${cfg.color} hover:underline mb-4`}
                    >
                      {isExpanded ? 'Show Less' : 'View All Features'}
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                </div>

                {/* CTA */}
                <div className="px-7 pb-7">
                  <Link
                    to={plan.type === 'institute' ? '/register?role=institute' : '/register'}
                    className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm transition-all shadow-lg hover:-translate-y-0.5 hover:shadow-xl ${cfg.btnClass}`}
                  >
                    {plan.price === 0 ? 'Get Started Free' : 'Start Free Trial'}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  {plan.price > 0 && (
                    <p className="text-center text-xs text-slate-400 mt-3 font-medium">7-day free trial · No card needed</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Trust strip */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-sm text-slate-500 font-medium">
          {[
            { icon: ShieldCheck, text: 'SSL Secured Payments' },
            { icon: BadgeCheck, text: 'Cancel Anytime' },
            { icon: Clock, text: '7-day Free Trial' },
            { icon: Users, text: '10,000+ Students' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2">
              <Icon className="w-4 h-4 text-emerald-500" />
              {text}
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURE COMPARISON TABLE ─────────────────────────── */}
      {parsedPlans.length > 0 && (
        <section className="py-20 px-6 lg:px-12 bg-slate-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-full text-xs font-bold text-slate-600 mb-4 shadow-sm">
                <BarChart3 className="w-3.5 h-3.5 text-indigo-500" /> Compare All Features
              </div>
              <h2 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight mb-3">Everything side by side</h2>
              <p className="text-slate-500 font-medium">Pick the plan that fits your ambitions</p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
              <div className="min-w-[800px]">
                {/* Table header */}
                <div 
                  className="grid bg-slate-50 border-b border-slate-200"
                  style={{ gridTemplateColumns: `minmax(250px, 1.5fr) repeat(${parsedPlans.length}, 1fr)` }}
                >
                  <div className="p-5 text-sm font-bold text-slate-500 col-span-1 border-r border-slate-100" />
                  {parsedPlans.map((plan, i) => {
                     const priceInfo = getPrice(plan.price, plan.interval);
                     return (
                      <div key={plan.id} className={`p-4 text-center ${plan.popular || plan.highlight ? 'bg-indigo-50 border-x border-indigo-100' : ''}`}>
                        <div className="text-sm font-bold text-slate-800">{plan.name}</div>
                        <div className="text-xs text-slate-400 font-medium mt-0.5">
                          {priceInfo.display === 'Free' ? 'Free' : `₹${priceInfo.display}${priceInfo.suffix}`}
                        </div>
                      </div>
                     );
                  })}
                </div>

                {/* Rows */}
                {allUniqueFeatures.map((feat, ri) => (
                  <div 
                    key={ri} 
                    className={`grid border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors ${ri % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}
                    style={{ gridTemplateColumns: `minmax(250px, 1.5fr) repeat(${parsedPlans.length}, 1fr)` }}
                  >
                    <div className="p-4 pl-5 text-[13px] text-slate-600 font-semibold flex items-center border-r border-slate-100/50">
                      {feat}
                    </div>
                    {parsedPlans.map((plan, i) => {
                      const hasFeature = plan.parsedFeatures.includes(feat);
                      return (
                        <div key={plan.id} className={`p-4 flex items-center justify-center ${plan.popular || plan.highlight ? 'bg-indigo-50/50 border-x border-indigo-100' : ''}`}>
                          {hasFeature 
                            ? <Check className={`w-5 h-5 ${plan.popular || plan.highlight ? 'text-indigo-600' : 'text-emerald-500'}`} /> 
                            : <X className="w-4 h-4 text-slate-200" />
                          }
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── SOCIAL PROOF STRIP ───────────────────────────────── */}
      <section className="py-16 px-6 lg:px-12 bg-gradient-to-r from-indigo-600 to-violet-600">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="flex -space-x-3">
            {[47, 32, 25, 55, 68, 71].map(n => (
              <img key={n} src={`https://i.pravatar.cc/60?img=${n}`} alt="" className="w-11 h-11 rounded-full border-3 border-indigo-500 shadow-md" />
            ))}
          </div>
          <div className="text-center lg:text-left">
            <p className="text-white font-black text-2xl mb-1">Trusted by 200+ coaching institutes</p>
            <p className="text-indigo-200 font-medium text-sm">across UPSC · BPSC · SSC · Banking · Railway</p>
          </div>
          <div className="flex items-center gap-2">
            {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />)}
            <span className="text-white font-black text-xl ml-1">4.9</span>
            <span className="text-indigo-200 text-sm font-medium">/5 · 10K+ reviews</span>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────── */}
      <section className="py-20 px-6 lg:px-12 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight mb-3">Why students choose us</h2>
          <p className="text-slate-500 font-medium">Real reviews from real achievers</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { name: 'Priya Sharma', role: 'UPSC Aspirant · Pro Plan', img: 47, text: 'Switched to Pro and my subject analytics blew my mind. Identified exact weak spots in Polity within a week. Worth every rupee!', plan: 'pro' },
            { name: 'Rahul Kumar', role: 'SSC CGL Selected · Basic Plan', img: 32, text: 'Started with the Free plan, upgraded to Basic after 2 weeks. The unlimited access to mock tests gave me the confidence to clear on my first attempt.', plan: 'basic' },
            { name: 'Anjali Singh', role: 'Institute Owner · Enterprise', img: 25, text: 'Manages 800+ students across 6 batches from a single dashboard. The white-label branding is chef\'s kiss. Our institute brand looks so professional!', plan: 'enterprise' },
          ].map((t, i) => {
            const cfg = PLAN_CONFIG[t.plan];
            return (
              <div key={i} className="bg-white border border-slate-200 rounded-3xl p-7 hover:shadow-xl hover:-translate-y-1 transition-all group">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-slate-600 text-sm leading-relaxed mb-6 font-medium italic">"{t.text}"</p>
                <div className="flex items-center gap-3 pt-5 border-t border-slate-100">
                  <img src={`https://i.pravatar.cc/100?img=${t.img}`} alt={t.name} className="w-11 h-11 rounded-full border-2 border-slate-200 shadow-sm" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900">{t.name}</p>
                    <p className="text-xs text-slate-500 font-medium">{t.role}</p>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full bg-gradient-to-r ${cfg.gradient} text-white shadow-sm`}>
                    {t.plan.charAt(0).toUpperCase() + t.plan.slice(1)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section className="py-20 px-6 lg:px-12 bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-full text-xs font-bold text-slate-600 mb-4 shadow-sm">
              <HelpCircle className="w-3.5 h-3.5 text-indigo-500" /> Frequently Asked
            </div>
            <h2 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight mb-3">Got questions?</h2>
            <p className="text-slate-500 font-medium">Everything you need to know about our plans</p>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => <FAQItem key={i} {...faq} />)}
          </div>
        </div>
      </section>

      {/* ── ENTERPRISE CTA ───────────────────────────────────── */}
      <section className="py-8 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-12 lg:p-16 relative overflow-hidden">
            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '32px 32px' }} />
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600 rounded-full blur-3xl opacity-20" />
            <div className="relative z-10 grid lg:grid-cols-2 gap-10 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-4 py-2 rounded-full text-white/80 text-xs font-semibold mb-6">
                  <Building2 className="w-3.5 h-3.5" /> For Large Coaching Institutes
                </div>
                <h2 className="text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight mb-6">
                  Need a custom<br /><span className="text-indigo-400">Enterprise plan?</span>
                </h2>
                <p className="text-slate-300 text-base leading-relaxed mb-8 font-medium max-w-md">
                  Talk to our team for custom pricing, volume discounts, and a dedicated onboarding experience tailored to your institute's needs.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link to="/register?role=institute" className="inline-flex items-center justify-center gap-2 bg-white text-slate-900 font-extrabold py-4 px-8 rounded-2xl shadow-2xl hover:shadow-white/20 hover:-translate-y-1 transition-all text-base">
                    Get Enterprise <ArrowRight className="w-4 h-4" />
                  </Link>
                  <a href="mailto:sales@abhyo.com" className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold py-4 px-8 rounded-2xl transition-all text-base">
                    Talk to Sales
                  </a>
                </div>
              </div>
              <div className="relative hidden lg:grid grid-cols-2 gap-4">
                {[
                  { icon: Users, label: 'Unlimited Students', val: '∞', color: 'text-indigo-400' },
                  { icon: Trophy, label: 'Custom Branding', val: '✓', color: 'text-amber-400' },
                  { icon: TrendingUp, label: 'SLA Uptime', val: '99.9%', color: 'text-emerald-400' },
                  { icon: ShieldCheck, label: 'Dedicated Support', val: '24/7', color: 'text-violet-400' },
                ].map(item => (
                  <div key={item.label} className="bg-white/10 border border-white/20 rounded-2xl p-5 backdrop-blur-sm hover:bg-white/15 transition-colors">
                    <item.icon className={`w-6 h-6 ${item.color} mb-3`} />
                    <div className={`text-2xl font-black ${item.color} mb-1`}>{item.val}</div>
                    <div className="text-white/70 text-xs font-semibold">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────── */}
      <section className="py-24 px-6 lg:px-12 text-center max-w-4xl mx-auto">
        <h2 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mb-6">
          Start your journey<br /><span className="bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">completely free</span>
        </h2>
        <p className="text-slate-500 text-lg mb-10 font-medium max-w-2xl mx-auto">
          No credit card. No setup fees. Just sign up and start taking mock tests in 60 seconds.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/register" className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-extrabold py-4 px-10 rounded-2xl shadow-xl shadow-indigo-500/30 hover:-translate-y-1 transition-all text-base flex items-center gap-2 justify-center">
            Get Started Free <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/tests" className="bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-700 font-bold py-4 px-10 rounded-2xl hover:shadow-md hover:-translate-y-0.5 transition-all text-base flex items-center gap-2 justify-center">
            Browse All Tests
          </Link>
        </div>
        <p className="text-slate-400 text-xs mt-5 font-medium">
          Join 10,000+ students · 200+ institutes · Trusted since 2024
        </p>
      </section>

      {/* Footer is now handled by PublicLayout */}
    </div>
  );
}
