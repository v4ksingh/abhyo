import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Loader2, ArrowRight, ArrowLeft, User, Mail, Phone,
  Lock, Building2, Sparkles, CheckCircle2, Search, X, MapPin, ChevronDown
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import api from '../../lib/api';
import { getImageUrl } from '../../lib/imageUrl';

const INDIA_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman & Nicobar Islands', 'Chandigarh', 'Dadra & Nagar Haveli & Daman & Diu',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];


const benefitsByRole = {
  student: [
    '500+ Mock Tests across all major exams',
    'Real-time Analytics & subject insights',
    'National Leaderboard & rank tracking',
    'Bilingual (Hindi + English) support',
  ],
  institute: [
    'Manage unlimited students & batches',
    'Assign tests with auto-grading',
    'Institute-level leaderboards',
    'Detailed student performance reports',
  ],
};

// ── Searchable Institute Picker ──────────────────────────────────────────────
function InstitutePicker({ value, stateFilter, onChange }) {
  const [query, setQuery] = useState('');
  const [institutes, setInstitutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null); // { name, slug, inviteCode, logo, city, state }
  const dropRef = useRef(null);
  const timerRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Fetch institutes when query changes or open state
  useEffect(() => {
    clearTimeout(timerRef.current);
    if (!open) return;
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get('/public/institutes', { params: { search: query, state: stateFilter || undefined, limit: 20, page: 1 } });
        setInstitutes(res.data.data || []);
      } catch {
        setInstitutes([]);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(timerRef.current);
  }, [query, open, stateFilter]);

  const handleSelect = (inst) => {
    setSelected(inst);
    setOpen(false);
    setQuery('');
    // Pass invite code to parent
    onChange(inst.inviteCode || '');
  };

  const handleClear = () => {
    setSelected(null);
    onChange('');
  };

  return (
    <div ref={dropRef} className="relative">
      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
        Coaching Institute <span className="text-slate-400 font-normal">(Optional)</span>
      </label>

      {/* Trigger */}
      {selected ? (
        <div className="flex items-center gap-2.5 border-2 border-emerald-400 bg-emerald-50 rounded-xl px-3 py-2.5">
          {getImageUrl(selected.logo) ? (
            <img src={getImageUrl(selected.logo)} alt="" className="w-7 h-7 rounded-lg object-cover flex-shrink-0 border border-emerald-200" />
          ) : (
            <div className="w-7 h-7 rounded-lg bg-emerald-200 flex items-center justify-center flex-shrink-0 text-emerald-700 font-bold text-xs">
              {selected.name?.charAt(0)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-800 truncate">{selected.name}</p>
            {(selected.city || selected.state) && (
              <p className="text-xs text-slate-500 flex items-center gap-0.5">
                <MapPin size={9} />{[selected.city, selected.state].filter(Boolean).join(', ')}
              </p>
            )}
          </div>
          <button type="button" onClick={handleClear}
            className="text-slate-400 hover:text-red-500 transition-colors flex-shrink-0">
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full flex items-center gap-2.5 border-2 border-slate-200 hover:border-emerald-400 bg-white rounded-xl px-3 py-2.5 transition-all text-left">
          <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <span className="flex-1 text-sm text-slate-400 font-medium">Search coaching institutes…</span>
          <ChevronDown size={13} className="text-slate-400" />
        </button>
      )}

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-100">
            <Search size={13} className="text-slate-400 flex-shrink-0" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by name or city…"
              className="flex-1 text-xs outline-none text-slate-700 placeholder:text-slate-400 font-medium"
            />
            {query && (
              <button type="button" onClick={() => setQuery('')}><X size={12} className="text-slate-400" /></button>
            )}
          </div>

          {/* Results */}
          <div className="max-h-52 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-6 text-slate-400 text-xs">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading institutes…
              </div>
            ) : institutes.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                <Building2 className="w-6 h-6 mx-auto mb-1.5 opacity-40" />
                {query ? 'No institutes found for this search' : 'No institutes available'}
              </div>
            ) : (
              institutes.map(inst => (
                <button
                  key={inst.id}
                  type="button"
                  onClick={() => handleSelect(inst)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-emerald-50 transition-colors text-left border-b border-slate-50 last:border-0"
                >
                  {getImageUrl(inst.logo) ? (
                    <img src={getImageUrl(inst.logo)} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0 border border-slate-100" />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                      {inst.name?.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{inst.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {(inst.city || inst.state) && (
                        <span className="text-xs text-slate-500 flex items-center gap-0.5">
                          <MapPin size={9} />{[inst.city, inst.state].filter(Boolean).join(', ')}
                        </span>
                      )}
                      {inst.isFeatured && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-semibold">⭐ Featured</span>
                      )}
                    </div>
                  </div>
                  <CheckCircle2 size={14} className="text-slate-200 flex-shrink-0" />
                </button>
              ))
            )}
          </div>

          {/* Footer hint */}
          <div className="px-3 py-2 bg-slate-50 border-t border-slate-100">
            <p className="text-xs text-slate-400">
              Or enter your invite code manually below ↓
            </p>
          </div>
        </div>
      )}

      {/* Manual code fallback */}
      {!selected && (
        <div className="mt-2">
          <div className="relative rounded-xl border-2 border-slate-200 hover:border-slate-300 bg-white transition-all">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono">#</span>
            <input
              type="text"
              value={value}
              onChange={e => onChange(e.target.value.toUpperCase())}
              placeholder="Have an invite code? DELHI123"
              className="w-full pl-7 pr-4 py-2.5 bg-transparent outline-none text-slate-700 text-xs font-mono placeholder:text-slate-400 rounded-xl placeholder:font-sans"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Register Component ───────────────────────────────────────────────────
export default function RegisterPage() {
  const [form, setForm] = useState({
    name: '', email: '', mobile: '', password: '', confirmPassword: '',
    role: 'student', instituteName: '', instituteCode: '', state: '', city: '',
  });
  const [focusedField, setFocusedField] = useState(null);
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const [regSettings, setRegSettings] = useState({ student: true, institute: true });
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/cms/settings');
        const cmsData = res.data?.data || [];
        const stuReg = cmsData.find(s => s.key === 'student_registration');
        const instReg = cmsData.find(s => s.key === 'institute_registration');
        setRegSettings({
          student: stuReg ? stuReg.value !== 'false' : true,
          institute: instReg ? instReg.value !== 'false' : true,
        });
      } catch (err) {
        // Fallback to true if network fails
      } finally {
        setLoadingSettings(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.mobile && form.mobile.length !== 10) {
      toast.error('Mobile number must be exactly 10 digits');
      return;
    }

    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!strongPasswordRegex.test(form.password)) {
      toast.error('Password must be at least 8 characters, with 1 uppercase, 1 lowercase, 1 number, and 1 special character.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    try {
      const result = await register(form, false);
      const registeredUser = result.user || { name: form.name, email: form.email, role: form.role, instituteName: form.instituteName };

      toast.success(
        result.pendingApproval
          ? 'Registration submitted! Your institute is pending admin approval.'
          : '🎉 Account created successfully!'
      );

      navigate('/welcome', {
        replace: true,
        state: {
          name: registeredUser.name || form.name,
          email: registeredUser.email || form.email,
          role: form.role,
          instituteName: form.instituteName,
          trialInfo: result.trialInfo,
          pendingApproval: !!result.pendingApproval,
        },
      });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    }
  };

  const inputBase = 'w-full pl-10 pr-4 py-2.5 bg-transparent outline-none text-slate-800 text-sm font-medium placeholder:text-slate-400 rounded-xl';
  const wrap = (f) => `relative rounded-xl border-2 transition-all ${focusedField === f ? 'border-emerald-500 shadow-sm shadow-emerald-500/10' : 'border-slate-200 hover:border-slate-300'} bg-white`;
  const iconWrap = 'absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5';

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── Left — Hero Panel ── */}
      <div
        className="hidden lg:flex flex-col flex-1 relative overflow-hidden items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #064e3b 0%, #059669 50%, #10b981 100%)' }}
      >
        <div className="absolute inset-0"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-emerald-300 rounded-full blur-3xl opacity-20" />
        <div className="absolute bottom-1/4 left-1/4 w-44 h-44 bg-teal-400 rounded-full blur-3xl opacity-15" />
        {[...Array(14)].map((_, i) => (
          <div key={i} className="absolute rounded-full bg-white/10 animate-pulse"
            style={{ width: `${Math.random() * 5 + 3}px`, height: `${Math.random() * 5 + 3}px`, left: `${10 + Math.random() * 80}%`, top: `${5 + Math.random() * 90}%`, animationDelay: `${Math.random() * 4}s`, animationDuration: `${2 + Math.random() * 3}s` }} />
        ))}

        <div className="relative z-10 p-8 max-w-sm w-full">
          <div className="flex items-center mb-6">
            <img src="/logo.png" alt="Abhyo" className="h-14 w-auto brightness-0 invert" />
          </div>

          <h2 className="text-3xl font-black text-white leading-tight mb-2 tracking-tight">
            {form.role === 'student' ? 'Start Your' : 'Grow Your'}{' '}
            <span className="text-emerald-200">
              {form.role === 'student' ? 'Success Journey' : 'Coaching Online'}
            </span>
          </h2>
          <p className="text-emerald-100 text-xs leading-relaxed mb-5 font-medium">
            {form.role === 'student'
              ? 'Join 10,000+ aspirants who cracked their exams with Abhyo'
              : 'Join 200+ coaching institutes managing their students online'}
          </p>

          <div className="space-y-2 mb-6">
            {benefitsByRole[form.role]?.map((b, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className="w-5 h-5 bg-emerald-400/20 border border-emerald-400/40 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                </div>
                <span className="text-emerald-50 text-xs font-medium">{b}</span>
              </div>
            ))}
          </div>

          {/* Trial promo */}
          {form.role === 'student' && (
            <div className="mb-5 flex items-center gap-2.5 bg-white/15 border border-white/30 rounded-xl px-4 py-3">
              <span className="text-2xl flex-shrink-0">🎁</span>
              <div>
                <p className="text-white font-black text-xs">Free Trial on Signup!</p>
                <p className="text-emerald-200 text-xs leading-snug">Get premium access free on registration — no credit card needed.</p>
              </div>
            </div>
          )}

          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="flex -space-x-2">
                {[47, 32, 25, 55].map(n => (
                  <img key={n} src={`https://i.pravatar.cc/40?img=${n}`} alt=""
                    className="w-7 h-7 rounded-full border-2 border-emerald-700/50" />
                ))}
              </div>
              <p className="text-emerald-100 text-xs font-semibold">
                <strong className="text-white">10,000+</strong> students joined this month
              </p>
            </div>
            <div className="flex items-center gap-0.5 mb-0.5">
              {[...Array(5)].map((_, i) => <span key={i} className="text-amber-400 text-xs">★</span>)}
              <span className="text-white font-bold text-xs ml-1">4.9/5</span>
            </div>
            <p className="text-emerald-200 text-xs">Rated by students across India</p>
          </div>
        </div>
      </div>

      {/* ── Right — Form Panel ── */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-8 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-56 h-56 bg-emerald-50 rounded-full blur-3xl opacity-60 translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-50 rounded-full blur-3xl opacity-60 -translate-x-1/3 translate-y-1/3 pointer-events-none" />

        <div className="w-full max-w-sm relative z-10">

          <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-emerald-600 transition-colors mb-4 group">
            <span className="w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center group-hover:border-emerald-300 group-hover:bg-emerald-50 transition-all">
              <ArrowLeft className="w-3 h-3" />
            </span>
            Back to Home
          </Link>

          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center mb-4">
            <img src="/logo.png" alt="Abhyo" className="h-14 w-auto" />
          </div>

          <h2 className="text-2xl font-black text-slate-900 mb-0.5 tracking-tight">Create your account ✨</h2>
          <p className="text-slate-500 text-sm mb-3 font-medium">Join thousands of students & institutes</p>

          {/* Olympiad Switch Notice */}
          <div className="mb-4 p-2.5 rounded-xl bg-violet-50/80 border border-violet-100 flex items-center justify-between gap-2 text-xs">
            <span className="text-violet-700 font-medium">Looking for Olympiad registration?</span>
            <Link
              to={`/olympiad/register-account${window.location.search}`}
              className="text-violet-700 hover:text-violet-900 font-bold hover:underline shrink-0 flex items-center gap-1"
            >
              <span>Join Olympiad</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Role Toggle */}
          <div className="flex bg-slate-100 rounded-xl p-1 mb-4 gap-1 border border-slate-200">
            {[
              { value: 'student', label: 'Student', emoji: '👨‍🎓' },
              { value: 'institute', label: 'Institute', emoji: '🏫' },
            ].map(r => (
              <button
                key={r.value}
                onClick={() => setForm({ ...form, role: r.value })}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${form.role === r.value
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow shadow-emerald-500/25'
                  : 'text-slate-500 hover:text-slate-700'
                  }`}
              >
                <span>{r.emoji}</span>{r.label}
              </button>
            ))}
          </div>

          {loadingSettings ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            </div>
          ) : !regSettings[form.role] ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center mt-4">
              <Lock className="w-12 h-12 text-red-400 mx-auto mb-3" />
              <h3 className="text-lg font-black text-red-600 mb-2">Registration Closed</h3>
              <p className="text-sm font-medium text-red-500">
                {form.role === 'institute' ? 'Institute' : 'Student'} registration is currently closed. Please wait some time and try again later.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <div className={wrap('name')}>
                  <User className={iconWrap} />
                  <input type="text" value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    onFocus={() => setFocusedField('name')} onBlur={() => setFocusedField(null)}
                    className={inputBase} placeholder="Rajesh Kumar" required />
                </div>
              </div>

              {/* Institute Name (for institute role) */}
              {form.role === 'institute' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Institute Name</label>
                  <div className={wrap('instituteName')}>
                    <Building2 className={iconWrap} />
                    <input type="text" value={form.instituteName}
                      onChange={e => setForm({ ...form, instituteName: e.target.value })}
                      onFocus={() => setFocusedField('instituteName')} onBlur={() => setFocusedField(null)}
                      className={inputBase} placeholder="ABC Coaching Centre" required />
                  </div>
                </div>
              )}

              {/* Email + Mobile */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Email <span className="text-red-400">*</span>
                  </label>
                  <div className={wrap('email')}>
                    <Mail className={iconWrap} />
                    <input type="email" value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)}
                      className={inputBase} placeholder="you@email.com" required />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Mobile <span className="text-red-400">*</span>
                  </label>
                  <div className={wrap('mobile')}>
                    <Phone className={iconWrap} />
                    <input type="tel" value={form.mobile}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setForm({ ...form, mobile: val });
                      }}
                      onFocus={() => setFocusedField('mobile')} onBlur={() => setFocusedField(null)}
                      className={inputBase} placeholder="9999999999" required />
                  </div>
                </div>
              </div>

              {/* State + City */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    State <span className="text-red-400">*</span>
                  </label>
                  <div className={`relative rounded-xl border-2 transition-all ${focusedField === 'state' ? 'border-emerald-500 shadow-sm shadow-emerald-500/10' : 'border-slate-200 hover:border-slate-300'
                    } bg-white`}>
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                    <select
                      value={form.state}
                      onChange={e => setForm({ ...form, state: e.target.value })}
                      onFocus={() => setFocusedField('state')}
                      onBlur={() => setFocusedField(null)}
                      required
                      className="w-full pl-9 pr-3 py-2.5 bg-transparent outline-none text-slate-800 text-xs font-medium rounded-xl appearance-none cursor-pointer"
                      style={{ color: form.state ? '#1e293b' : '#94a3b8' }}
                    >
                      <option value="" disabled>Select state…</option>
                      {INDIA_STATES.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">City</label>
                  <div className={`relative rounded-xl border-2 transition-all ${focusedField === 'city' ? 'border-emerald-500 shadow-sm shadow-emerald-500/10' : 'border-slate-200 hover:border-slate-300'
                    } bg-white`}>
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                    <input
                      type="text" value={form.city}
                      onChange={e => setForm({ ...form, city: e.target.value })}
                      onFocus={() => setFocusedField('city')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Delhi, Mumbai…"
                      className="w-full pl-9 pr-3 py-2.5 bg-transparent outline-none text-slate-700 text-xs font-medium placeholder:text-slate-400 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* Coaching Institute Picker (Student only) */}
              {form.role === 'student' && (
                <InstitutePicker
                  value={form.instituteCode}
                  stateFilter={form.state}
                  onChange={(code) => setForm({ ...form, instituteCode: code })}
                />
              )}

              {/* Password + Confirm */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Password</label>
                  <div className={wrap('password')}>
                    <Lock className={iconWrap} />
                    <input type="password" value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField(null)}
                      className={inputBase} placeholder="••••••••" required minLength={8} />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5 pl-1 leading-tight">
                    Requires 8+ chars, 1 uppercase, 1 lowercase, 1 number, & 1 special character.
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Confirm</label>
                  <div className={wrap('confirmPassword')}>
                    <Lock className={iconWrap} />
                    <input type="password" value={form.confirmPassword}
                      onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                      onFocus={() => setFocusedField('confirmPassword')} onBlur={() => setFocusedField(null)}
                      className={inputBase} placeholder="••••••••" required />
                  </div>
                </div>
              </div>

              {/* Institute approval notice */}
              {form.role === 'institute' && (
                <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <span className="text-base flex-shrink-0">⚠️</span>
                  <p className="text-xs text-amber-700 font-medium leading-relaxed">
                    Institute accounts require admin approval before activation (usually 24–48 hours).
                  </p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="relative w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold text-sm text-white overflow-hidden group transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
                style={{
                  background: form.role === 'institute'
                    ? 'linear-gradient(135deg, #059669 0%, #0d9488 100%)'
                    : 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)',
                  boxShadow: '0 6px 24px rgba(16,185,129,0.35)',
                }}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                <span className="relative flex items-center gap-2">
                  {isLoading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />Creating account…</>
                  ) : (
                    <><Sparkles className="w-4 h-4" />{form.role === 'student' ? 'Create Free Account + Start Trial' : 'Create Free Account'}<ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" /></>
                  )}
                </span>
              </button>

              <p className="text-center text-xs text-slate-400 font-medium">
                By signing up, you agree to our{' '}
                <Link to="/terms" className="text-emerald-600 hover:underline">Terms</Link> &{' '}
                <Link to="/privacy-policy" className="text-emerald-600 hover:underline">Privacy Policy</Link>
              </p>
            </form>
          )}

          <p className="text-slate-500 text-xs text-center mt-3 font-medium">
            Already have an account?{' '}
            <Link to="/login" className="text-emerald-600 hover:text-emerald-700 font-bold hover:underline underline-offset-2 transition-colors">
              Sign in →
            </Link>
          </p>
        </div>
      </div>

    </div>
  );
}
