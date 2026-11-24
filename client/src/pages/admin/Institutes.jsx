import React, { useEffect, useState } from 'react';
import {
  CheckCircle, XCircle, Clock, Search, Building2, Users,
  Eye, Edit3, Globe, Star, ToggleLeft, ToggleRight,
  Layout, Plus, Trash2, Save, RefreshCw, ExternalLink,
  ChevronDown, ChevronUp, Award, Image, Phone, MapPin, Link2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../lib/api';
import ExportButtons from '../../components/shared/ExportButtons';

const statusConfig = {
  pending: { label: 'Pending', class: 'badge-warning', icon: Clock },
  approved: { label: 'Approved', class: 'badge-success', icon: CheckCircle },
  rejected: { label: 'Rejected', class: 'badge-danger', icon: XCircle },
  suspended: { label: 'Suspended', class: 'badge-danger', icon: XCircle },
};

const getPlanBadge = (planName) => {
  if (!planName) return 'bg-slate-200 text-slate-600';
  const name = String(planName).toLowerCase();
  if (name.includes('free')) return 'bg-slate-200 text-slate-600';
  if (name.includes('basic') || name.includes('starter')) return 'bg-blue-500/20 text-blue-700';
  if (name.includes('pro') || name.includes('advanced')) return 'bg-purple-500/20 text-purple-700';
  if (name.includes('enterprise') || name.includes('premium')) return 'bg-amber-500/20 text-amber-700';
  return 'bg-emerald-500/20 text-emerald-700';
};

const CLIENT_URL = import.meta.env.VITE_CLIENT_URL || 'http://localhost:5173';

export default function AdminInstitutes() {
  const [institutes, setInstitutes] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showLandingModal, setShowLandingModal] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchInstitutes = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (filter !== 'all') params.status = filter;
      if (search) params.search = search;
      const res = await api.get('/admin/institutes', { params });
      setInstitutes(res.data.data);
      setTotal(res.data.pagination?.total || 0);
    } catch {
      toast.error('Failed to load institutes');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const res = await api.get('/plans/public?type=institute');
      setPlans(res.data.data || []);
    } catch (err) {
      console.error('Failed to load plans', err);
    }
  };

  useEffect(() => { fetchInstitutes(); fetchPlans(); }, [filter, search, page]);

  const handleApprove = async (id) => {
    try {
      await api.patch(`/admin/institutes/${id}/approve`);
      toast.success('Institute approved! ✅');
      fetchInstitutes();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to approve');
    }
  };

  const handleReject = async (id, reason) => {
    try {
      await api.patch(`/admin/institutes/${id}/reject`, { reason });
      toast.success('Institute rejected');
      fetchInstitutes();
      setShowModal(false);
    } catch {
      toast.error('Failed to reject');
    }
  };

  const handleUpdateSubscription = async (id, plan) => {
    try {
      await api.put(`/admin/institutes/${id}/subscription`, { plan });
      toast.success('Subscription updated');
      fetchInstitutes();
    } catch {
      toast.error('Failed to update subscription');
    }
  };

  const handleToggleLanding = async (inst) => {
    try {
      const res = await api.patch(`/admin/institutes/${inst.id}/toggle-landing`);
      const enabled = res.data.data.isLandingEnabled;
      toast.success(enabled ? '🌐 Landing page published!' : 'Landing page hidden');
      fetchInstitutes();
    } catch {
      toast.error('Failed to toggle landing page');
    }
  };

  const handleToggleFeatured = async (inst) => {
    try {
      const res = await api.patch(`/admin/institutes/${inst.id}/toggle-featured`);
      const featured = res.data.data.isFeatured;
      toast.success(featured ? '⭐ Marked as Featured!' : 'Removed from Featured');
      fetchInstitutes();
    } catch {
      toast.error('Failed to toggle featured');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-header">🏫 Institutes</h1>
          <p className="section-subheader">Manage coaching institute accounts & landing pages ({total} total)</p>
        </div>
        <div className="flex gap-3">
          <ExportButtons 
            data={institutes} 
            filename="institutes_report" 
            title="Registered Institutes Report" 
            headers={['Institute', 'Email', 'Owner', 'Status', 'Plan', 'Students', 'Joined']}
            pdfDataMapping={(inst) => [
              inst.name,
              inst.email,
              inst.owner?.name || '-',
              inst.status,
              inst.subscriptionPlan || 'free',
              `${inst.totalStudents || 0} / ${inst.maxStudents || 50}`,
              new Date(inst.createdAt).toLocaleDateString('en-IN')
            ]}
          />
          <a href={`${CLIENT_URL}/institutes`} target="_blank" rel="noopener noreferrer"
            className="btn-secondary flex items-center gap-2 text-sm">
            <Globe size={14} /> View Public Page
          </a>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search institutes..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="input-field !pl-9"
          />
        </div>
        <div className="flex bg-slate-100 rounded-xl p-1 gap-0.5">
          {['all', 'pending', 'approved', 'rejected'].map(s => (
            <button
              key={s}
              onClick={() => { setFilter(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
                filter === s ? 'bg-primary-600 text-white' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200/80">
                {['Institute', 'Owner', 'Status', 'Plan', 'Students', 'Landing', 'Featured', 'Actions'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-4 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="table-row">
                    {[...Array(8)].map((_, j) => (
                      <td key={j} className="px-5 py-4"><div className="skeleton h-4 w-24" /></td>
                    ))}
                  </tr>
                ))
              ) : institutes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-slate-400 py-12">No institutes found</td>
                </tr>
              ) : institutes.map(inst => {
                const status = statusConfig[inst.status] || statusConfig.pending;
                return (
                  <tr key={inst.id} className="table-row">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center text-slate-900 font-semibold text-sm flex-shrink-0">
                          {inst.name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 text-sm">{inst.name}</p>
                          <p className="text-xs text-slate-500">{inst.email}</p>
                          {inst.slug && (
                            <p className="text-xs text-primary-500 mt-0.5 font-mono">/{inst.slug}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-slate-600">{inst.owner?.name || '—'}</p>
                      <p className="text-xs text-slate-400">{inst.owner?.email || '—'}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={status.class}>{status.label}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`badge ${getPlanBadge(inst.subscriptionPlan)} capitalize`}>
                        {inst.subscriptionPlan || 'free'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {inst.totalStudents || 0} / {inst.maxStudents || 50}
                    </td>
                    {/* Landing Toggle */}
                    <td className="px-5 py-4">
                      <button
                        onClick={() => handleToggleLanding(inst)}
                        title={inst.isLandingEnabled ? 'Landing published — click to hide' : 'Landing hidden — click to publish'}
                        className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                          inst.isLandingEnabled
                            ? 'bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {inst.isLandingEnabled ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                        {inst.isLandingEnabled ? 'Live' : 'Off'}
                      </button>
                    </td>
                    {/* Featured Toggle */}
                    <td className="px-5 py-4">
                      <button
                        onClick={() => handleToggleFeatured(inst)}
                        title={inst.isFeatured ? 'Featured — click to unfeature' : 'Not featured — click to feature'}
                        className={`p-1.5 rounded-lg transition-all ${
                          inst.isFeatured
                            ? 'text-amber-500 bg-amber-50 hover:bg-amber-100'
                            : 'text-slate-300 bg-slate-50 hover:bg-slate-100'
                        }`}
                      >
                        <Star size={15} fill={inst.isFeatured ? 'currentColor' : 'none'} />
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        {inst.status === 'pending' && (
                          <>
                            <button onClick={() => handleApprove(inst.id)}
                              className="p-1.5 bg-emerald-500/20 text-emerald-600 hover:bg-emerald-500/30 rounded-lg transition-colors" title="Approve">
                              <CheckCircle size={15} />
                            </button>
                            <button onClick={() => { setSelected(inst); setShowModal(true); }}
                              className="p-1.5 bg-red-500/20 text-red-500 hover:bg-red-500/30 rounded-lg transition-colors" title="Reject">
                              <XCircle size={15} />
                            </button>
                          </>
                        )}

                        {/* Manage Landing Button */}
                        <button
                          onClick={() => { setSelected(inst); setShowLandingModal(true); }}
                          className="p-1.5 bg-primary-500/15 text-primary-600 hover:bg-primary-500/25 rounded-lg transition-colors" title="Manage Landing Page"
                        >
                          <Layout size={15} />
                        </button>
                        {inst.isLandingEnabled && inst.slug && (
                          <a href={`${CLIENT_URL}/i/${inst.slug}`} target="_blank" rel="noopener noreferrer"
                            className="p-1.5 bg-blue-500/15 text-blue-600 hover:bg-blue-500/25 rounded-lg transition-colors" title="View Landing Page">
                            <ExternalLink size={15} />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 20 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200">
            <p className="text-xs text-slate-500">Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, total)} of {total}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="btn-secondary !px-3 !py-1.5 !text-sm disabled:opacity-40">Prev</button>
              <button onClick={() => setPage(p => p + 1)} disabled={page * 20 >= total}
                className="btn-secondary !px-3 !py-1.5 !text-sm disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showModal && selected && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 mb-4">Reject Institute</h3>
            <p className="text-slate-500 text-sm mb-4">Rejecting: <strong className="text-slate-900">{selected.name}</strong></p>
            <RejectForm onReject={(reason) => handleReject(selected.id, reason)} onCancel={() => setShowModal(false)} />
          </div>
        </div>
      )}

      {/* Landing Page Manager Modal */}
      {showLandingModal && selected && (
        <LandingPageModal
          institute={selected}
          onClose={() => { setShowLandingModal(false); setSelected(null); fetchInstitutes(); }}
        />
      )}
    </div>
  );
}

/* ─── Landing Page Manager Modal ──────────────────────────── */
function LandingPageModal({ institute, onClose }) {
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const safeArray = (val) => {
    if (!val) return [];
    if (typeof val === 'string') {
      try { const parsed = JSON.parse(val); return Array.isArray(parsed) ? parsed : []; }
      catch { return []; }
    }
    return Array.isArray(val) ? val : [];
  };

  const safeObject = (val, fb = {}) => {
    if (!val) return fb;
    if (typeof val === 'string') {
      try { const parsed = JSON.parse(val); return (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : fb; }
      catch { return fb; }
    }
    return (val && typeof val === 'object' && !Array.isArray(val)) ? val : fb;
  };

  const parsedAchievements = safeArray(institute.achievements);
  const parsedCourses = safeArray(institute.courses);
  const parsedFaculty = safeArray(institute.faculty);
  const parsedTestimonials = safeArray(institute.testimonials);
  const parsedSocial = safeObject(institute.socialLinks, { facebook: '', twitter: '', youtube: '', instagram: '', linkedin: '' });

  const [form, setForm] = useState({
    slug: institute.slug || institute.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || '',
    tagline: institute.tagline || '',
    bannerImage: institute.bannerImage || '',
    landingBio: institute.landingBio || institute.description || '',
    foundedYear: institute.foundedYear || '',
    phone: institute.phone || institute.mobile || '',
    contactAddress: institute.contactAddress || institute.address || '',
    isLandingEnabled: institute.isLandingEnabled || false,
    isFeatured: institute.isFeatured || false,
    socialLinks: parsedSocial,
    achievements: parsedAchievements.length > 0 ? parsedAchievements : [
      { title: 'Students', value: `${institute.totalStudents || 0}+`, icon: 'users' },
    ],
    courses: parsedCourses,
    faculty: parsedFaculty,
    testimonials: parsedTestimonials,
    logoFile: null,
    bannerFile: null,
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      Object.keys(form).forEach(key => {
        if (key === 'logoFile' || key === 'bannerFile') return;
        if (typeof form[key] === 'object' && form[key] !== null) {
          formData.append(key, JSON.stringify(form[key]));
        } else {
          formData.append(key, form[key] !== undefined && form[key] !== null ? form[key] : '');
        }
      });
      
      if (form.logoFile) formData.append('logo', form.logoFile);
      if (form.bannerFile) formData.append('banner', form.bannerFile);

      await api.put(`/admin/institutes/${institute.id}/landing`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Landing page saved! 🎉');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const CLIENT_URL = import.meta.env.VITE_CLIENT_URL || 'http://localhost:5173';
  const previewUrl = `${CLIENT_URL}/i/${form.slug || 'preview'}`;

  const tabs = [
    { id: 'basic', label: '📝 Basic Info' },
    { id: 'achievements', label: '🏆 Stats' },
    { id: 'courses', label: '📚 Courses' },
    { id: 'faculty', label: '👨‍🏫 Faculty' },
    { id: 'testimonials', label: '💬 Reviews' },
    { id: 'social', label: '🔗 Social' },
  ];

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content !max-w-3xl !max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Layout size={18} className="text-primary-500" />
              Landing Page: {institute.name}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Configure the public-facing institute page</p>
          </div>
          <div className="flex items-center gap-2">
            {form.slug && (
              <a href={previewUrl} target="_blank" rel="noopener noreferrer"
                className="btn-secondary !px-3 !py-1.5 !text-xs flex items-center gap-1">
                <ExternalLink size={12} /> Preview
              </a>
            )}
            <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2">
              <span className="text-xs font-medium text-slate-600">Published</span>
              <button
                onClick={() => set('isLandingEnabled', !form.isLandingEnabled)}
                className={`relative w-10 h-5 rounded-full transition-colors ${form.isLandingEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isLandingEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 py-3 border-b border-slate-100 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === t.id ? 'bg-primary-100 text-primary-700' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 py-4 space-y-4">

          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">URL Slug <span className="text-slate-400 font-normal">(auto-generated)</span></label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">/</span>
                    <input value={form.slug} onChange={e => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      className="input-field !pl-5" placeholder="institute-name" />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{CLIENT_URL}/institute/{form.slug || 'your-slug'}</p>
                </div>
                <div>
                  <label className="label">Founded Year</label>
                  <input type="number" value={form.foundedYear} onChange={e => set('foundedYear', e.target.value)}
                    className="input-field" placeholder="e.g. 2010" min={1900} max={2025} />
                </div>
              </div>

              <div>
                <label className="label">Tagline <span className="text-slate-400 font-normal">(shown below institute name)</span></label>
                <input value={form.tagline} onChange={e => set('tagline', e.target.value)}
                  className="input-field" placeholder="e.g. India's #1 destination for UPSC preparation" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Institute Logo <span className="text-slate-400 font-normal">(upload image)</span></label>
                  <input type="file" accept="image/*" onChange={e => set('logoFile', e.target.files[0])}
                    className="input-field cursor-pointer text-sm" />
                  {form.logoFile ? (
                    <img src={URL.createObjectURL(form.logoFile)} alt="logo preview" className="mt-2 rounded-xl h-24 w-24 object-cover border border-slate-200" />
                  ) : institute.logo ? (
                    <img src={institute.logo.startsWith('http') ? institute.logo : `${CLIENT_URL.replace('5173', '5000')}/uploads/${institute.logo}`} alt="current logo" className="mt-2 rounded-xl h-24 w-24 object-cover border border-slate-200" />
                  ) : (
                    <p className="text-xs text-slate-400 mt-1">No logo uploaded.</p>
                  )}
                </div>

                <div>
                  <label className="label">Banner Image <span className="text-slate-400 font-normal">(upload image)</span></label>
                  <input type="file" accept="image/*" onChange={e => {
                      set('bannerFile', e.target.files[0]);
                      set('bannerImage', ''); // Clear URL to avoid confusion
                    }} className="input-field cursor-pointer text-sm" />
                  {form.bannerFile ? (
                    <img src={URL.createObjectURL(form.bannerFile)} alt="banner preview" className="mt-2 rounded-xl h-24 w-full object-cover border border-slate-200" />
                  ) : form.bannerImage || institute.bannerImage ? (
                    <img src={(form.bannerImage || institute.bannerImage).startsWith('http') ? (form.bannerImage || institute.bannerImage) : `${CLIENT_URL.replace('5173', '5000')}/uploads/${form.bannerImage || institute.bannerImage}`} alt="current banner" className="mt-2 rounded-xl h-24 w-full object-cover border border-slate-200" />
                  ) : (
                    <p className="text-xs text-slate-400 mt-1">No banner uploaded.</p>
                  )}
                </div>
              </div>

              <div>
                <label className="label">About / Bio <span className="text-slate-400 font-normal">(displayed in About tab)</span></label>
                <textarea value={form.landingBio} onChange={e => set('landingBio', e.target.value)}
                  className="input-field resize-none" rows={4}
                  placeholder="Tell students about your institute, mission, track record..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Contact Phone</label>
                  <input value={form.phone} onChange={e => set('phone', e.target.value)}
                    className="input-field" placeholder="+91 xxxxx xxxxx" />
                </div>
                <div>
                  <label className="label">Mark as Featured</label>
                  <div className="flex items-center gap-3 mt-2">
                    <button onClick={() => set('isFeatured', !form.isFeatured)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${form.isFeatured ? 'bg-amber-400' : 'bg-slate-300'}`}>
                      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isFeatured ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                    <span className="text-sm text-slate-600">{form.isFeatured ? '⭐ Featured' : 'Not featured'}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="label">Contact Address</label>
                <textarea value={form.contactAddress} onChange={e => set('contactAddress', e.target.value)}
                  className="input-field resize-none" rows={2} placeholder="Full address shown to students" />
              </div>
            </div>
          )}

          {/* Achievements / Stats */}
          {activeTab === 'achievements' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">These stats appear as a highlight strip below the banner (e.g. "5000+ Students", "95% Success Rate").</p>
              {form.achievements.map((ach, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <input value={ach.value} placeholder="e.g. 5000+" className="input-field !text-sm"
                      onChange={e => { const a = [...form.achievements]; a[i] = { ...a[i], value: e.target.value }; set('achievements', a); }} />
                    <input value={ach.title} placeholder="e.g. Students" className="input-field !text-sm"
                      onChange={e => { const a = [...form.achievements]; a[i] = { ...a[i], title: e.target.value }; set('achievements', a); }} />
                  </div>
                  <button onClick={() => set('achievements', form.achievements.filter((_, j) => j !== i))}
                    className="p-2 text-red-400 hover:bg-red-50 rounded-lg mt-1"><Trash2 size={14} /></button>
                </div>
              ))}
              <button onClick={() => set('achievements', [...form.achievements, { title: '', value: '' }])}
                className="btn-secondary w-full flex items-center justify-center gap-2 !text-sm">
                <Plus size={14} /> Add Stat
              </button>
            </div>
          )}

          {/* Courses */}
          {activeTab === 'courses' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">Add courses offered by this institute.</p>
              {form.courses.map((c, i) => (
                <div key={i} className="flex gap-3 items-start border border-slate-200 rounded-xl p-3">
                  <div className="flex-1 space-y-2">
                    <input value={c.name} placeholder="Course name (e.g. UPSC CSE 2026)" className="input-field !text-sm"
                      onChange={e => { const a = [...form.courses]; a[i] = { ...a[i], name: e.target.value }; set('courses', a); }} />
                    <input value={c.description || ''} placeholder="Short description" className="input-field !text-sm"
                      onChange={e => { const a = [...form.courses]; a[i] = { ...a[i], description: e.target.value }; set('courses', a); }} />
                  </div>
                  <button onClick={() => set('courses', form.courses.filter((_, j) => j !== i))}
                    className="p-2 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                </div>
              ))}
              <button onClick={() => set('courses', [...form.courses, { name: '', description: '' }])}
                className="btn-secondary w-full flex items-center justify-center gap-2 !text-sm">
                <Plus size={14} /> Add Course
              </button>
            </div>
          )}

          {/* Faculty */}
          {activeTab === 'faculty' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">Highlight the faculty members.</p>
              {form.faculty.map((f, i) => (
                <div key={i} className="flex gap-3 items-start border border-slate-200 rounded-xl p-3">
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <input value={f.name} placeholder="Full name" className="input-field !text-sm"
                      onChange={e => { const a = [...form.faculty]; a[i] = { ...a[i], name: e.target.value }; set('faculty', a); }} />
                    <input value={f.designation || ''} placeholder="Designation (e.g. Sr. Faculty – History)" className="input-field !text-sm"
                      onChange={e => { const a = [...form.faculty]; a[i] = { ...a[i], designation: e.target.value }; set('faculty', a); }} />
                    <input value={f.photo || ''} placeholder="Photo URL (optional)" className="input-field !text-sm col-span-2"
                      onChange={e => { const a = [...form.faculty]; a[i] = { ...a[i], photo: e.target.value }; set('faculty', a); }} />
                  </div>
                  <button onClick={() => set('faculty', form.faculty.filter((_, j) => j !== i))}
                    className="p-2 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                </div>
              ))}
              <button onClick={() => set('faculty', [...form.faculty, { name: '', designation: '', photo: '' }])}
                className="btn-secondary w-full flex items-center justify-center gap-2 !text-sm">
                <Plus size={14} /> Add Faculty Member
              </button>
            </div>
          )}

          {/* Testimonials */}
          {activeTab === 'testimonials' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">Add student success stories and reviews.</p>
              {form.testimonials.map((t, i) => (
                <div key={i} className="border border-slate-200 rounded-xl p-3 space-y-2">
                  <div className="flex gap-2">
                    <input value={t.name} placeholder="Student name" className="input-field !text-sm flex-1"
                      onChange={e => { const a = [...form.testimonials]; a[i] = { ...a[i], name: e.target.value }; set('testimonials', a); }} />
                    <input value={t.year || ''} placeholder="Year (e.g. 2024)" className="input-field !text-sm w-28"
                      onChange={e => { const a = [...form.testimonials]; a[i] = { ...a[i], year: e.target.value }; set('testimonials', a); }} />
                    <input value={t.score || ''} placeholder="Score / Rank" className="input-field !text-sm w-32"
                      onChange={e => { const a = [...form.testimonials]; a[i] = { ...a[i], score: e.target.value }; set('testimonials', a); }} />
                    <button onClick={() => set('testimonials', form.testimonials.filter((_, j) => j !== i))}
                      className="p-2 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                  </div>
                  <textarea value={t.text || ''} placeholder="What they said about the institute..." rows={2}
                    className="input-field !text-sm resize-none w-full"
                    onChange={e => { const a = [...form.testimonials]; a[i] = { ...a[i], text: e.target.value }; set('testimonials', a); }} />
                </div>
              ))}
              <button onClick={() => set('testimonials', [...form.testimonials, { name: '', text: '', year: '', score: '' }])}
                className="btn-secondary w-full flex items-center justify-center gap-2 !text-sm">
                <Plus size={14} /> Add Testimonial
              </button>
            </div>
          )}

          {/* Social */}
          {activeTab === 'social' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">Add social media links for the institute.</p>
              {['facebook', 'twitter', 'youtube', 'instagram', 'linkedin'].map(platform => (
                <div key={platform} className="flex items-center gap-3">
                  <div className="w-24 text-sm font-medium text-slate-600 capitalize">{platform}</div>
                  <input
                    value={form.socialLinks[platform] || ''}
                    onChange={e => set('socialLinks', { ...form.socialLinks, [platform]: e.target.value })}
                    className="input-field flex-1 !text-sm"
                    placeholder={`https://${platform}.com/your-page`}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 pt-4 border-t border-slate-200">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? 'Saving...' : 'Save Landing Page'}
          </button>
        </div>
      </div>
    </div>
  );
}

function RejectForm({ onReject, onCancel }) {
  const [reason, setReason] = useState('');
  return (
    <div className="space-y-4">
      <div>
        <label className="label">Rejection Reason</label>
        <textarea value={reason} onChange={e => setReason(e.target.value)}
          className="input-field resize-none" rows={3} placeholder="Provide reason for rejection..." />
      </div>
      <div className="flex gap-3">
        <button onClick={() => onReject(reason)} className="btn-danger flex-1">Reject</button>
        <button onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
      </div>
    </div>
  );
}
