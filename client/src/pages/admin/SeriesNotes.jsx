import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  ArrowLeft, Plus, Trash2, Edit2, FileText, Link2, Eye, EyeOff,
  BookOpen, Upload, X, Check, GripVertical, ChevronDown, ChevronRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../lib/api';

// ── Style tokens ────────────────────────────────────────────────
const card = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '18px 20px' };
const inp = {
  width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8,
  fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  color: '#111827', backgroundColor: '#fff'
};
const btn = (v = 'primary') => ({
  padding: '8px 18px', borderRadius: 9, fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer',
  background: v === 'primary' ? '#6366f1' : v === 'danger' ? '#ef4444' : v === 'ghost' ? '#f3f4f6' : v === 'green' ? '#059669' : '#fff',
  color: v === 'primary' ? '#fff' : v === 'danger' ? '#fff' : v === 'ghost' ? '#374151' : v === 'green' ? '#fff' : '#374151',
  border: v === 'outline' ? '1px solid #d1d5db' : 'none',
});

const FILE_ICON = { pdf: '📄', doc: '📝', image: '🖼', link: '🔗', none: '📋' };
const FILE_COLOR = { pdf: '#dc2626', doc: '#2563eb', image: '#7c3aed', link: '#059669', none: '#6b7280' };

// COMMON_SUBJECTS is now fetched dynamically from /api/subjects
// See fetchSubjects() inside the component

