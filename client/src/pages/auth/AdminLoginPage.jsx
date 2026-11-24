import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield, Eye, EyeOff, ArrowRight, Loader2, ArrowLeft,
  Mail, Lock, AlertCircle, X, RefreshCw, KeyRound
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import useAuthStore from '../../store/authStore';

// Generate dynamic 5-character alphanumeric verification code
const generateSecurityCode = () => {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export default function AdminLoginPage() {
  const [form, setForm] = useState({ email: '', password: '', captchaInput: '' });
  const [captchaCode, setCaptchaCode] = useState(generateSecurityCode());
  const [showPass, setShowPass] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [error, setError] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [cooldown, setCooldown] = useState(0);

  const canvasRef = useRef(null);
  const { adminLogin, login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const STAFF_ROLES = ['superadmin', 'admin', 'accountant', 'content_manager', 'teacher'];

  // Disable right-click context menu and inspection shortcuts for security
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

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Render clean, distorted bot-resistant canvas challenge
  const drawCaptcha = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#090d16');
    grad.addColorStop(1, '#111827');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Subtle noise lines
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * width, Math.random() * height);
      ctx.lineTo(Math.random() * width, Math.random() * height);
      ctx.strokeStyle = i % 2 === 0 ? 'rgba(99, 102, 241, 0.35)' : 'rgba(56, 189, 248, 0.25)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Characters with subtle rotation and distinct colors
    const colors = ['#818cf8', '#38bdf8', '#34d399', '#a78bfa', '#f472b6'];
    const charSpacing = width / (captchaCode.length + 1);

    for (let i = 0; i < captchaCode.length; i++) {
      const char = captchaCode[i];
      const x = (i + 0.8) * charSpacing;
      const y = height / 2 + 1;
      const angle = (Math.random() * 20 - 10) * (Math.PI / 180);

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.font = '600 20px monospace';
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
      setError(`Interface temporarily locked. Please wait ${cooldown} seconds.`);
      return;
    }

    // Verify security challenge
    if (form.captchaInput.trim().toUpperCase() !== captchaCode) {
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);
      refreshCaptcha();

      if (nextAttempts >= 3) {
        setCooldown(30);
        setError('Multiple failed verification attempts. Access locked for 30 seconds.');
      } else {
        setError(`Security code mismatch. ${3 - nextAttempts} attempt(s) remaining.`);
      }
      return;
    }

    try {
      const loginPayload = {
        email: form.email.trim(),
        password: form.password,
        securityChallenge: form.captchaInput.trim()
      };

      const result = adminLogin ? await adminLogin(loginPayload) : await login(loginPayload);
      const user = result.user;

      if (!STAFF_ROLES.includes(user.role)) {
        const { logout } = useAuthStore.getState();
        logout();
        setError('Access Denied: Clearance level insufficient. Platform staff only.');
        refreshCaptcha();
        return;
      }

      const redirectMap = {
        superadmin: '/admin/dashboard',
        admin: '/admin/dashboard',
        accountant: '/admin/revenue',
        content_manager: '/admin/questions',
        teacher: '/admin/questions',
      };

      const roleLabels = {
        superadmin: 'Super Admin',
        admin: 'Admin',
        accountant: 'Accountant',
        content_manager: 'Content Manager',
        teacher: 'Teacher',
      };

      toast.success(`Welcome, ${roleLabels[user.role] || 'Staff'} ${user.name}!`);
      navigate(redirectMap[user.role] || '/admin/dashboard');
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
        setError('Unable to reach authentication gateway.');
      } else {
        setError('Invalid credentials or insufficient clearance.');
      }
    }
  };

  const inputBase = 'w-full pl-9 pr-3.5 py-2.5 bg-slate-900/90 text-slate-100 text-xs font-normal outline-none placeholder:text-slate-500 rounded-xl border border-slate-700/80 transition-all';
  const wrap = (f) => `relative rounded-xl transition-all ${focusedField === f ? 'ring-1 ring-indigo-500 border-indigo-500' : ''} bg-slate-900`;
  const iconWrap = 'absolute left-3 top-1/2 -translate-y-1/2 text-slate-500';

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-slate-300 antialiased select-none"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      
      {/* Subtle background glow */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Clean Card */}
      <div className="w-full max-w-sm bg-slate-900/70 border border-slate-800/90 rounded-2xl p-6 sm:p-7 shadow-2xl backdrop-blur-xl relative z-10">

        {/* Top bar: Public site link & Security badge */}
        <div className="flex items-center justify-between mb-5">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-400 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Public Site</span>
          </Link>

          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>256-BIT ENCRYPTED</span>
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center gap-2.5 mb-1.5">
          <div className="w-8 h-8 bg-indigo-600 border border-indigo-400/30 rounded-xl flex items-center justify-center shadow-md shadow-indigo-600/20">
            <Shield className="w-4 h-4 text-white stroke-[1.5]" />
          </div>
          <div>
            <h1 className="font-medium text-slate-100 text-base">
              Admin <span className="text-indigo-400">Portal</span>
            </h1>
          </div>
        </div>
        <p className="text-slate-400 text-xs font-normal mb-5">
          Restricted administrative access gateway.
        </p>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2.5 animate-fadeIn relative">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5 stroke-[1.5]" />
            <div className="flex-1 pr-3">
              <p className="text-xs text-rose-300 font-normal leading-relaxed">{error}</p>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-rose-400 hover:text-rose-200 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Lockout Warning */}
        {cooldown > 0 && (
          <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-center text-xs font-mono">
            Access locked for security. Wait {cooldown}s.
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off" spellCheck="false">
          
          {/* Email */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1 tracking-wider uppercase">
              Admin Email
            </label>
            <div className={wrap('email')}>
              <div className={iconWrap}><Mail className="w-3.5 h-3.5 stroke-[1.5]" /></div>
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
                placeholder="admin@abhyo.com"
                className={inputBase}
                autoComplete="off"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1 tracking-wider uppercase">
              Password
            </label>
            <div className={wrap('password')}>
              <div className={iconWrap}><Lock className="w-3.5 h-3.5 stroke-[1.5]" /></div>
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-indigo-400 transition-colors p-0.5"
                title="Toggle password view"
              >
                {showPass ? <EyeOff className="w-3.5 h-3.5 stroke-[1.5]" /> : <Eye className="w-3.5 h-3.5 stroke-[1.5]" />}
              </button>
            </div>
          </div>

          {/* Security Challenge (CAPTCHA) */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1 tracking-wider uppercase">
              Security Challenge
            </label>
            <div className="flex gap-2 items-center">
              {/* Canvas element */}
              <div className="relative rounded-xl border border-slate-700/80 overflow-hidden bg-slate-950 flex-shrink-0">
                <canvas
                  ref={canvasRef}
                  width={130}
                  height={38}
                  className="block"
                  title="Verification code"
                />
              </div>

              {/* Refresh button */}
              <button
                type="button"
                onClick={refreshCaptcha}
                className="p-2.5 rounded-xl border border-slate-700/80 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-indigo-400 transition-colors flex-shrink-0"
                title="Generate new challenge"
              >
                <RefreshCw className="w-3.5 h-3.5 stroke-[1.5]" />
              </button>

              {/* Code input */}
              <input
                type="text"
                maxLength={5}
                disabled={cooldown > 0}
                value={form.captchaInput}
                onChange={e => setForm({ ...form, captchaInput: e.target.value.toUpperCase() })}
                placeholder="CODE"
                className="flex-1 px-3 py-2 bg-slate-900/90 text-slate-100 text-xs font-mono font-medium outline-none placeholder:text-slate-600 rounded-xl border border-slate-700/80 focus:border-indigo-500 text-center tracking-widest uppercase transition-all"
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || cooldown > 0}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 mt-2 rounded-xl font-medium text-xs text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Verifying…</span>
              </>
            ) : cooldown > 0 ? (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span>Locked ({cooldown}s)</span>
              </>
            ) : (
              <>
                <KeyRound className="w-3.5 h-3.5 stroke-[1.5]" />
                <span>Sign In</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[1.5]" />
              </>
            )}
          </button>
        </form>

        {/* Clean Footer */}
        <div className="mt-5 pt-3.5 border-t border-slate-800/80 text-[11px] text-slate-500 text-center">
          🔒 Authorized personnel only. All access is logged.
        </div>

      </div>
    </div>
  );
}
