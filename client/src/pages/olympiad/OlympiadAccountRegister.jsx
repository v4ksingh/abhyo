import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Loader2, ArrowRight, ArrowLeft, User, Mail, Phone,
  Lock, MapPin, Trophy, ShieldCheck, Award, BookOpen, GraduationCap,
  Eye, EyeOff, Check, X, AlertCircle, Sparkles
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import api from '../../lib/api';

const INDIA_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman & Nicobar Islands', 'Chandigarh', 'Dadra & Nagar Haveli & Daman & Diu',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

export default function OlympiadAccountRegister() {
  const navigate = useNavigate();
  const { register, isLoading } = useAuthStore();
  const [focusedField, setFocusedField] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    mobile: '',
    state: '',
    city: '',
    class: '',
    subject: '',
    password: '',
    confirmPassword: '',
    role: 'student',
  });

  // Password criteria evaluation
  const passwordCriteria = {
    length: (form.password || '').length >= 8,
    upper: /[A-Z]/.test(form.password || ''),
    lower: /[a-z]/.test(form.password || ''),
    number: /\d/.test(form.password || ''),
    special: /[@$!%*?&#^()_+=\-[\]{}|~:;<>,.]/.test(form.password || ''),
  };
  const passedCriteriaCount = Object.values(passwordCriteria).filter(Boolean).length;
  const isPasswordStrong = passedCriteriaCount === 5;

  useEffect(() => {
    // Check if a subject was passed via query params e.g. ?subject=Mathematics
    const searchParams = new URLSearchParams(window.location.search);
    const subParam = searchParams.get('subject');

    // Fetch all active subjects from DB
    api.get('/olympiad/subjects')
      .then(res => {
        if (res.data?.data && Array.isArray(res.data.data)) {
          // Strictly filter to only active subjects
          const activeOnly = res.data.data.filter(s => s.isActive !== false);
          setSubjects(activeOnly);
          if (subParam && activeOnly.some(s => s.name.toLowerCase() === subParam.toLowerCase())) {
            setForm(f => ({ ...f, subject: subParam }));
          }
        }
      })
      .catch(() => {
        // Fallback default list (all active)
        const fallback = [
          { name: 'Mathematics', icon: '📐', isActive: true },
          { name: 'Science', icon: '🔬', isActive: true },
          { name: 'Computer', icon: '💻', isActive: true },
          { name: 'English', icon: '📖', isActive: true },
          { name: 'General Knowledge', icon: '🌏', isActive: true },
          { name: 'Logical Reasoning', icon: '🧠', isActive: true },
          { name: 'Social Studies', icon: '🏛️', isActive: true },
          { name: 'Cyber & AI', icon: '🤖', isActive: true },
        ];
        setSubjects(fallback);
        if (subParam) {
          setForm(f => ({ ...f, subject: subParam }));
        }
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Mobile number validation: Strictly 10 digits
    if (!form.mobile || form.mobile.length !== 10 || !/^\d{10}$/.test(form.mobile)) {
      toast.error('Mobile number must be exactly 10 digits');
      return;
    }

    // 2. Strong Password validation
    if (!isPasswordStrong) {
      toast.error('Password must be at least 8 characters, with 1 uppercase, 1 lowercase, 1 number, and 1 special character.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    // 3. Olympiad Subject validation: Must be an active subject
    if (!form.subject) {
      toast.error('Please select an active Olympiad Subject');
      return;
    }
    const activeSubjects = subjects.filter(s => s.isActive !== false);
    if (activeSubjects.length > 0) {
      const match = activeSubjects.find(s => s.name.toLowerCase() === form.subject.trim().toLowerCase());
      if (!match) {
        toast.error('Selected subject is not currently active. Please select an active subject.');
        return;
      }
    }

    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        mobile: form.mobile.trim(),
        state: form.state,
        city: form.city.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        role: 'student',
        isOlympiadUser: true,
      }, false);
      toast.success('🎉 Olympiad profile created! Welcome to Abhyo Olympiad.');

      // Store their class/subject preference for the Olympiad dashboard
      if (form.class) sessionStorage.setItem('olympiad_class', form.class);
      if (form.subject) sessionStorage.setItem('olympiad_subject', form.subject);

      navigate('/welcome', {
        replace: true,
        state: {
          name: form.name.trim(),
          email: form.email.trim(),
          role: 'student',
          isOlympiad: true,
        },
      });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    }
  };

  const inputBase = 'w-full pl-10 pr-4 py-2.5 bg-transparent outline-none text-slate-800 text-sm font-medium placeholder:text-slate-400 rounded-xl';
  const wrap = (f) => `relative rounded-xl border-2 transition-all ${focusedField === f ? 'border-indigo-500 shadow-sm shadow-indigo-500/10' : 'border-slate-200 hover:border-slate-300'} bg-white`;
  const iconWrap = 'absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 pointer-events-none';

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── Left — Custom Form Panel ── */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-8 bg-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-56 h-56 bg-indigo-50 rounded-full blur-3xl opacity-60 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-50 rounded-full blur-3xl opacity-60 translate-x-1/3 translate-y-1/3 pointer-events-none" />

        <div className="w-full max-w-md relative z-10 py-6">
          {/* Back link */}
          <Link to="/olympiad" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-indigo-600 transition-colors mb-4 group">
            <span className="w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center group-hover:border-indigo-300 group-hover:bg-indigo-50 transition-all">
              <ArrowLeft className="w-3 h-3" />
            </span>
            Back to Olympiad
          </Link>

          <h2 className="text-2xl font-black text-slate-900 mb-0.5 tracking-tight flex items-center gap-2">
            <Trophy className="w-6 h-6 text-indigo-600 shrink-0" />
            Olympiad Registration
          </h2>
          <p className="text-slate-500 text-sm mb-3 font-medium">Create your student account to participate</p>

          {/* Mock Test Switch Notice */}
          <div className="mb-4 p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-100 flex items-center justify-between gap-2 text-xs">
            <span className="text-emerald-700 font-medium">Looking for Mock Tests & Series?</span>
            <Link
              to={`/register${window.location.search}`}
              className="text-emerald-700 hover:text-emerald-900 font-bold hover:underline shrink-0 flex items-center gap-1"
            >
              <span>Mock Test Sign Up</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Full Name *</label>
              <div className={wrap('name')}>
                <div className={iconWrap}><User className="w-3.5 h-3.5" /></div>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Enter student full name"
                  className={inputBase}
                  required
                />
              </div>
            </div>

            {/* Email & Mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email Address *</label>
                <div className={wrap('email')}>
                  <div className={iconWrap}><Mail className="w-3.5 h-3.5" /></div>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="you@domain.com"
                    className={inputBase}
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-600">Mobile Number *</label>
                  <span className={`text-[10px] font-semibold transition-colors ${form.mobile.length === 10 ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {form.mobile.length}/10 digits
                  </span>
                </div>
                <div className={wrap('mobile')}>
                  <div className={iconWrap}><Phone className="w-3.5 h-3.5" /></div>
                  <div className="flex items-center pl-9 pr-3">
                    <span className="text-xs font-bold text-slate-500 mr-2 pr-2 border-r border-slate-200 select-none">
                      +91
                    </span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      pattern="[0-9]{10}"
                      value={form.mobile}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setForm({ ...form, mobile: val });
                      }}
                      onFocus={() => setFocusedField('mobile')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="9876543210"
                      className="w-full py-2.5 bg-transparent outline-none text-slate-800 text-sm font-medium placeholder:text-slate-400"
                      required
                    />
                    {form.mobile.length === 10 && (
                      <span className="flex-shrink-0 text-emerald-600 bg-emerald-50 rounded-full p-1" title="Valid 10-digit number">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* State & City */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">State *</label>
                <div className={wrap('state')}>
                  <div className={iconWrap}><MapPin className="w-3.5 h-3.5" /></div>
                  <select
                    value={form.state}
                    onChange={e => setForm({ ...form, state: e.target.value })}
                    onFocus={() => setFocusedField('state')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white outline-none text-slate-800 text-sm font-medium rounded-xl cursor-pointer"
                    required
                  >
                    <option value="">Select State</option>
                    {INDIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">City *</label>
                <div className={wrap('city')}>
                  <div className={iconWrap}><MapPin className="w-3.5 h-3.5" /></div>
                  <input
                    type="text"
                    value={form.city}
                    onChange={e => setForm({ ...form, city: e.target.value })}
                    onFocus={() => setFocusedField('city')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="e.g. Ranchi, Patna…"
                    className={inputBase}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Class & Subject */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Class / Standard *</label>
                <div className={wrap('class')}>
                  <div className={iconWrap}><GraduationCap className="w-3.5 h-3.5" /></div>
                  <select
                    value={form.class}
                    onChange={e => setForm({ ...form, class: e.target.value })}
                    onFocus={() => setFocusedField('class')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white outline-none text-slate-800 text-sm font-medium rounded-xl text-slate-900 cursor-pointer"
                    required
                  >
                    <option value="">Select Class</option>
                    {[6,7,8,9,10,11,12].map(c => <option key={c} value={c}>Class {c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-600">Olympiad Subject *</label>
                  <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100/70">
                    Active subjects only
                  </span>
                </div>
                <div className={wrap('subject')}>
                  <div className={iconWrap}><BookOpen className="w-3.5 h-3.5" /></div>
                  <select
                    value={form.subject}
                    onChange={e => setForm({ ...form, subject: e.target.value })}
                    onFocus={() => setFocusedField('subject')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white outline-none text-slate-800 text-sm font-medium rounded-xl text-slate-900 cursor-pointer"
                    required
                  >
                    <option value="">Select Subject</option>
                    {subjects.filter(s => s.isActive !== false).map(s => (
                      <option key={s.id || s.name} value={s.name}>
                        {s.icon ? `${s.icon} ` : ''}{s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Passwords */}
            <div className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Password *</label>
                  <div className={wrap('password')}>
                    <div className={iconWrap}><Lock className="w-3.5 h-3.5" /></div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 bg-transparent outline-none text-slate-800 text-sm font-medium placeholder:text-slate-400 rounded-xl"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                      tabIndex={-1}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Confirm Password *</label>
                  <div className={wrap('confirmPassword')}>
                    <div className={iconWrap}><Lock className="w-3.5 h-3.5" /></div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={form.confirmPassword}
                      onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                      onFocus={() => setFocusedField('confirmPassword')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 bg-transparent outline-none text-slate-800 text-sm font-medium placeholder:text-slate-400 rounded-xl"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                      tabIndex={-1}
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password Strength Meter & Checklist */}
              {form.password && (
                <div className="p-3 bg-slate-50 border border-slate-200/90 rounded-xl text-xs space-y-2 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-600">Password Strength:</span>
                    <span className={`font-bold ${
                      passedCriteriaCount <= 2 ? 'text-rose-600' :
                      passedCriteriaCount <= 4 ? 'text-amber-600' : 'text-emerald-600'
                    }`}>
                      {passedCriteriaCount <= 2 ? 'Weak' : passedCriteriaCount <= 4 ? 'Moderate' : 'Strong & Secure'}
                    </span>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden flex gap-1">
                    {[1, 2, 3, 4, 5].map((lvl) => (
                      <div
                        key={lvl}
                        className={`h-full flex-1 rounded-full transition-all duration-300 ${
                          lvl <= passedCriteriaCount
                            ? passedCriteriaCount <= 2
                              ? 'bg-rose-500'
                              : passedCriteriaCount <= 4
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                            : 'bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Checklist Requirements */}
                  <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
                    <div className={`flex items-center gap-1.5 ${passwordCriteria.length ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                      {passwordCriteria.length ? <Check className="w-3.5 h-3.5 shrink-0" /> : <span className="w-3.5 h-3.5 flex items-center justify-center shrink-0">○</span>}
                      <span>At least 8 characters</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${passwordCriteria.upper ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                      {passwordCriteria.upper ? <Check className="w-3.5 h-3.5 shrink-0" /> : <span className="w-3.5 h-3.5 flex items-center justify-center shrink-0">○</span>}
                      <span>1 Uppercase letter (A-Z)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${passwordCriteria.lower ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                      {passwordCriteria.lower ? <Check className="w-3.5 h-3.5 shrink-0" /> : <span className="w-3.5 h-3.5 flex items-center justify-center shrink-0">○</span>}
                      <span>1 Lowercase letter (a-z)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${passwordCriteria.number ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                      {passwordCriteria.number ? <Check className="w-3.5 h-3.5 shrink-0" /> : <span className="w-3.5 h-3.5 flex items-center justify-center shrink-0">○</span>}
                      <span>1 Number digit (0-9)</span>
                    </div>
                    <div className={`col-span-2 flex items-center gap-1.5 ${passwordCriteria.special ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                      {passwordCriteria.special ? <Check className="w-3.5 h-3.5 shrink-0" /> : <span className="w-3.5 h-3.5 flex items-center justify-center shrink-0">○</span>}
                      <span>1 Special symbol (@$!%*?&#^()_+=-)</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Password Match Indicator */}
              {form.confirmPassword && (
                <div className={`text-[11px] font-semibold flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors ${
                  form.password === form.confirmPassword
                    ? 'text-emerald-700 bg-emerald-50 border border-emerald-200/60'
                    : 'text-rose-600 bg-rose-50 border border-rose-200/60'
                }`}>
                  {form.password === form.confirmPassword ? (
                    <><Check className="w-3.5 h-3.5" /> Passwords match</>
                  ) : (
                    <><X className="w-3.5 h-3.5" /> Passwords do not match</>
                  )}
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="relative w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold text-sm text-white overflow-hidden group transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
              style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', boxShadow: '0 6px 24px rgba(79, 70, 229, 0.35)' }}
            >
              <span className="relative flex items-center gap-2">
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Creating Account…</>
                ) : (
                  <><ShieldCheck className="w-4 h-4" /> Create Account & Register <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" /></>
                )}
              </span>
            </button>
          </form>

          {/* Login fallback */}
          <p className="text-slate-500 text-xs text-center mt-5 font-medium">
            Already have an account?{' '}
            <Link to="/login?redirect=/student/olympiad" className="text-indigo-600 hover:text-indigo-700 font-bold hover:underline underline-offset-2 transition-colors">
              Log in here →
            </Link>
          </p>
        </div>
      </div>

      {/* ── Right — Custom Hero Panel ── */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #311042 50%, #4c1d95 100%)' }}
      >
        <div className="absolute inset-0"
          style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1.5px, transparent 1.5px)', backgroundSize: '32px 32px' }} />
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-60 h-60 bg-purple-500/20 rounded-full blur-3xl" />

        <div className="relative z-10 text-center p-8 max-w-sm text-white">
          <div className="w-20 h-20 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/20 shadow-xl">
            <Trophy className="w-10 h-10 text-yellow-300" />
          </div>
          <h2 className="text-3xl font-black mb-3 tracking-tight">National Olympiad</h2>
          <p className="text-indigo-200 text-sm leading-relaxed mb-6 font-medium">
            Create your profile, select your class, and complete the enrollment to challenge your skills across all national Olympiad subjects.
          </p>
          <div className="bg-white/5 backdrop-blur-sm border border-white/15 rounded-xl p-4 flex items-center gap-3 text-left">
            <Award className="w-5 h-5 text-indigo-300 flex-shrink-0" />
            <p className="text-xs text-indigo-100 font-medium">Verified digital certificates with QR validation will be issued to all participants.</p>
          </div>
        </div>
      </div>

    </div>
  );
}