// ── Note Card ────────────────────────────────────────────────────
function NoteCard({ note, onEdit, onDelete, onToggle }) {
  const typeColor = FILE_COLOR[note.fileType] || '#6b7280';
  const typeIcon = FILE_ICON[note.fileType] || '📋';

  return (
    <div style={{
      background: '#fff', border: `1px solid ${note.isActive ? '#e5e7eb' : '#f3f4f6'}`,
      borderRadius: 12, padding: '14px 16px', opacity: note.isActive ? 1 : 0.6,
      display: 'flex', gap: 12, alignItems: 'flex-start'
    }}>
      {/* Icon */}
      <div style={{
        width: 40, height: 40, borderRadius: 10, background: `${typeColor}15`,
        border: `1px solid ${typeColor}30`, display: 'flex', alignItems: 'center',
        justifyContent: 'center', flexShrink: 0, fontSize: 20
      }}>
        {note.thumbnail ? (
          <img src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${note.thumbnail}`} alt="Thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          typeIcon
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div>
            <p style={{ fontWeight: 700, color: '#111827', fontSize: 13, margin: 0, lineHeight: 1.3 }}>{note.title}</p>
            {note.description && (
              <p style={{ fontSize: 11, color: '#6b7280', margin: '3px 0 0', lineHeight: 1.4 }}>{note.description}</p>
            )}
          </div>
          <div style={{ display: 'flex', gap: 5, flexShrink: 0, alignItems: 'center' }}>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
              background: note.isFree ? '#d1fae5' : '#fef3c7',
              color: note.isFree ? '#065f46' : '#92400e'
            }}>
              {note.isFree ? 'FREE' : '⭐ PRO'}
            </span>
          </div>
        </div>

        {/* File info row */}
        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {note.fileType !== 'none' && (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
              background: `${typeColor}15`, color: typeColor
            }}>
              {note.fileType.toUpperCase()}
            </span>
          )}
          {note.fileUrl && (
            <a
              href={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${note.fileUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 11, color: '#6366f1', textDecoration: 'none', fontWeight: 600 }}
            >
              ↗ View File
            </a>
          )}
          {note.externalLink && (
            <a
              href={note.externalLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 11, color: '#059669', textDecoration: 'none', fontWeight: 600 }}
            >
              ↗ External Link
            </a>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
          <button onClick={() => onEdit(note)} style={{ ...btn('ghost'), padding: '5px 12px', fontSize: 11 }}>
            ✏️ Edit
          </button>
          <button
            onClick={() => onToggle(note)}
            style={{
              ...btn('ghost'), padding: '5px 12px', fontSize: 11,
              color: note.isActive ? '#059669' : '#9ca3af'
            }}
          >
            {note.isActive ? '✓ Active' : '✗ Hidden'}
          </button>
          <button onClick={() => onDelete(note.id)} style={{ ...btn('danger'), padding: '5px 12px', fontSize: 11 }}>
            🗑
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Subject Group ─────────────────────────────────────────────────
function SubjectGroup({ subject, notes, onEdit, onDelete, onToggle, onAddNote }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', background: '#f9fafb', borderBottom: collapsed ? 'none' : '1px solid #e5e7eb',
          cursor: 'pointer'
        }}
        onClick={() => setCollapsed(c => !c)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
          <span style={{ fontWeight: 800, fontSize: 13, color: '#111827' }}>📚 {subject}</span>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
            background: '#e0e7ff', color: '#3730a3'
          }}>
            {notes.length} note{notes.length !== 1 ? 's' : ''}
          </span>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onAddNote(subject); }}
          style={{ ...btn('primary'), padding: '5px 12px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <Plus size={12} /> Add Note
        </button>
      </div>

      {/* Notes list */}
      {!collapsed && (
        <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {notes.length === 0 ? (
            <p style={{ color: '#9ca3af', fontSize: 12, textAlign: 'center', padding: '12px 0' }}>No notes yet</p>
          ) : (
            notes.map(n => (
              <NoteCard key={n.id} note={n} onEdit={onEdit} onDelete={onDelete} onToggle={onToggle} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

//  ═══════════════════════════════════════════════════════════════
export default function AdminSeriesNotes() {
  const { seriesId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const seriesTitle = location.state?.seriesTitle || 'Exam Series';

  const [notes, setNotes] = useState([]);
  const [grouped, setGrouped] = useState({});
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState([]);     // fetched from API
  const [modal, setModal] = useState(null); // null | 'create' | 'edit'
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: '',
    subject: '',          // will be set to subjects[0] once fetched
    customSubject: '',
    description: '',
    content: '',
    fileType: 'none',
    externalLink: '',
    isFree: true,
    isActive: true,
    sortOrder: 0,
  });
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const fileInputRef = useRef(null);

  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const thumbnailInputRef = useRef(null);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get(`/exam-series/${seriesId}/notes`);
      setNotes(r.data.data || []);
      setGrouped(r.data.grouped || {});
    } catch {
      toast.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  }, [seriesId]);

  // Fetch subjects from the managed subject list
  const fetchSubjects = useCallback(async () => {
    try {
      const r = await api.get('/subjects');
      const names = (r.data.data || []).map(s => s.name);
      setSubjects(names.length ? [...names, 'Custom'] : ['General Knowledge', 'Mathematics', 'English', 'Reasoning', 'History', 'Geography', 'Science', 'Custom']);
    } catch {
      // fallback if API fails
      setSubjects(['General Knowledge', 'Mathematics', 'English', 'Reasoning', 'History', 'Geography', 'Science', 'Custom']);
    }
  }, []);

  useEffect(() => { fetchNotes(); fetchSubjects(); }, [fetchNotes, fetchSubjects]);

  // Once subjects are fetched, set default form subject if not already set
  useEffect(() => {
    if (subjects.length > 0 && !form.subject) {
      setForm(p => ({ ...p, subject: subjects[0] }));
    }
  }, [subjects]);

  const resetForm = () => {
    setForm({
      title: '', subject: subjects[0] || '', customSubject: '', description: '',
      content: '', fileType: 'none', externalLink: '', isFree: true, isActive: true, sortOrder: 0,
    });
    setFile(null);
    setFilePreview(null);
    setThumbnailFile(null);
    setThumbnailPreview(null);
    setEditing(null);
  };

  const openCreate = (prefilledSubject = '') => {
    resetForm();
    if (prefilledSubject) {
      setForm(f => ({
        ...f,
        subject: subjects.includes(prefilledSubject) ? prefilledSubject : 'Custom',
        customSubject: subjects.includes(prefilledSubject) ? '' : prefilledSubject,
      }));
    }
    setModal('create');
  };

  const openEdit = (note) => {
    setEditing(note);
    setForm({
      title: note.title || '',
      subject: subjects.includes(note.subject) ? note.subject : 'Custom',
      customSubject: subjects.includes(note.subject) ? '' : note.subject,
      description: note.description || '',
      content: note.content || '',
      fileType: note.fileType || 'none',
      externalLink: note.externalLink || '',
      isFree: note.isFree !== false,
      isActive: note.isActive !== false,
      sortOrder: note.sortOrder || 0,
    });
    setFile(null);
    setFilePreview(null);
    setThumbnailFile(null);
    setThumbnailPreview(note.thumbnail ? `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${note.thumbnail}` : null);
    setModal('edit');
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    const ext = f.name.split('.').pop().toLowerCase();
    if (['pdf'].includes(ext)) setForm(p => ({ ...p, fileType: 'pdf' }));
    else if (['doc', 'docx'].includes(ext)) setForm(p => ({ ...p, fileType: 'doc' }));
    else if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) {
      setForm(p => ({ ...p, fileType: 'image' }));
      setFilePreview(URL.createObjectURL(f));
    }
  };

  const handleThumbnailChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setThumbnailFile(f);
    setThumbnailPreview(URL.createObjectURL(f));
  };

  const handleSave = async () => {
    const subjectValue = form.subject === 'Custom' ? form.customSubject.trim() : form.subject;
    if (!form.title.trim() || !subjectValue) {
      toast.error('Title and Subject are required');
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title.trim());
      fd.append('subject', subjectValue);
      fd.append('description', form.description || '');
      fd.append('content', form.content || '');
      fd.append('fileType', form.fileType || 'none');
      fd.append('externalLink', form.externalLink || '');
      fd.append('isFree', form.isFree);
      fd.append('isActive', form.isActive);
      fd.append('sortOrder', form.sortOrder || 0);
      if (file) fd.append('file', file);
      if (thumbnailFile) fd.append('thumbnail', thumbnailFile);

      if (modal === 'edit' && editing) {
        await api.put(`/exam-series/${seriesId}/notes/${editing.id}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Note updated!');
      } else {
        await api.post(`/exam-series/${seriesId}/notes`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Note added!');
      }
      setModal(null);
      resetForm();
      fetchNotes();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (noteId) => {
    if (!window.confirm('Delete this note? This cannot be undone.')) return;
    try {
      await api.delete(`/exam-series/${seriesId}/notes/${noteId}`);
      toast.success('Note deleted');
      fetchNotes();
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleToggle = async (note) => {
    try {
      await api.patch(`/exam-series/${seriesId}/notes/${note.id}/toggle`);
      fetchNotes();
    } catch {
      toast.error('Failed');
    }
  };

  const allSubjects = Object.keys(grouped);

  // derived: is subjects list still loading?
  const subjectsReady = subjects.length > 0;

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, fontFamily: 'sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 36, height: 36, border: '3px solid #e0e7ff', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'sp 0.7s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ color: '#6b7280', fontSize: 13 }}>Loading notes...</p>
        <style>{`@keyframes sp{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '20px 24px', fontFamily: "'Inter',-apple-system,sans-serif", fontSize: 13 }}>
      <style>{`@keyframes sp{to{transform:rotate(360deg)}} * {box-sizing:border-box;}`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => navigate('/admin/exam-series')}
            style={{ ...btn('ghost'), padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <ArrowLeft size={14} /> Back
          </button>
          <div>
            <h1 style={{ fontSize: 17, fontWeight: 800, color: '#111827', margin: 0 }}>📝 Study Notes</h1>
            <p style={{ fontSize: 11, color: '#6b7280', margin: '2px 0 0' }}>{seriesTitle}</p>
          </div>
        </div>
        <button
          style={{ ...btn('primary'), display: 'flex', alignItems: 'center', gap: 6 }}
          onClick={() => openCreate()}
        >
          <Plus size={14} /> Add Note
        </button>
      </div>

      {/* Stats bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 18 }}>
        {[
          ['📝', 'Total Notes', notes.length],
          ['📚', 'Subjects', allSubjects.length],
          ['✅', 'Active', notes.filter(n => n.isActive).length],
          ['🆓', 'Free Notes', notes.filter(n => n.isFree).length],
        ].map(([icon, label, val]) => (
          <div key={label} style={{ ...card, padding: '12px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#111827' }}>{val}</div>
            <div style={{ fontSize: 10, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Notes grouped by subject */}
      {allSubjects.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', padding: 56 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📝</div>
          <p style={{ fontWeight: 700, color: '#374151', fontSize: 15, marginBottom: 6 }}>No Notes Yet</p>
          <p style={{ color: '#9ca3af', fontSize: 13, marginBottom: 18 }}>
            Add subject-wise study notes, PDFs, or resource links for this exam series
          </p>
          <button style={btn('primary')} onClick={() => openCreate()}>+ Add First Note</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {allSubjects.map(subject => (
            <SubjectGroup
              key={subject}
              subject={subject}
              notes={grouped[subject] || []}
              onEdit={openEdit}
              onDelete={handleDelete}
              onToggle={handleToggle}
              onAddNote={openCreate}
            />
          ))}
        </div>
      )}

      {/* ── Add / Edit Note Modal ────────────────────────────────── */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 580, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}>
            {/* Modal Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#fff', zIndex: 10 }}>
              <h2 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: '#111827' }}>
                {modal === 'edit' ? '✏️ Edit Note' : '➕ Add Study Note'}
              </h2>
              <button onClick={() => { setModal(null); resetForm(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Title */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Note Title *
                </label>
                <input
                  style={inp}
                  placeholder="e.g. Chapter 1 - Modern History Notes"
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                />
              </div>

              {/* Subject */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Subject *
                </label>
                <select
                  style={inp}
                  value={form.subject}
                  onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                  disabled={!subjectsReady}
                >
                  {!subjectsReady && <option value="">Loading subjects…</option>}
                  {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {form.subject === 'Custom' && (
                  <input
                    style={{ ...inp, marginTop: 8 }}
                    placeholder="Enter custom subject name..."
                    value={form.customSubject}
                    onChange={e => setForm(p => ({ ...p, customSubject: e.target.value }))}
                  />
                )}
              </div>

              {/* Description */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Short Description
                </label>
                <input
                  style={inp}
                  placeholder="Brief summary of what this note covers..."
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                />
              </div>

              {/* Content (rich text) */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Note Content (Optional — online content)
                </label>
                <textarea
                  style={{ ...inp, minHeight: 100, resize: 'vertical', lineHeight: 1.6 }}
                  placeholder="Type note content here (can be HTML or plain text)..."
                  value={form.content}
                  onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                />
              </div>

              {/* File Upload ─ uses display:none + ref so it CANNOT leak over other fields */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Upload File (PDF / DOC / Image — max 20MB)
                </label>

                {/* TRUE hidden file input — no absolute positioning at all */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />

                {file ? (
                  /* File chosen — show name + remove button */
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '12px 14px', borderRadius: 10,
                    border: '2px solid #6ee7b7', background: '#f0fdf4',
                  }}>
                    <span style={{ fontSize: 20 }}>{FILE_ICON[form.fileType] || '📄'}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#111827', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {file.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => { setFile(null); setFilePreview(null); setForm(p => ({ ...p, fileType: 'none' })); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: '2px 4px', flexShrink: 0 }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  /* Dropzone button — clicking calls fileInputRef.current.click() */
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      width: '100%', border: '2px dashed #d1d5db', borderRadius: 10,
                      padding: '20px 16px', textAlign: 'center', cursor: 'pointer',
                      background: '#f9fafb', display: 'flex', flexDirection: 'column',
                      alignItems: 'center', gap: 6, transition: 'border-color 0.2s',
                    }}
                  >
                    <Upload size={22} style={{ color: '#9ca3af' }} />
                    <span style={{ fontSize: 12, color: '#6b7280' }}>Click to choose file</span>
                    <span style={{ fontSize: 10, color: '#9ca3af' }}>PDF, DOC, DOCX, PNG, JPG — max 20 MB</span>
                  </button>
                )}

                {filePreview && (
                  <img src={filePreview} alt="Preview" style={{ width: '100%', maxHeight: 180, objectFit: 'contain', marginTop: 8, borderRadius: 8, border: '1px solid #e5e7eb' }} />
                )}
                {modal === 'edit' && editing?.fileUrl && !file && (
                  <p style={{ fontSize: 11, color: '#059669', marginTop: 6 }}>
                    ✓ Current file uploaded — click above to replace it
                  </p>
                )}

              </div>

              {/* Thumbnail Upload */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Thumbnail Image (Optional)
                </label>

                <input
                  ref={thumbnailInputRef}
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp"
                  onChange={handleThumbnailChange}
                  style={{ display: 'none' }}
                />

                {thumbnailFile || thumbnailPreview ? (
                  <div style={{ position: 'relative', width: 120, height: 120, borderRadius: 10, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                    <img src={thumbnailPreview} alt="Thumbnail Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      type="button"
                      onClick={() => { setThumbnailFile(null); setThumbnailPreview(null); }}
                      style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', padding: 4, cursor: 'pointer', color: '#dc2626' }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => thumbnailInputRef.current?.click()}
                    style={{
                      width: 120, height: 120, border: '2px dashed #d1d5db', borderRadius: 10,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
                      background: '#f9fafb', cursor: 'pointer', transition: 'border-color 0.2s',
                    }}
                  >
                    <Upload size={20} style={{ color: '#9ca3af' }} />
                    <span style={{ fontSize: 10, color: '#6b7280', textAlign: 'center', padding: '0 8px' }}>Add Thumbnail</span>
                  </button>
                )}
              </div>

              {/* External Link */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  External Link (Optional)
                </label>
                <div style={{ position: 'relative' }}>
                  <Link2 size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                  <input
                    style={{ ...inp, paddingLeft: 30 }}
                    placeholder="https://example.com/study-material"
                    value={form.externalLink}
                    onChange={e => setForm(p => ({
                      ...p,
                      externalLink: e.target.value,
                      fileType: e.target.value && !file ? 'link' : p.fileType
                    }))}
                  />
                </div>
              </div>

              {/* Access + Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Access
                  </label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[{ label: '🆓 Free', val: true }, { label: '⭐ Pro Only', val: false }].map(opt => (
                      <button
                        key={String(opt.val)}
                        onClick={() => setForm(p => ({ ...p, isFree: opt.val }))}
                        style={{
                          flex: 1, padding: '8px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none',
                          background: form.isFree === opt.val ? '#6366f1' : '#f3f4f6',
                          color: form.isFree === opt.val ? '#fff' : '#374151',
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Status
                  </label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[{ label: '✓ Active', val: true }, { label: '✗ Hidden', val: false }].map(opt => (
                      <button
                        key={String(opt.val)}
                        onClick={() => setForm(p => ({ ...p, isActive: opt.val }))}
                        style={{
                          flex: 1, padding: '8px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none',
                          background: form.isActive === opt.val ? (opt.val ? '#059669' : '#ef4444') : '#f3f4f6',
                          color: form.isActive === opt.val ? '#fff' : '#374151',
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sort order */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Sort Order (lower = first)
                </label>
                <input
                  type="number"
                  style={{ ...inp, width: 120 }}
                  value={form.sortOrder}
                  onChange={e => setForm(p => ({ ...p, sortOrder: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '12px 22px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', bottom: 0, background: '#fff', gap: 10 }}>
              <button onClick={() => { setModal(null); resetForm(); }} style={btn('ghost')}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={{ ...btn('primary'), opacity: saving ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                {saving ? (
                  <>
                    <div style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'sp 0.7s linear infinite' }} />
                    Saving…
                  </>
                ) : (
                  <>{modal === 'edit' ? '✓ Update Note' : '✓ Add Note'}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
