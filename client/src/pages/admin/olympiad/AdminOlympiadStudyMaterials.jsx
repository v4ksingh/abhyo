import React, { useState, useEffect, useRef } from 'react';
import api from '../../../lib/api';
import {
  BookOpen, Plus, Edit2, Trash2, FileText, Video,
  PenLine, Target, Search, X, Save, AlertCircle, CheckCircle,
  Upload, Link as LinkIcon, Loader,
} from 'lucide-react';

const TYPE_OPTIONS = [
  { value: 'syllabus', label: 'Syllabus PDF', icon: BookOpen, color: 'text-amber-500' },
  { value: 'practice', label: 'Olympiad Mock Test', icon: Target, color: 'text-purple-500' },
  { value: 'pdf',      label: 'PDF Study Material', icon: FileText, color: 'text-red-500' },
  { value: 'notes',    label: 'Revision Notes', icon: PenLine, color: 'text-green-500' },
  { value: 'video',    label: 'Video Lecture', icon: Video, color: 'text-blue-500' },
];

const EMPTY_FORM = {
  title: '', description: '', type: 'pdf',
  fileUrl: '', videoUrl: '', externalUrl: '',
  classLevel: '', subjectId: '', chapterId: '',
  orderIndex: 0, isActive: true, isFree: true,
};

const inputCls = 'w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white text-gray-900 placeholder-gray-400';
const labelCls = 'block text-xs font-bold text-slate-700 mb-1';

