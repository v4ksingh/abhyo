import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Trophy,
  GraduationCap,
  Award,
  Medal,
  BookOpen,
  Layers,
  TrendingUp,
  Sparkles,
  School,
  UserCheck,
  AlertTriangle,
  Scale,
  ShieldCheck,
  CreditCard,
  Layers as LayersIcon,
  ShieldAlert,
  Globe,
  HelpCircle,
  Megaphone,
  ArrowLeft,
  ArrowRight,
  Search,
  CheckCircle2,
  FileText,
  Download,
  Share2,
  BookmarkCheck
} from 'lucide-react';
import usePageMeta from '../../hooks/usePageMeta';

const SECTIONS_DATA = [
  {
    id: 1,
    num: '01',
    category: 'awards',
    title: 'AWARD CATEGORIES',
    icon: Trophy,
    color: 'from-amber-500 to-yellow-600',
    accentBg: 'bg-amber-500/10 text-amber-600 border-amber-200',
    badge: 'Multi-Tier Honours',
    items: [
      {
        heading: 'National-Level Recognition',
        text: 'National Rank 1, 2, 3, National Top Rankers and National Subject Toppers. Recognition may include trophy/medal, Certificate of Excellence, scholarship or cash award where announced, featured recognition and special achiever recognition.',
      },
      {
        heading: 'State-Level Recognition',
        text: 'Eligible state rank holders may receive a State Rank Certificate, medal/trophy where applicable, scholarship/prize where announced, digital achievement badge and recognition on Abhyo platforms subject to consent and privacy requirements.',
      },
      {
        heading: 'District / Regional Recognition',
        text: 'Eligible high-performing students may receive District/Regional Rank Certificates, medals or trophies where announced, digital achievement badges and special recognition.',
      },
    ],
  },
  {
    id: 2,
    num: '02',
    category: 'scholarships',
    title: 'SCHOLARSHIPS',
    icon: GraduationCap,
    color: 'from-indigo-600 to-violet-600',
    accentBg: 'bg-indigo-500/10 text-indigo-600 border-indigo-200',
    badge: 'Financial & Merit Support',
    items: [
      {
        text: 'Abhyo may offer scholarships based on Olympiad performance.',
      },
      {
        text: 'Possible categories include Academic Excellence, Merit, Subject Excellence, Improvement and Special Recognition Scholarships.',
      },
      {
        text: 'A scholarship is not automatically guaranteed. Amounts, recipients, eligibility and conditions will be announced for the relevant Olympiad edition.',
      },
    ],
  },
  {
    id: 3,
    num: '03',
    category: 'awards',
    title: 'SUBJECT TOPPER AWARDS',
    icon: BookOpen,
    color: 'from-blue-600 to-cyan-600',
    accentBg: 'bg-blue-500/10 text-blue-600 border-blue-200',
    badge: 'Subject Mastery',
    items: [
      {
        text: 'Abhyo may recognise the highest-performing students in each offered subject, such as Mathematics, Science, English, General Knowledge and Reasoning. Additional subjects may be introduced in future editions.',
      },
      {
        text: 'Subject awards will be determined according to the published scoring and ranking criteria.',
      },
    ],
  },
  {
    id: 4,
    num: '04',
    category: 'awards',
    title: 'CLASS-WISE RECOGNITION',
    icon: Layers,
    color: 'from-emerald-600 to-teal-600',
    accentBg: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
    badge: 'Class 6 to 12',
    items: [
      {
        text: 'Recognition may be provided separately for Classes 6–12 to ensure fair comparison among students at the same academic level.',
      },
    ],
  },
  {
    id: 5,
    num: '05',
    category: 'certificates',
    title: 'MOST IMPROVED STUDENT',
    icon: TrendingUp,
    color: 'from-rose-600 to-pink-600',
    accentBg: 'bg-rose-500/10 text-rose-600 border-rose-200',
    badge: 'Growth Mindset',
    items: [
      {
        text: 'Abhyo may recognise students showing meaningful improvement across eligible assessments. Criteria may consider previous performance, current performance, accuracy, consistency and improvement percentage.',
      },
    ],
  },
  {
    id: 6,
    num: '06',
    category: 'certificates',
    title: 'SPECIAL ACHIEVEMENT RECOGNITION',
    icon: Sparkles,
    color: 'from-purple-600 to-indigo-600',
    accentBg: 'bg-purple-500/10 text-purple-600 border-purple-200',
    badge: 'Special Honours',
    items: [
      {
        text: 'Abhyo may recognise exceptional problem-solving, subject performance, consistent participation, academic improvement and other achievement categories announced for a particular edition.',
      },
    ],
  },
  {
    id: 7,
    num: '07',
    category: 'certificates',
    title: 'CERTIFICATES',
    icon: Award,
    color: 'from-amber-600 to-orange-600',
    accentBg: 'bg-amber-500/10 text-amber-600 border-amber-200',
    badge: 'QR-Verified',
    items: [
      {
        text: 'Eligible students may receive Participation, Merit, Rank, Certificate of Excellence or Special Achievement certificates according to published criteria. Certificates may be digital and/or physical.',
      },
    ],
  },
  {
    id: 8,
    num: '08',
    category: 'awards',
    title: 'MEDALS & TROPHIES',
    icon: Medal,
    color: 'from-yellow-500 to-amber-600',
    accentBg: 'bg-yellow-500/10 text-yellow-700 border-yellow-200',
    badge: 'Gold, Silver & Bronze',
    items: [
      {
        text: 'Where announced, Abhyo may provide Gold, Silver and Bronze Medals and trophies to selected top performers. The number and eligibility criteria will be announced for each edition.',
      },
    ],
  },
  {
    id: 9,
    num: '09',
    category: 'schools',
    title: 'SCHOOL RECOGNITION',
    icon: School,
    color: 'from-sky-600 to-blue-700',
    accentBg: 'bg-sky-500/10 text-sky-600 border-sky-200',
    badge: 'Institutional Excellence',
    items: [
      {
        text: 'Abhyo may recognise schools through Best Performing School, School Excellence Award, School Participation Recognition and School Topper Recognition. Criteria will be published for the relevant edition.',
      },
    ],
  },
  {
    id: 10,
    num: '10',
    category: 'schools',
    title: 'TEACHER / SCHOOL COORDINATOR RECOGNITION',
    icon: UserCheck,
    color: 'from-teal-600 to-emerald-700',
    accentBg: 'bg-teal-500/10 text-teal-600 border-teal-200',
    badge: 'Educator Mentorship',
    items: [
      {
        text: 'Where applicable, Abhyo may recognise teachers or Olympiad coordinators through categories such as Best Olympiad Coordinator, Outstanding Teacher Recognition and School Coordinator Certificate.',
      },
    ],
  },
  {
    id: 11,
    num: '11',
    category: 'rules',
    title: 'AWARDS ARE NOT BASED SOLELY ON PARTICIPATION',
    icon: AlertTriangle,
    color: 'from-orange-600 to-red-600',
    accentBg: 'bg-orange-500/10 text-orange-600 border-orange-200',
    badge: 'Merit-Based Criteria',
    items: [
      {
        text: 'Registration alone does not guarantee a rank, scholarship, medal, trophy or cash prize. Each award has its own published eligibility criteria.',
      },
    ],
  },
  {
    id: 12,
    num: '12',
    category: 'rules',
    title: 'TIE-BREAKING FOR AWARDS',
    icon: Scale,
    color: 'from-indigo-600 to-slate-700',
    accentBg: 'bg-indigo-500/10 text-indigo-600 border-indigo-200',
    badge: 'Objective Resolution',
    items: [
      {
        text: 'Where scores are tied, Abhyo may apply published tie-break criteria such as section-wise performance, correct answers, incorrect answers, reliably recorded completion time or other announced criteria.',
      },
    ],
  },
  {
    id: 13,
    num: '13',
    category: 'rules',
    title: 'VERIFICATION OF AWARD WINNERS',
    icon: ShieldCheck,
    color: 'from-emerald-600 to-cyan-700',
    accentBg: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
    badge: 'Integrity Check',
    items: [
      {
        text: 'Abhyo may verify identity, registration, class, school, examination record, eligibility and compliance before issuing awards or scholarships. Violations may result in cancellation of awards, certificates or rankings.',
      },
    ],
  },
  {
    id: 14,
    num: '14',
    category: 'scholarships',
    title: 'SCHOLARSHIP DISBURSEMENT',
    icon: CreditCard,
    color: 'from-violet-600 to-purple-700',
    accentBg: 'bg-violet-500/10 text-violet-600 border-violet-200',
    badge: 'Disbursement Protocols',
    items: [
      {
        text: 'Monetary scholarships, where offered, will follow the announced terms. Abhyo may require parent/guardian details, identity verification, payment details and supporting documents. For minors, the parent/guardian may be involved as applicable.',
      },
    ],
  },
  {
    id: 15,
    num: '15',
    category: 'rules',
    title: 'AWARD LIMITATION',
    icon: LayersIcon,
    color: 'from-slate-600 to-gray-800',
    accentBg: 'bg-slate-500/10 text-slate-600 border-slate-200',
    badge: 'Single Prize Policy',
    items: [
      {
        text: 'Unless otherwise announced, a participant cannot claim multiple awards for the same achievement where the award structure specifies one applicable prize. Multiple forms of recognition may be given when the published structure permits.',
      },
    ],
  },
  {
    id: 16,
    num: '16',
    category: 'rules',
    title: 'DISQUALIFICATION FROM AWARDS',
    icon: ShieldAlert,
    color: 'from-red-600 to-rose-700',
    accentBg: 'bg-red-500/10 text-red-600 border-red-200',
    badge: 'Zero-Tolerance Policy',
    items: [
      {
        text: 'Awards, scholarships, ranks or certificates may be withdrawn for unfair means, impersonation, false information, rule violations, verified technical/administrative irregularities or ineligibility.',
      },
    ],
  },
  {
    id: 17,
    num: '17',
    category: 'rules',
    title: 'PUBLIC RECOGNITION',
    icon: Globe,
    color: 'from-blue-600 to-indigo-700',
    accentBg: 'bg-blue-500/10 text-blue-600 border-blue-200',
    badge: 'Privacy & Consent',
    items: [
      {
        text: "With appropriate permissions and privacy safeguards, Abhyo may recognise achievers through its website, digital achiever wall, social media, certificates, award ceremonies and school-level recognition. Appropriate consent should be obtained before publicly displaying minors' personally identifiable information beyond what is necessary.",
      },
    ],
  },
  {
    id: 18,
    num: '18',
    category: 'scholarships',
    title: 'NO GUARANTEED SCHOLARSHIP CLAIM',
    icon: HelpCircle,
    color: 'from-amber-600 to-yellow-700',
    accentBg: 'bg-amber-500/10 text-amber-600 border-amber-200',
    badge: 'Clarity & Transparency',
    items: [
      {
        text: "Promotional material should distinguish between 'Eligible for Scholarship' and 'Guaranteed Scholarship'. Unless expressly guaranteed under published terms, registration does not guarantee a scholarship or prize.",
      },
    ],
  },
  {
    id: 19,
    num: '19',
    category: 'rules',
    title: 'EDITION-SPECIFIC AWARD ANNOUNCEMENT',
    icon: Megaphone,
    color: 'from-indigo-600 to-sky-600',
    accentBg: 'bg-indigo-500/10 text-indigo-600 border-indigo-200',
    badge: 'Pre-Exam Notice',
    items: [
      {
        text: 'For every Olympiad, Abhyo should publish the number of awards, categories, scholarship amounts if any, recipients, rank criteria, eligibility, tie-break rules, certificate criteria and prize-distribution process before or during registration.',
      },
    ],
  },
];

