import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ChevronLeft, Image, Upload, Table2, ImagePlus, X, Sparkles,
  Layers, DollarSign, CheckCircle2, Link2, Zap, BookmarkCheck
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../lib/api';
import Editor from 'react-simple-wysiwyg';
import { EXAMS } from '../../data/examsData';

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  border: '1.5px solid #e2e8f0',
  borderRadius: 10,
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  color: '#0f172a',
  backgroundColor: '#fff',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};

const labelStyle = {
  fontSize: 12,
  fontWeight: 700,
  color: '#334155',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  marginBottom: 6,
};

export default function ExamSeriesForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const editing = location.state?.editing || null;
  const isEdit = !!editing;

  const [dbCategories, setDbCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState(editing?.thumbnailImage || editing?.thumbnail || '');
  const [thumbUploading, setThumbUploading] = useState(false);

  // Upcoming Government Exams Quick Fill & Linking State
  const [upcomingOptions, setUpcomingOptions] = useState(EXAMS);
  const [selectedUpcomingExam, setSelectedUpcomingExam] = useState('');
  const [examToLink, setExamToLink] = useState('');

  // Description editor extras
  const descImgInputRef = useRef(null);
  const [imgUploading, setImgUploading] = useState(false);
  const [tablePopup, setTablePopup] = useState(false);
  const [hoverCell, setHoverCell] = useState({ r: 0, c: 0 });
  const savedRangeRef = useRef(null);

  const [form, setForm] = useState({
    title: editing?.title || '',
    examName: editing?.examName || editing?.title || '',
    tagline: editing?.tagline || '',
    description: editing?.description || '',
    category: editing?.category || '',
    subCategory: editing?.subCategory || '',
    isFree: editing ? editing.isFree !== false : true,
    price: editing?.price || 0,
    isActive: editing ? editing.isActive !== false : true,
    isFeatured: !!editing?.isFeatured,
    thumbnailImage: editing?.thumbnailImage || editing?.thumbnail || '',
    linkedExams: Array.isArray(editing?.linkedExams) ? editing.linkedExams : (editing?.linkedExams ? [editing.linkedExams] : []),
    // Preserve legacy metadata in background if present on existing records
    examDetails: editing?.examDetails || {},
    eligibility: editing?.eligibility || [],
    syllabus: editing?.syllabus || [],
    examPattern: editing?.examPattern || [],
    importantDates: editing?.importantDates || [],
    highlights: editing?.highlights || [],
    faqs: editing?.faqs || [],
    selectionProcess: editing?.selectionProcess || [],
    salaryDetails: editing?.salaryDetails || [],
    howToApply: editing?.howToApply || [],
    importantLinks: editing?.importantLinks || [],
  });

  const [touchedExamName, setTouchedExamName] = useState(!!editing?.examName && editing.examName !== editing.title);

  const sf = (field, val) => setForm(p => ({ ...p, [field]: val }));

  useEffect(() => {
    api.get('/categories')
      .then(res => setDbCategories(res.data.data || []))
      .catch(() => {});

    // Also fetch live government jobs to combine with static EXAMS
    api.get('/government-jobs?limit=50')
      .then(res => {
        if (res.data?.data && Array.isArray(res.data.data)) {
          const liveGovJobs = res.data.data.map(j => ({
            id: `job-${j.id}`,
            slug: j.slug,
            name: j.shortName || j.title,
            category: j.category || 'Govt Job',
            org: j.organization,
            vacancies: j.totalVacancies,
            desc: j.description || j.tagline,
            eligibility: Array.isArray(j.qualification) ? j.qualification.join(', ') : j.qualification,
            ageLimit: j.ageLimit?.minimum && j.ageLimit?.maximum ? `${j.ageLimit.minimum}–${j.ageLimit.maximum} years` : undefined,
            startDate: j.applicationStartDate,
            lastDate: j.applicationLastDate,
            official: j.applyLink || j.officialWebsite,
            isLiveJob: true,
          }));
          const seenSlugs = new Set(EXAMS.map(e => e.slug));
          const extra = liveGovJobs.filter(j => !seenSlugs.has(j.slug));
          setUpcomingOptions([...EXAMS, ...extra]);
        }
      })
      .catch(() => {});
  }, []);

  // Quick-fill handler from Upcoming Exams
  const handleApplyAutofill = (examKey) => {
    if (!examKey) return;
    const exam = upcomingOptions.find(e => (e.slug || e.id) === examKey || e.name === examKey);
    if (!exam) return;

    const autoTitle = `${exam.name} Full Mock Test Series 2026`;
    const autoExamName = exam.name;
    const autoTagline = `Full-length mock tests, chapter-wise practice tests & previous year papers for ${exam.name}`;

    // Map category
    let autoCategory = exam.category || 'SSC';
    if (autoCategory === 'State') autoCategory = 'State PSC';
    const matchedDbCat = dbCategories.find(c => c.name.toLowerCase() === autoCategory.toLowerCase());
    if (matchedDbCat) autoCategory = matchedDbCat.name;

    // Formatted rich description
    const autoDesc = `<h3><strong>Comprehensive Test Series for ${exam.name}</strong></h3>
<p>Prepare thoroughly for <strong>${exam.name}</strong> with Abhyo's mock test series. Designed strictly according to the latest official syllabus and exam pattern released by ${exam.org || 'the official board'}.</p>
<h4><strong>What is included in this series:</strong></h4>
<ul>
  <li>Full-Length Mock Tests strictly based on the latest exam pattern</li>
  <li>Previous Year Question Papers (PYPs) with detailed step-by-step explanations</li>
  <li>Subject-wise and Chapter-wise speed tests to strengthen weak areas</li>
  <li>Real-time All India Ranking (AIR), percentile scores, and in-depth performance analytics</li>
</ul>
${Array.isArray(exam.syllabus) && exam.syllabus.length ? `<h4><strong>Key Syllabus Topics:</strong></h4><ul>${exam.syllabus.map(s => `<li>${s}</li>`).join('')}</ul>` : ''}
${exam.eligibility ? `<p><strong>Eligibility:</strong> ${exam.eligibility}</p>` : ''}
${exam.vacancies ? `<p><strong>Vacancies:</strong> ${typeof exam.vacancies === 'number' ? exam.vacancies.toLocaleString() : exam.vacancies} Posts</p>` : ''}
<p>Start practicing now to boost your speed, accuracy, and confidence before the examination!</p>`;

    const examSlug = exam.slug || exam.name;
    const currentLinked = Array.isArray(form.linkedExams) ? form.linkedExams : [];
    const updatedLinked = currentLinked.includes(examSlug) ? currentLinked : [...currentLinked, examSlug];

    setForm(p => ({
      ...p,
      title: autoTitle,
      examName: autoExamName,
      tagline: autoTagline,
      category: autoCategory,
      description: autoDesc,
      linkedExams: updatedLinked,
      examDetails: {
        organizer: exam.org || '',
        applicationDate: exam.startDate || '',
        lastDate: exam.lastDate || '',
        examDate: exam.examDate || '',
        vacancy: exam.vacancies ? String(exam.vacancies) : '',
        website: exam.official || '',
      },
      eligibility: exam.eligibility ? [{ label: 'Eligibility', value: exam.eligibility }] : p.eligibility,
      importantDates: exam.lastDate ? [{ event: 'Last Date to Apply', date: exam.lastDate }] : p.importantDates,
    }));

    setTouchedExamName(true);
    toast.success(`✨ Auto-filled details from "${exam.name}"!`);
  };

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) savedRangeRef.current = sel.getRangeAt(0).cloneRange();
  };

  const restoreSelection = () => {
    const sel = window.getSelection();
    if (sel && savedRangeRef.current) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    }
  };

  const insertHtmlAtCaret = (html) => {
    restoreSelection();
    document.execCommand('insertHTML', false, html);
  };

  const handleDescImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    setImgUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/exam-series/admin/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const url = `${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '')}${res.data.url}`;
      const imgHtml = `<img src="${url}" alt="" style="max-width:100%;height:auto;border-radius:8px;margin:8px 0;display:block;" />`;
      insertHtmlAtCaret(imgHtml);
      const ce = document.querySelector('.rsw-ce');
      if (ce) sf('description', ce.innerHTML);
      toast.success('Image inserted into description');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Image upload failed');
    } finally {
      setImgUploading(false);
    }
  };

  const insertTable = (rows, cols) => {
    const header = `<tr>${Array.from({ length: cols }, () => '<th style="border:1px solid #d1d5db;padding:7px 10px;background:#f8faff;font-weight:700;font-size:13px;">&nbsp;</th>').join('')}</tr>`;
    const bodyRows = Array.from({ length: rows - 1 }, () =>
      `<tr>${Array.from({ length: cols }, () => '<td style="border:1px solid #d1d5db;padding:7px 10px;font-size:13px;">&nbsp;</td>').join('')}</tr>`
    ).join('');
    const tableHtml = `<table style="border-collapse:collapse;width:100%;margin:10px 0;">${header}${bodyRows}</table><p><br></p>`;
    insertHtmlAtCaret(tableHtml);
    const ce = document.querySelector('.rsw-ce');
    if (ce) sf('description', ce.innerHTML);
    setTablePopup(false);
    toast.success(`${rows}×${cols} table inserted`);
  };

  const handleThumbChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setThumbnailPreview(URL.createObjectURL(file));
    setThumbUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/exam-series/admin/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      sf('thumbnailImage', res.data.url);
      toast.success('Thumbnail uploaded');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Thumbnail upload failed');
    } finally {
      setThumbUploading(false);
    }
  };

  const handleClearThumbnail = () => {
    setThumbnailPreview('');
    sf('thumbnailImage', '');
  };

  const handleSave = async () => {
    const cleanTitle = form.title.trim();
    if (!cleanTitle) {
      toast.error('Series Title is required');
      return;
    }
    if (!form.category) {
      toast.error('Category is required');
      return;
    }

    const payload = {
      ...form,
      title: cleanTitle,
      examName: form.examName?.trim() || cleanTitle,
      price: form.isFree ? 0 : (parseFloat(form.price) || 0),
    };

    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/exam-series/admin/${editing.id}`, payload);
        toast.success('Series updated successfully');
      } else {
        await api.post('/exam-series/admin/create', payload);
        toast.success('Series created successfully');
      }
      navigate('/admin/exam-series');
    } catch (e) {
      toast.error(e.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 940, margin: '0 auto', padding: '24px 20px 48px', fontFamily: "'Inter',-apple-system,sans-serif", color: '#0f172a' }}>
      <style>{`
        .rsw-editor { color: #0f172a !important; min-height: 240px; }
        .rsw-ce { padding: 14px 16px; min-height: 200px; font-size: 14px; line-height: 1.7; color: #0f172a; }
        .rsw-ce:focus { outline: none; }
        .rsw-ce h1,.rsw-ce h2,.rsw-ce h3 { font-weight: 700; margin: 8px 0 4px; }
        .rsw-ce ul,.rsw-ce ol { padding-left: 22px; margin: 6px 0; }
        .rsw-ce table { border-collapse: collapse; width: 100%; margin: 8px 0; }
        .rsw-ce table td,.rsw-ce table th { border: 1px solid #d1d5db; padding: 6px 10px; font-size: 13px; }
        .rsw-ce a { color: #6366f1; text-decoration: underline; }
        .rsw-ce img { max-width: 100%; border-radius: 8px; margin: 6px 0; }
        .rsw-toolbar {
          text-align: left !important;
          background: #f8fafc !important;
          border-bottom: 1px solid #e2e8f0 !important;
          padding: 6px 8px !important;
          display: flex;
          flex-wrap: wrap;
          gap: 2px;
        }
        .rsw-toolbar button {
          color: #475569 !important;
          border-radius: 6px !important;
          padding: 4px 7px !important;
          font-size: 13px !important;
          transition: background 0.15s, color 0.15s;
        }
        .rsw-toolbar button:hover { background: #e0e7ff !important; color: #4338ca !important; }
        .desc-editor-wrap:focus-within {
          border-color: #6366f1 !important;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.12) !important;
        }
        .desc-extra-toolbar {
          display: flex; align-items: center; gap: 6px;
          padding: 6px 10px;
          background: #f1f5f9;
          border-bottom: 1px solid #e2e8f0;
        }
        .desc-extra-btn {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 5px 10px; border-radius: 6px; border: 1px solid #cbd5e1;
          font-size: 11px; font-weight: 700; cursor: pointer;
          color: #4338ca; background: #fff;
          transition: background 0.15s, box-shadow 0.15s;
        }
        .desc-extra-btn:hover { background: #eef2ff; }
        .tbl-popup {
          position: absolute; z-index: 999; top: calc(100% + 4px); left: 0;
          background: #fff; border: 1px solid #e2e8f0; border-radius: 10px;
          padding: 10px; box-shadow: 0 10px 25px rgba(0,0,0,0.12);
          min-width: 200px;
        }
        .tbl-grid { display: grid; gap: 3px; }
        .tbl-cell {
          width: 18px; height: 18px; border-radius: 3px;
          border: 1px solid #e2e8f0;
          cursor: pointer; transition: background 0.1s;
        }
        .tbl-cell.active { background: #c7d2fe; border-color: #6366f1; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate('/admin/exam-series')}
            style={{
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: 10,
              padding: '8px 10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#475569',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
            }}
            title="Back to Exam Series"
          >
            <ChevronLeft size={18} />
          </button>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 }}>
              {isEdit ? '✏️ Edit Exam Series' : '➕ Create Exam Series'}
            </h1>
            <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>
              Set up your test series details, pricing, and appearance
            </p>
          </div>
        </div>
      </div>

      {/* Main Form Card */}
      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: '28px 32px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 20px -2px rgba(0,0,0,0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: 22,
      }}>

        {/* ⚡ Quick-Fill from Upcoming Government Exam */}
        <div style={{
          background: 'linear-gradient(135deg, #f0fdf4 0%, #eef2ff 100%)',
          border: '1.5px solid #c7d2fe',
          borderRadius: 14,
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          boxShadow: '0 2px 10px rgba(99,102,241,0.06)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(79,70,229,0.3)' }}>
                <Zap size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: 13, fontWeight: 800, color: '#1e1b4b', margin: 0 }}>
                  ⚡ Quick-Fill from Upcoming Government Exam
                </h3>
                <p style={{ fontSize: 11, color: '#6366f1', margin: 0, fontWeight: 500 }}>
                  Select an upcoming exam to instantly populate Title, Category, Tagline &amp; comprehensive Description
                </p>
              </div>
            </div>
            {selectedUpcomingExam && (
              <span style={{ fontSize: 11, fontWeight: 700, color: '#059669', background: '#d1fae5', padding: '3px 10px', borderRadius: 20 }}>
                ✓ Ready to Apply
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              style={{ ...inputStyle, flex: 1, minWidth: 280, borderColor: '#a5b4fc', backgroundColor: '#fff', fontWeight: 600 }}
              value={selectedUpcomingExam}
              onChange={e => setSelectedUpcomingExam(e.target.value)}
            >
              <option value="">-- Choose an Upcoming Government Exam (SSC, Railway, Banking, UPSC, Defence, State) --</option>
              {upcomingOptions.map(ex => {
                const key = ex.slug || ex.id;
                return (
                  <option key={key} value={key}>
                    {ex.name} ({ex.category || 'Govt Exam'}) {ex.vacancies ? `• ${typeof ex.vacancies === 'number' ? ex.vacancies.toLocaleString() : ex.vacancies} Posts` : ''}
                  </option>
                );
              })}
            </select>
            <button
              type="button"
              disabled={!selectedUpcomingExam}
              onClick={() => handleApplyAutofill(selectedUpcomingExam)}
              style={{
                padding: '10px 18px',
                background: selectedUpcomingExam ? 'linear-gradient(135deg, #4f46e5, #7c3aed)' : '#cbd5e1',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 700,
                cursor: selectedUpcomingExam ? 'pointer' : 'not-allowed',
                boxShadow: selectedUpcomingExam ? '0 2px 8px rgba(79,70,229,0.3)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              <Sparkles size={14} /> Auto-fill Details
            </button>
          </div>
        </div>

        {/* 1. Series Title & Exam Name */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14 }}>
          <div>
            <label style={labelStyle}>
              <span>Series Title</span> <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              style={inputStyle}
              placeholder="e.g. NDA 2026 Full Mock Test Series"
              value={form.title}
              onChange={e => {
                const val = e.target.value;
                setForm(p => ({
                  ...p,
                  title: val,
                  examName: (!touchedExamName || !p.examName) ? val : p.examName,
                }));
              }}
            />
          </div>
          <div>
            <label style={labelStyle}>
              <span>Short / Exam Name</span>
              <span style={{ fontSize: 10, fontWeight: 500, color: '#94a3b8' }}>(for badges &amp; URL)</span>
            </label>
            <input
              style={inputStyle}
              placeholder="e.g. NDA 2026"
              value={form.examName}
              onChange={e => {
                setTouchedExamName(true);
                sf('examName', e.target.value);
              }}
            />
          </div>
        </div>

        {/* 2. Tagline */}
        <div>
          <label style={labelStyle}>Tagline / Subtitle</label>
          <input
            style={inputStyle}
            placeholder="e.g. 50+ Full Mock Tests, Previous Year Papers & Detailed Solutions"
            value={form.tagline}
            onChange={e => sf('tagline', e.target.value)}
          />
        </div>

        {/* 3. Category & Sub Category & Payment */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
          <div>
            <label style={labelStyle}>
              <span>Category</span> <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              style={inputStyle}
              value={form.category}
              onChange={e => {
                sf('category', e.target.value);
                sf('subCategory', '');
              }}
            >
              <option value="">Select Category</option>
              {!dbCategories.find(c => c.name === form.category) && form.category && (
                <option value={form.category}>{form.category}</option>
              )}
              {dbCategories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Sub Category</label>
            <select
              style={inputStyle}
              value={form.subCategory}
              onChange={e => sf('subCategory', e.target.value)}
              disabled={!form.category}
            >
              <option value="">None / Not Applicable</option>
              {dbCategories.find(c => c.name === form.category)?.subCategories?.map(sub => (
                <option key={sub.id} value={sub.name}>{sub.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Access Type</label>
            <select
              style={inputStyle}
              value={form.isFree ? 'free' : 'premium'}
              onChange={e => {
                const isFree = e.target.value === 'free';
                sf('isFree', isFree);
                if (isFree) sf('price', 0);
                else if (!form.price) sf('price', 499);
              }}
            >
              <option value="free">🆓 Free Access</option>
              <option value="premium">💎 Premium / Paid</option>
            </select>
          </div>
        </div>

        {/* Premium Price Input (Visible when Premium is selected) */}
        {!form.isFree && (
          <div style={{ padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10 }}>
            <label style={labelStyle}>
              <DollarSign size={14} style={{ color: '#6366f1' }} /> Price (₹)
            </label>
            <input
              type="number"
              min="0"
              style={{ ...inputStyle, maxWidth: 220 }}
              placeholder="e.g. 499"
              value={form.price || ''}
              onChange={e => sf('price', e.target.value)}
            />
            <p style={{ fontSize: 11, color: '#64748b', margin: '4px 0 0' }}>
              Students will need to purchase this series or hold an active subscription to access premium tests.
            </p>
          </div>
        )}

        {/* 4. Covered / Linked Upcoming Exams */}
        <div style={{
          background: '#f8fafc',
          border: '1.5px solid #e2e8f0',
          borderRadius: 14,
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <label style={{ ...labelStyle, margin: 0 }}>
              <Layers size={15} style={{ color: '#6366f1' }} />
              <span>Covered / Linked Upcoming Exams</span>
              <span style={{ fontSize: 10, fontWeight: 500, color: '#94a3b8' }}>(Connect one or multiple exams to this series)</span>
            </label>
            <span style={{ fontSize: 11, color: '#4338ca', fontWeight: 700, background: '#e0e7ff', padding: '2px 10px', borderRadius: 12 }}>
              {form.linkedExams.length} Exam{form.linkedExams.length !== 1 ? 's' : ''} Linked
            </span>
          </div>

          <p style={{ fontSize: 11, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
            Students viewing linked upcoming exams on Abhyo will see direct buttons to practice this test series. You can link multiple exams to create combo series (e.g. SSC CGL + CHSL + MTS).
          </p>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              style={{ ...inputStyle, flex: 1, minWidth: 260, backgroundColor: '#fff' }}
              value={examToLink}
              onChange={e => {
                const val = e.target.value;
                if (val && !form.linkedExams.includes(val)) {
                  sf('linkedExams', [...form.linkedExams, val]);
                  toast.success('Exam linked to series!');
                }
                setExamToLink('');
              }}
            >
              <option value="">+ Add an Upcoming Exam covered by this test series...</option>
              {upcomingOptions.map(ex => {
                const key = ex.slug || ex.name;
                const alreadyLinked = form.linkedExams.includes(key);
                return (
                  <option key={key} value={key} disabled={alreadyLinked}>
                    {alreadyLinked ? `✓ ${ex.name} (Already Added)` : `${ex.name} (${ex.category || 'Govt'})`}
                  </option>
                );
              })}
            </select>
          </div>

          {form.linkedExams.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
              {form.linkedExams.map(slug => {
                const match = upcomingOptions.find(o => (o.slug || o.name) === slug);
                const label = match ? match.name : slug;
                const cat = match?.category || '';
                return (
                  <div
                    key={slug}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: '#fff',
                      border: '1.5px solid #c7d2fe',
                      color: '#3730a3',
                      padding: '5px 12px',
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 700,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                    }}
                  >
                    <span>🏛️ {label}</span>
                    {cat && <span style={{ fontSize: 10, color: '#6366f1', background: '#eef2ff', padding: '1px 6px', borderRadius: 10 }}>{cat}</span>}
                    <button
                      type="button"
                      onClick={() => sf('linkedExams', form.linkedExams.filter(s => s !== slug))}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        padding: 0,
                        marginLeft: 2,
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      title="Remove exam"
                    >
                      <X size={13} style={{ color: '#ef4444' }} />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
              No exams linked yet. Use the dropdown above to link upcoming government exams.
            </p>
          )}
        </div>

        {/* 5. Thumbnail Image */}
        <div>
          <label style={labelStyle}>Thumbnail Image</label>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{
              width: 130,
              height: 82,
              borderRadius: 10,
              border: '1.5px dashed #cbd5e1',
              overflow: 'hidden',
              background: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {thumbnailPreview ? (
                <img src={thumbnailPreview} alt="Thumbnail preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <Image size={28} color="#94a3b8" />
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <label style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  background: thumbUploading ? '#e0e7ff' : '#4f46e5',
                  color: '#fff',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: thumbUploading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 1px 3px rgba(79,70,229,0.2)'
                }}>
                  <Upload size={14} /> {thumbUploading ? 'Uploading...' : 'Upload Thumbnail'}
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleThumbChange} disabled={thumbUploading} />
                </label>
                {thumbnailPreview && (
                  <button
                    type="button"
                    onClick={handleClearThumbnail}
                    style={{
                      background: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: 8,
                      padding: '8px 12px',
                      fontSize: 12,
                      color: '#ef4444',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
              <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>
                Recommended: 800×450px aspect ratio (JPG, PNG, WebP)
              </p>
            </div>
          </div>
        </div>

        {/* 5. Description (Rich Text Editor) */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <label style={labelStyle}>
              <Sparkles size={14} style={{ color: '#6366f1' }} /> Series Description
            </label>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>
              {form.description.replace(/<[^>]*>/g, '').length} characters
            </span>
          </div>

          <div
            className="desc-editor-wrap"
            style={{
              background: '#fff',
              border: '1.5px solid #e2e8f0',
              borderRadius: 10,
              overflow: 'hidden',
              transition: 'border-color 0.2s',
            }}
          >
            {/* Toolbar extras */}
            <div className="desc-extra-toolbar">
              <button
                type="button"
                className="desc-extra-btn"
                disabled={imgUploading}
                onClick={() => { saveSelection(); descImgInputRef.current?.click(); }}
                title="Insert Image"
              >
                <ImagePlus size={13} />
                {imgUploading ? 'Uploading…' : 'Insert Image'}
              </button>
              <input ref={descImgInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleDescImageUpload} />

              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  className="desc-extra-btn"
                  onClick={() => { saveSelection(); setTablePopup(p => !p); }}
                  title="Insert Table"
                >
                  <Table2 size={13} />
                  Insert Table
                </button>

                {tablePopup && (
                  <div className="tbl-popup" onMouseLeave={() => setHoverCell({ r: 0, c: 0 })}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: '#4f46e5', margin: '0 0 6px', letterSpacing: 0.5 }}>SELECT TABLE SIZE</p>
                    <div className="tbl-grid" style={{ gridTemplateColumns: 'repeat(8, 18px)' }}>
                      {Array.from({ length: 8 * 8 }, (_, idx) => {
                        const r = Math.floor(idx / 8);
                        const c = idx % 8;
                        const active = r < hoverCell.r && c < hoverCell.c;
                        return (
                          <div
                            key={idx}
                            className={`tbl-cell${active ? ' active' : ''}`}
                            onMouseEnter={() => setHoverCell({ r: r + 1, c: c + 1 })}
                            onClick={() => insertTable(hoverCell.r, hoverCell.c)}
                          />
                        );
                      })}
                    </div>
                    <p style={{ fontSize: 10, color: '#64748b', margin: '6px 0 0', textAlign: 'center' }}>
                      {hoverCell.r > 0 && hoverCell.c > 0
                        ? `${hoverCell.r} × ${hoverCell.c}`
                        : 'Hover to select'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <Editor
              value={form.description}
              onChange={e => sf('description', e.target.value)}
              onSelect={saveSelection}
              onKeyUp={saveSelection}
              onMouseUp={saveSelection}
              containerProps={{ style: { border: 'none', minHeight: 220 } }}
            />
          </div>
        </div>

        {/* 6. Visibility & Publishing options */}
        <div style={{
          display: 'flex',
          gap: 20,
          padding: '14px 18px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 10,
          alignItems: 'center'
        }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              style={{ width: 16, height: 16, accentColor: '#4f46e5' }}
              checked={form.isActive}
              onChange={e => sf('isActive', e.target.checked)}
            />
            Active (Visible to students)
          </label>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              style={{ width: 16, height: 16, accentColor: '#f59e0b' }}
              checked={form.isFeatured}
              onChange={e => sf('isFeatured', e.target.checked)}
            />
            ⭐ Featured (Show on homepage &amp; banners)
          </label>
        </div>

        {/* Bottom Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, borderTop: '1px solid #f1f5f9', paddingTop: 18 }}>
          <button
            type="button"
            onClick={() => navigate('/admin/exam-series')}
            style={{
              padding: '9px 20px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              border: '1px solid #cbd5e1',
              background: '#fff',
              color: '#475569',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '9px 26px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              border: 'none',
              background: saving ? '#94a3b8' : '#4f46e5',
              color: '#fff',
              cursor: saving ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 6px rgba(79,70,229,0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <CheckCircle2 size={16} />
            {saving ? 'Saving...' : (isEdit ? 'Update Series' : 'Create Series')}
          </button>
        </div>

      </div>
    </div>
  );
}
