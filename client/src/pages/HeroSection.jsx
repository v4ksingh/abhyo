import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Play, TrendingUp, Trophy } from 'lucide-react';

const heroStyle = `
  @keyframes floatBob1 { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
  @keyframes floatBob2 { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
  .hero-card-1 { animation: floatBob1 3.5s ease-in-out infinite; }
  .hero-card-2 { animation: floatBob2 4s ease-in-out 0.8s infinite; }
`;

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-white" style={{ minHeight: '100vh' }}>
      <style>{heroStyle}</style>

      {/* Framer-style mesh gradient blobs */}
      <div className="absolute pointer-events-none" style={{ top: '-10%', left: '-5%', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 65%)', filter: 'blur(1px)' }} />
      <div className="absolute pointer-events-none" style={{ top: '5%', right: '-8%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 65%)', filter: 'blur(1px)' }} />
      <div className="absolute pointer-events-none" style={{ bottom: '0%', left: '30%', width: 800, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.08) 0%, transparent 65%)' }} />

      {/* Subtle dot grid */}
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(rgba(99,102,241,0.12) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-5xl mx-auto px-6 pt-32 pb-8">

        {/* Top pill badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 cursor-default select-none" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
          <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
          <span className="text-violet-700 text-xs font-bold tracking-wide">India's Most Advanced Mock Test Platform</span>
          <span className="text-violet-400 text-xs">→</span>
        </div>

        {/* Giant headline */}
        <h1 className="font-black tracking-tight leading-[1.0] mb-6" style={{ fontSize: 'clamp(3rem, 8vw, 6rem)' }}>
          <span className="block text-slate-900">The smarter way</span>
          <span className="block" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 40%, #2563eb 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            to crack any exam.
          </span>
        </h1>

        {/* Sub-headline */}
        <p className="text-slate-500 text-lg lg:text-xl leading-relaxed max-w-2xl mb-10 font-medium">
          Attempt real exam-level mock tests, identify weak spots with AI-powered analytics, and rank higher — all in one platform built for serious aspirants.
        </p>

        {/* CTA row */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
          <Link
            to="/register"
            className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl font-bold text-white text-base transition-all hover:scale-[1.03] hover:shadow-2xl"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', boxShadow: '0 4px 24px rgba(124,58,237,0.35)' }}
          >
            Start for Free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <button
            className="inline-flex items-center gap-3 px-7 py-4 rounded-2xl font-semibold text-slate-700 text-base bg-white transition-all hover:scale-[1.02]"
            style={{ border: '1.5px solid #e2e8f0', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-violet-100">
              <Play className="w-3 h-3 ml-0.5 fill-violet-600 text-violet-600" />
            </div>
            Watch Demo
          </button>
        </div>

        {/* Social proof */}
        <div className="flex items-center justify-center gap-3 mb-16">
          <div className="flex -space-x-2">
            {[47, 32, 25, 55, 60].map(n => (
              <img key={n} src={`https://i.pravatar.cc/60?img=${n}`} alt="" className="w-8 h-8 rounded-full border-2 border-white shadow-sm" />
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex gap-0.5">{[1, 2, 3, 4, 5].map(s => <span key={s} className="text-amber-400 text-sm">★</span>)}</div>
            <span className="text-slate-500 text-sm font-medium">Trusted by <strong className="text-slate-800">10,000+</strong> students</span>
          </div>
        </div>

        {/* Floating UI preview card */}
        <div className="relative w-full max-w-3xl mx-auto">
          {/* Glow under card */}
          <div className="absolute -inset-4 rounded-3xl pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(124,58,237,0.15) 0%, transparent 70%)' }} />

          {/* Main dashboard card */}
          <div className="relative rounded-3xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(226,232,240,0.9)', boxShadow: '0 32px 80px rgba(0,0,0,0.1), 0 0 0 1px rgba(255,255,255,0.8)', backdropFilter: 'blur(20px)' }}>

            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-400" />
                <span className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="w-3 h-3 rounded-full bg-emerald-400" />
              </div>
              <div className="flex-1 mx-4 h-6 rounded-lg bg-white border border-slate-200 flex items-center px-3 shadow-sm">
                <span className="text-[10px] text-slate-400 font-medium">abhyo.com/dashboard</span>
              </div>
            </div>

            {/* Dashboard body */}
            <div className="p-6">
              {/* Stat cards */}
              <div className="grid grid-cols-3 gap-4 mb-5">
                {[
                  { label: 'Overall Score', value: '78%', sub: 'Great Progress!', color: '#7c3aed', bg: '#f5f3ff' },
                  { label: 'Day Streak', value: '🔥 12', sub: 'Keep it up!', color: '#ea580c', bg: '#fff7ed' },
                  { label: 'Tests Done', value: '24', sub: 'This month', color: '#2563eb', bg: '#eff6ff' },
                ].map(s => (
                  <div key={s.label} className="rounded-2xl p-4 text-left" style={{ background: s.bg }}>
                    <p className="text-xs text-slate-500 font-semibold mb-1">{s.label}</p>
                    <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
                    <p className="text-xs mt-1" style={{ color: s.color, opacity: 0.7 }}>{s.sub}</p>
                  </div>
                ))}
              </div>

              {/* Progress bars */}
              <div className="bg-slate-50 rounded-2xl p-4 text-left">
                <p className="text-xs font-black text-slate-700 mb-3">Continue Learning</p>
                <div className="space-y-3">
                  {[
                    ['Quantitative Aptitude', 60, '#7c3aed'],
                    ['Logical Reasoning', 53, '#2563eb'],
                    ['General Awareness', 81, '#059669'],
                  ].map(([name, pct, color]) => (
                    <div key={name}>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="font-semibold text-slate-600">{name}</span>
                        <span className="font-bold" style={{ color }}>{pct}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200">
                        <div className="h-2 rounded-full" style={{ width: `${pct}%`, background: color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Floating pill — top right */}
          <div className="absolute -top-5 -right-5 px-4 py-3 rounded-2xl flex items-center gap-3 hero-card-1" style={{ background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#fef3c7' }}>
              <Trophy className="w-5 h-5 text-amber-500" />
            </div>
            <div className="text-left">
              <p className="text-xs font-black text-slate-800 leading-none">Top 5%</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Nationwide Rank</p>
            </div>
          </div>

          {/* Floating pill — bottom left */}
          <div className="absolute -bottom-5 -left-5 px-4 py-3 rounded-2xl flex items-center gap-3 hero-card-2" style={{ background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#f0fdf4' }}>
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="text-left">
              <p className="text-xs font-black text-slate-800 leading-none">+34% Score</p>
              <p className="text-[10px] text-slate-400 mt-0.5">in 3 months</p>
            </div>
          </div>
        </div>

        {/* Bottom stat bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-24 w-full border-t border-slate-100 pt-10 pb-6">
          {[
            { value: '10K+', label: 'Active Students' },
            { value: '500+', label: 'Mock Tests' },
            { value: '150+', label: 'Exam Categories' },
            { value: '95%',  label: 'Success Rate' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-black text-slate-900">{s.value}</p>
              <p className="text-sm text-slate-400 font-medium mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