const CATEGORY_TABS = [
  { key: 'all', label: 'All Guidelines (19)' },
  { key: 'awards', label: '🏆 Awards & Trophies' },
  { key: 'scholarships', label: '🎓 Scholarships' },
  { key: 'certificates', label: '📜 Certificates & Growth' },
  { key: 'schools', label: '🏫 School & Coordinators' },
  { key: 'rules', label: '⚖️ Rules & Verification' },
];

export default function OlympiadAwards() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  usePageMeta({
    title: 'Abhyo Olympiad Awards, Scholarships & Recognitions',
    description:
      'Official guidelines for Abhyo Olympiad awards, scholarships, national & state rank recognitions, medals, trophies, and certificates for Class 6–12.',
    canonical: '/olympiad/awards',
  });

  const filteredSections = useMemo(() => {
    return SECTIONS_DATA.filter((sec) => {
      const matchesTab = activeTab === 'all' || sec.category === activeTab;
      if (!matchesTab) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const inTitle = sec.title.toLowerCase().includes(q);
      const inNum = sec.num.includes(q);
      const inItems = sec.items.some(
        (it) =>
          (it.heading && it.heading.toLowerCase().includes(q)) ||
          it.text.toLowerCase().includes(q)
      );
      return inTitle || inNum || inItems;
    });
  }, [activeTab, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-500 selection:text-white pb-20">
      {/* ── BREADCRUMB STRIP ────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-500">
            <Link to="/" className="hover:text-indigo-600 transition-colors">
              Home
            </Link>
            <span className="text-slate-300">/</span>
            <Link to="/olympiad" className="hover:text-indigo-600 transition-colors flex items-center gap-1">
              Olympiad
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-indigo-600 font-bold">Awards & Scholarships</span>
          </div>

          <Link
            to="/olympiad"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Olympiad
          </Link>
        </div>
      </div>

      {/* ── HERO BANNER ─────────────────────────────────────────────── */}
      <div className="relative bg-gradient-to-br from-slate-950 via-[#0a071b] to-[#120e29] text-white pt-14 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/15 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-indigo-200 text-xs font-extrabold uppercase tracking-widest mb-4 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Official Recognition & Rewards Framework
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white mb-3">
            ABHYO OLYMPIAD
          </h1>

          <p className="text-lg sm:text-2xl font-black bg-gradient-to-r from-amber-300 via-amber-100 to-indigo-300 bg-clip-text text-transparent uppercase tracking-wider mb-4">
            AWARDS • SCHOLARSHIPS • RECOGNITIONS
          </p>

          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto font-medium leading-relaxed mb-8">
            Recognising Talent. Rewarding Excellence. Inspiring Every Learner.
          </p>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto pt-2">
            {[
              { icon: Trophy, label: 'National, State & District', sub: '3-Tier Honours' },
              { icon: GraduationCap, label: 'Merit Scholarships', sub: 'Performance Based' },
              { icon: Award, label: 'QR-Verified Badges', sub: 'Official Certificates' },
              { icon: School, label: 'Schools & Coordinators', sub: 'Institutional Recognition' },
            ].map((stat, i) => (
              <div
                key={i}
                className="bg-white/5 border border-white/10 rounded-xl p-3.5 backdrop-blur-sm hover:border-white/20 transition-all text-left"
              >
                <stat.icon className="w-5 h-5 text-amber-400 mb-1.5" />
                <p className="text-xs font-black text-white leading-snug">{stat.label}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{stat.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── STICKY CONTROL & SEARCH BAR ─────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-7 relative z-20">
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xl p-4 sm:p-5 flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search sections, rules, terms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick CTA Actions */}
          <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
            <a
              href="/Abhyo_Olympiad_Student_Registration_Form.pdf"
              download="Abhyo_Olympiad_Student_Registration_Form.pdf"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              <span>Offline Form (PDF)</span>
            </a>
            <button
              onClick={() => navigate('/olympiad/register-account')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md shadow-indigo-600/20 transition-all"
            >
              <span>Register Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto py-4 scrollbar-none">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── MAIN CONTENT (19 SECTIONS) ──────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        {filteredSections.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center my-8">
            <p className="text-3xl mb-2">🔍</p>
            <h3 className="text-base font-black text-slate-800">No sections found</h3>
            <p className="text-xs text-slate-500 mt-1">
              No results match "{searchQuery}". Try a different keyword or reset filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveTab('all');
              }}
              className="mt-4 px-4 py-2 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-bold hover:bg-indigo-100 transition-colors"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {filteredSections.map((sec) => {
              const Icon = sec.icon;
              return (
                <section
                  key={sec.id}
                  id={`section-${sec.id}`}
                  className="bg-white rounded-2xl border border-slate-200/90 hover:border-indigo-300 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden group"
                >
                  <div className="p-5 sm:p-6">
                    {/* Header Row */}
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-900 text-white text-xs font-black shadow-xs shrink-0">
                          {sec.num}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                            <Icon className="w-4 h-4" />
                          </div>
                          <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                            {sec.title}
                          </h2>
                        </div>
                      </div>

                      <span
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${sec.accentBg}`}
                      >
                        {sec.badge}
                      </span>
                    </div>

                    {/* Content Items */}
                    <div className="space-y-3.5 pl-1 sm:pl-3">
                      {sec.items.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <span className="w-2 h-2 rounded-full bg-indigo-500 mt-2 shrink-0 ring-4 ring-indigo-50" />
                          <div className="flex-1 text-xs sm:text-sm text-slate-700 leading-relaxed">
                            {item.heading && (
                              <span className="font-black text-slate-900 mr-1.5">
                                {item.heading}:
                              </span>
                            )}
                            <span>{item.text}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>

      {/* ── ABHYO RECOGNITION PHILOSOPHY ────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-14">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-[#1e143b] text-white p-6 sm:p-10 shadow-2xl border border-indigo-500/20">
          {/* Subtle Ambient Orbs */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto text-center">
            <span className="inline-block px-3.5 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-black uppercase tracking-widest mb-4">
              Core Guiding Principle
            </span>

            <h2 className="text-2xl sm:text-4xl font-black text-white mb-3">
              ABHYO'S RECOGNITION PHILOSOPHY
            </h2>

            <blockquote className="text-base sm:text-xl font-bold text-amber-200/90 italic mb-4">
              “Not every student has to be Rank 1 to be recognised.”
            </blockquote>

            <p className="text-sm sm:text-base text-slate-300 font-medium leading-relaxed mb-8">
              Abhyo celebrates <strong className="text-white">Excellence</strong>,{' '}
              <strong className="text-white">Improvement</strong>,{' '}
              <strong className="text-white">Effort</strong> and{' '}
              <strong className="text-white">Achievement</strong>.
            </p>

            {/* Three Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 text-left">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm hover:border-amber-400/40 transition-all">
                <div className="w-8 h-8 rounded-xl bg-amber-400/20 flex items-center justify-center text-amber-300 font-black text-sm mb-3">
                  01
                </div>
                <h4 className="text-sm font-black text-white mb-1">Compete</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  To discover your potential and test your strengths against national peers.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm hover:border-indigo-400/40 transition-all">
                <div className="w-8 h-8 rounded-xl bg-indigo-400/20 flex items-center justify-center text-indigo-300 font-black text-sm mb-3">
                  02
                </div>
                <h4 className="text-sm font-black text-white mb-1">Improve</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  To become your best through analytics, practice and persistent effort.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm hover:border-emerald-400/40 transition-all">
                <div className="w-8 h-8 rounded-xl bg-emerald-400/20 flex items-center justify-center text-emerald-300 font-black text-sm mb-3">
                  03
                </div>
                <h4 className="text-sm font-black text-white mb-1">Achieve</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  To inspire others with your journey, discipline, and certified accomplishments.
                </p>
              </div>
            </div>

            {/* Final Slogan Banner */}
            <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-400/20 via-indigo-500/20 to-emerald-400/20 border border-white/20 text-white font-black text-sm sm:text-base tracking-widest uppercase shadow-lg">
              <span>PRACTICE.</span>
              <span className="text-amber-400">•</span>
              <span>IMPROVE.</span>
              <span className="text-indigo-400">•</span>
              <span>ACHIEVE.</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── CALL TO ACTION STRIP ────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div>
            <span className="text-indigo-600 text-xs font-bold uppercase tracking-wider">
              Ready to take the challenge?
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              Participate in the Abhyo National Olympiad
            </h3>
            <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-xl">
              Registrations open for Classes 6–12. Test your knowledge, earn All-India Ranks, and win cash prizes, medals and scholarships.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              to="/olympiad"
              className="px-5 py-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors"
            >
              Explore Olympiads
            </Link>
            <button
              onClick={() => navigate('/olympiad/register-account')}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5"
            >
              Register for Olympiad
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
