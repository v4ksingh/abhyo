import React, { useEffect, useState, useCallback } from 'react';
import {
  Plus, Search, Upload, Edit, Trash2, Brain,
  Image, CheckSquare, AlignLeft, BookOpen, Columns,
  X, ChevronDown, ChevronUp, Globe, Tag
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../lib/api';
import ExportButtons from '../../components/shared/ExportButtons';

// ── Question type config ─────────────────────────────────────
const Q_TYPES = [
  { id: 'mcq',          label: 'Single MCQ',        icon: '🔘', desc: '4 options, one correct answer'               },
  { id: 'multi_correct',label: 'Multi Correct',      icon: '☑️', desc: 'Multiple options can be correct'           },
  { id: 'true_false',   label: 'True / False',       icon: '✅', desc: 'Two options: True or False'                },
  { id: 'fill_blank',   label: 'Fill in the Blank',  icon: '📝', desc: 'Student types the answer'                  },
  { id: 'passage',      label: 'Passage / Comprehension', icon: '📖', desc: 'Reading passage with MCQ sub-questions' },
  { id: 'match',        label: 'Match the Column',   icon: '🔗', desc: 'Match items from two columns'              },
];

const DIFF_BADGE = {
  easy:   'bg-emerald-100 text-emerald-700 border border-emerald-200',
  medium: 'bg-amber-100 text-amber-700 border border-amber-200',
  hard:   'bg-red-100 text-red-700 border border-red-200',
};
const TYPE_BADGE = {
  mcq:          'bg-blue-100 text-blue-700',
  multi_correct:'bg-purple-100 text-purple-700',
  true_false:   'bg-teal-100 text-teal-700',
  fill_blank:   'bg-orange-100 text-orange-700',
  passage:      'bg-indigo-100 text-indigo-700',
  match:        'bg-pink-100 text-pink-700',
};

const makeOption = (label) => ({ label, text: '', textHindi: '', image: '' });
const INIT_OPTIONS = ['A','B','C','D'].map(makeOption);

const INIT_FORM = {
  questionType: 'mcq',
  questionText: '', questionTextHindi: '',
  passage: '', passageHindi: '',
  image: '',
  options: INIT_OPTIONS,
  correctAnswer: 'A',
  correctAnswers: [],
  matchPairs: [{ left: '', right: '' },{ left: '', right: '' },{ left: '', right: '' },{ left: '', right: '' }],
  explanation: '', explanationHindi: '', explanationImage: '',
  subjectId: '', topic: '', difficulty: 'medium', categoryId: '',
  marks: 2, negativeMarks: 0.67, language: 'en', tags: '',
};

// ══════════════════════════════════════════════════════════════
// ADD/EDIT QUESTION MODAL
// ══════════════════════════════════════════════════════════════
function QuestionModal({ editQ, onClose, onSaved, subjects, categories }) {
  const [form, setForm] = useState(() => {
    if (!editQ) return { ...INIT_FORM };
    return {
      ...INIT_FORM, ...editQ,
      options: editQ.options?.length ? editQ.options : INIT_OPTIONS,
      correctAnswers: editQ.correctAnswers || [],
      matchPairs: editQ.matchPairs?.length ? editQ.matchPairs : INIT_FORM.matchPairs,
      tags: Array.isArray(editQ.tags) ? editQ.tags.join(', ') : editQ.tags || '',
    };
  });
  const [saving, setSaving] = useState(false);
  const [showHindi, setShowHindi] = useState(false);
  const [uploadingImg, setUploadingImg] = useState('');

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  // When type changes reset relevant fields
  const changeType = (type) => {
    const updates = { questionType: type };
    if (type === 'true_false') {
      updates.options = [makeOption('A'), makeOption('B')];
      updates.options[0].text = 'True';
      updates.options[1].text = 'False';
      updates.correctAnswer = 'A';
    } else if (type === 'fill_blank') {
      updates.options = [];
    } else if (type === 'match') {
      updates.options = [];
    } else if (form.options.length < 4) {
      updates.options = INIT_OPTIONS;
    }
    setForm(f => ({ ...f, ...updates }));
  };

  // Image upload helper (reuses uploads endpoint via multipart)
  const uploadImage = async (file, field) => {
    setUploadingImg(field);
    const fd = new FormData();
    fd.append('image', file);
    try {
      const res = await api.post('/questions/upload-image', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      set(field, res.data.data.url);
      toast.success('Image uploaded!');
    } catch {
      toast.error('Image upload failed');
    } finally { setUploadingImg(''); }
  };

  const updateOption = (i, field, val) => {
    const opts = [...form.options];
    opts[i] = { ...opts[i], [field]: val };
    set('options', opts);
  };
  const addOption = () => {
    const labels = ['A','B','C','D','E'];
    if (form.options.length >= 5) return toast.error('Max 5 options');
    set('options', [...form.options, makeOption(labels[form.options.length])]);
  };
  const removeOption = (i) => {
    if (form.options.length <= 2) return toast.error('Min 2 options');
    const opts = form.options.filter((_, idx) => idx !== i)
      .map((o, idx) => ({ ...o, label: ['A','B','C','D','E'][idx] }));
    set('options', opts);
    if (form.correctAnswer === form.options[i].label) set('correctAnswer', opts[0].label);
  };

  const toggleMultiAnswer = (label) => {
    const arr = [...(form.correctAnswers || [])];
    const idx = arr.indexOf(label);
    if (idx >= 0) arr.splice(idx, 1); else arr.push(label);
    set('correctAnswers', arr);
  };

  const updateMatch = (i, side, val) => {
    const pairs = [...form.matchPairs];
    pairs[i] = { ...pairs[i], [side]: val };
    set('matchPairs', pairs);
  };
  const addMatchPair = () => set('matchPairs', [...form.matchPairs, { left: '', right: '' }]);
  const removeMatchPair = (i) => set('matchPairs', form.matchPairs.filter((_, idx) => idx !== i));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.subjectId) return toast.error('Subject is required');
    setSaving(true);
    try {
      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        correctAnswers: form.questionType === 'multi_correct' ? form.correctAnswers : null,
        matchPairs: form.questionType === 'match' ? form.matchPairs : null,
        passage: ['passage'].includes(form.questionType) ? form.passage : null,
        categoryId: form.categoryId || null,
      };
      if (editQ) {
        await api.put(`/questions/${editQ.id}`, payload);
        toast.success('Question updated!');
      } else {
        await api.post('/questions', payload);
        toast.success('Question added!');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally { setSaving(false); }
  };

  const t = form.questionType;

  return (
    <div className="fixed inset-0 z-50 flex items-stretch bg-black/60 backdrop-blur-sm overflow-y-auto py-4">
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-auto my-auto flex flex-col animate-slide-up">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-purple-50 to-slate-50 rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{editQ ? '✏️ Edit Question' : '➕ Add Question'}</h2>
            <p className="text-xs text-slate-500 mt-0.5">Fill in all required fields to save</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center text-slate-500 transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">

          {/* ── Step 1: Question Type ─────────────────────────── */}
          <div>
            <label className="label">Question Type *</label>
            <div className="grid grid-cols-3 gap-2">
              {Q_TYPES.map(qt => (
                <button type="button" key={qt.id}
                  onClick={() => changeType(qt.id)}
                  className={`flex items-start gap-2 p-3 rounded-xl border-2 text-left transition-all ${
                    t === qt.id ? 'border-primary-500 bg-primary-50' : 'border-slate-200 hover:border-primary-300 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-lg flex-shrink-0">{qt.icon}</span>
                  <div>
                    <p className={`text-xs font-bold ${t === qt.id ? 'text-primary-700' : 'text-slate-700'}`}>{qt.label}</p>
                    <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{qt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ── Step 2: Passage (if passage type) ────────────── */}
          {t === 'passage' && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 space-y-3">
              <p className="text-sm font-bold text-indigo-800 flex items-center gap-2"><BookOpen size={14} /> Reading Passage</p>
              <textarea value={form.passage} onChange={e => set('passage', e.target.value)}
                className="input-field !bg-white resize-none" rows={5}
                placeholder="Enter the comprehension passage here. Students will read this before answering the question." required />
              {showHindi && (
                <textarea value={form.passageHindi} onChange={e => set('passageHindi', e.target.value)}
                  className="input-field !bg-white resize-none" rows={4} placeholder="Hindi passage (optional)" />
              )}
            </div>
          )}

          {/* ── Step 3: Question Text + Image ────────────────── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="label !mb-0">Question Text (English) *</label>
              <button type="button" onClick={() => setShowHindi(h => !h)}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-primary-600 transition-colors">
                <Globe size={12} /> {showHindi ? 'Hide Hindi' : 'Add Hindi'}
              </button>
            </div>
            <textarea value={form.questionText} onChange={e => set('questionText', e.target.value)}
              className="input-field resize-none" rows={3}
              placeholder={t === 'fill_blank' ? 'The capital of India is _______ .' : 'Enter the question...'}
              required />
            {showHindi && (
              <textarea value={form.questionTextHindi} onChange={e => set('questionTextHindi', e.target.value)}
                className="input-field resize-none" rows={2} placeholder="प्रश्न हिंदी में (वैकल्पिक)" />
            )}

            {/* Question image */}
            <div className="flex items-center gap-3">
              {form.image ? (
                <div className="relative flex-shrink-0">
                  <img src={form.image} alt="Question" className="w-28 h-20 object-cover rounded-xl border border-slate-200" />
                  <button type="button" onClick={() => set('image', '')}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center">
                    <X size={10} />
                  </button>
                </div>
              ) : null}
              <div>
                <p className="text-xs text-slate-500 font-medium mb-1">📷 Question Image (optional)</p>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer text-xs font-semibold text-slate-600 transition-colors">
                    <Upload size={12} /> {uploadingImg === 'image' ? 'Uploading...' : 'Upload Image'}
                    <input type="file" accept="image/*" className="hidden"
                      onChange={e => e.target.files[0] && uploadImage(e.target.files[0], 'image')} />
                  </label>
                  <span className="text-xs text-slate-400">or</span>
                  <input type="url" value={form.image} onChange={e => set('image', e.target.value)}
                    placeholder="Paste image URL..." className="input-field !py-1.5 !text-xs flex-1" />
                </div>
              </div>
            </div>
          </div>

          {/* ── Step 4: Options / Answer ──────────────────────── */}

          {/* MCQ / Passage options */}
          {(t === 'mcq' || t === 'passage' || t === 'multi_correct') && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="label !mb-0">Answer Options *</label>
                {t !== 'true_false' && (
                  <button type="button" onClick={addOption}
                    className="text-xs text-primary-600 font-semibold hover:text-primary-700 flex items-center gap-1">
                    <Plus size={12} /> Add Option
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {form.options.map((opt, i) => {
                  const isCorrect = t === 'multi_correct'
                    ? (form.correctAnswers || []).includes(opt.label)
                    : form.correctAnswer === opt.label;
                  return (
                    <div key={opt.label} className={`rounded-xl border-2 p-3 transition-all ${isCorrect ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200'}`}>
                      <div className="flex items-center gap-2">
                        {/* Toggle correct */}
                        <button type="button"
                          onClick={() => t === 'multi_correct' ? toggleMultiAnswer(opt.label) : set('correctAnswer', opt.label)}
                          className={`w-7 h-7 flex-shrink-0 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${
                            isCorrect ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          }`} title="Click to mark as correct">
                          {opt.label}
                        </button>
                        <input type="text" value={opt.text} onChange={e => updateOption(i, 'text', e.target.value)}
                          className="input-field flex-1 !py-1.5 !text-sm" placeholder={`Option ${opt.label}`} required />
                        {/* Option image */}
                        <label className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 cursor-pointer text-slate-500 transition-colors" title="Add image to this option">
                          <Image size={13} />
                          <input type="file" accept="image/*" className="hidden"
                            onChange={e => e.target.files[0] && uploadImage(e.target.files[0], `opt_img_${i}`)} />
                        </label>
                        {t !== 'true_false' && form.options.length > 2 && (
                          <button type="button" onClick={() => removeOption(i)}
                            className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors">
                            <X size={13} />
                          </button>
                        )}
                      </div>
                      {opt.image && (
                        <div className="mt-2 flex items-center gap-2">
                          <img src={opt.image} alt="" className="w-16 h-12 object-cover rounded-lg border" />
                          <button type="button" onClick={() => updateOption(i, 'image', '')} className="text-xs text-red-400">Remove</button>
                        </div>
                      )}
                      {showHindi && (
                        <input type="text" value={opt.textHindi || ''} onChange={e => updateOption(i, 'textHindi', e.target.value)}
                          className="input-field !py-1 !text-xs mt-2" placeholder={`Option ${opt.label} in Hindi`} />
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-slate-400 mt-1.5">
                {t === 'multi_correct'
                  ? `✅ Click the letter badge to mark/unmark correct answers (${(form.correctAnswers||[]).join(', ') || 'none selected'})`
                  : '✅ Click the letter badge to mark the correct answer'}
              </p>
            </div>
          )}

          {/* True/False */}
          {t === 'true_false' && (
            <div>
              <label className="label">Correct Answer *</label>
              <div className="flex gap-3">
                {['True', 'False'].map(val => (
                  <button type="button" key={val}
                    onClick={() => set('correctAnswer', val)}
                    className={`flex-1 py-3 rounded-xl border-2 font-bold text-sm transition-all ${
                      form.correctAnswer === val ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}>
                    {val === 'True' ? '✅ True' : '❌ False'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Fill in the blank */}
          {t === 'fill_blank' && (
            <div>
              <label className="label">Correct Answer *</label>
              <input type="text" value={form.correctAnswer || ''} onChange={e => set('correctAnswer', e.target.value)}
                className="input-field" placeholder="The exact correct answer text..." required />
              <p className="text-xs text-slate-400 mt-1">The student's answer will be matched against this (case-insensitive)</p>
            </div>
          )}

          {/* Match the column */}
          {t === 'match' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="label !mb-0">Match Pairs *</label>
                <button type="button" onClick={addMatchPair}
                  className="text-xs text-primary-600 font-semibold hover:text-primary-700 flex items-center gap-1">
                  <Plus size={12} /> Add Pair
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <p className="text-xs font-semibold text-slate-500 text-center">Column A (Left)</p>
                <p className="text-xs font-semibold text-slate-500 text-center">Column B (Right)</p>
              </div>
              <div className="space-y-2">
                {form.matchPairs.map((pair, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 w-5">{i+1}.</span>
                    <input type="text" value={pair.left} onChange={e => updateMatch(i, 'left', e.target.value)}
                      className="input-field flex-1 !py-2 !text-sm" placeholder={`Item ${i+1}`} required />
                    <span className="text-slate-400">⟶</span>
                    <input type="text" value={pair.right} onChange={e => updateMatch(i, 'right', e.target.value)}
                      className="input-field flex-1 !py-2 !text-sm" placeholder={`Match ${i+1}`} required />
                    {form.matchPairs.length > 2 && (
                      <button type="button" onClick={() => removeMatchPair(i)}
                        className="p-1 text-red-400 hover:text-red-600 transition-colors">
                        <X size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-2">Correct answer = matching all pairs correctly in order</p>
            </div>
          )}

          {/* ── Step 5: Meta ──────────────────────────────────── */}
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="label">Category</label>
              <select value={form.categoryId || ''} onChange={e => set('categoryId', e.target.value)} className="input-field">
                <option value="">-- No Category --</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Subject *</label>
              <select value={form.subjectId || ''} onChange={e => set('subjectId', e.target.value)} className="input-field" required>
                <option value="">-- Select Subject --</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Topic</label>
              <input type="text" value={form.topic || ''} onChange={e => set('topic', e.target.value)}
                className="input-field" placeholder="e.g. Amendments" />
            </div>
            <div>
              <label className="label">Difficulty</label>
              <select value={form.difficulty} onChange={e => set('difficulty', e.target.value)} className="input-field">
                <option value="easy">🟢 Easy</option>
                <option value="medium">🟡 Medium</option>
                <option value="hard">🔴 Hard</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Marks</label>
              <input type="number" step="0.5" min={0} value={form.marks} onChange={e => set('marks', +e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="label">Negative Marks</label>
              <input type="number" step="0.25" min={0} value={form.negativeMarks} onChange={e => set('negativeMarks', +e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="label">Language</label>
              <select value={form.language} onChange={e => set('language', e.target.value)} className="input-field">
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="bilingual">Bilingual</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Tags (comma separated)</label>
            <input type="text" value={form.tags} onChange={e => set('tags', e.target.value)}
              className="input-field" placeholder="UPSC, Polity, 2024" />
          </div>

          {/* ── Explanation ───────────────────────────────────── */}
          <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
            <label className="label !mb-0 flex items-center gap-2">
              💡 Explanation <span className="text-slate-400 font-normal text-xs">(shown after submission)</span>
            </label>
            <textarea value={form.explanation || ''} onChange={e => set('explanation', e.target.value)}
              className="input-field !bg-white resize-none" rows={2}
              placeholder="Explain why the correct answer is right..." />
            {showHindi && (
              <textarea value={form.explanationHindi || ''} onChange={e => set('explanationHindi', e.target.value)}
                className="input-field !bg-white resize-none" rows={2} placeholder="हिंदी में व्याख्या" />
            )}
            <div className="flex items-center gap-2">
              {form.explanationImage && (
                <div className="relative">
                  <img src={form.explanationImage} alt="" className="w-20 h-14 object-cover rounded-lg border" />
                  <button type="button" onClick={() => set('explanationImage', '')}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center">
                    <X size={8} />
                  </button>
                </div>
              )}
              <label className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl cursor-pointer text-xs font-semibold text-slate-600 transition-colors">
                <Image size={12} /> Add Explanation Image
                <input type="file" accept="image/*" className="hidden"
                  onChange={e => e.target.files[0] && uploadImage(e.target.files[0], 'explanationImage')} />
              </label>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={saving}
              className="btn-primary flex-1 flex items-center justify-center gap-2 !py-3">
              {saving
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
                : editQ ? '💾 Update Question' : '➕ Add Question'
              }
            </button>
            <button type="button" onClick={onClose} className="btn-secondary flex-1 !py-3">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════
export default function QuestionBank() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showCSVModal, setShowCSVModal] = useState(false);
  const [editQ, setEditQ] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ subjectId: '', categoryId: '', difficulty: '', search: '', questionType: '' });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [subjectForm, setSubjectForm] = useState({ name: '', description: '', isActive: true });
  const [editSubjectId, setEditSubjectId] = useState(null);

  const fetchQ = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (filters.search) params.search = filters.search;
      if (filters.subjectId) params.subjectId = filters.subjectId;
      if (filters.categoryId) params.categoryId = filters.categoryId;
      if (filters.difficulty) params.difficulty = filters.difficulty;
      const res = await api.get('/questions', { params });
      setQuestions(res.data.data || []);
      setTotal(res.data.pagination?.total || 0);
    } catch { toast.error('Failed to load questions'); }
    finally { setLoading(false); }
  }, [filters, page]);

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/subjects');
      setSubjects(res.data.data || []);
    } catch {}
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data.data || []);
    } catch {}
  };

  useEffect(() => { fetchQ(); }, [fetchQ]);
  useEffect(() => { fetchSubjects(); fetchCategories(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this question?')) return;
    try { await api.delete(`/questions/${id}`); toast.success('Deleted'); fetchQ(); }
    catch { toast.error('Failed to delete'); }
  };

  const handleCSVUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await api.post('/questions/import-csv', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(`${res.data.data.created} questions imported!`);
      setShowCSVModal(false); fetchQ();
    } catch (err) { toast.error(err.response?.data?.error || 'CSV import failed'); }
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-header">🧠 Question Bank</h1>
          <p className="section-subheader">{total} question{total !== 1 ? 's' : ''} in the bank</p>
        </div>
        <div className="flex gap-3">
          <ExportButtons 
            data={questions} 
            filename="question_bank" 
            title="Question Bank Export" 
            headers={['Question', 'Type', 'Subject', 'Topic', 'Difficulty', 'Marks']}
            pdfDataMapping={(q) => [
              q.questionText,
              q.questionType,
              subjects.find(s => s.id === q.subjectId)?.name || q.subject || '-',
              q.topic || '-',
              q.difficulty,
              q.marks
            ]}
          />
          <button onClick={() => setShowSubjectModal(true)} className="btn-secondary flex items-center gap-2">
            Manage Subjects
          </button>
          <button onClick={() => setShowCSVModal(true)} className="btn-secondary flex items-center gap-2">
            <Upload size={15} /> Import CSV
          </button>
          <button onClick={() => { setEditQ(null); setShowModal(true); }} className="btn-primary flex items-center gap-2">
            <Plus size={15} /> Add Question
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-52">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input type="text" placeholder="Search questions..." value={filters.search}
            onChange={e => { setFilters(f => ({ ...f, search: e.target.value })); setPage(1); }}
            className="input-field !pl-9" />
        </div>
        <select value={filters.categoryId} onChange={e => { setFilters(f => ({ ...f, categoryId: e.target.value })); setPage(1); }}
          className="input-field !w-auto">
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={filters.subjectId} onChange={e => { setFilters(f => ({ ...f, subjectId: e.target.value })); setPage(1); }}
          className="input-field !w-auto">
          <option value="">All Subjects</option>
          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={filters.difficulty} onChange={e => { setFilters(f => ({ ...f, difficulty: e.target.value })); setPage(1); }}
          className="input-field !w-auto">
          <option value="">Any Difficulty</option>
          <option value="easy">🟢 Easy</option>
          <option value="medium">🟡 Medium</option>
          <option value="hard">🔴 Hard</option>
        </select>
        {/* Type quick filter pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {Q_TYPES.slice(0,3).map(qt => (
            <button key={qt.id}
              onClick={() => setFilters(f => ({ ...f, questionType: f.questionType === qt.id ? '' : qt.id }))}
              className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-colors ${
                filters.questionType === qt.id ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}>
              {qt.icon} {qt.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}</div>
      ) : questions.length === 0 ? (
        <div className="card text-center py-16">
          <Brain className="w-14 h-14 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">No questions found</p>
          <p className="text-slate-400 text-sm mt-1">Add questions or adjust your filters</p>
          <button onClick={() => { setEditQ(null); setShowModal(true); }} className="btn-primary mt-4 mx-auto flex items-center gap-2 w-fit">
            <Plus size={15} /> Add First Question
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {questions.map((q, idx) => (
            <div key={q.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:border-primary-200 hover:shadow-sm transition-all group">
              <div className="flex items-start gap-3">
                <span className="text-[11px] text-slate-400 font-mono pt-0.5 min-w-6 flex-shrink-0">
                  {((page - 1) * 20) + idx + 1}.
                </span>

                <div className="flex-1 min-w-0">
                  {/* Question image if any */}
                  {q.image && (
                    <img src={q.image} alt="" className="w-32 h-20 object-cover rounded-xl border mb-2 float-right ml-3" />
                  )}
                  <p className="text-sm text-slate-800 leading-relaxed">{q.questionText}</p>

                  {/* Options preview for MCQ */}
                  {(q.questionType === 'mcq' || q.questionType === 'multi_correct') && q.options?.length > 0 && (
                    <div className="mt-2 grid grid-cols-2 gap-1">
                      {q.options.map(opt => (
                        <div key={opt.label} className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg ${
                          (q.correctAnswer === opt.label || (q.correctAnswers || []).includes(opt.label))
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold'
                            : 'bg-slate-50 text-slate-500'
                        }`}>
                          <span className="font-bold w-3">{opt.label}.</span>
                          <span className="truncate">{opt.text}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* True/False answer */}
                  {q.questionType === 'true_false' && (
                    <p className="mt-1.5 text-xs font-semibold text-emerald-600">Answer: {q.correctAnswer}</p>
                  )}

                  {/* Fill blank answer */}
                  {q.questionType === 'fill_blank' && (
                    <p className="mt-1.5 text-xs font-semibold text-emerald-600">Answer: "{q.correctAnswer}"</p>
                  )}

                  {/* Badges */}
                  <div className="flex items-center flex-wrap gap-1.5 mt-2.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TYPE_BADGE[q.questionType] || 'bg-slate-100 text-slate-600'}`}>
                      {Q_TYPES.find(t => t.id === q.questionType)?.icon} {Q_TYPES.find(t => t.id === q.questionType)?.label || q.questionType}
                    </span>
                    {q.subjectId && subjects.find(s => s.id === q.subjectId) && (
                      <span className="badge-info text-[10px]">{subjects.find(s => s.id === q.subjectId).name}</span>
                    )}
                    {q.topic && <span className="text-[10px] text-slate-400">• {q.topic}</span>}
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${DIFF_BADGE[q.difficulty]}`}>{q.difficulty}</span>
                    <span className="text-[10px] text-slate-400">+{q.marks}m{q.negativeMarks > 0 ? ` / −${q.negativeMarks}m` : ''}</span>
                    {q.image && <span className="text-[10px] text-blue-500">📷 has image</span>}
                    {q.categoryId && categories.find(c => c.id === q.categoryId) && (
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                        {categories.find(c => c.id === q.categoryId).name}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button onClick={() => { setEditQ(q); setShowModal(true); }}
                    className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-slate-900 transition-colors">
                    <Edit size={14} />
                  </button>
                  <button onClick={() => handleDelete(q.id)}
                    className="p-2 hover:bg-red-50 rounded-xl text-slate-400 hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="btn-secondary !px-4 !py-1.5 !text-sm disabled:opacity-40">← Prev</button>
          <span className="text-slate-500 text-sm">Page {page} of {Math.ceil(total / 20)}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page * 20 >= total}
            className="btn-secondary !px-4 !py-1.5 !text-sm disabled:opacity-40">Next →</button>
        </div>
      )}

      {/* CSV Modal */}
      {showCSVModal && (
        <div className="modal-overlay" onClick={() => setShowCSVModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 mb-4">📥 Import Questions via CSV</h3>
            <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-500 mb-4 space-y-2 border border-slate-200">
              <div className="flex justify-between items-start mb-1">
                <p className="font-semibold text-slate-700">Required CSV columns:</p>
                <a 
                  href={encodeURI("data:text/csv;charset=utf-8,question,questionHindi,optionA,optionAHindi,optionB,optionBHindi,optionC,optionCHindi,optionD,optionDHindi,correctAnswer,subject,category,topic,difficulty,marks,negativeMarks,explanation,explanationHindi\n\"What is the capital of India?\",\"भारत की राजधानी क्या है?\",\"Mumbai\",\"मुंबई\",\"New Delhi\",\"नई दिल्ली\",\"Kolkata\",\"कोलकाता\",\"Chennai\",\"चेन्नई\",\"B\",\"Geography\",\"General\",\"Capitals\",\"easy\",\"2\",\"0.5\",\"New Delhi is the correct answer.\",\"नई दिल्ली सही उत्तर है।\"")} 
                  download="questions_import_sample.csv" 
                  className="text-primary-600 font-bold hover:underline flex items-center gap-1 bg-primary-50 px-2 py-1 rounded"
                >
                  📥 Download Sample CSV
                </a>
              </div>
              <code className="text-primary-600 block">question, optionA, optionB, optionC, optionD, correctAnswer, subject</code>
              <p>Optional Details: <code className="text-slate-600">category, topic, difficulty, marks, negativeMarks, explanation</code></p>
              <p>Hindi Support: <code className="text-slate-600">questionHindi, optionAHindi, optionBHindi, optionCHindi, optionDHindi, explanationHindi</code></p>
              <p>Tips:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li><code className="text-slate-800 font-bold">subject</code> and <code className="text-slate-800 font-bold">category</code> will automatically link to existing database items with exactly the same name.</li>
                <li><code className="text-slate-800 font-bold">correctAnswer</code> should be A, B, C, or D.</li>
              </ul>
            </div>
            <label className="block">
              <div className="border-2 border-dashed border-slate-300 hover:border-primary-500 rounded-xl p-8 text-center cursor-pointer transition-colors">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-500 text-sm font-medium">Click to upload CSV</p>
                <p className="text-slate-400 text-xs mt-1">All questions will be added to the bank</p>
                <input type="file" accept=".csv" className="hidden" onChange={handleCSVUpload} />
              </div>
            </label>
            <button onClick={() => setShowCSVModal(false)} className="btn-secondary w-full mt-3">Cancel</button>
          </div>
        </div>
      )}

      {/* Question Modal */}
      {showModal && (
        <QuestionModal
          editQ={editQ}
          subjects={subjects}
          categories={categories}
          onClose={() => setShowModal(false)}
          onSaved={() => { fetchQ(); fetchSubjects(); }}
        />
      )}

      {/* Subject Manager Modal */}
      {showSubjectModal && (
        <div className="modal-overlay z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowSubjectModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-900">Manage Subjects</h3>
              <button className="text-slate-400 hover:text-slate-600" onClick={() => setShowSubjectModal(false)}><X size={18} /></button>
            </div>
            <div className="flex flex-1 overflow-hidden h-full min-h-[400px]">
              <div className="w-1/2 border-r border-slate-100 overflow-y-auto p-4 space-y-2 bg-white">
                {subjects.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{c.name} {!c.isActive && <span className="text-xs text-amber-500 font-medium">(Inactive)</span>}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditSubjectId(c.id); setSubjectForm({ name: c.name, description: c.description || '', isActive: c.isActive }); }} className="p-1 hover:bg-slate-200 rounded text-blue-600"><Edit size={14} /></button>
                      <button onClick={async () => {
                        if (window.confirm(`Delete subject "${c.name}"?`)) {
                          try { await api.delete('/subjects/' + c.id); fetchSubjects(); toast.success('Subject deleted'); }
                          catch(err) { toast.error(err.response?.data?.error || 'Delete failed'); }
                        }
                      }} className="p-1 hover:bg-slate-200 rounded text-red-600"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="w-1/2 p-6 bg-slate-50 flex flex-col">
                <h4 className="font-bold mb-4 text-slate-800">{editSubjectId ? 'Edit Subject' : 'Add New Subject'}</h4>
                <div className="space-y-4">
                  <div>
                    <label className="label">Subject Name *</label>
                    <input type="text" value={subjectForm.name} onChange={e => setSubjectForm({ ...subjectForm, name: e.target.value })} className="input-field bg-white" placeholder="e.g. Polity" />
                  </div>
                  <div>
                    <label className="label">Description</label>
                    <textarea value={subjectForm.description} onChange={e => setSubjectForm({ ...subjectForm, description: e.target.value })} className="input-field bg-white" placeholder="Optional description..." rows={2} />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer mt-2">
                    <input type="checkbox" checked={subjectForm.isActive} onChange={e => setSubjectForm({ ...subjectForm, isActive: e.target.checked })} className="w-4 h-4 text-primary-600" />
                    <span className="text-sm font-medium text-slate-700">Active (Visible)</span>
                  </label>
                  <div className="flex gap-3 mt-6">
                     <button onClick={async () => {
                        if(!subjectForm.name) return toast.error('Name is required');
                        try {
                          if (editSubjectId) await api.put('/subjects/' + editSubjectId, subjectForm);
                          else await api.post('/subjects', subjectForm);
                          fetchSubjects();
                          toast.success(editSubjectId ? 'Subject updated' : 'Subject created');
                          setEditSubjectId(null); setSubjectForm({ name: '', description: '', isActive: true });
                        } catch(err) { toast.error(err.response?.data?.error || 'Error saving subject'); }
                     }} className="btn-primary flex-1">Save Subject</button>
                     {editSubjectId && <button onClick={() => { setEditSubjectId(null); setSubjectForm({ name: '', description: '', isActive: true }); }} className="btn-secondary flex-1">Cancel Edit</button>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