export default function AdminOlympiadStudyMaterials() {
  const [materials,  setMaterials]  = useState([]);
  const [subjects,   setSubjects]   = useState([]);
  const [chapters,   setChapters]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showModal,  setShowModal]  = useState(false);
  const [editing,    setEditing]    = useState(null);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [saving,     setSaving]     = useState(false);
  const [toast,      setToast]      = useState(null);
  const [search,     setSearch]     = useState('');
  const [filterSub,  setFilterSub]  = useState('');

  // File upload state
  const [uploadMode,   setUploadMode]   = useState('url');   // 'url' | 'file'
  const [uploading,    setUploading]    = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const fileInputRef = useRef(null);

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  /* Load subjects from public endpoint (no auth needed) */
  const loadSubjects = async () => {
    try {
      const res = await api.get('/olympiad/subjects');
      setSubjects(res.data.data || []);
    } catch {
      try {
        const res2 = await api.get('/olympiad/admin/subjects');
        setSubjects(res2.data.data || []);
      } catch (err) {
        console.error('Failed to load subjects:', err);
      }
    }
  };

  const loadMaterials = async () => {
    setLoading(true);
    try {
      const res = await api.get('/olympiad/admin/study-materials');
      setMaterials(res.data.data || []);
    } catch (err) {
      console.error('Failed to load materials:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSubjects();
    loadMaterials();
  }, []);

  /* Load chapters when subject changes */
  useEffect(() => {
    if (!form.subjectId) { setChapters([]); return; }
    api.get('/olympiad/admin/chapters', { params: { subjectId: form.subjectId } })
      .then(r => setChapters(r.data.data || []))
      .catch(() => setChapters([]));
  }, [form.subjectId]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setUploadMode('url');
    setUploadedFile(null);
    setShowModal(true);
  };

  const openEdit = (m) => {
    setEditing(m.id);
    setForm({
      title: m.title, description: m.description || '',
      type: m.type, fileUrl: m.fileUrl || '', videoUrl: m.videoUrl || '',
      externalUrl: m.externalUrl || '', classLevel: m.classLevel || '',
      subjectId: m.subjectId, chapterId: m.chapterId || '',
      orderIndex: m.orderIndex || 0, isActive: m.isActive, isFree: m.isFree,
    });
    setUploadMode('url');
    setUploadedFile(null);
    setShowModal(true);
  };

  /* File upload handler */
  const handleFileUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      // Must delete the default 'Content-Type: application/json' header so axios
      // can auto-set 'multipart/form-data; boundary=...' for multer to parse correctly.
      const res = await api.post('/olympiad/admin/study-materials/upload', formData, {
        headers: { 'Content-Type': undefined },
      });

      const url = res.data.url;
      setUploadedFile({ name: file.name, url });
      setForm(f => ({ ...f, fileUrl: url }));
      showToast('File uploaded successfully!');
    } catch (err) {
      showToast(err.response?.data?.error || 'Upload failed', false);
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.title || !form.subjectId || !form.type) {
      showToast('Title, Subject & Type are required', false); return;
    }
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/olympiad/admin/study-materials/${editing}`, form);
        showToast('Material updated!');
      } else {
        await api.post('/olympiad/admin/study-materials', form);
        showToast('Material added!');
      }
      setShowModal(false);
      loadMaterials();
    } catch (e) { showToast(e.response?.data?.error || 'Error saving', false); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this material?')) return;
    try {
      await api.delete(`/olympiad/admin/study-materials/${id}`);
      showToast('Deleted');
      loadMaterials();
    } catch { showToast('Error deleting', false); }
  };

  const filtered = materials.filter(m =>
    (!filterSub || m.subject?.name === filterSub) &&
    (!search    || m.title.toLowerCase().includes(search.toLowerCase()))
  );

  /* URL/File field for pdf/notes/syllabus/practice */
  const renderFileField = () => {
    if (form.type === 'video') return null;
    return (
      <div>
        <label className={labelCls}>File</label>
        {/* Toggle */}
        <div className="flex gap-2 mb-2">
          <button type="button"
            onClick={() => setUploadMode('url')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${uploadMode === 'url' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}>
            <LinkIcon className="w-3.5 h-3.5" /> URL / Drive Link
          </button>
          <button type="button"
            onClick={() => setUploadMode('file')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${uploadMode === 'file' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}>
            <Upload className="w-3.5 h-3.5" /> Upload File
          </button>
        </div>

        {uploadMode === 'url' ? (
          <input
            value={form.fileUrl}
            onChange={e => setForm(f => ({ ...f, fileUrl: e.target.value }))}
            className={inputCls}
            placeholder="https://drive.google.com/..."
          />
        ) : (
          <div>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all"
            >
              {uploading ? (
                <div className="flex flex-col items-center gap-2 text-indigo-600">
                  <Loader className="w-6 h-6 animate-spin" />
                  <span className="text-xs font-semibold">Uploading…</span>
                </div>
              ) : uploadedFile ? (
                <div className="flex flex-col items-center gap-1">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <span className="text-xs font-semibold text-green-700">{uploadedFile.name}</span>
                  <span className="text-xs text-slate-400">Click to change</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1 text-slate-400">
                  <Upload className="w-6 h-6" />
                  <span className="text-xs font-semibold">Click to select a file</span>
                  <span className="text-xs">PDF, DOC, PPT up to 50 MB</span>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx"
              className="hidden"
              onChange={e => handleFileUpload(e.target.files[0])}
            />
            {form.fileUrl && uploadedFile && (
              <p className="text-xs text-slate-500 mt-1 truncate">URL: {form.fileUrl}</p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold ${toast.ok ? 'bg-green-600 text-white' : 'bg-red-500 text-white'}`}>
          {toast.ok ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">Study Materials</h1>
            <p className="text-xs text-slate-500">{materials.length} materials across all subjects</p>
          </div>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-bold hover:shadow-lg hover:-translate-y-0.5 transition-all">
          <Plus className="w-4 h-4" /> Add Material
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search materials…"
            className="text-sm outline-none w-full text-slate-700 bg-transparent placeholder-slate-400" />
        </div>
        <select value={filterSub} onChange={e => setFilterSub(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none">
          <option value="">All Subjects</option>
          {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : !filtered.length ? (
        <div className="text-center py-16 text-slate-400">
          <BookOpen className="w-14 h-14 mx-auto mb-3 opacity-20" />
          <p className="font-semibold">No materials yet. Click "Add Material" to get started.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3">Title</th>
                <th className="text-left px-4 py-3">Subject</th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-left px-4 py-3">Class</th>
                <th className="text-left px-4 py-3">Access</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => {
                const tOpt = TYPE_OPTIONS.find(t => t.value === m.type) || TYPE_OPTIONS[0];
                const TIcon = tOpt.icon;
                return (
                  <tr key={m.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{m.title}</p>
                      {m.description && <p className="text-xs text-slate-400 line-clamp-1">{m.description}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{m.subject?.name || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className={`flex items-center gap-1.5 ${tOpt.color}`}>
                        <TIcon className="w-3.5 h-3.5" />
                        <span className="text-xs font-semibold">{tOpt.label}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{m.classLevel ? `Class ${m.classLevel}` : 'All'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${m.isFree ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {m.isFree ? 'Free' : 'Registered'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${m.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {m.isActive ? 'Active' : 'Hidden'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(m)} className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-500 hover:text-indigo-700 transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(m.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white sticky top-0 rounded-t-2xl z-10">
              <h2 className="font-black text-slate-900 text-lg">{editing ? 'Edit Material' : 'Add Study Material'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className={labelCls}>Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className={inputCls} placeholder="e.g. Algebra Chapter 1 Notes" />
              </div>
              {/* Description */}
              <div>
                <label className={labelCls}>Description</label>
                <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className={`${inputCls} resize-none`} placeholder="Brief description…" />
              </div>
              {/* Type */}
              <div>
                <label className={labelCls}>Type *</label>
                <div className="grid grid-cols-4 gap-2">
                  {TYPE_OPTIONS.map(t => {
                    const TIcon = t.icon;
                    return (
                      <button key={t.value} type="button" onClick={() => setForm(f => ({ ...f, type: t.value }))}
                        className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-xs font-bold transition-all ${form.type === t.value ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500 hover:border-indigo-200 bg-white'}`}>
                        <TIcon className={`w-4 h-4 ${form.type === t.value ? 'text-indigo-600' : t.color}`} />
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* Subject + Class */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Subject *</label>
                  <select value={form.subjectId} onChange={e => setForm(f => ({ ...f, subjectId: e.target.value, chapterId: '' }))}
                    className={inputCls}>
                    <option value="">— Select subject —</option>
                    {subjects.length === 0 && (
                      <option disabled value="">No subjects found</option>
                    )}
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Class</label>
                  <select value={form.classLevel} onChange={e => setForm(f => ({ ...f, classLevel: e.target.value }))}
                    className={inputCls}>
                    <option value="">All Classes</option>
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(c => <option key={c} value={c}>Class {c}</option>)}
                  </select>
                </div>
              </div>
              {/* Chapter */}
              {chapters.length > 0 && (
                <div>
                  <label className={labelCls}>Chapter (optional)</label>
                  <select value={form.chapterId} onChange={e => setForm(f => ({ ...f, chapterId: e.target.value }))}
                    className={inputCls}>
                    <option value="">No chapter</option>
                    {chapters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}
              {/* File / URL field */}
              {renderFileField()}
              {/* Video URL */}
              {form.type === 'video' && (
                <div>
                  <label className={labelCls}>Video URL (YouTube / Drive)</label>
                  <input value={form.videoUrl} onChange={e => setForm(f => ({ ...f, videoUrl: e.target.value }))}
                    className={inputCls} placeholder="https://youtube.com/watch?v=…" />
                </div>
              )}
              {/* Practice URL */}
              {form.type === 'practice' && (
                <div>
                  <label className={labelCls}>External / Practice URL</label>
                  <input value={form.externalUrl} onChange={e => setForm(f => ({ ...f, externalUrl: e.target.value }))}
                    className={inputCls} placeholder="https://…" />
                </div>
              )}
              {/* Toggles */}
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isFree} onChange={e => setForm(f => ({ ...f, isFree: e.target.checked }))}
                    className="w-4 h-4 accent-indigo-600" />
                  <span className="text-sm font-semibold text-slate-700">Free Access</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                    className="w-4 h-4 accent-indigo-600" />
                  <span className="text-sm font-semibold text-slate-700">Active / Visible</span>
                </label>
              </div>
            </div>
            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-white sticky bottom-0 rounded-b-2xl flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 bg-white">Cancel</button>
              <button onClick={handleSave} disabled={saving || uploading}
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-bold hover:shadow-lg transition-all disabled:opacity-50">
                {saving ? <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                {editing ? 'Update' : 'Add Material'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
