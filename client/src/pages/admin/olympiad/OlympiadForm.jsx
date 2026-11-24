import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Trophy, Save, ArrowLeft, Calendar, Clock, DollarSign,
  Users, BookOpen, Upload, Image, X, CheckCircle, Loader,
  Plus, Trash2, Eye, Sparkles, FileText, Settings, HelpCircle,
  Palette, Tag, AlertCircle, RefreshCw
} from 'lucide-react';
import api from '../../../lib/api';
import toast from 'react-hot-toast';

const InputField = ({ label, type = 'text', value, onChange, required, placeholder, helper }) => (
  <div>
    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type} value={value} onChange={onChange} required={required}
      placeholder={placeholder}
      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
    />
    {helper && <p className="text-xs text-slate-400 mt-1">{helper}</p>}
  </div>
);

const CLASSES = [6, 7, 8, 9, 10, 11, 12];

const PRESET_COLORS = [
  '#6366f1', '#0ea5e9', '#10b981', '#f59e0b',
  '#e11d48', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'
];

const PRESET_ICONS = ['📐', '🔬', '💻', '📖', '🌏', '🧠', '🏛️', '🤖', '🎨', '🎵', '🏅', '📘'];

export default function OlympiadForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [subjects, setSubjects] = useState([]);
  const [saving, setSaving] = useState(false);
  const [templateUrl, setTemplateUrl] = useState(null);
  const [tplFile, setTplFile] = useState(null);
  const [tplUploading, setTplUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Official Syllabus PDF upload states
  const [syllabusPdfUrl, setSyllabusPdfUrl] = useState(null);
  const [syllabusUploading, setSyllabusUploading] = useState(false);
  const syllabusInputRef = useRef(null);

  // Description editor states
  const [descTab, setDescTab] = useState('edit'); // 'edit' | 'preview'

  // Subject management modals
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [showManageSubjectsModal, setShowManageSubjectsModal] = useState(false);
  const [newSubject, setNewSubject] = useState({
    name: '',
    color: '#6366f1',
    icon: '📘',
    description: ''
  });
  const [creatingSubject, setCreatingSubject] = useState(false);
  const [deletingSubjectId, setDeletingSubjectId] = useState(null);

  const [form, setForm] = useState({
    title: '', tagline: '', description: '', syllabusPdfUrl: '', subjectId: '',
    registrationStartDate: '', registrationEndDate: '',
    examDate: '', examStartTime: '10:00', examDurationMinutes: 60,
    resultDate: '',
    eligibleClasses: [6, 7, 8, 9, 10, 11, 12],
    totalQuestions: 40, marksPerQuestion: 1, negativeMarks: 0, passingMarks: 0,
    registrationFee: 150,
    status: 'draft',
    prizeDetails: JSON.stringify([
      { rank: '1st Place', prize: '₹5,000 + Gold Medal + Certificate' },
      { rank: '2nd Place', prize: '₹3,000 + Silver Medal + Certificate' },
      { rank: '3rd Place', prize: '₹1,000 + Bronze Medal + Certificate' },
      { rank: 'Top 10%', prize: 'Distinction Certificate' },
      { rank: 'All', prize: 'Participation Certificate' },
    ], null, 2),
  });

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/olympiad/admin/subjects?all=true');
      setSubjects(res.data.data || []);
    } catch {
      toast.error('Failed to load subjects');
    }
  };

  useEffect(() => {
    fetchSubjects();
    if (isEdit) {
      api.get(`/olympiad/admin/olympiads/${id}`).then(r => {
        const o = r.data.data;
        setTemplateUrl(o.certificateTemplate || null);
        setSyllabusPdfUrl(o.syllabusPdfUrl || null);
        setForm({
          title: o.title || '',
          tagline: o.tagline || '',
          description: o.description || '',
          syllabusPdfUrl: o.syllabusPdfUrl || '',
          subjectId: o.subjectId || '',
          registrationStartDate: o.registrationStartDate || '',
          registrationEndDate: o.registrationEndDate || '',
          examDate: o.examDate || '',
          examStartTime: o.examStartTime || '10:00',
          examDurationMinutes: o.examDurationMinutes || 60,
          resultDate: o.resultDate || '',
          eligibleClasses: o.eligibleClasses || CLASSES,
          totalQuestions: o.totalQuestions || 40,
          marksPerQuestion: o.marksPerQuestion || 1,
          negativeMarks: o.negativeMarks || 0,
          passingMarks: o.passingMarks || 0,
          registrationFee: o.registrationFee || 150,
          status: o.status || 'draft',
          prizeDetails: JSON.stringify(o.prizeDetails || [], null, 2),
        });
      }).catch(err => {
        toast.error('Failed to load olympiad details');
      });
    }
  }, [id]);

  /* ── Template upload handler ── */
  const uploadTemplate = async (file) => {
    if (!file) return;
    if (!isEdit) { toast.error('Save the olympiad first, then upload a template'); return; }
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowed.includes(file.type)) { toast.error('Only PNG, JPG or WEBP images allowed'); return; }
    if (file.size > 20 * 1024 * 1024) { toast.error('Image must be under 20 MB'); return; }

    setTplFile(file);
    setTplUploading(true);
    try {
      const fd = new FormData();
      fd.append('template', file);
      const res = await api.post(`/olympiad/admin/olympiads/${id}/certificate-template`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setTemplateUrl(res.data.templateUrl);
      setTplFile(null);
      toast.success('Certificate template uploaded!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    }
    setTplUploading(false);
  };

  const removeTemplate = async () => {
    try {
      await api.put(`/olympiad/admin/olympiads/${id}`, { certificateTemplate: null });
      setTemplateUrl(null);
      setTplFile(null);
      toast.success('Template removed — built-in design will be used');
    } catch {
      toast.error('Could not remove template');
    }
  };

  /* ── Official Syllabus PDF Upload Handlers ── */
  const uploadSyllabusPdf = async (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed for Syllabus');
      return;
    }
    setSyllabusUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/olympiad/admin/study-materials/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data.url;
      setSyllabusPdfUrl(url);
      setForm(f => ({ ...f, syllabusPdfUrl: url }));
      toast.success('Official Syllabus PDF uploaded successfully!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Syllabus upload failed');
    }
    setSyllabusUploading(false);
  };

  const removeSyllabusPdf = () => {
    setSyllabusPdfUrl(null);
    setForm(f => ({ ...f, syllabusPdfUrl: '' }));
    toast.success('Syllabus PDF detached');
  };

  const toggleClass = (cls) => {
    setForm(f => ({
      ...f,
      eligibleClasses: f.eligibleClasses.includes(cls)
        ? f.eligibleClasses.filter(c => c !== cls)
        : [...f.eligibleClasses, cls].sort((a, b) => a - b),
    }));
  };

  /* ── Description Templates ── */
  const insertTemplate = (templateType) => {
    let textToInsert = '';
    if (templateType === 'full') {
      textToInsert = `🎯 Overview:
The National Olympiad is designed to assess conceptual mastery, logical aptitude, and creative problem-solving skills among aspiring students across India. Benchmarked against national standards, it empowers students with invaluable competitive exposure.

📚 Key Syllabus Highlights:
• Foundational Concepts & Definition Mastery
• Multi-Step Analytical Problem Solving
• Applied Real-World Questions & Logical Deductions
• High-Order Thinking Skills (HOTS)

🏆 Awards & Recognition:
• All-India Rank (AIR) and Class Percentile Benchmark
• Gold, Silver, Bronze Medals and Cash Scholarships for Top Performers
• Authenticated Certificate of Merit with tamper-proof QR verification
• 2 Free Mock Practice Tests with immediate performance feedback

📋 Exam Guidelines & Rules:
• 100% Online Computer-Based Test (CBT) with countdown timer
• AI proctored environment with fullscreen lockdown
• Auto-save enabled on every answer choice`;
    } else if (templateType === 'syllabus') {
      textToInsert = `📚 Detailed Syllabus Structure:
• Section 1: Conceptual Core (40% Weightage) — Fundamental syllabus questions assessing conceptual clarity and definitions.
• Section 2: Analytical Application (40% Weightage) — Non-routine mathematical and scientific problems requiring deduction.
• Section 3: Logical Aptitude & HOTS (20% Weightage) — Pattern recognition, critical analysis, and higher-order reasoning.`;
    } else if (templateType === 'prizes') {
      textToInsert = `🏆 Awards & Scholarship Structure:
• 1st Place (National Champion): Gold Trophy + ₹5,000 Cash Award + Certificate of Excellence
• 2nd Place: Silver Medal + ₹3,000 Cash Award + Certificate of Excellence
• 3rd Place: Bronze Medal + ₹1,000 Cash Award + Certificate of Merit
• Top 10% Rankers: National Distinction Certificate & Abhyo Elite Badge
• All Participants: Digital QR-Verifiable Participation Certificate`;
    } else if (templateType === 'rules') {
      textToInsert = `📋 Examination Day Guidelines:
• Login 15 minutes before exam start time to complete browser security check.
• Devices supported: Desktop, Laptop, Tablet, or Smartphone with modern browser.
• Fullscreen lockdown active: Tab switching and secondary windows are monitored.
• Automatic submission once time duration expires.`;
    }

    if (!form.description) {
      setForm(p => ({ ...p, description: textToInsert }));
    } else {
      setForm(p => ({ ...p, description: p.description.trim() + '\n\n' + textToInsert }));
    }
    toast.success('Template added to description!');
  };

  /* ── Create Subject Handler ── */
  const handleCreateSubject = async (e) => {
    e.preventDefault();
    if (!newSubject.name.trim()) {
      toast.error('Subject name is required');
      return;
    }
    setCreatingSubject(true);
    try {
      const res = await api.post('/olympiad/admin/subjects', newSubject);
      if (res.data?.data) {
        const created = res.data.data;
        setSubjects(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
        setForm(p => ({ ...p, subjectId: created.id }));
        setNewSubject({ name: '', color: '#6366f1', icon: '📘', description: '' });
        setShowAddSubjectModal(false);
        toast.success(`Subject "${created.name}" created!`);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create subject');
    } finally {
      setCreatingSubject(false);
    }
  };

  /* ── Delete Subject Handler ── */
  const handleDeleteSubject = async (subjectId, subjectName) => {
    if (!window.confirm(`Are you sure you want to delete "${subjectName}"? This will permanently remove the subject.`)) return;
    setDeletingSubjectId(subjectId);
    try {
      await api.delete(`/olympiad/admin/subjects/${subjectId}`);
      setSubjects(prev => prev.filter(s => s.id !== subjectId));
      if (form.subjectId === subjectId) {
        setForm(p => ({ ...p, subjectId: '' }));
      }
      toast.success(`Subject "${subjectName}" deleted`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Cannot delete subject');
    } finally {
      setDeletingSubjectId(null);
    }
  };

  /* ── Toggle Subject Active Handler ── */
  const handleToggleSubjectActive = async (subject) => {
    try {
      const newStatus = subject.isActive === false ? true : false;
      await api.put(`/olympiad/admin/subjects/${subject.id}`, { isActive: newStatus });
      setSubjects(prev => prev.map(s => s.id === subject.id ? { ...s, isActive: newStatus } : s));
      toast.success(`"${subject.name}" is now ${newStatus ? 'Active' : 'Inactive'}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update subject status');
    }
  };

  /* ── Submit Olympiad Form ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subjectId) { toast.error('Please select a subject'); return; }
    if (!form.eligibleClasses.length) { toast.error('Select at least one class'); return; }

    setSaving(true);
    try {
      let prizeDetails = null;
      try { prizeDetails = JSON.parse(form.prizeDetails); } catch {}

      const payload = { ...form, prizeDetails };

      if (isEdit) {
        await api.put(`/olympiad/admin/olympiads/${id}`, payload);
        toast.success('Olympiad updated!');
      } else {
        await api.post('/olympiad/admin/olympiads', payload);
        toast.success('Olympiad created!');
      }
      navigate('/admin/olympiad/list');
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const f = (field) => ({
    value: form[field],
    onChange: e => setForm(p => ({ ...p, [field]: e.target.value }))
  });

  const wordCount = form.description ? form.description.trim().split(/\s+/).filter(Boolean).length : 0;
  const charCount = form.description ? form.description.length : 0;

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button type="button" onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <Trophy className="w-6 h-6 text-indigo-600" />
            {isEdit ? 'Edit Olympiad' : 'Create New Olympiad'}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Fill in all details for the olympiad event</p>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          BASIC INFORMATION SECTION (ENHANCED SUBJECT & DESCRIPTION)
          ───────────────────────────────────────────────────────────────────── */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <h2 className="font-bold text-slate-800 flex items-center gap-2 text-base">
          <BookOpen className="w-4 h-4 text-indigo-500" /> Basic Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField label="Olympiad Title" required {...f('title')} placeholder="e.g. Abhyo Maths Olympiad 2026" />
          <InputField label="Tagline" {...f('tagline')} placeholder="e.g. Test Your Mathematical Excellence!" />
        </div>

        {/* ── ENHANCED SUBJECT SELECTOR WITH ADD & MANAGE MODALS ── */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-semibold text-slate-700">
              Subject <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAddSubjectModal(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-bold transition-colors"
                title="Add a new custom subject"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Subject</span>
              </button>
              <button
                type="button"
                onClick={() => setShowManageSubjectsModal(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition-colors"
                title="Manage or delete existing subjects"
              >
                <Settings className="w-3.5 h-3.5 text-slate-500" />
                <span>Manage Subjects</span>
              </button>
            </div>
          </div>

          <div className="relative">
            <select
              value={form.subjectId}
              onChange={e => setForm(p => ({ ...p, subjectId: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select subject...</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>
                  {s.icon ? `${s.icon} ` : ''}{s.name}
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Choose from existing subjects or click "+ Add Subject" to create custom subjects anytime.
          </p>
        </div>

        {/* ── ENHANCED DETAILED DESCRIPTION BOX ── */}
        <div className="pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <div>
              <label className="block text-sm font-semibold text-slate-700">
                Detailed Olympiad Description
              </label>
              <p className="text-xs text-slate-400">
                Provide comprehensive syllabus details, objectives, and exam format.
              </p>
            </div>

            {/* Edit / Preview Tab Toggle & Counters */}
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-medium text-slate-400">
                {wordCount} words &middot; {charCount} chars
              </span>
              <div className="inline-flex p-0.5 rounded-lg bg-slate-100 border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setDescTab('edit')}
                  className={`px-3 py-1 rounded-md font-semibold transition-all ${
                    descTab === 'edit'
                      ? 'bg-white text-indigo-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setDescTab('preview')}
                  className={`px-3 py-1 rounded-md font-semibold transition-all ${
                    descTab === 'preview'
                      ? 'bg-white text-indigo-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Live Preview
                </button>
              </div>
            </div>
          </div>

          {/* Quick Insert Template Buttons */}
          <div className="mb-2.5 flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
              Insert Templates:
            </span>
            <button
              type="button"
              onClick={() => insertTemplate('full')}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 text-xs font-semibold transition-colors flex items-center gap-1 shadow-2xs"
            >
              <Sparkles className="w-3 h-3 text-indigo-500" />
              <span>Full Overview</span>
            </button>
            <button
              type="button"
              onClick={() => insertTemplate('syllabus')}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors flex items-center gap-1 shadow-2xs"
            >
              <BookOpen className="w-3 h-3 text-blue-500" />
              <span>Syllabus Breakdown</span>
            </button>
            <button
              type="button"
              onClick={() => insertTemplate('prizes')}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors flex items-center gap-1 shadow-2xs"
            >
              <Trophy className="w-3 h-3 text-amber-500" />
              <span>Prizes & Awards</span>
            </button>
            <button
              type="button"
              onClick={() => insertTemplate('rules')}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors flex items-center gap-1 shadow-2xs"
            >
              <CheckCircle className="w-3 h-3 text-emerald-500" />
              <span>CBT Rules</span>
            </button>
            {form.description && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Clear description text?')) {
                    setForm(p => ({ ...p, description: '' }));
                  }
                }}
                className="ml-auto text-xs text-rose-500 hover:text-rose-700 px-2 py-1 font-medium transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {descTab === 'edit' ? (
            <div>
              <textarea
                rows={9}
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Write a detailed description for this Olympiad (overview, learning outcomes, syllabus topics, competition structure)..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y leading-relaxed"
              />
              <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                Line breaks, bullet points (&bull;), and numbered lists will automatically render cleanly on the student details page.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5 min-h-[220px]">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-indigo-500" /> Student View Live Preview:
              </div>
              {form.description ? (
                <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line space-y-2">
                  {form.description}
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">
                  No description provided yet. Type in Edit mode or use one of the templates above.
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Dates */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
        <h2 className="font-bold text-slate-800 flex items-center gap-2 text-base">
          <Calendar className="w-4 h-4 text-blue-500" /> Dates & Schedule
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <InputField label="Registration Start" type="date" required {...f('registrationStartDate')} />
          <InputField label="Registration End" type="date" required {...f('registrationEndDate')} />
          <InputField label="Exam Date" type="date" required {...f('examDate')} />
          <InputField label="Result Date" type="date" {...f('resultDate')} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField label="Exam Start Time" type="time" {...f('examStartTime')} helper="24-hour format e.g. 10:00" />
          <InputField label="Exam Duration (minutes)" type="number" {...f('examDurationMinutes')} placeholder="60" />
        </div>
      </section>

      {/* Eligibility */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
        <h2 className="font-bold text-slate-800 flex items-center gap-2 text-base">
          <Users className="w-4 h-4 text-purple-500" /> Eligibility & Exam Config
        </h2>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Eligible Classes <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2 flex-wrap">
            {CLASSES.map(c => (
              <button
                key={c} type="button" onClick={() => toggleClass(c)}
                className={`w-12 h-12 rounded-xl font-bold text-sm transition-all ${
                  form.eligibleClasses.includes(c)
                    ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <InputField label="Total Questions" type="number" {...f('totalQuestions')} />
          <InputField label="Marks/Question" type="number" {...f('marksPerQuestion')} />
          <InputField label="Negative Marks" type="number" {...f('negativeMarks')} />
          <InputField label="Passing Marks (%)" type="number" {...f('passingMarks')} />
        </div>
      </section>

      {/* Fee & Prizes */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
        <h2 className="font-bold text-slate-800 flex items-center gap-2 text-base">
          <DollarSign className="w-4 h-4 text-emerald-500" /> Registration Fee & Prizes
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField label="Registration Fee (₹)" type="number" required {...f('registrationFee')} placeholder="150" />
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Status</label>
            <select
              value={form.status}
              onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="draft">Draft (Hidden)</option>
              <option value="open">Open (Accepting Registrations)</option>
              <option value="closed">Closed (Registrations Finished)</option>
              <option value="ongoing">Ongoing (Exam In Progress)</option>
              <option value="completed">Completed (Results Out)</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Prize Details (JSON)</label>
          <textarea
            rows={5} value={form.prizeDetails}
            onChange={e => setForm(p => ({ ...p, prizeDetails: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <p className="text-xs text-slate-400 mt-1">
            Array of objects with <code>rank</code> and <code>prize</code> keys.
          </p>
        </div>
      </section>

      {/* Official Exam Syllabus (PDF Format) */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-800 flex items-center gap-2 text-base">
              <FileText className="w-4 h-4 text-red-500" /> Official Exam Syllabus (PDF Format)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Upload the official Syllabus PDF file that will be provided to registered students.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">
            PDF Required
          </span>
        </div>

        <div className="space-y-3">
          <input
            ref={syllabusInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={e => uploadSyllabusPdf(e.target.files[0])}
          />

          {syllabusPdfUrl ? (
            <div className="p-4 rounded-xl border border-red-200 bg-red-50/40 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {syllabusPdfUrl.split('/').pop() || 'Official_Olympiad_Syllabus.pdf'}
                  </p>
                  <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                    <CheckCircle className="w-3 h-3" /> Syllabus PDF Active & Attached
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={syllabusPdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-500" /> View PDF
                </a>
                <button
                  type="button"
                  onClick={() => syllabusInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg border border-red-200 bg-white text-xs font-semibold text-red-700 hover:bg-red-50 transition-colors"
                >
                  Replace PDF
                </button>
                <button
                  type="button"
                  onClick={removeSyllabusPdf}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Remove Syllabus PDF"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => syllabusInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center cursor-pointer hover:border-red-400 hover:bg-red-50/20 transition-all space-y-2"
            >
              {syllabusUploading ? (
                <div className="flex flex-col items-center gap-2 text-red-600">
                  <Loader className="w-6 h-6 animate-spin" />
                  <span className="text-xs font-semibold">Uploading Syllabus PDF…</span>
                </div>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Click to upload Official Syllabus PDF</p>
                    <p className="text-xs text-slate-400">PDF document up to 50 MB</p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Direct URL input */}
          <div className="pt-1">
            <span className="text-[11px] text-slate-400 block mb-1">Or enter direct Syllabus PDF URL:</span>
            <input
              type="text"
              value={form.syllabusPdfUrl || ''}
              onChange={e => {
                const val = e.target.value;
                setForm(p => ({ ...p, syllabusPdfUrl: val }));
                setSyllabusPdfUrl(val || null);
              }}
              placeholder="https://.../syllabus.pdf"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-red-400 font-mono"
            />
          </div>
        </div>
      </section>

      {/* Certificate Template */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div>
          <h2 className="font-bold text-slate-800 flex items-center gap-2 text-base">
            <Image className="w-4 h-4 text-amber-500" /> Certificate Template
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Upload custom background image (PNG/JPG/WEBP, 2000x1414 recommended).
          </p>
        </div>

        {!isEdit ? (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
            Save this Olympiad first, then you can upload a certificate template.
          </div>
        ) : (
          <div className="space-y-3">
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); uploadTemplate(e.dataTransfer.files[0]); }}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                dragOver ? 'border-amber-400 bg-amber-50' : 'border-slate-200 hover:border-amber-300 hover:bg-slate-50'
              }`}
            >
              <input
                ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                onChange={e => uploadTemplate(e.target.files[0])}
              />
              {templateUrl ? (
                <div className="space-y-2">
                  <img src={templateUrl} alt="Template" className="max-h-36 mx-auto rounded-lg shadow-sm border border-slate-200 object-contain" />
                  <p className="text-xs font-bold text-emerald-600">Custom Template Active</p>
                  <p className="text-xs text-slate-400">Click or drop a new image to replace</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-sm font-semibold text-slate-700">Drop certificate image here, or click to browse</p>
                  <p className="text-xs text-slate-400">PNG, JPG or WEBP up to 20 MB</p>
                </div>
              )}
              {tplUploading && templateUrl && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-xl">
                  <Loader className="w-8 h-8 text-amber-500 animate-spin" />
                </div>
              )}
            </div>

            {templateUrl && !tplUploading && (
              <button
                type="button" onClick={removeTemplate}
                className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-700 transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Remove template (use built-in design)
              </button>
            )}
          </div>
        )}
      </section>

      {/* Submit Buttons */}
      <div className="flex justify-end gap-3 pb-6">
        <button
          type="button" onClick={() => navigate(-1)}
          className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-all"
        >
          Cancel
        </button>
        <button
          type="submit" disabled={saving}
          className="flex items-center gap-2 px-8 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg disabled:opacity-60 transition-all shadow-md"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : isEdit ? 'Update Olympiad' : 'Create Olympiad'}
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          MODAL 1: ADD NEW SUBJECT MODAL
          ───────────────────────────────────────────────────────────────────── */}
      {showAddSubjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Tag className="w-5 h-5 text-indigo-600" />
                Add New Subject
              </h3>
              <button
                type="button"
                onClick={() => setShowAddSubjectModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 py-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Subject Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newSubject.name}
                  onChange={e => setNewSubject(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Social Studies, Astronomy, Cyber Security"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Subject Icon / Emoji
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={newSubject.icon}
                    onChange={e => setNewSubject(p => ({ ...p, icon: e.target.value }))}
                    className="w-16 text-center text-xl py-1.5 rounded-xl border border-slate-200"
                  />
                  <span className="text-xs text-slate-400">Pick from presets below or type custom:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_ICONS.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setNewSubject(p => ({ ...p, icon: emoji }))}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm border transition-all ${
                        newSubject.icon === emoji
                          ? 'border-indigo-600 bg-indigo-50 scale-105'
                          : 'border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Theme Color
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-full border border-slate-300" style={{ backgroundColor: newSubject.color }} />
                  <input
                    type="text"
                    value={newSubject.color}
                    onChange={e => setNewSubject(p => ({ ...p, color: e.target.value }))}
                    className="w-28 text-xs font-mono px-2 py-1 rounded-lg border border-slate-200"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewSubject(p => ({ ...p, color: c }))}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${
                        newSubject.color === c ? 'scale-110 border-slate-900 ring-2 ring-indigo-300' : 'border-white'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Short Description
                </label>
                <input
                  type="text"
                  value={newSubject.description}
                  onChange={e => setNewSubject(p => ({ ...p, description: e.target.value }))}
                  placeholder="e.g. National examination for classes 6 to 12"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddSubjectModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateSubject}
                disabled={creatingSubject}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all disabled:opacity-60 shadow-sm"
              >
                {creatingSubject ? 'Creating...' : 'Create Subject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────
          MODAL 2: MANAGE & DELETE SUBJECTS MODAL
          ───────────────────────────────────────────────────────────────────── */}
      {showManageSubjectsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-indigo-600" />
                  Manage Olympiad Subjects
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{subjects.length} active subject(s)</p>
              </div>
              <button
                type="button"
                onClick={() => setShowManageSubjectsModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-2 max-h-80 overflow-y-auto pr-1">
              {subjects.map(s => (
                <div
                  key={s.id}
                  className="p-3 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shadow-2xs text-white font-bold shrink-0"
                      style={{ backgroundColor: s.color || '#6366f1' }}
                    >
                      {s.icon || '📘'}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{s.name}</p>
                      <p className="text-[11px] text-slate-400 truncate max-w-[220px]">
                        {s.description || `Slug: ${s.slug}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleToggleSubjectActive(s)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        s.isActive !== false
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200'
                      }`}
                      title={`Click to toggle ${s.isActive !== false ? 'Inactive' : 'Active'}`}
                    >
                      {s.isActive !== false ? '● Active' : '○ Inactive'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSubject(s.id, s.name)}
                      disabled={deletingSubjectId === s.id}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                      title={`Delete "${s.name}"`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowManageSubjectsModal(false);
                  setShowAddSubjectModal(true);
                }}
                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Another Subject</span>
              </button>

              <button
                type="button"
                onClick={() => setShowManageSubjectsModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </form>
  );
}
