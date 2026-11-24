import React from 'react';
import { Link } from 'react-router-dom';
import {
  Building2, Users, Target, BookOpen, Sparkles, ShieldCheck,
  Trophy, Award, Medal, CheckCircle2, ArrowRight, GraduationCap,
  Zap, Brain, Star, Quote, Compass
} from 'lucide-react';
import usePageMeta from '../../hooks/usePageMeta';

export default function AboutUs() {
  usePageMeta({
    title: 'About Abhyo – National Olympiads & Smart Exam Preparation Platform',
    description: 'Learn about Abhyo’s mission to power school National Olympiads (Class 6-12) and premier competitive exam mock tests for UPSC, SSC, Banking, and State PCS across India.',
    canonical: '/about',
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* ─── Hero Section ────────────────────────────────────────── */}
      <section className="relative pt-24 pb-16 lg:pt-28 lg:pb-24 overflow-hidden bg-gradient-to-b from-indigo-50/60 via-white to-slate-50">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[550px] bg-gradient-to-br from-indigo-100/60 via-purple-50/40 to-amber-50/50 rounded-full blur-[120px] opacity-70 pointer-events-none" />

        <div className="container mx-auto px-6 lg:px-12 relative z-10 text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 bg-white border border-indigo-200/80 text-indigo-700 text-xs font-bold px-4 py-2 rounded-full mb-6 shadow-sm shadow-indigo-500/10">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span>Excellence from School to Career</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight mb-6 leading-[1.15]">
            Empowering India's Next Generation of{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600">
              Olympiad Champions
            </span>{' '}
            &{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
              Top Achievers
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto mb-8">
            At Abhyo, we bridge foundational school excellence with high-stakes competitive examinations. Through India's premier online School Olympiads (Class 6–12) and 500+ realistic exam mock tests, we make analytical learning accessible, measurable, and rewarding for every Indian student.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3.5">
            <Link
              to="/olympiad"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold px-6 py-3 rounded-xl shadow-md shadow-orange-500/20 hover:shadow-lg hover:-translate-y-0.5 transition-all text-sm"
            >
              <Trophy size={16} /> Explore Abhyo Olympiad
            </Link>
            <Link
              to="/categories"
              className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-800 font-bold px-6 py-3 rounded-xl border border-slate-200 shadow-sm hover:shadow hover:-translate-y-0.5 transition-all text-sm"
            >
              <Target size={16} className="text-indigo-600" /> Explore Mock Tests
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Stats Section ────────────────────────────────────────── */}
      <section className="pb-16 relative z-20 -mt-10">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 lg:p-10">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
              <div className="pt-4 lg:pt-0">
                <div className="text-3xl lg:text-4xl font-black text-indigo-600 mb-1">50K+</div>
                <div className="text-xs lg:text-sm font-bold text-slate-500 uppercase tracking-wider">Active Students</div>
              </div>
              <div className="pt-4 lg:pt-0">
                <div className="text-3xl lg:text-4xl font-black text-amber-500 mb-1">Class 6–12</div>
                <div className="text-xs lg:text-sm font-bold text-slate-500 uppercase tracking-wider">National Olympiads</div>
              </div>
              <div className="pt-4 lg:pt-0">
                <div className="text-3xl lg:text-4xl font-black text-orange-500 mb-1">₹10 Lakh+</div>
                <div className="text-xs lg:text-sm font-bold text-slate-500 uppercase tracking-wider">Annual Prize Pool</div>
              </div>
              <div className="pt-4 lg:pt-0">
                <div className="text-3xl lg:text-4xl font-black text-violet-600 mb-1">500+</div>
                <div className="text-xs lg:text-sm font-bold text-slate-500 uppercase tracking-wider">Mock Test Series</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── NEW: The Abhyo National Olympiad Division ───────────── */}
      <section className="py-20 bg-gradient-to-b from-white to-amber-50/30 border-y border-amber-100/60 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-200/20 rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto px-6 lg:px-12 max-w-6xl relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 bg-amber-100/80 border border-amber-200 text-amber-800 text-xs font-black px-3.5 py-1.5 rounded-full mb-3 uppercase tracking-wider">
              <Trophy size={14} className="text-amber-600" />
              <span>National School Talent Initiative</span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight mb-4">
              Cultivating India's Brightest Young Minds
            </h2>
            <p className="text-slate-600 font-medium text-base leading-relaxed">
              Realizing that cognitive excellence and problem-solving habits begin in school, Abhyo launched the <strong>Abhyo National Olympiad</strong>. We provide a transparent, all-India competitive platform for students from Class 6 to 12 across CBSE, ICSE, and State boards.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              {
                icon: Trophy,
                title: 'All-India Ranking (AIR)',
                desc: 'Compete against thousands of students nationwide with deep percentile rankings and analytics.',
                color: 'from-amber-500 to-yellow-500',
              },
              {
                icon: Medal,
                title: '₹10 Lakh+ Prize Pool',
                desc: 'Cash awards up to ₹25,000 for top rankers, national trophies, gold, silver, and bronze medals.',
                color: 'from-orange-500 to-amber-500',
              },
              {
                icon: Award,
                title: 'QR-Verified Certificates',
                desc: 'Every participant earns a tamper-proof digital merit certificate verified via secure QR code.',
                color: 'from-violet-500 to-purple-600',
              },
              {
                icon: ShieldCheck,
                title: '100% Online & Proctored',
                desc: 'Fair, secure, and accessible from home or school computer labs on computers and tablets.',
                color: 'from-emerald-500 to-teal-600',
              },
            ].map((card, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 border border-amber-200/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} text-white flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform`}>
                  <card.icon size={22} />
                </div>
                <h3 className="font-black text-slate-900 text-lg mb-2">{card.title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed font-medium">{card.desc}</p>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-indigo-600 rounded-3xl p-6 md:p-8 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl md:text-2xl font-black mb-1">Ready to benchmark your knowledge?</h3>
              <p className="text-amber-100 text-xs md:text-sm font-medium">Registrations are currently open for Mathematics, Science, Computer, English & Reasoning Olympiads.</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link
                to="/olympiad"
                className="inline-flex items-center gap-2 bg-white text-slate-900 hover:bg-slate-50 font-black px-5 py-3 rounded-xl shadow text-xs sm:text-sm transition-all"
              >
                <span>Olympiad Portal</span>
                <ArrowRight size={14} className="text-amber-600" />
              </Link>
              <Link
                to="/olympiad/awards"
                className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white font-bold px-4 py-3 rounded-xl text-xs sm:text-sm transition-all border border-white/20"
              >
                View Awards
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Our Two Pillars Ecosystem ───────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 lg:px-12 max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl font-black text-slate-900 mb-3">Our Two Pillars of Education</h2>
            <p className="text-slate-600 font-medium">Catering to learners from middle school foundation through career recruitment.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Pillar 1: Olympiad & School */}
            <div className="bg-gradient-to-br from-amber-50/50 to-orange-50/30 rounded-3xl p-8 border border-amber-200/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center mb-6 shadow-md shadow-amber-500/20">
                <GraduationCap size={24} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
                Classes 6–12
              </span>
              <h3 className="text-2xl font-black text-slate-900 mt-3 mb-2">School Foundation & National Olympiad</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-4 font-medium">
                Designed to nurture critical thinking, logical deduction, and scientific temperament beyond the school textbook:
              </p>
              <ul className="space-y-2 text-xs font-semibold text-slate-700 mb-6">
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-amber-600" /> National Mathematics & Science Olympiads</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-amber-600" /> Coding, AI & Computer Science Challenges</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-amber-600" /> English Vocabulary & Grammar Competitions</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-amber-600" /> Navodaya & Sainik School Entrance Foundations</li>
              </ul>
              <Link to="/olympiad" className="text-amber-700 font-black text-xs inline-flex items-center gap-1 hover:gap-2 transition-all">
                Learn more about Olympiad <ArrowRight size={13} />
              </Link>
            </div>

            {/* Pillar 2: Competitive Mock Tests */}
            <div className="bg-gradient-to-br from-indigo-50/50 to-violet-50/30 rounded-3xl p-8 border border-indigo-200/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mb-6 shadow-md shadow-indigo-600/20">
                <Target size={24} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800">
                Aspirants & Graduates
              </span>
              <h3 className="text-2xl font-black text-slate-900 mt-3 mb-2">Government & Entrance Exam CBTs</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-4 font-medium">
                Full-length computer-based tests matching exact TCS/NTA exam interfaces with in-depth AI percentile analytics:
              </p>
              <ul className="space-y-2 text-xs font-semibold text-slate-700 mb-6">
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-indigo-600" /> UPSC Civil Services (Prelims & CSAT)</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-indigo-600" /> SSC CGL, CHSL, GD Constable, Selection Post</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-indigo-600" /> Banking Exams (IBPS PO/Clerk, SBI PO)</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-indigo-600" /> Railways RRB NTPC, Group D, and State PCS</li>
              </ul>
              <Link to="/categories" className="text-indigo-700 font-black text-xs inline-flex items-center gap-1 hover:gap-2 transition-all">
                Explore Exam Series <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Mission & Vision ────────────────────────────────────── */}
      <section className="py-20 bg-slate-50 border-t border-slate-200/60">
        <div className="container mx-auto px-6 lg:px-12 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-full mb-3">
                <Sparkles size={13} /> Our Purpose
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-4">Our Mission</h2>
              <p className="text-slate-600 font-medium leading-relaxed mb-6">
                To democratize rigorous assessment and quality education across India. Whether a 6th grader discovering mathematical patterns or a graduate preparing for the Civil Services, Abhyo provides the intelligent tools, granular performance feedback, and recognition to turn aspirations into reality.
              </p>
              <ul className="space-y-3.5">
                {[
                  { icon: Target, text: 'Precision Question Analytics & Weakness Diagnostics' },
                  { icon: Trophy, text: 'National Recognition & Transparent Merit Awards' },
                  { icon: BookOpen, text: 'Comprehensive Curriculum & Exam Coverage' },
                  { icon: ShieldCheck, text: 'Bilingual Support in Hindi & English' },
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-800 font-bold text-sm">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                      <item.icon className="w-4 h-4 text-indigo-600" />
                    </div>
                    {item.text}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-100 to-purple-50 rounded-[3rem] transform rotate-3" />
              <img
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                alt="Students collaborating"
                className="relative rounded-[3rem] shadow-2xl object-cover h-[400px] w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Leadership & Directors' Vision ──────────────────────── */}
      <section className="py-20 bg-white border-t border-slate-200/60">
        <div className="container mx-auto px-6 lg:px-12 max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-black px-3.5 py-1.5 rounded-full mb-3 uppercase tracking-wider">
              <Star size={13} className="text-amber-500 fill-amber-500" />
              <span>Leadership & Directors' Vision</span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight mb-3">
              Guiding India's Educational Future
            </h2>
            <p className="text-slate-600 font-medium text-sm md:text-base">
              Meet the visionary educators leading Abhyo in shaping young minds through National Olympiads and empowering competitive exam aspirants nationwide.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Director 1: Vivek Singh */}
            <div className="bg-gradient-to-br from-slate-50 to-indigo-50/40 rounded-3xl p-8 lg:p-10 border border-slate-200/90 shadow-md hover:shadow-xl transition-all flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-100/40 rounded-full blur-2xl pointer-events-none" />
              <div>
                <div className="flex items-center gap-5 mb-6">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 relative">
                    <div className="absolute inset-0 bg-gradient-to-tr from-amber-400 to-orange-500 rounded-full blur-[3px] transform -translate-x-1 translate-y-1 opacity-70" />
                    <img
                      src="/images/director.jpg"
                      alt="Mr. Vivek Singh"
                      className="relative w-full h-full object-cover object-top rounded-full border-4 border-white shadow-md"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';
                      }}
                    />
                  </div>
                  <div>
                    <span className="inline-block text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 mb-1.5">
                      Founder & Managing Director
                    </span>
                    <h3 className="text-2xl font-black text-slate-900">Mr. Vivek Singh</h3>
                    <p className="text-xs font-semibold text-slate-500">Managing Director, Abhyo</p>
                  </div>
                </div>

                <div className="relative mb-6">
                  <Quote className="w-8 h-8 text-indigo-200 absolute -top-3 -left-2 -z-0 opacity-60" />
                  <p className="text-slate-700 font-medium leading-relaxed italic text-sm sm:text-base relative z-10 pl-4 border-l-2 border-indigo-400">
                    "Real education isn't just memorizing facts — it is learning how to think, question, and excel under pressure. By combining all-India school Olympiads with high-stakes exam prep, we instill lasting analytical confidence right from Class 6 to career recruitment."
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200/80 flex flex-wrap gap-2">
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600">
                  🎯 Strategic Vision
                </span>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600">
                  ⚡ Test Architecture
                </span>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600">
                  🌱 Student Mentorship
                </span>
              </div>
            </div>

            {/* Director 2: Prakash Singh */}
            <div className="bg-gradient-to-br from-slate-50 to-amber-50/40 rounded-3xl p-8 lg:p-10 border border-slate-200/90 shadow-md hover:shadow-xl transition-all flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-36 h-36 bg-amber-100/40 rounded-full blur-2xl pointer-events-none" />
              <div>
                <div className="flex items-center gap-5 mb-6">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 relative">
                    <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-full blur-[3px] transform -translate-x-1 translate-y-1 opacity-70" />
                    <img
                      src="/images/director-prakash.jpg?v=2"
                      alt="Mr. Prakash Singh"
                      className="relative w-full h-full object-cover object-top rounded-full border-4 border-white shadow-md"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';
                      }}
                    />
                  </div>
                  <div>
                    <span className="inline-block text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 mb-1.5">
                      Founder & Managing Director
                    </span>
                    <h3 className="text-2xl font-black text-slate-900">Mr. Prakash Singh</h3>
                    <p className="text-xs font-semibold text-slate-500">Founder & Managing Director, Abhyo</p>
                  </div>
                </div>

                <div className="relative mb-6">
                  <Quote className="w-8 h-8 text-amber-200 absolute -top-3 -left-2 -z-0 opacity-60" />
                  <p className="text-slate-700 font-medium leading-relaxed italic text-sm sm:text-base relative z-10 pl-4 border-l-2 border-amber-400">
                    "Every school student across India deserves access to national-standard benchmark testing and genuine merit recognition. Through the Abhyo National Olympiad, we are breaking geographical boundaries to identify and champion young academic talent from every corner of the nation."
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200/80 flex flex-wrap gap-2">
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600">
                  🏆 National Olympiads
                </span>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600">
                  📚 Academic Quality
                </span>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600">
                  🎖️ Talent Recognition
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Core Values ─────────────────────────────────────────── */}
      <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-500/15 rounded-full blur-[120px] pointer-events-none" />

        <div className="container mx-auto px-6 lg:px-12 relative z-10 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black mb-4">Our Core Values</h2>
            <p className="text-slate-400 font-medium max-w-2xl mx-auto">The principles that guide every algorithm, exam paper, and Olympiad we conduct at Abhyo.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Users,
                title: 'Student-Centric Meritocracy',
                desc: 'We celebrate hard work and genuine talent. Our rankings and Olympiad awards are 100% transparent and objective.',
              },
              {
                icon: ShieldCheck,
                title: 'Excellence & Precision',
                desc: 'From Class 6 Science to UPSC Prelims, our questions are curated by experienced educators to mirror exact competitive standards.',
              },
              {
                icon: Brain,
                title: 'Continuous Cognitive Growth',
                desc: 'We focus on actionable analytics that turn mistakes into learning moments, building confidence and real exam composure.',
              },
            ].map((value, i) => (
              <div key={i} className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/60 p-8 rounded-3xl hover:bg-slate-800 transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center mb-6 border border-indigo-500/30">
                  <value.icon className="w-6 h-6 text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold mb-3">{value.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Dual CTA ────────────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-b from-slate-50 to-white border-t border-slate-200/70">
        <div className="container mx-auto px-6 lg:px-12 max-w-5xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-3">
              Start Your Journey with Abhyo
            </h2>
            <p className="text-slate-600 font-medium text-sm md:text-base max-w-xl mx-auto">
              Whether you are a school student reaching for national glory or an aspirant preparing for your dream government post.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-8 text-white shadow-xl flex flex-col justify-between">
              <div>
                <span className="inline-block text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-white/20 text-white mb-4">
                  For Students (Class 6–12)
                </span>
                <h3 className="text-2xl font-black mb-2">Abhyo National Olympiad</h3>
                <p className="text-amber-100 text-sm leading-relaxed mb-6 font-medium">
                  Compete with thousands nationwide, win cash awards up to ₹25,000, trophies, medals, and tamper-proof digital merit certificates.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/olympiad"
                  className="inline-flex items-center gap-2 bg-white text-slate-900 hover:bg-amber-50 font-black px-5 py-2.5 rounded-xl text-xs sm:text-sm shadow transition-all"
                >
                  <Trophy size={14} className="text-amber-600" />
                  <span>Explore Olympiads</span>
                </Link>
                <Link
                  to="/olympiad/awards"
                  className="inline-flex items-center gap-2 bg-black/20 hover:bg-black/30 text-white font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm border border-white/20 transition-all"
                >
                  <span>Awards & Medals</span>
                </Link>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-8 text-white shadow-xl flex flex-col justify-between">
              <div>
                <span className="inline-block text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-white/20 text-white mb-4">
                  For Graduates & Job Aspirants
                </span>
                <h3 className="text-2xl font-black mb-2">Government & CBT Mock Series</h3>
                <p className="text-indigo-100 text-sm leading-relaxed mb-6 font-medium">
                  Master real exam interfaces for UPSC, SSC, Banking, Railways, and State PCS with deep AI analytics and bilingual questions.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/categories"
                  className="inline-flex items-center gap-2 bg-white text-slate-900 hover:bg-indigo-50 font-black px-5 py-2.5 rounded-xl text-xs sm:text-sm shadow transition-all"
                >
                  <Target size={14} className="text-indigo-600" />
                  <span>Browse Exam Series</span>
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 bg-black/20 hover:bg-black/30 text-white font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm border border-white/20 transition-all"
                >
                  <span>Create Account</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
