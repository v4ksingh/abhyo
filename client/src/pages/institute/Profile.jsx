import React, { useEffect, useState } from 'react';
import { Building2, Save, Loader2, Layout, Plus, Trash2, ExternalLink } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../lib/api';
import { getImageUrl } from '../../lib/imageUrl';

export default function InstituteProfile() {
  const [institute, setInstitute] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [uploadProgress, setUploadProgress] = useState({});

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = () => {
    setLoading(true);
    api.get('/institute/profile')
      .then(res => {
        const data = res.data.data;
        setInstitute(data);

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

        const parsedAchievements = safeArray(data.achievements);

        setForm({
          ...data,
          slug: data.slug || data.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || '',
          tagline: data.tagline || '',
          landingBio: data.landingBio || data.description || '',
          foundedYear: data.foundedYear || '',
          phone: data.phone || data.mobile || '',
          contactAddress: data.contactAddress || data.address || '',
          isLandingEnabled: data.isLandingEnabled || false,
          socialLinks: safeObject(data.socialLinks, { facebook: '', twitter: '', youtube: '', instagram: '', linkedin: '' }),
          achievements: parsedAchievements.length > 0 ? parsedAchievements : [
            { title: 'Students', value: `${data.totalStudents || 0}+`, icon: 'users' },
          ],
          courses: safeArray(data.courses),
          faculty: safeArray(data.faculty),
          testimonials: safeArray(data.testimonials),
          certificates: safeArray(data.certificates),
          gallery: safeArray(data.gallery),
          logoFile: null,
          bannerFile: null,
        });
      })
      .finally(() => setLoading(false));
  };

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      Object.keys(form).forEach(key => {
        if (key === 'logoFile' || key === 'bannerFile' || key === 'subscription' || key === 'owner') return;
        if (typeof form[key] === 'object' && form[key] !== null) {
          formData.append(key, JSON.stringify(form[key]));
        } else {
          formData.append(key, form[key] !== null && form[key] !== undefined ? form[key] : '');
        }
      });
      if (form.logoFile) formData.append('logo', form.logoFile);
      if (form.bannerFile) formData.append('banner', form.bannerFile);

      await api.put('/institute/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Profile & Landing Page updated!');
      fetchProfile();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="skeleton h-96 max-w-4xl mx-auto mt-6" />;

  const CLIENT_URL = import.meta.env.VITE_CLIENT_URL || 'http://localhost:5173';
  const previewUrl = `${CLIENT_URL}/i/${form.slug || 'preview'}`;

  const tabs = [
    { id: 'basic', label: '📝 Basic Info' },
    { id: 'landing', label: '🌐 Landing Page Settings' },
    { id: 'achievements', label: '🏆 Stats' },
    { id: 'faculty', label: '👨‍🏫 Faculty' },
    { id: 'testimonials', label: '💬 Reviews' },
    { id: 'gallery', label: '📸 Gallery' },
    { id: 'social', label: '🔗 Social Links' },
    { id: 'subscription', label: '📦 Subscription' },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="section-header">🏫 Institute Profile</h1>
          <p className="section-subheader">Manage your institute information and public landing page</p>
        </div>
        <div className="flex items-center gap-3">
          {form.slug && (
            <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary flex items-center gap-2 text-sm !py-2">
              <ExternalLink size={14} /> View Public Page
            </a>
          )}
          <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2 !py-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={15} />} Save Changes
          </button>
        </div>
      </div>

      <div className="card !p-0 overflow-hidden">
        {/* Tabs */}
        <div className="flex px-4 pt-4 border-b border-slate-200 overflow-x-auto no-scrollbar gap-2">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 text-sm font-semibold whitespace-nowrap border-b-2 transition-all ${activeTab === t.id ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-t-lg'
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-6 bg-slate-50/50 min-h-[400px]">
          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-4 max-w-2xl">
              <div><label className="label">Institute Name</label>
                <input type="text" value={form.name || ''} onChange={e => set('name', e.target.value)} className="input-field" />
              </div>
              <div><label className="label">Description</label>
                <textarea value={form.description || ''} onChange={e => set('description', e.target.value)} className="input-field resize-none" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">City</label>
                  <input type="text" value={form.city || ''} onChange={e => set('city', e.target.value)} className="input-field" />
                </div>
                <div><label className="label">State</label>
                  <input type="text" value={form.state || ''} onChange={e => set('state', e.target.value)} className="input-field" />
                </div>
              </div>
              <div><label className="label">Website</label>
                <input type="url" value={form.website || ''} onChange={e => set('website', e.target.value)} className="input-field" placeholder="https://yourinstitute.com" />
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div>
                  <label className="label">
                    Institute Logo (Main)
                    <span className="text-[10px] font-normal text-slate-400 ml-2">(Recommended: 1:1 Square, 512x512px)</span>
                  </label>
                  <input type="file" accept="image/*" onChange={e => set('logoFile', e.target.files[0])} className="input-field cursor-pointer text-sm" />
                  {form.logoFile ? (
                    <img src={URL.createObjectURL(form.logoFile)} alt="logo" className="mt-2 text-sm rounded-xl h-24 w-24 object-cover border border-slate-200" />
                  ) : institute?.logo ? (
                    <img src={getImageUrl(institute.logo)} alt="logo" className="mt-2 rounded-xl h-24 w-24 object-cover border border-slate-200" />
                  ) : (
                    <p className="text-xs text-slate-400 mt-1">No logo uploaded</p>
                  )}
                </div>
                <div>
                  <label className="label">
                    Banner Image (Dashboard & Landing)
                    <span className="text-[10px] font-normal text-slate-400 ml-2">(Recommended: 16:9 Landscape, 1920x1080px)</span>
                  </label>
                  <input type="file" accept="image/*" onChange={e => set('bannerFile', e.target.files[0])} className="input-field cursor-pointer text-sm" />
                  {form.bannerFile ? (
                    <img src={URL.createObjectURL(form.bannerFile)} alt="banner" className="mt-2 rounded-xl h-24 w-full object-cover border border-slate-200" />
                  ) : institute?.bannerImage ? (
                    <img src={getImageUrl(institute.bannerImage)} alt="banner" className="mt-2 rounded-xl h-24 w-full object-cover border border-slate-200" />
                  ) : <p className="text-xs text-slate-400 mt-1">No banner uploaded</p>}
                </div>
              </div>
            </div>
          )}

          {/* Landing Page Settings */}
          {activeTab === 'landing' && (
            <div className="space-y-5 max-w-2xl">
              <div className="p-4 bg-primary-50 rounded-xl border border-primary-100 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-primary-900">Landing Page Visibility</h4>
                  <p className="text-sm text-primary-600 mt-1">Enable this to publish your public landing page.</p>
                </div>
                <button
                  onClick={() => set('isLandingEnabled', !form.isLandingEnabled)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${form.isLandingEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isLandingEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">URL Slug</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">/</span>
                    <input value={form.slug} onChange={e => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      className="input-field !pl-5" placeholder="institute-name" />
                  </div>
                  <p className="text-xs text-slate-400 mt-1 font-mono">/i/{form.slug || 'your-slug'}</p>
                </div>
                <div>
                  <label className="label">Founded Year</label>
                  <input type="number" value={form.foundedYear} onChange={e => set('foundedYear', e.target.value)}
                    className="input-field" placeholder="e.g. 2010" />
                </div>
              </div>

              <div>
                <label className="label">Tagline / Catchphrase</label>
                <input value={form.tagline} onChange={e => set('tagline', e.target.value)}
                  className="input-field" placeholder="India's #1 Destination for Exams" />
              </div>

              <div>
                <label className="label">Extended Bio / About</label>
                <textarea value={form.landingBio} onChange={e => set('landingBio', e.target.value)}
                  className="input-field resize-none" rows={4} placeholder="Full description for the landing page..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Contact Phone</label>
                  <input value={form.phone} onChange={e => set('phone', e.target.value)} className="input-field" placeholder="+91 999999999" />
                </div>
              </div>

              <div><label className="label">Contact Office Address</label>
                <textarea value={form.contactAddress} onChange={e => set('contactAddress', e.target.value)} className="input-field resize-none" rows={2} />
              </div>
            </div>
          )}

          {/* Stats Config */}
          {activeTab === 'achievements' && (
            <div className="space-y-4 max-w-2xl">
              <p className="text-sm text-slate-500 bg-white p-4 rounded-xl border border-slate-200">
                These statistics appear as highlights directly below your banner on the public landing page.
              </p>
              {form.achievements.map((ach, i) => (
                <div key={i} className="flex gap-3 items-start bg-white p-3 rounded-xl border border-slate-200">
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-500 mb-1 block">Value</label>
                      <input value={ach.value} placeholder="e.g. 15,000+" className="input-field !text-sm"
                        onChange={e => { const a = [...form.achievements]; a[i] = { ...a[i], value: e.target.value }; set('achievements', a); }} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 mb-1 block">Title</label>
                      <input value={ach.title} placeholder="e.g. Successful Students" className="input-field !text-sm"
                        onChange={e => { const a = [...form.achievements]; a[i] = { ...a[i], title: e.target.value }; set('achievements', a); }} />
                    </div>
                  </div>
                  <button onClick={() => set('achievements', form.achievements.filter((_, j) => j !== i))}
                    className="p-2 text-red-400 hover:bg-red-50 rounded-lg mt-5" title="Remove">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button onClick={() => set('achievements', [...form.achievements, { title: '', value: '' }])}
                className="btn-secondary w-full gap-2 !py-2.5 shadow-sm">
                <Plus size={16} /> Add Statistic
              </button>
            </div>
          )}


          {/* Faculty Edit */}
          {activeTab === 'faculty' && (
            <div className="space-y-4 max-w-3xl">
              <p className="text-sm text-slate-500 bg-white p-4 rounded-xl border border-slate-200">Feature your top educators to build trust. Adding an email will automatically generate an instructor login for them.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {form.faculty.map((f, i) => (
                  <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 relative">
                    <button onClick={() => set('faculty', form.faculty.filter((_, j) => j !== i))} className="absolute top-3 right-3 text-red-400 hover:text-red-500"><Trash2 size={16} /></button>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 block mb-1">Faculty Name</label>
                      <input value={f.name} placeholder="Enter name" className="input-field !text-sm"
                        onChange={e => { const a = [...form.faculty]; a[i] = { ...a[i], name: e.target.value }; set('faculty', a); }} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 block mb-1">Designation</label>
                      <input value={f.designation || ''} placeholder="e.g. Mathematics HOD" className="input-field !text-sm"
                        onChange={e => { const a = [...form.faculty]; a[i] = { ...a[i], designation: e.target.value }; set('faculty', a); }} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 block mb-1">Login Email (Optional)</label>
                      <input type="email" value={f.email || ''} placeholder="instructor@example.com" className="input-field !text-sm"
                        onChange={e => { const a = [...form.faculty]; a[i] = { ...a[i], email: e.target.value }; set('faculty', a); }} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 block mb-1">Login Password</label>
                      <input type="password" value={f.password || ''} placeholder="Leave blank to skip/unchanged" className="input-field !text-sm"
                        onChange={e => { const a = [...form.faculty]; a[i] = { ...a[i], password: e.target.value }; set('faculty', a); }} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 block mb-1">
                        Upload Photo <span className="font-normal">(1:1 Square)</span>
                      </label>
                      {f.photo ? (
                        <div className="flex items-center gap-3">
                          <img
                            src={getImageUrl(f.photo)}
                            alt="faculty"
                            className="h-10 w-10 border border-slate-200 object-cover rounded-lg"
                          />
                          <button onClick={() => { const a = [...form.faculty]; a[i] = { ...a[i], photo: '' }; set('faculty', a); }} className="text-xs text-red-500 hover:underline">Remove</button>
                        </div>
                      ) : (
                        <input type="file" accept="image/*" className="input-field !text-sm cursor-pointer"
                          onChange={async e => {
                            if (!e.target.files[0]) return;
                            const tId = toast.loading('Uploading photo...');
                            try {
                              const uploadData = new FormData();
                              uploadData.append('image', e.target.files[0]);
                              const res = await api.post('/institute/upload', uploadData, {
                                headers: { 'Content-Type': 'multipart/form-data' }
                              });
                              const a = [...form.faculty];
                              a[i] = { ...a[i], photo: res.data.url };
                              set('faculty', a);
                              toast.success('Uploaded!', { id: tId });
                            } catch (err) {
                              toast.error('Failed to upload', { id: tId });
                            }
                          }}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => set('faculty', [...form.faculty, { name: '', designation: '', email: '', password: '', photo: '' }])}
                className="btn-secondary w-full gap-2 !py-2.5 shadow-sm">
                <Plus size={16} /> Add Faculty Member
              </button>
            </div>
          )}

          {/* Testimonials */}
          {activeTab === 'testimonials' && (
            <div className="space-y-4 max-w-2xl">
              <p className="text-sm text-slate-500 bg-white p-4 rounded-xl border border-slate-200">Share success stories and reviews from past students.</p>
              {form.testimonials.map((t, i) => (
                <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="font-semibold text-slate-700 text-sm">Testimonial #{i + 1}</h5>
                    <button onClick={() => set('testimonials', form.testimonials.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-500"><Trash2 size={16} /></button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="col-span-2 md:col-span-1">
                      <label className="text-xs font-semibold text-slate-500 block mb-1">Student Name</label>
                      <input value={t.name} placeholder="e.g. Rahul Kumar" className="input-field !text-sm"
                        onChange={e => { const a = [...form.testimonials]; a[i] = { ...a[i], name: e.target.value }; set('testimonials', a); }} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 block mb-1">Exam / Score</label>
                      <input value={t.score || ''} placeholder="AIR 15" className="input-field !text-sm"
                        onChange={e => { const a = [...form.testimonials]; a[i] = { ...a[i], score: e.target.value }; set('testimonials', a); }} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 block mb-1">Year</label>
                      <input value={t.year || ''} placeholder="2024" className="input-field !text-sm"
                        onChange={e => { const a = [...form.testimonials]; a[i] = { ...a[i], year: e.target.value }; set('testimonials', a); }} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">Review</label>
                    <textarea value={t.text || ''} placeholder="Their experience..." rows={2} className="input-field !text-sm resize-none"
                      onChange={e => { const a = [...form.testimonials]; a[i] = { ...a[i], text: e.target.value }; set('testimonials', a); }} />
                  </div>
                </div>
              ))}
              <button onClick={() => set('testimonials', [...form.testimonials, { name: '', text: '', year: '', score: '' }])}
                className="btn-secondary w-full gap-2 !py-2.5 shadow-sm">
                <Plus size={16} /> Add Testimonial
              </button>
            </div>
          )}

          {/* Gallery */}
          {activeTab === 'gallery' && (
            <div className="space-y-4 max-w-3xl">
              <p className="text-sm text-slate-500 bg-white p-4 rounded-xl border border-slate-200">Showcase your campus, events, and infrastructure to prospective students.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(form.gallery || []).map((img, i) => (
                  <div key={i} className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col relative group">
                    <button onClick={() => set('gallery', form.gallery.filter((_, j) => j !== i))} className="absolute top-4 right-4 bg-red-500 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"><Trash2 size={14} /></button>
                    <div className="aspect-video w-full rounded-lg bg-slate-100 mb-3 overflow-hidden border border-slate-200 relative group/media">
                      {img.url ? (
                        img.url.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                          <video src={getImageUrl(img.url)} className="w-full h-full object-cover" controls preload="metadata" />
                        ) : (
                          <img src={getImageUrl(img.url)} alt="gallery" className="w-full h-full object-cover" />
                        )
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                          {uploadProgress[i] ? (
                            <div className="w-full px-4 text-center">
                              <span className="text-xs font-bold text-slate-600 block mb-2">{uploadProgress[i]}</span>
                              <div className="w-full bg-slate-200 rounded-full h-2">
                                <div className="bg-indigo-500 h-2 rounded-full border border-indigo-600 animate-pulse" style={{ width: uploadProgress[i].split('%')[0] + '%' }}></div>
                              </div>
                            </div>
                          ) : (
                            <>
                              <input type="file" accept="image/*,video/*" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                onChange={async e => {
                                  const file = e.target.files[0];
                                  if (!file) return;

                                  const totalSizeMB = (file.size / (1024 * 1024)).toFixed(2);

                                  try {
                                    const uploadData = new FormData();
                                    uploadData.append('image', file);

                                    setUploadProgress(p => ({ ...p, [i]: `Uploading 0% (0 / ${totalSizeMB} MB)` }));

                                    const res = await api.post('/institute/upload', uploadData, {
                                      headers: { 'Content-Type': 'multipart/form-data' },
                                      onUploadProgress: progressEvent => {
                                        if (progressEvent.total) {
                                          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                                          const loadedMB = (progressEvent.loaded / (1024 * 1024)).toFixed(2);
                                          setUploadProgress(p => ({ ...p, [i]: `${percent}% (${loadedMB} / ${totalSizeMB} MB)` }));
                                        }
                                      }
                                    });

                                    const a = [...form.gallery];
                                    a[i] = { ...a[i], url: res.data.url };
                                    set('gallery', a);
                                    setUploadProgress(p => ({ ...p, [i]: null }));
                                    toast.success(`Success! Added ${totalSizeMB} MB media.`);
                                  } catch (err) {
                                    setUploadProgress(p => ({ ...p, [i]: null }));
                                    toast.error(`Upload failed for ${totalSizeMB} MB file.`);
                                  }
                                }}
                              />
                              <Plus size={24} className="mb-1" />
                              <span className="text-[10px] font-bold uppercase tracking-widest text-center px-2 block mt-1">Upload Media</span>
                              <span className="text-[9px] text-slate-400 text-center font-medium mt-1">Recommended: 16:9 ratio</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    <input
                      value={img.caption || ''}
                      placeholder="Optional caption..."
                      className="input-field !text-xs !py-2"
                      onChange={e => { const a = [...form.gallery]; a[i] = { ...a[i], caption: e.target.value }; set('gallery', a); }}
                    />
                  </div>
                ))}

                <button onClick={() => set('gallery', [...(form.gallery || []), { url: '', caption: '' }])}
                  className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors aspect-video">
                  <Plus size={32} className="mb-2" />
                  <span className="text-xs font-bold uppercase tracking-widest block">Add New Media</span>
                  <span className="text-[10px] mt-1 font-medium text-slate-400">16:9 Aspect Ratio</span>
                </button>
              </div>
            </div>
          )}

          {/* Social Links */}
          {activeTab === 'social' && (
            <div className="space-y-4 max-w-2xl">
              <p className="text-sm text-slate-500 bg-white p-4 rounded-xl border border-slate-200">Connect your institute's social media accounts.</p>
              <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
                {['facebook', 'twitter', 'youtube', 'instagram', 'linkedin'].map(platform => (
                  <div key={platform} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                    <label className="w-24 text-sm font-semibold capitalize text-slate-700">{platform}</label>
                    <input
                      value={form.socialLinks[platform] || ''}
                      onChange={e => set('socialLinks', { ...form.socialLinks, [platform]: e.target.value })}
                      className="input-field flex-1"
                      placeholder={`https://${platform}.com/your-url`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subscription Tab (Read-only overview of currently active state) */}
          {activeTab === 'subscription' && (
            <div className="max-w-2xl">
              <div className="card border border-primary-100 shadow-xl shadow-primary-500/10">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                  <h3 className="font-bold text-slate-900 text-lg">Current Subscription</h3>
                  <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full tracking-wider ${institute?.subscription?.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {institute?.subscription?.status || 'trial'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Active Plan</p>
                    <p className="text-xl font-bold capitalize text-slate-800">{institute?.subscription?.plan || 'Free'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Student Capacity</p>
                    <div className="flex items-end gap-2">
                      <p className="text-xl font-bold text-slate-800">{institute?.totalStudents || 0} <span className="text-sm font-medium text-slate-400">/ {institute?.subscription?.maxStudents || 50}</span></p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Batch Capacity</p>
                    <div className="flex items-end gap-2">
                      <p className="text-xl font-bold text-slate-800">{institute?.totalBatches || 0} <span className="text-sm font-medium text-slate-400">/ {institute?.subscription?.maxBatches || 3}</span></p>
                    </div>
                  </div>
                </div>

                <a href="/institute/subscription" className="btn-primary w-full text-center block !py-3 font-semibold shadow-md">
                  Manage Plan & Billing
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
