import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Lock, Eye, EyeOff, ArrowRight, Loader2, ArrowLeft,
  CheckCircle2, AlertCircle, ShieldCheck, KeyRound, Check, X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../lib/api';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  // Verification state
  const [verifyingToken, setVerifyingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState('');
  const [userInfo, setUserInfo] = useState(null);

  // Form states
  const [form, setForm] = useState({
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formError, setFormError] = useState('');

  // Verify token on mount
  useEffect(() => {
    if (!token) {
      setVerifyingToken(false);
      setTokenValid(false);
      setTokenError('No reset token provided in the link. Please request a new password reset.');
      return;
    }

    const checkToken = async () => {
      try {
        const res = await api.get('/auth/verify-reset-token', { params: { token } });
        if (res.data?.success) {
          setTokenValid(true);
          setUserInfo(res.data.data);
        } else {
          setTokenValid(false);
          setTokenError(res.data?.error || 'Password reset link is invalid or has expired.');
        }
      } catch (err) {
        setTokenValid(false);
        setTokenError(err.response?.data?.error || 'Password reset link is invalid or has expired.');
      } finally {
        setVerifyingToken(false);
      }
    };

    checkToken();
  }, [token]);

  // Security validation checks (Enterprise-Grade)
  const hasMinLength = form.password.length >= 8;
  const hasUppercase = /[A-Z]/.test(form.password);
  const hasLowercase = /[a-z]/.test(form.password);
  const hasNumber = /[0-9]/.test(form.password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(form.password);
  const passwordsMatch = Boolean(form.password && form.confirmPassword && form.password === form.confirmPassword);
  
  const isFormValid = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial && passwordsMatch;

  // Password strength meter
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: 'Not entered', color: 'bg-slate-200', text: 'text-slate-400' };
    let score = 0;
    if (pass.length >= 8) score += 20;
    if (pass.length >= 12) score += 10;
    if (/[A-Z]/.test(pass)) score += 20;
    if (/[a-z]/.test(pass)) score += 15;
    if (/[0-9]/.test(pass)) score += 20;
    if (/[^A-Za-z0-9]/.test(pass)) score += 15;

    if (score < 40) return { score, label: 'Weak', color: 'bg-rose-500', text: 'text-rose-600' };
    if (score < 70) return { score, label: 'Moderate', color: 'bg-amber-500', text: 'text-amber-600' };
    if (score < 90) return { score, label: 'Strong', color: 'bg-indigo-600', text: 'text-indigo-600' };
    return { score: 100, label: 'Very Secure', color: 'bg-emerald-600', text: 'text-emerald-600' };
  };

  const strength = getPasswordStrength(form.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!hasMinLength) {
      setFormError('Password must be at least 8 characters long.');
      return;
    }
    if (!hasUppercase) {
      setFormError('Password must include at least one uppercase letter (A-Z).');
      return;
    }
    if (!hasLowercase) {
      setFormError('Password must include at least one lowercase letter (a-z).');
      return;
    }
    if (!hasNumber) {
      setFormError('Password must include at least one number (0-9).');
      return;
    }
    if (!hasSpecial) {
      setFormError('Password must include at least one special character (!@#$%^&*).');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/auth/reset-password', {
        token,
        password: form.password,
      });

      if (res.data?.success) {
        setSuccess(true);
        toast.success('Password reset successfully!');
      } else {
        setFormError(res.data?.error || 'Failed to reset password. Please try again.');
      }
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to reset password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputBase = 'w-full pl-10 pr-10 py-2.5 bg-slate-50/70 focus:bg-white text-slate-800 text-xs font-normal outline-none placeholder:text-slate-400 rounded-xl transition-all';
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

        {/* ── State 1: Verifying Token ── */}
        {verifyingToken && (
          <div className="text-center py-8 space-y-3">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto stroke-[1.5]" />
            <p className="text-sm font-medium text-slate-800">Verifying Security Token…</p>
            <p className="text-xs text-slate-500 font-normal">Authenticating your password reset authorization</p>
          </div>
        )}

        {/* ── State 2: Invalid or Expired Token ── */}
        {!verifyingToken && !tokenValid && !success && (
          <div className="space-y-5 animate-fadeIn">
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-5 h-5 stroke-[1.5]" />
              </div>
              <h3 className="text-sm font-semibold text-rose-900">Reset Link Expired or Invalid</h3>
              <p className="text-xs text-rose-700 leading-relaxed font-normal">
                {tokenError || 'This password reset link has expired or has already been used once for security.'}
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <Link
                to="/forgot-password"
                className="w-full py-2.5 px-4 rounded-xl text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Request a New Reset Link</span>
                <ArrowRight size={13} />
              </Link>
              <Link
                to="/login"
                className="w-full py-2.5 px-4 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors flex items-center justify-center gap-1.5"
              >
                <ArrowLeft size={13} />
                <span>Back to Login</span>
              </Link>
            </div>
          </div>
        )}

        {/* ── State 3: Success Screen ── */}
        {success && (
          <div className="text-center py-4 space-y-4 animate-fadeIn">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8 stroke-[1.5]" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Password Reset Complete! 🎉</h2>
              <p className="text-xs text-slate-500 font-normal mt-1 leading-relaxed">
                Your password has been securely updated. You can now log in to your Abhyo account using your new credentials.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full py-3 px-5 rounded-xl font-medium text-xs text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 mt-2"
            >
              <span>Sign In with New Password</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}

        {/* ── State 4: Reset Form ── */}
        {!verifyingToken && tokenValid && !success && (
          <div className="space-y-5 animate-fadeIn">
            {/* Header */}
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200/60 text-[11px] text-indigo-700 font-medium mb-2.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified Reset Token</span>
              </div>
              <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Set New Password</h1>
              <p className="text-slate-500 text-xs font-normal mt-0.5">
                {userInfo?.name ? `Resetting password for ${userInfo.name}` : 'Enter and confirm your new account passphrase'}
              </p>
            </div>

            {/* Error banner */}
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-700 animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 stroke-[1.5]" />
                <span className="flex-1 font-normal">{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* New Password */}
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1 tracking-wide uppercase">
                  New Password
                </label>
                <div className={wrap('password')}>
                  <div className={iconWrap}>
                    <Lock className="w-3.5 h-3.5 stroke-[1.5]" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => {
                      setForm({ ...form, password: e.target.value });
                      if (formError) setFormError('');
                    }}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Minimum 8 characters with symbols"
                    className={inputBase}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors p-0.5"
                    title="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>

                {/* Real-time Password Strength Meter */}
                {form.password && (
                  <div className="mt-2 space-y-1 animate-fadeIn">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-500 font-medium">Security Strength:</span>
                      <span className={`font-bold ${strength.text}`}>{strength.label}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${strength.color} transition-all duration-300`}
                        style={{ width: `${strength.score}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1 tracking-wide uppercase">
                  Confirm New Password
                </label>
                <div className={wrap('confirmPassword')}>
                  <div className={iconWrap}>
                    <KeyRound className="w-3.5 h-3.5 stroke-[1.5]" />
                  </div>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={e => {
                      setForm({ ...form, confirmPassword: e.target.value });
                      if (formError) setFormError('');
                    }}
                    onFocus={() => setFocusedField('confirmPassword')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Re-enter your password"
                    className={inputBase}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors p-0.5"
                    title="Toggle password visibility"
                  >
                    {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Strict Security Criteria Checklist */}
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5 text-[11px] font-normal">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Required Security Standards:
                </p>
                <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                  {hasMinLength ? <Check size={12} className="text-emerald-600 stroke-[3]" /> : <div className="w-3 h-3 rounded-full border border-slate-300" />}
                  <span>At least 8 characters long</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasUppercase ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                  {hasUppercase ? <Check size={12} className="text-emerald-600 stroke-[3]" /> : <div className="w-3 h-3 rounded-full border border-slate-300" />}
                  <span>At least one uppercase letter (A-Z)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasLowercase ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                  {hasLowercase ? <Check size={12} className="text-emerald-600 stroke-[3]" /> : <div className="w-3 h-3 rounded-full border border-slate-300" />}
                  <span>At least one lowercase letter (a-z)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                  {hasNumber ? <Check size={12} className="text-emerald-600 stroke-[3]" /> : <div className="w-3 h-3 rounded-full border border-slate-300" />}
                  <span>At least one numerical digit (0-9)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasSpecial ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                  {hasSpecial ? <Check size={12} className="text-emerald-600 stroke-[3]" /> : <div className="w-3 h-3 rounded-full border border-slate-300" />}
                  <span>At least one special character (!@#$%^&*)</span>
                </div>
                {form.confirmPassword && (
                  <div className={`flex items-center gap-1.5 pt-0.5 border-t border-slate-200/60 ${passwordsMatch ? 'text-emerald-700 font-medium' : 'text-rose-600'}`}>
                    {passwordsMatch ? <Check size={12} className="text-emerald-600 stroke-[3]" /> : <X size={12} className="text-rose-600" />}
                    <span>{passwordsMatch ? 'Passwords match' : 'Passwords do not match'}</span>
                  </div>
                )}
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={submitting || !isFormValid}
                className="w-full py-2.5 px-5 rounded-xl font-medium text-xs text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Updating Password…</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={14} />
                    <span>Reset Password</span>
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
