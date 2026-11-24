import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, Loader2, ArrowLeft, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setError('');
    setIsLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
      toast.success('Password reset email dispatched!');
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to send password reset email. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const inputBase = 'w-full pl-10 pr-4 py-2.5 bg-slate-50/70 focus:bg-white text-slate-800 text-xs font-normal outline-none placeholder:text-slate-400 rounded-xl transition-all';
  const wrap = (f) => `relative rounded-xl border transition-all ${focusedField === f ? 'border-indigo-500 ring-2 ring-indigo-500/10 bg-white' : 'border-slate-200 hover:border-slate-300 bg-slate-50/70'}`;
  const iconWrap = 'absolute left-3 top-1/2 -translate-y-1/2 text-slate-400';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50/80 text-slate-700 antialiased" style={{ fontFamily: "'Inter', sans-serif" }}>
      
      {/* Background decoration glow */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xl relative z-10">

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Link to="/">
            <img src="/logo.png" alt="Abhyo" className="h-11 w-auto" />
          </Link>
        </div>

        {sent ? (
          <div className="text-center py-3 space-y-4 animate-fadeIn">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8 stroke-[1.5]" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900 tracking-tight">Check Your Inbox</h2>
              <p className="text-xs text-slate-500 font-normal mt-1.5 leading-relaxed">
                We've sent a password reset authorization link to:
              </p>
              <div className="inline-block mt-2 px-3 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-800">
                {email}
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-left text-[11px] text-amber-800 space-y-1">
              <p className="font-medium">💡 Can't find the email?</p>
              <ul className="list-disc list-inside text-amber-700/90 space-y-0.5">
                <li>Check your Spam or Junk mail folder</li>
                <li>The security link will expire in 60 minutes</li>
              </ul>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => setSent(false)}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Try another email address</span>
              </button>
              <Link
                to="/login"
                className="w-full py-2.5 px-4 rounded-xl text-xs font-medium text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center justify-center gap-1.5"
              >
                <ArrowLeft size={13} />
                <span>Return to Login</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-5 animate-fadeIn">
            {/* Header */}
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200/60 text-[11px] text-indigo-700 font-medium mb-2.5">
                <KeyRound className="w-3.5 h-3.5" />
                <span>Account Recovery</span>
              </div>
              <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Forgot Password?</h1>
              <p className="text-slate-500 text-xs font-normal mt-0.5">
                Enter your registered email address and we'll send you a secure link to reset your credentials.
              </p>
            </div>

            {/* Error banner */}
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-700 animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 stroke-[1.5]" />
                <span className="flex-1 font-normal">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
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
                    value={email}
                    onChange={e => {
                      setEmail(e.target.value);
                      if (error) setError('');
                    }}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Enter your registered email"
                    className={inputBase}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !email}
                className="w-full py-2.5 px-5 rounded-xl font-medium text-xs text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Dispatching Link…</span>
                  </>
                ) : (
                  <>
                    <span>Send Reset Link</span>
                    <ArrowRight size={13} />
                  </>
                )}
              </button>
            </form>

            <div className="text-center pt-2">
              <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 transition-colors">
                <ArrowLeft size={13} />
                <span>Return to Login</span>
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
