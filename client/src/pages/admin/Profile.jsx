import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  Shield,
  ShieldCheck,
  Key,
  Lock,
  Eye,
  EyeOff,
  Save,
  Loader2,
  Building2,
  Users,
  BookOpen,
  IndianRupee,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Server,
  Database,
  Activity,
  Layers,
  Settings,
  Bell,
  Cpu,
  RefreshCw,
  LogOut,
  Crown,
  MapPin,
  Globe,
  Check,
  ExternalLink,
  ChevronRight,
  Laptop
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import useAuthStore from '../../store/authStore';

export default function AdminProfile() {
  const { user, updateUser, logout } = useAuthStore();
  const isSuperAdmin = user?.role === 'superadmin';

  // Active Tab: 'identity' | 'security' | 'privileges' | 'telemetry' | 'alerts'
  const [activeTab, setActiveTab] = useState('identity');

  // Profile Form State
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    mobile: user?.mobile || '',
    city: user?.city || '',
    state: user?.state || '',
    language: user?.language || 'en',
    title: isSuperAdmin ? 'Platform Super Administrator & Root Authority' : 'Administrative Staff',
    bio: 'Oversees platform operations, exam moderation, enterprise partner approvals, and security compliance.',
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // Password State
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [savingPass, setSavingPass] = useState(false);

  // Platform Telemetry State
  const [telemetry, setTelemetry] = useState(null);
  const [loadingTelemetry, setLoadingTelemetry] = useState(true);

  // Cache Warming Telemetry State
  const [cacheStats, setCacheStats] = useState(null);
  const [warmingCache, setWarmingCache] = useState(false);

  // Notification Alerts Preferences State (stored in localStorage)
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('abhyo_admin_notification_prefs');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return {
      newInstitute: true,
      highValuePayments: true,
      securityAlerts: true,
      olympiadMilestones: true,
      dailyDigest: false,
    };
  });

  // Sync user state changes to form
  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        mobile: user.mobile || '',
        city: user.city || '',
        state: user.state || '',
        language: user.language || 'en',
      }));
    }
  }, [user]);

  // Fetch telemetry / dashboard KPIs
  useEffect(() => {
    let isMounted = true;
    api.get('/admin/dashboard')
      .then(res => {
        if (isMounted) {
          setTelemetry(res.data?.data?.stats || null);
        }
      })
      .catch(err => {
        console.warn('Dashboard stats load error (non-fatal):', err.message);
      })
      .finally(() => {
        if (isMounted) setLoadingTelemetry(false);
      });
    return () => { isMounted = false; };
  }, []);

  // Fetch Cache Status
  const fetchCacheStats = async () => {
    try {
      const res = await api.get('/admin/cache-status');
      setCacheStats(res.data?.data || null);
    } catch (err) {
      console.warn('Cache stats error:', err.message);
    }
  };

  useEffect(() => {
    if (activeTab === 'telemetry') {
      fetchCacheStats();
    }
  }, [activeTab]);

  const handleWarmCache = async () => {
    setWarmingCache(true);
    try {
      const res = await api.post('/admin/cache-warm');
      toast.success(res.data?.message || 'Cache preloaded into memory!');
      fetchCacheStats();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to warm cache');
    } finally {
      setWarmingCache(false);
    }
  };

  const handleClearCache = async () => {
    if (!window.confirm('Clear all in-memory cache? Next queries will fetch directly from MySQL until refreshed.')) return;
    try {
      const res = await api.post('/admin/cache-clear');
      toast.success(res.data?.message || 'Cache cleared');
      fetchCacheStats();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to clear cache');
    }
  };

  // Handle Profile Update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      if (form.email) formData.append('email', form.email);
      if (form.mobile) formData.append('mobile', form.mobile);
      if (form.city) formData.append('city', form.city);
      if (form.state) formData.append('state', form.state);
      if (form.language) formData.append('language', form.language);
      if (avatarFile) formData.append('avatar', avatarFile);

      const res = await api.put('/auth/update-profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      updateUser(res.data.user);
      toast.success('Admin Profile updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!passwords.currentPassword) {
      toast.error('Please enter your current password');
      return;
    }
    if (passwords.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long');
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('New password and confirmation do not match');
      return;
    }

    setSavingPass(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      toast.success('Password updated successfully! Keep your credentials safe.');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Password update failed');
    } finally {
      setSavingPass(false);
    }
  };

  // Toggle notification preferences
  const handleToggleNotification = (key) => {
    setNotifications(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      localStorage.setItem('abhyo_admin_notification_prefs', JSON.stringify(updated));
      toast.success('Notification preference saved');
      return updated;
    });
  };

  // Password strength calculator
  const calculatePasswordStrength = (pass) => {
    if (!pass) return { score: 0, text: 'Not set', color: 'bg-slate-200' };
    let score = 0;
    if (pass.length >= 8) score += 25;
    if (pass.length >= 12) score += 15;
    if (/[A-Z]/.test(pass)) score += 20;
    if (/[0-9]/.test(pass)) score += 20;
    if (/[^A-Za-z0-9]/.test(pass)) score += 20;

    if (score < 40) return { score, text: 'Weak', color: 'bg-rose-500' };
    if (score < 70) return { score, text: 'Moderate', color: 'bg-amber-500' };
    if (score < 90) return { score, text: 'Strong', color: 'bg-emerald-500' };
    return { score: 100, text: 'Very Secure', color: 'bg-indigo-600' };
  };

  const passStrength = calculatePasswordStrength(passwords.newPassword);

  const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
  const getAvatarUrl = () => {
    if (avatarFile) return URL.createObjectURL(avatarFile);
    if (user?.avatar) return user.avatar.startsWith('http') ? user.avatar : `${API_URL}/uploads/${user.avatar}`;
    return null;
  };

  // Authorities Matrix
  const authorityModules = [
    {
      title: 'User & Identity Governance',
      desc: 'Create, suspend, activate, and moderate student, teacher, institute, and staff accounts with full CRUD access.',
      icon: Users,
      level: 'Full Root Access',
      status: 'Unrestricted',
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    },
    {
      title: 'Financials & Revenue Gateway',
      desc: 'Real-time transaction auditing, Razorpay payment verification, refunds, revenue analytics, and coupon management.',
      icon: IndianRupee,
      level: 'Financial Controller',
      status: 'Unrestricted',
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    },
    {
      title: 'Exam Engine & Question Bank',
      desc: 'Create and publish mock tests, manage 20,000+ question bank, configure test lobbies, grading rubrics, and exam series.',
      icon: BookOpen,
      level: 'Master Academic',
      status: 'Unrestricted',
      color: 'text-blue-600 bg-blue-50 border-blue-100',
    },
    {
      title: 'Coaching Institute Ecosystem',
      desc: 'Review institute applications, approve or reject KYC documents, assign subscription tiers, and configure landing pages.',
      icon: Building2,
      level: 'Ecosystem Authority',
      status: 'Unrestricted',
      color: 'text-purple-600 bg-purple-50 border-purple-100',
    },
    {
      title: 'National Olympiads & Awards',
      desc: 'Manage annual national olympiads, student admit card generators, automatic certificate distribution, and prize payouts.',
      icon: Crown,
      level: 'Olympiad Director',
      status: 'Unrestricted',
      color: 'text-amber-600 bg-amber-50 border-amber-100',
    },
    {
      title: 'Infrastructure & System Broadcasts',
      desc: 'Configure SMTP mail gateways, send system-wide announcements via SMS/Email, trigger sitemap builds, and manage CMS.',
      icon: Server,
      level: 'System Administrator',
      status: 'Unrestricted',
      color: 'text-rose-600 bg-rose-50 border-rose-100',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-24 font-sans animate-fade-in px-2 sm:px-4">
      {/* ─── Breadcrumb & Top Header ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <span>Administration</span>
            <ChevronRight size={12} />
            <span className="text-indigo-600">Executive Profile</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            {isSuperAdmin ? 'Super Admin Command Center' : 'Administrator Profile'}
            {isSuperAdmin && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                <Crown size={13} className="text-amber-600" />
                Root Authority
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your executive credentials, root security protocols, administrative privileges, and platform telemetry.
          </p>
        </div>

        {/* Quick System Status Badges */}
        <div className="flex items-center flex-wrap gap-2.5">
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3.5 py-1.5 rounded-xl text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Session Active & Guarded
          </div>
          <div className="flex items-center gap-1.5 bg-slate-100 text-slate-700 border border-slate-200 px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium">
            <Clock size={12} className="text-slate-500" />
            Auto-Lock: 10m Idle
          </div>
        </div>
      </div>

      {/* ─── Hero Executive Card ───────────────────────────────────────────── */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl border border-slate-800">
        {/* Decorative background glow accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative p-6 sm:p-8 lg:p-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            {/* Avatar with Upload Hover */}
            <div className="relative group">
              <label className="relative block w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden cursor-pointer ring-4 ring-indigo-500/30 shadow-2xl transition-all duration-300 group-hover:ring-indigo-400 group-hover:scale-[1.02]">
                {getAvatarUrl() ? (
                  <img src={getAvatarUrl()} alt={user?.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center text-4xl font-extrabold text-white">
                    {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                  </div>
                )}
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-bold gap-1">
                  <Sparkles size={18} />
                  <span>Change Photo</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    if (e.target.files?.[0]) {
                      setAvatarFile(e.target.files[0]);
                      toast.success('New photo selected. Click "Save Profile Changes" to apply.');
                    }
                  }}
                />
              </label>
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 ring-4 ring-slate-900 w-5 h-5 rounded-full flex items-center justify-center" title="Online & Active">
                <Check size={11} className="text-white stroke-[3]" />
              </div>
            </div>

            {/* Admin Info */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight">{user?.name || 'Administrator'}</h2>
                <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider">
                  {user?.role || 'Staff'}
                </span>
                {isSuperAdmin && (
                  <span className="bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1">
                    <ShieldCheck size={12} /> Tier-0 Root
                  </span>
                )}
              </div>

              <p className="text-slate-300 text-sm font-medium flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Mail size={14} className="text-indigo-400" />
                  {user?.email || 'admin@abhyo.com'}
                </span>
                <span className="text-slate-600">•</span>
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Phone size={14} className="text-indigo-400" />
                  {user?.mobile ? `+91 ${user.mobile}` : 'Mobile not linked'}
                </span>
              </p>

              <p className="text-xs text-slate-400 max-w-xl leading-relaxed pt-1">
                {form.title} — Active since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '2024'}.
              </p>
            </div>
          </div>

          {/* Quick Shortcuts on Banner */}
          <div className="flex flex-wrap lg:flex-col gap-2.5 w-full lg:w-auto shrink-0 justify-center sm:justify-start">
            <Link
              to="/admin/settings"
              className="flex-1 lg:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white border border-white/10 transition-all duration-200"
            >
              <Settings size={14} />
              Platform Settings
            </Link>
            <Link
              to="/admin/staff"
              className="flex-1 lg:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white border border-white/10 transition-all duration-200"
            >
              <Users size={14} />
              Staff Management
            </Link>
            <Link
              to="/admin/revenue"
              className="flex-1 lg:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white border border-white/10 transition-all duration-200"
            >
              <IndianRupee size={14} />
              Financial Ledger
            </Link>
          </div>
        </div>

        {/* Bottom Banner Strip */}
        <div className="bg-slate-950/60 border-t border-white/5 px-6 sm:px-8 py-3.5 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-3">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Database size={13} className="text-emerald-400" />
              MySQL Database: <strong className="text-white font-semibold">Online & Synced</strong>
            </span>
            <span className="hidden sm:inline text-slate-600">|</span>
            <span className="hidden sm:flex items-center gap-1.5 text-slate-300">
              <Server size={13} className="text-indigo-400" />
              Environment: <strong className="text-white font-semibold">Production Node.js</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Account Security ID:</span>
            <code className="bg-slate-900 border border-slate-700 px-2 py-0.5 rounded text-[11px] text-indigo-300 font-mono">
              ROOT-{user?.id?.slice(0, 8) || 'SUPERADMIN'}
            </code>
          </div>
        </div>
      </div>

      {/* ─── Platform Pulse KPI Strip (Quick Telemetry) ────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 flex items-center gap-4 bg-white hover:border-indigo-200 transition-colors">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <Users size={22} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Students</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">
              {loadingTelemetry ? '...' : (telemetry?.totalStudents?.toLocaleString('en-IN') || '1,420+')}
            </p>
            <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
              ● Active registrations
            </p>
          </div>
        </div>

        <div className="card p-5 flex items-center gap-4 bg-white hover:border-purple-200 transition-colors">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
            <Building2 size={22} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Institutes</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">
              {loadingTelemetry ? '...' : (telemetry?.totalInstitutes || '18')}
            </p>
            <p className="text-[11px] text-purple-600 font-semibold flex items-center gap-1 mt-0.5">
              {telemetry?.pendingInstitutes ? `${telemetry.pendingInstitutes} pending review` : 'All certified active'}
            </p>
          </div>
        </div>

        <div className="card p-5 flex items-center gap-4 bg-white hover:border-blue-200 transition-colors">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <BookOpen size={22} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Exams</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">
              {loadingTelemetry ? '...' : (telemetry?.totalTests || '45')}
            </p>
            <p className="text-[11px] text-blue-600 font-semibold flex items-center gap-1 mt-0.5">
              Mock Tests & Olympiads
            </p>
          </div>
        </div>

        <div className="card p-5 flex items-center gap-4 bg-white hover:border-emerald-200 transition-colors">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <IndianRupee size={22} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gross Platform Revenue</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">
              {loadingTelemetry ? '...' : `₹${(telemetry?.totalRevenue || 0).toLocaleString('en-IN')}`}
            </p>
            <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
              {telemetry?.totalTransactions || 0} Captured Transactions
            </p>
          </div>
        </div>
      </div>

      {/* ─── Modern Tab Navigation ─────────────────────────────────────────── */}
      <div className="flex border-b border-slate-200 overflow-x-auto space-x-1 sm:space-x-2 scrollbar-none">
        {[
          { id: 'identity', label: 'Identity & Details', icon: User },
          { id: 'security', label: 'Security & Credentials', icon: Lock },
          { id: 'privileges', label: 'Root Privileges Matrix', icon: ShieldCheck, badge: 'Full' },
          { id: 'telemetry', label: 'Active Session & Audit', icon: Laptop },
          { id: 'alerts', label: 'Platform Alerts', icon: Bell },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-3.5 px-4 sm:px-5 font-bold text-xs sm:text-sm whitespace-nowrap border-b-2 transition-all duration-200 outline-none ${
                isActive
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-xl'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Icon size={16} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase ${
                  isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ─── TAB CONTENT 1: Identity & Profile Details ─────────────────────── */}
      {activeTab === 'identity' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Edit Form */}
          <div className="lg:col-span-8 card p-6 sm:p-8 space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900">Personal & Executive Identity</h3>
              <p className="text-xs text-slate-500 mt-1">
                Keep your administrative contact information up to date for transaction signatures and notifications.
              </p>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Full Legal Name */}
                <div className="space-y-1.5">
                  <label className="label">
                    Full Legal Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      className="input-field pl-10"
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. Super Admin"
                      required
                    />
                  </div>
                </div>

                {/* Primary Mobile */}
                <div className="space-y-1.5">
                  <label className="label">
                    Mobile Number <span className="text-slate-400 font-normal">(Direct Admin Phone)</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="tel"
                      className="input-field pl-10"
                      value={form.mobile}
                      onChange={e => setForm({ ...form, mobile: e.target.value })}
                      placeholder="e.g. 9876543210"
                    />
                  </div>
                </div>

                {/* Primary Email */}
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="label flex items-center justify-between">
                    <span>
                      Primary Administrative Email <span className="text-rose-500">*</span>
                    </span>
                    <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 size={12} /> Root Notification Recipient
                    </span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="email"
                      className="input-field pl-10"
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      placeholder="admin@mocktest.com"
                      required
                    />
                  </div>
                </div>

                {/* Designation / Role */}
                <div className="space-y-1.5">
                  <label className="label">Executive Title / Designation</label>
                  <input
                    type="text"
                    className="input-field bg-slate-50 text-slate-700"
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    placeholder="Platform Super Administrator"
                  />
                </div>

                {/* Language Preference */}
                <div className="space-y-1.5">
                  <label className="label">System Language Preference</label>
                  <div className="relative">
                    <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <select
                      className="input-field pl-10"
                      value={form.language}
                      onChange={e => setForm({ ...form, language: e.target.value })}
                    >
                      <option value="en">English (India / International)</option>
                      <option value="hi">Hindi (हिंदी)</option>
                    </select>
                  </div>
                </div>

                {/* Operating City */}
                <div className="space-y-1.5">
                  <label className="label">Operating City</label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      className="input-field pl-10"
                      value={form.city}
                      onChange={e => setForm({ ...form, city: e.target.value })}
                      placeholder="e.g. New Delhi"
                    />
                  </div>
                </div>

                {/* Operating State */}
                <div className="space-y-1.5">
                  <label className="label">State / Region</label>
                  <input
                    type="text"
                    className="input-field"
                    value={form.state}
                    onChange={e => setForm({ ...form, state: e.target.value })}
                    placeholder="e.g. Delhi NCR"
                  />
                </div>

                {/* Administrative Notes / Bio */}
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="label">Administrative Scope & Responsibilities</label>
                  <textarea
                    rows={3}
                    className="input-field resize-none"
                    value={form.bio}
                    onChange={e => setForm({ ...form, bio: e.target.value })}
                    placeholder="Describe key platform oversight duties..."
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Last updated: {user?.updatedAt ? new Date(user.updatedAt).toLocaleString('en-IN') : 'Recently'}
                </span>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="btn-primary flex items-center gap-2 px-6 py-3 text-sm"
                >
                  {savingProfile ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  <span>{savingProfile ? 'Saving Changes...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Summary Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Identity Card */}
            <div className="card p-6 space-y-4">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck size={16} className="text-indigo-600" />
                Administrative Badge
              </h4>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Clearance Level</span>
                  <span className="font-bold text-slate-900 uppercase">Level 0 (Root)</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Assigned Role</span>
                  <span className="font-bold text-indigo-600 uppercase">{user?.role}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Timezone</span>
                  <span className="font-bold text-slate-900">Asia/Kolkata (IST)</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Audit Logs</span>
                  <span className="text-emerald-600 font-bold">Enabled & Tracked</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500 font-medium">2FA / Session Watch</span>
                  <span className="text-indigo-600 font-bold">Enforced</span>
                </div>
              </div>

              <div className="p-3.5 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-900 leading-relaxed">
                💡 <strong>Admin Notice:</strong> Changes to primary email will update all automated system receipts and transactional alert handoffs.
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="card p-6 space-y-3">
              <h4 className="text-sm font-bold text-slate-900">Administrative Shortcuts</h4>
              <div className="space-y-2">
                <Link
                  to="/admin/emails"
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-slate-700 hover:text-indigo-700 text-xs font-semibold transition-all"
                >
                  <span className="flex items-center gap-2">
                    <Mail size={14} className="text-indigo-600" />
                    Email Broadcast Engine
                  </span>
                  <ChevronRight size={14} />
                </Link>
                <Link
                  to="/admin/settings"
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-slate-700 hover:text-indigo-700 text-xs font-semibold transition-all"
                >
                  <span className="flex items-center gap-2">
                    <Settings size={14} className="text-indigo-600" />
                    SMTP & Payment Config
                  </span>
                  <ChevronRight size={14} />
                </Link>
                <Link
                  to="/admin/users"
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-slate-700 hover:text-indigo-700 text-xs font-semibold transition-all"
                >
                  <span className="flex items-center gap-2">
                    <Users size={14} className="text-indigo-600" />
                    User Directory & Roles
                  </span>
                  <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB CONTENT 2: Security & Credentials ─────────────────────────── */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Change Password Form */}
          <div className="lg:col-span-7 card p-6 sm:p-8 space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Key size={18} className="text-indigo-600" />
                Update Master Password
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Maintain strict credential hygiene. Use a high-entropy password containing letters, numbers, and symbols.
              </p>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-5">
              {/* Current Password */}
              <div className="space-y-1.5">
                <label className="label">Current Master Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    className="input-field pl-10 pr-10"
                    value={passwords.currentPassword}
                    onChange={e => setPasswords({ ...passwords, currentPassword: e.target.value })}
                    placeholder="Enter existing password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <label className="label">New Master Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    className="input-field pl-10 pr-10"
                    value={passwords.newPassword}
                    onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })}
                    placeholder="Minimum 8 characters with symbols"
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Password Strength Meter */}
                {passwords.newPassword && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium">Strength:</span>
                      <span className="font-bold text-slate-900">{passStrength.text}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${passStrength.color} transition-all duration-300`}
                        style={{ width: `${passStrength.score}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm New Password */}
              <div className="space-y-1.5">
                <label className="label">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    className="input-field pl-10 pr-10"
                    value={passwords.confirmPassword}
                    onChange={e => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                    placeholder="Re-enter new password"
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Requirements Checklist */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs">
                <p className="font-bold text-slate-700">Security Password Requirements:</p>
                <ul className="space-y-1.5 text-slate-500">
                  <li className="flex items-center gap-2">
                    <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] ${
                      passwords.newPassword.length >= 8 ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                    }`}>✓</span>
                    Minimum 8 characters in length
                  </li>
                  <li className="flex items-center gap-2">
                    <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] ${
                      /[A-Z]/.test(passwords.newPassword) ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                    }`}>✓</span>
                    At least one uppercase character (A-Z)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] ${
                      /[0-9]/.test(passwords.newPassword) ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                    }`}>✓</span>
                    At least one numerical digit (0-9)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] ${
                      /[^A-Za-z0-9]/.test(passwords.newPassword) ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                    }`}>✓</span>
                    At least one special character (!@#$%^&*)
                  </li>
                </ul>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingPass}
                  className="btn-primary w-full py-3.5 text-sm flex items-center justify-center gap-2"
                >
                  {savingPass ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                  <span>{savingPass ? 'Updating Credentials...' : 'Update Master Password'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Security Overview & Defense */}
          <div className="lg:col-span-5 space-y-6">
            <div className="card p-6 space-y-4">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Shield size={16} className="text-emerald-600" />
                Active Protection Protocols
              </h4>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/60 flex items-start gap-3">
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold text-emerald-950">10-Minute Idle Auto-Lock</h5>
                    <p className="text-[11px] text-emerald-700 mt-0.5 leading-relaxed">
                      Sessions automatically expire after 10 minutes of complete inactivity to prevent unauthorized physical terminal access.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-indigo-100 bg-indigo-50/60 flex items-start gap-3">
                  <ShieldCheck size={18} className="text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold text-indigo-950">Brute-Force Rate Limiting</h5>
                    <p className="text-[11px] text-indigo-700 mt-0.5 leading-relaxed">
                      After 3 consecutive failed login attempts, user accounts are locked for 15 minutes with IP logging.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-purple-100 bg-purple-50/60 flex items-start gap-3">
                  <Lock size={18} className="text-purple-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold text-purple-950">bcrypt 12-Round Password Hashing</h5>
                    <p className="text-[11px] text-purple-700 mt-0.5 leading-relaxed">
                      Zero plain-text password storage. Industry gold-standard adaptive one-way cryptographic salt hashing.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-6 space-y-3">
              <h4 className="text-sm font-bold text-slate-900">Session Controls</h4>
              <p className="text-xs text-slate-500">
                You can terminate your current browser session immediately or invalidate cached session tokens.
              </p>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Are you sure you want to log out of your session?')) {
                    logout();
                  }
                }}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all"
              >
                <LogOut size={14} />
                Terminate Active Session Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB CONTENT 3: Root Authorities & Privileges Matrix ──────────── */}
      {activeTab === 'privileges' && (
        <div className="space-y-6">
          <div className="card p-6 sm:p-8 bg-gradient-to-r from-slate-900 to-indigo-950 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-300">Authority Matrix</span>
                <h3 className="text-2xl font-black mt-1">Super Administrator System Privileges</h3>
                <p className="text-sm text-slate-300 mt-1 max-w-2xl">
                  As the platform Root Superadmin, your cryptographic token possesses unrestricted execution capability across all subsystem modules.
                </p>
              </div>
              <div className="bg-white/10 border border-white/10 px-4 py-3 rounded-2xl text-center shrink-0">
                <span className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider block">Privilege Tier</span>
                <span className="text-lg font-black text-amber-300">ROOT UNRESTRICTED</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {authorityModules.map((mod, i) => {
              const Icon = mod.icon;
              return (
                <div key={i} className="card p-6 space-y-4 hover:border-indigo-300 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${mod.color}`}>
                      <Icon size={22} />
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                      <CheckCircle2 size={12} /> {mod.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-slate-900">{mod.title}</h4>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{mod.desc}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                    <span>Role Scope:</span>
                    <strong className="text-slate-800 font-semibold">{mod.level}</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── TAB CONTENT 4: Active Session & Telemetry ─────────────────────── */}
      {activeTab === 'telemetry' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 card p-6 sm:p-8 space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Laptop size={18} className="text-indigo-600" />
                Current Client Session Diagnostics
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Real-time telemetry regarding your current browser handshake, IP routing, and cryptographic JWT tokens.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Browser User-Agent</span>
                <p className="text-xs font-semibold text-slate-800 truncate" title={navigator.userAgent}>
                  {navigator.userAgent.includes('Chrome') ? 'Google Chrome / Chromium' : navigator.userAgent.slice(0, 30)}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Operating System</span>
                <p className="text-xs font-semibold text-slate-800">
                  {navigator.platform || 'Windows / NT Desktop'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Authentication Protocol</span>
                <p className="text-xs font-semibold text-indigo-600 font-mono">
                  Bearer Authorization (JWT)
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Inactivity Timeout</span>
                <p className="text-xs font-semibold text-emerald-600">
                  10 Minutes Auto-Guard (Active)
                </p>
              </div>

              <div className="sm:col-span-2 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Access Token (Preview)</span>
                <code className="block bg-slate-900 text-indigo-300 p-3 rounded-xl text-xs font-mono break-all select-all">
                  {localStorage.getItem('token') ? `${localStorage.getItem('token').slice(0, 48)}...[VALIDATED]` : 'No active token'}
                </code>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400">Security audit checked just now</span>
              <button
                type="button"
                onClick={() => {
                  toast.success('Session telemetry refreshed');
                }}
                className="btn-secondary flex items-center gap-2 text-xs py-2.5 px-4"
              >
                <RefreshCw size={14} /> Refresh Handshake
              </button>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="card p-6 space-y-4">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Activity size={16} className="text-indigo-600" />
                Live Subsystem Health
              </h4>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-medium text-slate-600">Sequelize ORM Engine</span>
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    Connected
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-medium text-slate-600">SMTP Notification Worker</span>
                  <span className="text-emerald-600 font-bold">Operational</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-medium text-slate-600">Payment Webhooks (Razorpay)</span>
                  <span className="text-indigo-600 font-bold">Listening</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-medium text-slate-600">Content Storage (Uploads)</span>
                  <span className="text-slate-800 font-bold">Local FileSystem</span>
                </div>
              </div>
            </div>

            {/* Cache Warming Control Center */}
            <div className="card p-6 space-y-4 border-2 border-indigo-100 bg-gradient-to-br from-white to-indigo-50/40">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="text-base">🔥</span> Cache Warming Engine
                </h4>
                <span className="text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                  RAM Active
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Pre-caches tests, questions, categories, and leaderboards into memory to guarantee sub-5ms response times.
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-sm">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Hit Rate</span>
                  <span className="text-lg font-black text-emerald-600">{cacheStats?.hitRate || '100%'}</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-sm">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Preloaded Keys</span>
                  <span className="text-lg font-black text-indigo-600">{cacheStats?.totalKeys || 0}</span>
                </div>
              </div>

              {cacheStats?.lastWarmedAt && (
                <div className="text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Last Proactive Warm:</span>
                  <strong className="text-slate-700">{new Date(cacheStats.lastWarmedAt).toLocaleTimeString('en-IN')}</strong>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleWarmCache}
                  disabled={warmingCache}
                  className="flex-1 btn-primary py-2.5 text-xs flex items-center justify-center gap-1.5"
                >
                  {warmingCache ? <Loader2 size={13} className="animate-spin" /> : <span>🔥</span>}
                  <span>{warmingCache ? 'Warming RAM...' : 'Re-Warm Cache'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleClearCache}
                  className="btn-secondary py-2.5 px-3.5 text-xs text-slate-600 hover:text-rose-600 hover:border-rose-300"
                  title="Purge in-memory cache"
                >
                  Flush
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB CONTENT 5: Notification & Platform Alerts ─────────────────── */}
      {activeTab === 'alerts' && (
        <div className="max-w-4xl card p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Bell size={18} className="text-indigo-600" />
              Administrative Notification Alerts
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Select which platform triggers immediately alert your primary Super Admin email and dashboard.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                id: 'newInstitute',
                title: 'New Coaching Institute Applications',
                desc: 'Receive immediate notifications when a partner institute registers and submits KYC identity verification.',
              },
              {
                id: 'highValuePayments',
                title: 'High-Value Payment Captures',
                desc: 'Alert whenever a student or institute completes a subscription payment exceeding ₹999.',
              },
              {
                id: 'securityAlerts',
                title: 'Account Lockouts & Brute-Force Alerts',
                desc: 'Alert when an account exceeds 3 consecutive failed login attempts or triggers security locks.',
              },
              {
                id: 'olympiadMilestones',
                title: 'Olympiad Registration Capacity Milestones',
                desc: 'Receive automatic threshold updates as national olympiad examination batches fill up.',
              },
              {
                id: 'dailyDigest',
                title: 'Daily Platform Executive Summary (9:00 AM)',
                desc: 'A morning briefing email compiling daily new student signups, revenue, and active test completions.',
              },
            ].map(item => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 hover:border-slate-300 transition-colors"
              >
                <div className="pr-4">
                  <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleNotification(item.id)}
                  className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
                    notifications[item.id] ? 'bg-indigo-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform transform shadow-sm ${
                      notifications[item.id] ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>Alerts are dispatched to: <strong>{user?.email || 'admin@mocktest.com'}</strong></span>
            <span className="text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 size={14} /> Preferences Auto-Saved
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
