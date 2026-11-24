import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Eye, EyeOff, ArrowRight, Loader2, ArrowLeft,
  Mail, Lock, ShieldCheck, Sparkles, Trophy, Users, BookOpen, AlertCircle, X, FileText,
  RefreshCw, Shield, CheckCircle2, LockKeyhole
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import useAuthStore from '../../store/authStore';

const floatingStats = [
  { icon: Users, value: '10K+', label: 'Students', color: 'from-violet-500 to-indigo-500' },
  { icon: BookOpen, value: '500+', label: 'Mock Tests', color: 'from-emerald-500 to-teal-500' },
  { icon: Trophy, value: '95%', label: 'Success Rate', color: 'from-amber-500 to-orange-500' },
];

// Generate dynamic 5-character alphanumeric verification code
const generateSecurityCode = () => {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export default function LoginPage() {
  const location = useLocation();
  const prefillEmail = location.state?.email || '';
  const [form, setForm] = useState({ email: prefillEmail, password: '', captchaInput: '' });
  const [captchaCode, setCaptchaCode] = useState(generateSecurityCode());
  const [showPass, setShowPass] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [error, setError] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const [showRegModal, setShowRegModal] = useState(false);

  const canvasRef = useRef(null);
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (prefillEmail && !form.email) {
      setForm(prev => ({ ...prev, email: prefillEmail }));
    }
  }, [prefillEmail]);

  // Disable right-click context menu and inspection shortcuts
  useEffect(() => {
    const handleContextMenu = (e) => {
      e.preventDefault();
      return false;
    };

    const handleKeyDown = (e) => {
      // Disable F12, Ctrl+U, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.key.toLowerCase() === 'u') ||
        (e.ctrlKey && e.shiftKey && ['i', 'j', 'c'].includes(e.key.toLowerCase()))
      ) {
        e.preventDefault();
        return false;
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Draw clean, bot-resistant canvas security challenge
  const drawCaptcha = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#f8fafc');
    grad.addColorStop(1, '#e2e8f0');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Subtle interference lines
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * width, Math.random() * height);
      ctx.lineTo(Math.random() * width, Math.random() * height);
      ctx.strokeStyle = i % 2 === 0 ? 'rgba(16, 185, 129, 0.4)' : 'rgba(99, 102, 241, 0.35)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Distorted characters
    const colors = ['#047857', '#4338ca', '#0369a1', '#7c3aed', '#b45309'];
    const charSpacing = width / (captchaCode.length + 1);

    for (let i = 0; i < captchaCode.length; i++) {
      const char = captchaCode[i];
      const x = (i + 0.8) * charSpacing;
      const y = height / 2 + 1;
      const angle = (Math.random() * 22 - 11) * (Math.PI / 180);

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.font = '600 19px monospace';
      ctx.fillStyle = colors[i % colors.length];
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(char, 0, 0);
      ctx.restore();
    }
  }, [captchaCode]);

  useEffect(() => {
    drawCaptcha();
  }, [drawCaptcha]);

  const refreshCaptcha = () => {
    setCaptchaCode(generateSecurityCode());
    setForm(prev => ({ ...prev, captchaInput: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (cooldown > 0) {
      setError(`Login temporarily restricted. Please wait ${cooldown} seconds.`);
      return;
    }

    // Verify CAPTCHA challenge
    if (form.captchaInput.trim().toUpperCase() !== captchaCode) {
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);
      refreshCaptcha();

      if (nextAttempts >= 3) {
        setCooldown(30);
        setError('Too many failed challenge attempts. Access locked for 30 seconds.');
      } else {
        setError(`Security code mismatch. ${3 - nextAttempts} attempt(s) remaining.`);
      }
      return;
    }

    try {
      const { user } = await login({ email: form.email.trim(), password: form.password });

      // Block all admin/staff roles from public login
      const STAFF_ROLES = ['superadmin', 'admin', 'accountant', 'content_manager', 'teacher'];
      if (STAFF_ROLES.includes(user.role)) {
        const { logout } = useAuthStore.getState();
        logout();
        setError('Staff login is restricted here. Please use the Admin Portal at /admin/login');
        refreshCaptcha();
        return;
      }

      toast.success(`Welcome back, ${user.name}! 🎉`);
      const searchRedirect = new URLSearchParams(window.location.search).get('redirect');
      const redirectMap = {
        institute: '/institute/dashboard',
        student: searchRedirect || (user.isOlympiadUser ? '/student/olympiad' : '/student/dashboard'),
        instructor: '/instructor/courses',
      };
      navigate(redirectMap[user.role] || '/student/dashboard');
    } catch (err) {
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);
      refreshCaptcha();

      if (nextAttempts >= 3) {
        setCooldown(30);
      }

      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.code === 'ERR_NETWORK') {
        setError('Unable to connect to the server. Please check your internet connection.');
      } else {
        setError('Invalid credentials or unauthorized login.');
      }
    }
  };

  const inputBase = 'w-full pl-9 pr-3.5 py-2.5 bg-slate-50/60 focus:bg-white text-slate-800 text-xs font-normal outline-none placeholder:text-slate-400 rounded-xl transition-all';
  const wrap = (f) => `relative rounded-xl border transition-all ${focusedField === f ? 'border-emerald-500 ring-2 ring-emerald-500/10 bg-white' : 'border-slate-200 hover:border-slate-300 bg-slate-50/60'}`;
  const iconWrap = 'absolute left-3 top-1/2 -translate-y-1/2 text-slate-400';

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      className="min-h-screen flex select-none"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >

      {/* ── Left — Form Panel ── */}
      <div className="flex-1 flex items-center justify-center p-5 lg:p-8 bg-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-72 h-72 bg-emerald-50/60 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-indigo-50/60 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />

        <div className="w-full max-w-sm relative z-10">

          {/* Top navigation */}
          <div className="flex items-center justify-between mb-5">
            <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-600 transition-colors group">
              <span className="w-5 h-5 rounded-lg border border-slate-200 flex items-center justify-center group-hover:border-emerald-300 group-hover:bg-emerald-50 transition-all">
                <ArrowLeft className="w-3 h-3 stroke-[1.5]" />
              </span>
              <span>Back to Home</span>
            </Link>

            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/60 text-[10px] text-emerald-700 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>256-BIT SSL ENCRYPTED</span>
            </div>
          </div>

          {/* Logo & Heading */}
          <div className="mb-4">
            <img src="/logo.png" alt="Abhyo" className="h-11 w-auto mb-3" />
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight flex items-center gap-2">
              Welcome back <span className="text-lg">👋</span>
            </h1>
            <p className="text-slate-500 text-xs font-normal mt-0.5">
              Sign in to continue your preparation and assessments
            </p>
          </div>

          {/* Welcome Notification when coming from registration */}
          {location.state?.fromWelcome && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 stroke-[1.5]" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-emerald-800">
                  Account Created Successfully! 🎉
                </p>
                <p className="text-xs text-emerald-700 font-normal mt-0.5 leading-relaxed">
                  Please enter your password to sign in to your {location.state?.role === 'institute' ? 'institute' : 'student'} account.
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 animate-fadeIn relative">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5 stroke-[1.5]" />
              <div className="flex-1 pr-3">
                <p className="text-xs text-rose-700 font-normal leading-relaxed">{error}</p>
              </div>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-rose-400 hover:text-rose-600 p-0.5"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5 stroke-[1.5]" />
              </button>
            </div>
          )}

          {/* Lockout Warning */}
          {cooldown > 0 && (
            <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-center text-xs font-mono">
              Account access paused for security. Wait {cooldown}s.
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5" autoComplete="off" spellCheck="false">
            {/* Email */}
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1 tracking-wide uppercase">
                Email Address
              </label>
              <div className={wrap('email')}>
                <div className={iconWrap}>
                  <Mail className="w-3.5 h-3.5 stroke-[1.5]" />
                </div>
                <input
                  type="email"
                  value={form.email}
                  disabled={cooldown > 0}
                  onChange={e => {
                    setForm({ ...form, email: e.target.value });
                    if (error) setError(null);
                  }}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="name@example.com"
                  className={inputBase}
                  autoComplete="off"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1 tracking-wide uppercase">
                Password
              </label>
              <div className={wrap('password')}>
                <div className={iconWrap}>
                  <Lock className="w-3.5 h-3.5 stroke-[1.5]" />
                </div>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  disabled={cooldown > 0}
                  onChange={e => {
                    setForm({ ...form, password: e.target.value });
                    if (error) setError(null);
                  }}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="••••••••••••"
                  className={`${inputBase} pr-10`}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 transition-colors p-0.5"
                  title="Toggle password visibility"
                >
                  {showPass ? <EyeOff className="w-3.5 h-3.5 stroke-[1.5]" /> : <Eye className="w-3.5 h-3.5 stroke-[1.5]" />}
                </button>
              </div>
            </div>

            {/* Anti-Bot Security Challenge (CAPTCHA) */}
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1 tracking-wide uppercase flex items-center justify-between">
                <span>Security Challenge</span>
                <span className="text-[9px] text-slate-400 font-mono font-normal">ANTI-BOT DEFENSE</span>
              </label>
              <div className="flex gap-2 items-center">
                {/* Canvas Box */}
                <div className="relative rounded-xl border border-slate-200 overflow-hidden bg-slate-100 flex-shrink-0 shadow-inner">
                  <canvas
                    ref={canvasRef}
                    width={125}
                    height={38}
                    className="block"
                    title="Security verification code"
                  />
                </div>

                {/* Refresh Button */}
                <button
                  type="button"
                  onClick={refreshCaptcha}
                  className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-emerald-600 transition-colors flex-shrink-0"
                  title="Generate new challenge"
                >
                  <RefreshCw className="w-3.5 h-3.5 stroke-[1.5]" />
                </button>

                {/* Code Input */}
                <input
                  type="text"
                  maxLength={5}
                  disabled={cooldown > 0}
                  value={form.captchaInput}
                  onChange={e => setForm({ ...form, captchaInput: e.target.value.toUpperCase() })}
                  placeholder="CODE"
                  className="flex-1 px-3 py-2 bg-slate-50/60 focus:bg-white text-slate-800 text-xs font-mono font-medium outline-none placeholder:text-slate-400 rounded-xl border border-slate-200 focus:border-emerald-500 text-center tracking-widest uppercase transition-all"
                  required
                />
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-xs pt-0.5">
              <label className="flex items-center gap-1.5 text-slate-500 cursor-pointer font-normal">
                <input type="checkbox" className="w-3.5 h-3.5 accent-emerald-600 rounded" />
                <span>Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-emerald-600 hover:text-emerald-700 font-medium hover:underline underline-offset-2 transition-colors">
                Forgot password?
              </Link>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading || cooldown > 0}
              className="relative w-full flex items-center justify-center gap-2 py-2.5 px-5 mt-1 rounded-xl font-medium text-xs text-white overflow-hidden group transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Signing in…</span>
                </>
              ) : cooldown > 0 ? (
                <>
                  <Lock className="w-3.5 h-3.5 stroke-[1.5]" />
                  <span>Locked ({cooldown}s)</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 stroke-[1.5]" />
                  <span>Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform stroke-[1.5]" />
                </>
              )}
            </button>
          </form>

          {/* Registration Options Footer */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-slate-500 text-xs text-center font-normal">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setShowRegModal(true)}
                className="text-emerald-600 hover:text-emerald-700 font-medium hover:underline underline-offset-2 transition-colors cursor-pointer"
              >
                Create one free →
              </button>
            </p>

            {/* Refined Registration Shortcuts */}
            <div className="flex items-center justify-center gap-2 mt-3 text-xs">
              <span className="text-slate-400 text-[11px] font-normal">Register for:</span>
              <button
                type="button"
                onClick={() => navigate(`/olympiad/register-account${window.location.search}`)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-50 hover:bg-violet-100/80 text-violet-700 text-xs font-medium border border-violet-200/60 transition-all hover:scale-102 cursor-pointer shadow-2xs"
              >
                <Trophy className="w-3 h-3 text-violet-600 stroke-[1.5]" />
                <span>Olympiad</span>
              </button>
              <button
                type="button"
                onClick={() => navigate(`/register${window.location.search}`)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100/80 text-emerald-700 text-xs font-medium border border-emerald-200/60 transition-all hover:scale-102 cursor-pointer shadow-2xs"
              >
                <FileText className="w-3 h-3 text-emerald-600 stroke-[1.5]" />
                <span>Mock Test</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* ── Right — Modern Hero Panel ── */}
      <div
        className="hidden lg:flex flex-1 relative overflow-hidden items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #064e3b 0%, #065f46 45%, #0d9488 100%)' }}
      >
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '32px 32px' }}
        />
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-emerald-400 rounded-full blur-3xl opacity-20 pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-60 h-60 bg-teal-300 rounded-full blur-3xl opacity-20 pointer-events-none" />

        <div className="relative z-10 text-center p-8 max-w-sm">
          {/* Logo icon */}
          <div className="w-24 h-24 flex items-center justify-center mx-auto mb-5">
            <img src="/favicon.png" alt="Abhyo" className="w-20 h-20 object-contain drop-shadow-xl" />
          </div>

          <h2 className="text-2xl font-semibold text-white leading-tight mb-2 tracking-tight">
            India's #1<br /><span className="text-emerald-200 font-medium">Mock Test Platform</span>
          </h2>
          <p className="text-emerald-100/80 text-xs leading-relaxed mb-6 font-normal">
            Trusted by <strong className="text-white font-medium">10,000+</strong> students and{' '}
            <strong className="text-white font-medium">200+</strong> coaching institutes across India
          </p>

          {/* Stats Cards */}
          <div className="flex justify-center gap-2.5 mb-5">
            {floatingStats.map((stat, i) => (
              <div
                key={i}
                className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 text-center flex-1 transition-transform hover:-translate-y-0.5"
                style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)' }}
              >
                <div className={`w-7 h-7 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center mx-auto mb-1 shadow-md`}>
                  <stat.icon className="w-3.5 h-3.5 text-white stroke-[1.5]" />
                </div>
                <p className="text-base font-semibold text-white">{stat.value}</p>
                <p className="text-[10px] text-emerald-200 font-normal">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3.5 text-left">
            <div className="flex items-center gap-0.5 mb-1.5">
              {[...Array(5)].map((_, i) => <span key={i} className="text-amber-300 text-xs">★</span>)}
            </div>
            <p className="text-emerald-50 text-xs italic leading-relaxed font-normal">
              "Abhyo helped me identify my weak spots and I improved by 34% in 3 months. Cleared UPSC on my first attempt!"
            </p>
            <div className="flex items-center gap-2.5 mt-2.5">
              <img src="https://i.pravatar.cc/40?img=47" alt="Priya" className="w-7 h-7 rounded-full border border-white/40" />
              <div>
                <p className="text-xs font-medium text-white">Priya Sharma</p>
                <p className="text-[10px] text-emerald-200 font-normal">UPSC CSE Qualifier</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Choose Registration Path Modal ── */}
      {showRegModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowRegModal(false)}
        >
          <div
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
            style={{ animation: 'loginModalIn 0.28s cubic-bezier(0.34,1.56,0.64,1) both' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 px-8 pt-7 pb-8 text-center">
              <button
                type="button"
                onClick={() => setShowRegModal(false)}
                className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-1.5 transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/15 mb-3 ring-1 ring-white/30">
                <span className="text-xl">🚀</span>
              </div>
              <h2 className="text-xl font-semibold text-white mb-1">Get Started for Free</h2>
              <p className="text-indigo-200 text-xs font-normal">Choose your path to begin your preparation journey</p>
            </div>

            {/* Cards */}
            <div className="px-7 py-6 flex flex-col sm:flex-row gap-4 bg-slate-50">
              {/* Olympiad Card */}
              <button
                type="button"
                onClick={() => {
                  setShowRegModal(false);
                  navigate(`/olympiad/register-account${window.location.search}`);
                }}
                className="flex-1 group flex flex-col items-center gap-2.5 p-5 rounded-2xl border border-slate-200/80 bg-white hover:border-violet-500 hover:shadow-md hover:shadow-violet-100 transition-all cursor-pointer text-left"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-md shadow-violet-300 group-hover:scale-105 transition-transform">
                  <Trophy size={22} className="text-white stroke-[1.5]" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-slate-800 text-sm group-hover:text-violet-700 transition-colors">Olympiad</p>
                  <p className="text-slate-500 text-xs mt-0.5 leading-relaxed font-normal">Register for competitive olympiads & win awards</p>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-violet-600 bg-violet-50 px-2.5 py-1 rounded-full group-hover:bg-violet-100 transition-colors mt-1">
                  Join Olympiad <ArrowRight size={11} className="stroke-[1.5]" />
                </span>
              </button>

              {/* Mock Test Card */}
              <button
                type="button"
                onClick={() => {
                  setShowRegModal(false);
                  navigate(`/register${window.location.search}`);
                }}
                className="flex-1 group flex flex-col items-center gap-2.5 p-5 rounded-2xl border border-slate-200/80 bg-white hover:border-emerald-500 hover:shadow-md hover:shadow-emerald-100 transition-all cursor-pointer text-left"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-300 group-hover:scale-105 transition-transform">
                  <FileText size={22} className="text-white stroke-[1.5]" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-slate-800 text-sm group-hover:text-emerald-700 transition-colors">Mock Test</p>
                  <p className="text-slate-500 text-xs mt-0.5 leading-relaxed font-normal">Practice mock tests, video series & test series</p>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full group-hover:bg-emerald-100 transition-colors mt-1">
                  Start Practicing <ArrowRight size={11} className="stroke-[1.5]" />
                </span>
              </button>
            </div>
          </div>

          <style>{`
            @keyframes loginModalIn {
              from { opacity: 0; transform: scale(0.92) translateY(15px); }
              to   { opacity: 1; transform: scale(1) translateY(0); }
            }
          `}</style>
        </div>
      )}

    </div>
  );
}
