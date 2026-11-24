import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Plus, Search, Edit, Trash2, BookOpen, Clock,
  ToggleLeft, ToggleRight, FileText, BarChart2,
  GraduationCap, Zap, Brain, Shield, Train, Building,
  Users, RefreshCw, CheckSquare, Square, ListChecks,
  ChevronRight, ChevronLeft, X, Save
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../lib/api';
import ExportButtons from '../../components/shared/ExportButtons';

// ── Constants ──────────────────────────────────────────────────


const TYPE_TABS = [
  { id: 'all',         label: 'All Types',  badge: 'bg-slate-200 text-slate-700'        },
  { id: 'mock',        label: 'Mock',       badge: 'bg-indigo-100 text-indigo-700'      },
  { id: 'pyp',         label: 'PYP',        badge: 'bg-amber-100 text-amber-700'        },
  { id: 'daily_quiz',  label: 'Daily Quiz', badge: 'bg-emerald-100 text-emerald-700'    },
  { id: 'sectional',   label: 'Sectional',  badge: 'bg-cyan-100 text-cyan-700'          },
];

const TYPE_COLOR = {
  mock: 'bg-indigo-100 text-indigo-700',
  pyp: 'bg-amber-100 text-amber-700',
  daily_quiz: 'bg-emerald-100 text-emerald-700',
  sectional: 'bg-cyan-100 text-cyan-700',
};
const TYPE_LABEL = { mock: 'Mock', pyp: 'PYP', daily_quiz: 'Daily Quiz', sectional: 'Sectional' };

const DIFF_COLOR = { easy: 'text-emerald-600 bg-emerald-50', medium: 'text-amber-600 bg-amber-50', hard: 'text-red-600 bg-red-50' };

const INIT_FORM = {
  title: '', description: '', type: 'mock', category: 'UPSC', subCategory: '',
  duration: 120, totalMarks: 100, passingMarks: 33,
  negativeMarkingEnabled: false, negativeMarkingValue: 0.67,
  isFree: true, price: 0, shuffleQuestions: false,
  showResultImmediately: true, allowReview: true,
  isActive: true, tags: '', language: 'en',
  examName: '', year: '', shift: '', cutoffMarks: '', expectedCutoff: '',
  difficultyTag: 'medium',
  seriesId: '',
};

// ══════════════════════════════════════════════════════════════
// QUESTION PICKER MODAL
// ══════════════════════════════════════════════════════════════
function QuestionPickerModal({ test, onClose, onSaved, categories }) {
  const [questions, setQuestions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Filter state
  const [search, setSearch] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Selection: set of question IDs currently assigned to this test
  const [selected, setSelected] = useState(new Set(test.questionIds || []));

  // Fetch subjects once
  useEffect(() => {
    api.get('/subjects').then(r => setSubjects(r.data.data || [])).catch(() => {});
  }, []);

  // Fetch questions with filters
  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (search) params.search = search;
      if (subjectId) params.subjectId = subjectId;
      if (difficulty) params.difficulty = difficulty;
      if (categoryId) params.categoryId = categoryId;
      const res = await api.get('/questions', { params });
      setQuestions(res.data.data || []);
      setTotal(res.data.pagination?.total || 0);
    } catch { toast.error('Failed to load questions'); }
    finally { setLoading(false); }
  }, [page, search, subjectId, difficulty, categoryId]);

  useEffect(() => { setPage(1); }, [search, subjectId, difficulty, categoryId]);
  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

  const toggle = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectPage = () => {
    setSelected(prev => {
      const next = new Set(prev);
      questions.forEach(q => next.add(q.id));
      return next;
    });
  };

  const deselectPage = () => {
    setSelected(prev => {
      const next = new Set(prev);
      questions.forEach(q => next.delete(q.id));
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const questionIds = [...selected];
      await api.put(`/tests/${test.id}`, {
        questionIds,
        totalQuestions: questionIds.length,
      });
      toast.success(`✅ ${questionIds.length} question${questionIds.length !== 1 ? 's' : ''} assigned to "${test.title}"`);
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally { setSaving(false); }
  };

  const pageAllSelected = questions.length > 0 && questions.every(q => selected.has(q.id));

  return (
    <div className="fixed inset-0 z-50 flex items-stretch bg-black/50 backdrop-blur-sm">
      <div className="relative flex flex-col w-full max-w-4xl mx-auto my-4 bg-white rounded-2xl shadow-2xl overflow-hidden animate-slide-up">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-primary-50 to-slate-50 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <ListChecks className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-slate-900 text-base leading-tight">Assign Questions</h2>
              <p className="text-xs text-slate-500 truncate max-w-sm">{test.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className={`text-sm font-bold px-3 py-1.5 rounded-xl ${
              selected.size > 0 ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-500'
            }`}>
              {selected.size} selected
            </div>
            <button onClick={handleSave} disabled={saving}
              className="btn-primary flex items-center gap-2 !py-1.5">
              {saving
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
                : <><Save size={15} /> Save Assignment</>
              }
            </button>
            <button onClick={onClose}
              className="w-8 h-8 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center text-slate-500 transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 px-6 py-3 border-b border-slate-100 flex-shrink-0 flex-wrap">
          <div className="relative flex-1 min-w-32">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Search questions..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="input-field !pl-9 !py-2 !text-sm w-full" />
          </div>
          <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
            className="input-field !py-2 !text-sm !w-auto">
            <option value="">All Categories</option>
            {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={subjectId} onChange={e => setSubjectId(e.target.value)}
            className="input-field !py-2 !text-sm !w-auto min-w-32">
            <option value="">All Subjects</option>
            {subjects?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={difficulty} onChange={e => setDifficulty(e.target.value)}
            className="input-field !py-2 !text-sm !w-auto">
            <option value="">Any Difficulty</option>
            <option value="easy">🟢 Easy</option>
            <option value="medium">🟡 Medium</option>
            <option value="hard">🔴 Hard</option>
          </select>
          <button onClick={pageAllSelected ? deselectPage : selectPage}
            className="flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 px-3 py-2 rounded-xl bg-primary-50 hover:bg-primary-100 transition-colors whitespace-nowrap">
            {pageAllSelected ? <><Square size={13} /> Deselect Page</> : <><CheckSquare size={13} /> Select Page</>}
          </button>
        </div>

        {/* Question list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
            </div>
          ) : questions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <BookOpen className="w-12 h-12 mb-3 opacity-40" />
              <p className="font-medium">No questions found</p>
              <p className="text-sm mt-1">Try changing your search filters</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {questions.map((q, i) => {
                const isSelected = selected.has(q.id);
                return (
                  <button
                    key={q.id}
                    onClick={() => toggle(q.id)}
                    className={`w-full text-left px-6 py-4 flex items-start gap-4 transition-colors ${
                      isSelected ? 'bg-primary-50 hover:bg-primary-100' : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Checkbox */}
                    <div className={`w-5 h-5 mt-0.5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      isSelected ? 'bg-primary-600 border-primary-600' : 'border-slate-300'
                    }`}>
                      {isSelected && <span className="text-white text-xs font-bold">✓</span>}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug line-clamp-2 ${isSelected ? 'text-slate-900 font-medium' : 'text-slate-700'}`}>
                        {q.questionText}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {q.subject && (
                          <span className="text-[10px] font-semibold text-primary-600 bg-primary-50 border border-primary-100 px-2 py-0.5 rounded-full">
                            {q.subject}
                          </span>
                        )}
                        {q.topic && (
                          <span className="text-[10px] text-slate-500">
                            {q.topic}
                          </span>
                        )}
                        {q.difficulty && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${DIFF_COLOR[q.difficulty] || 'bg-slate-100 text-slate-600'}`}>
                            {q.difficulty}
                          </span>
                        )}
                        {q.categoryId && categories?.find(c => c.id === q.categoryId) && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                            {categories.find(c => c.id === q.categoryId).name}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400">
                          +{q.marks}m{q.negativeMarks ? ` / −${q.negativeMarks}m` : ''}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination + footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 bg-slate-50 flex-shrink-0">
          <p className="text-xs text-slate-500">
            Showing {Math.min((page - 1) * 15 + 1, total)}–{Math.min(page * 15, total)} of {total} questions
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors">
              <ChevronLeft size={15} />
            </button>
            <span className="text-xs text-slate-600 font-medium">Page {page} of {Math.ceil(total / 15) || 1}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page * 15 >= total}
              className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors">
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════
export default function AdminTests() {
  const location = useLocation();
  const routeState = location.state || {};

  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [catStats, setCatStats] = useState({ byCategory: {}, byType: {}, grandTotal: 0 });
  const [seriesList, setSeriesList] = useState([]); // exam series for dropdown

  const [category, setCategory] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [dbCategories, setDbCategories] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [catForm, setCatForm] = useState({ name: '', description: '', image: '', isActive: true });
  const [uploadingImg, setUploadingImg] = useState('');
  const [editCatId, setEditCatId] = useState(null);

  const uploadCatImage = async (file) => {
    setUploadingImg('image');
    const fd = new FormData();
    fd.append('image', file);
    try {
      const res = await api.post('/questions/upload-image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setCatForm(f => ({ ...f, image: res.data.data.url }));
      toast.success('Image uploaded!');
    } catch { toast.error('Upload failed'); } 
    finally { setUploadingImg(''); }
  };

  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.get('/categories');
      setDbCategories(res.data.data || []);
    } catch (err) { }
  }, []);

  const STYLES = [
    { icon: GraduationCap, color: 'text-blue-600',   bg: 'bg-blue-50'     },
    { icon: Building,      color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { icon: Train,         color: 'text-orange-600',  bg: 'bg-orange-50'  },
    { icon: Shield,        color: 'text-purple-600',  bg: 'bg-purple-50'  },
    { icon: Brain,         color: 'text-pink-600',    bg: 'bg-pink-50'    },
    { icon: Zap,           color: 'text-yellow-600',  bg: 'bg-yellow-50'  },
  ];

  const ALL_CATEGORIES = [
    { id: 'all', label: 'All Tests', icon: BookOpen, color: 'text-slate-600', bg: 'bg-slate-100' },
    ...dbCategories.map((c, i) => ({
      id: c.name,
      label: c.name,
      icon: STYLES[i % STYLES.length].icon,
      color: STYLES[i % STYLES.length].color,
      bg: STYLES[i % STYLES.length].bg,
      active: c.isActive,
      catId: c.id,
      image: c.image
    }))
  ];

  const [showModal, setShowModal] = useState(false);
  const [editTest, setEditTest] = useState(null);
  const [form, setForm] = useState(INIT_FORM);
  const [saving, setSaving] = useState(false);

  // Question picker
  const [pickerTest, setPickerTest] = useState(null);

  // ── Data loading ─────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/tests/category-stats');
      setCatStats(res.data.data || { byCategory: {}, byType: {}, grandTotal: 0 });
    } catch {}
  }, []);

  const fetchTests = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 18 };
      if (search) params.search = search;
      if (category !== 'all') params.category = category;
      if (typeFilter !== 'all') params.type = typeFilter;
      const res = await api.get('/tests', { params });
      setTests(res.data.data || []);
      setTotal(res.data.pagination?.total || 0);
    } catch { toast.error('Failed to load tests'); }
    finally { setLoading(false); }
  }, [page, search, category, typeFilter]);

  useEffect(() => { fetchTests(); }, [fetchTests]);
  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchCategories(); }, [fetchCategories]);
  useEffect(() => {
    api.get('/exam-series/admin/all').then(r => setSeriesList(r.data.data || [])).catch(() => {});
  }, []);

  // Auto-open create modal when navigated from Exam Series panel
  useEffect(() => {
    if (routeState?.openCreateWithSeries) {
      setForm({ ...INIT_FORM, seriesId: routeState.openCreateWithSeries });
      setEditTest(null);
      setShowModal(true);
      // clear state so re-render doesn't re-trigger
      window.history.replaceState({}, document.title);
    }
  }, []);

  // ── Modal helpers ────────────────────────────────────────────
  const openCreate = (prefillSeriesId = '') => {
    setEditTest(null);
    setForm({ ...INIT_FORM, category: category !== 'all' ? category : (dbCategories[0]?.name || ''), seriesId: prefillSeriesId });
    setShowModal(true);
  };
  const openEdit = (test) => {
    setEditTest(test);
    setForm({
      ...INIT_FORM, ...test,
      tags: Array.isArray(test.tags) ? test.tags.join(', ') : test.tags || '',
      year: test.year || '', shift: test.shift || '',
      examName: test.examName || '', cutoffMarks: test.cutoffMarks || '',
      expectedCutoff: test.expectedCutoff || '',
      seriesId: test.seriesId || '',
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        year: form.year ? parseInt(form.year) : null,
        cutoffMarks: form.cutoffMarks ? parseFloat(form.cutoffMarks) : null,
        expectedCutoff: form.expectedCutoff ? parseFloat(form.expectedCutoff) : null,
        isDailyQuiz: form.type === 'daily_quiz',
      };
      if (editTest) {
        await api.put(`/tests/${editTest.id}`, payload);
        toast.success('Test updated!');
      } else {
        await api.post('/tests', payload);
        toast.success('Test created! Now assign questions to it →');
      }
      setShowModal(false);
      fetchTests(); fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save test');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this test? This cannot be undone.')) return;
    try {
      await api.delete(`/tests/${id}`);
      toast.success('Test deleted');
      fetchTests(); fetchStats();
    } catch { toast.error('Failed to delete'); }
  };

  const handleToggle = async (test) => {
    try {
      await api.put(`/tests/${test.id}`, { isActive: !test.isActive });
      toast.success(test.isActive ? 'Test deactivated' : 'Test activated');
      fetchTests();
    } catch { toast.error('Failed to update'); }
  };

  const currentCat = ALL_CATEGORIES.find(c => c.id === category) || ALL_CATEGORIES[0];

  return (
    <div className="flex gap-0 -mx-6 -mt-6 min-h-screen animate-fade-in">

      {/* ── LEFT SIDEBAR ─────────────────────────────────────── */}
      <aside className="w-56 flex-shrink-0 bg-white border-r border-slate-200 pt-6 pb-4 flex flex-col">
        <div className="px-4 mb-3 flex items-center justify-between">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Test Categories</p>
          <Link to="/admin/categories" className="text-xs text-primary-600 hover:text-primary-700 font-bold bg-primary-50 px-2 py-0.5 rounded flex items-center gap-1">Manage</Link>
        </div>
        <nav className="flex-1 space-y-0.5 px-2">
          {ALL_CATEGORIES.map(cat => {
            const count = cat.id === 'all' ? catStats.grandTotal : (catStats.byCategory[cat.id]?.total || 0);
            const Icon = cat.icon;
            const isActive = category === cat.id;
            return (
              <button key={cat.id}
                onClick={() => { setCategory(cat.id); setPage(1); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive ? `${cat.bg} ${cat.color} shadow-sm` : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {cat.id !== 'all' && cat.image ? (
                    <img src={cat.image.startsWith('http') ? cat.image : `${api.defaults.baseURL.replace('/api', '')}${cat.image}`} alt="" className="w-4 h-4 object-cover rounded-md flex-shrink-0" />
                  ) : (
                    <Icon size={15} className="flex-shrink-0" />
                  )}
                  <span className="truncate">{cat.label}</span>
                </div>
                {count > 0 && (
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full min-w-5 text-center ${
                    isActive ? 'bg-white/60' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                  }`}>{count}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Type breakdown */}
        {Object.keys(catStats.byType).length > 0 && (
          <div className="px-4 mt-4 pt-4 border-t border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">By Type</p>
            {Object.entries(catStats.byType).map(([type, data]) => (
              <div key={type} className="flex items-center justify-between text-xs text-slate-500 py-1">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${TYPE_COLOR[type] || 'bg-slate-100 text-slate-600'}`}>
                  {TYPE_LABEL[type] || type}
                </span>
                <span className="font-semibold text-slate-700">{data.total}</span>
              </div>
            ))}
          </div>
        )}
      </aside>

      {/* ── MAIN CONTENT ─────────────────────────────────────── */}
      <div className="flex-1 min-w-0 p-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 ${currentCat.bg} rounded-xl flex items-center justify-center`}>
              <currentCat.icon size={18} className={currentCat.color} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{currentCat.label}</h1>
              <p className="text-sm text-slate-500">{total} test{total !== 1 ? 's' : ''} found</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ExportButtons 
              data={tests} 
              filename="platform_tests" 
              title="Platform Test Library Report" 
              headers={['Title', 'Category', 'Type', 'Questions', 'Duration (min)', 'Attempts', 'Status']}
              pdfDataMapping={(t) => [
                t.title,
                t.category,
                TYPE_LABEL[t.type] || t.type,
                t.totalQuestions || 0,
                t.duration,
                t.totalAttempts || 0,
                t.isActive ? 'Active' : 'Inactive'
              ]}
            />
            <button onClick={() => { fetchTests(); fetchStats(); }}
              className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
              <RefreshCw size={15} />
            </button>
            <button onClick={openCreate} className="btn-primary flex items-center gap-2">
              <Plus size={16} /> Create Test
            </button>
          </div>
        </div>

        {/* Type tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          {TYPE_TABS.map(tab => {
            const count = tab.id === 'all'
              ? (category === 'all' ? catStats.grandTotal : catStats.byCategory[category]?.total || 0)
              : catStats.byType[tab.id]?.total || 0;
            return (
              <button key={tab.id}
                onClick={() => { setTypeFilter(tab.id); setPage(1); }}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-sm font-semibold border transition-all ${
                  typeFilter === tab.id
                    ? 'bg-primary-600 text-white border-primary-600 shadow-md shadow-primary-200'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-primary-300 hover:text-primary-600'
                }`}
              >
                {tab.label}
                {count > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    typeFilter === tab.id ? 'bg-white/20 text-white' : tab.badge
                  }`}>{count}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative max-w-xl">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input type="text" placeholder={`Search in ${currentCat.label}...`}
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="input-field !pl-10 !py-2.5 w-full" />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-60 rounded-2xl" />)}
          </div>
        ) : tests.length === 0 ? (
          <div className="card text-center py-20">
            <currentCat.icon className={`w-14 h-14 mx-auto mb-4 ${currentCat.color} opacity-40`} />
            <p className="text-slate-600 font-semibold text-lg mb-1">No {currentCat.label} tests yet</p>
            <p className="text-slate-400 text-sm mb-5">Create your first test in this category</p>
            <button onClick={openCreate} className="btn-primary mx-auto flex items-center gap-2 w-fit">
              <Plus size={16} /> Create Test
            </button>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {tests.map(test => {
                let actualQCount = 0;
                if (Array.isArray(test.questionIds) && test.questionIds.length > 0) {
                  actualQCount += test.questionIds.length;
                } else if (Array.isArray(test.sections) && test.sections.length > 0) {
                  actualQCount += test.sections.reduce((sum, s) => sum + (Array.isArray(s.questions) ? s.questions.length : 0), 0);
                }
                const qCount = actualQCount;
                const hasQuestions = qCount > 0;
                return (
                  <div key={test.id}
                    className={`bg-white border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col ${
                      !test.isActive ? 'opacity-60' : 'hover:border-primary-200'
                    } ${!hasQuestions ? 'border-amber-200 bg-amber-50/30' : ''}`}
                  >
                    {/* Top badges */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${TYPE_COLOR[test.type] || 'bg-slate-100 text-slate-600'}`}>
                          {TYPE_LABEL[test.type] || test.type}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {test.category}{test.subCategory ? ` / ${test.subCategory}` : ''}
                        </span>
                        {test.seriesId && seriesList.find(s => s.id === test.seriesId) && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">
                            📚 {seriesList.find(s => s.id === test.seriesId)?.examName}
                          </span>
                        )}
                      </div>
                      {test.isFree
                        ? <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">Free</span>
                        : <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">★ Premium</span>
                      }
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-slate-900 text-sm leading-snug mb-1 line-clamp-2">{test.title}</h3>

                    {/* PYP meta */}
                    {test.type === 'pyp' && test.year && (
                      <p className="text-xs text-amber-600 font-medium mb-1.5 flex items-center gap-1">
                        <FileText size={11} />
                        {test.examName} {test.year}{test.shift ? ` · ${test.shift}` : ''}
                      </p>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-1.5 my-3">
                      {[
                        { label: 'QS', value: qCount },
                        { label: 'MINS', value: test.duration },
                        { label: 'ATTEMPTS', value: test.totalAttempts || 0 },
                      ].map(s => (
                        <div key={s.label} className="bg-slate-50 rounded-xl py-2 text-center">
                          <p className="text-sm font-extrabold text-slate-800">{s.value}</p>
                          <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wide">{s.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* No-questions warning */}
                    {!hasQuestions && (
                      <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5 mb-2">
                        <span className="text-base">⚠️</span>
                        No questions assigned yet
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-3 border-t border-slate-100 mt-auto">
                      {/* Assign Questions — primary action */}
                      <button
                        onClick={() => setPickerTest(test)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-xl transition-colors ${
                          hasQuestions
                            ? 'text-primary-600 bg-primary-50 hover:bg-primary-100 border border-primary-200'
                            : 'text-white bg-amber-500 hover:bg-amber-600'
                        }`}
                      >
                        <ListChecks size={12} />
                        {hasQuestions ? `Questions (${qCount})` : 'Assign Questions'}
                      </button>
                      <button onClick={() => openEdit(test)}
                        className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                        <Edit size={12} /> Edit
                      </button>
                      <button onClick={() => handleToggle(test)} title={test.isActive ? 'Deactivate' : 'Activate'}
                        className={`p-1.5 rounded-xl transition-colors ${
                          test.isActive ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' : 'text-slate-400 bg-slate-100 hover:bg-slate-200'
                        }`}>
                        {test.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                      </button>
                      <button onClick={() => handleDelete(test.id)}
                        className="p-1.5 rounded-xl text-red-400 bg-red-50 hover:bg-red-100 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {total > 18 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">
                  Showing {Math.min((page - 1) * 18 + 1, total)}–{Math.min(page * 18, total)} of {total}
                </p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="btn-secondary !px-4 !py-2 disabled:opacity-40">← Prev</button>
                  <span className="text-sm text-slate-600 font-medium">Page {page}</span>
                  <button onClick={() => setPage(p => p + 1)} disabled={page * 18 >= total}
                    className="btn-secondary !px-4 !py-2 disabled:opacity-40">Next →</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── QUESTION PICKER (full-screen modal) ──────────────── */}
      {pickerTest && (
        <QuestionPickerModal
          test={pickerTest}
          categories={dbCategories}
          onClose={() => setPickerTest(null)}
          onSaved={() => { fetchTests(); fetchStats(); }}
        />
      )}

      {/* ── CREATE / EDIT MODAL ───────────────────────────────── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto animate-slide-up"
            onClick={e => e.stopPropagation()}>

            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-lg font-bold text-slate-900">
                {editTest ? `✏️ Edit Test` : '✨ Create New Test'}
              </h3>
              <button onClick={() => setShowModal(false)}
                className="w-8 h-8 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center text-slate-500 transition-colors">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5">

              {/* Series context banner */}
              {form.seriesId && seriesList.find(s => s.id === form.seriesId) && (
                <div className="flex items-center gap-3 px-4 py-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                  <span className="text-lg">📚</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-indigo-700">Adding to Exam Series</p>
                    <p className="text-sm font-semibold text-indigo-900 truncate">
                      {seriesList.find(s => s.id === form.seriesId)?.title}
                    </p>
                  </div>
                  <button type="button" onClick={() => setForm({...form, seriesId:''})}
                    className="text-xs text-indigo-400 hover:text-indigo-600 font-medium">Remove</button>
                </div>
              )}

              {/* Type + Category + Sub Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>
                  <label className="label">Test Type *</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="input-field">
                    <option value="mock">📝 Mock Test</option>
                    <option value="pyp">📅 Previous Year Paper (PYP)</option>
                    <option value="daily_quiz">⚡ Daily Quiz</option>
                    <option value="sectional">📖 Sectional Test</option>
                  </select>
                </div>
                <div>
                  <label className="label">Category *</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value, subCategory: '' })} className="input-field" required>
                    {ALL_CATEGORIES.filter(c => c.id !== 'all').map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
                {dbCategories?.find(c => c.name === form.category)?.subCategories?.length > 0 && (
                  <div className="col-span-1 md:col-span-2 md:w-1/2 md:pr-2">
                    <label className="label">Sub Category *</label>
                    <select value={form.subCategory || ''} onChange={e => setForm({ ...form, subCategory: e.target.value })} className="input-field" required>
                      <option value="">-- Select Sub Category --</option>
                      {dbCategories.find(c => c.name === form.category).subCategories.map(sc => (
                        <option key={sc.id} value={sc.name}>{sc.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="label">Test Title *</label>
                <input type="text" value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="input-field"
                  placeholder={form.type === 'pyp' ? 'UPSC CSE Prelims 2023 Paper GS-I' : `${form.category} Full Mock Test 1`}
                  required />
              </div>

              {/* PYP fields */}
              {form.type === 'pyp' && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
                  <p className="text-sm font-bold text-amber-800 flex items-center gap-2"><FileText size={14} /> PYP Details</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="label">Exam Name</label>
                      <input type="text" value={form.examName} onChange={e => setForm({ ...form, examName: e.target.value })} className="input-field !bg-white" placeholder="UPSC CSE Prelims" /></div>
                    <div><label className="label">Year *</label>
                      <input type="number" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} className="input-field !bg-white" placeholder="2023" min={2000} max={2030} /></div>
                    <div><label className="label">Shift / Session</label>
                      <input type="text" value={form.shift} onChange={e => setForm({ ...form, shift: e.target.value })} className="input-field !bg-white" placeholder="Morning / Shift 1" /></div>
                    <div><label className="label">Difficulty</label>
                      <select value={form.difficultyTag} onChange={e => setForm({ ...form, difficultyTag: e.target.value })} className="input-field !bg-white">
                        <option value="easy">🟢 Easy</option>
                        <option value="medium">🟡 Medium</option>
                        <option value="hard">🔴 Hard</option>
                      </select></div>
                    <div><label className="label">Official Cutoff</label>
                      <input type="number" step="0.25" value={form.cutoffMarks} onChange={e => setForm({ ...form, cutoffMarks: e.target.value })} className="input-field !bg-white" placeholder="110.5" /></div>
                    <div><label className="label">Expected Cutoff</label>
                      <input type="number" step="0.25" value={form.expectedCutoff} onChange={e => setForm({ ...form, expectedCutoff: e.target.value })} className="input-field !bg-white" placeholder="108.0" /></div>
                  </div>
                </div>
              )}

              {/* Duration / Marks */}
              <div className="grid grid-cols-3 gap-4">
                <div><label className="label">Duration (min) *</label>
                  <input type="number" value={form.duration} onChange={e => setForm({ ...form, duration: +e.target.value })} className="input-field" min={1} required /></div>
                <div><label className="label">Total Marks</label>
                  <input type="number" value={form.totalMarks} onChange={e => setForm({ ...form, totalMarks: +e.target.value })} className="input-field" min={0} /></div>
                <div><label className="label">Passing Marks</label>
                  <input type="number" value={form.passingMarks} onChange={e => setForm({ ...form, passingMarks: +e.target.value })} className="input-field" min={0} /></div>
              </div>

              {/* Language + Tags */}
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Language</label>
                  <select value={form.language} onChange={e => setForm({ ...form, language: e.target.value })} className="input-field">
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                    <option value="bilingual">Bilingual</option>
                  </select></div>
                <div><label className="label">Tags (comma separated)</label>
                  <input type="text" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} className="input-field" placeholder="UPSC, GS, 2025" /></div>
              </div>

              {/* Link to Exam Series */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4">
                <label className="label !text-indigo-700 flex items-center gap-2">📚 Link to Exam Series <span className="text-xs font-normal text-indigo-400">(optional)</span></label>
                <select
                  value={form.seriesId}
                  onChange={e => setForm({ ...form, seriesId: e.target.value })}
                  className="input-field !bg-white mt-1"
                >
                  <option value="">— Not linked to any series —</option>
                  {seriesList.map(s => (
                    <option key={s.id} value={s.id}>{s.examName} — {s.title}</option>
                  ))}
                </select>
                {form.seriesId && (
                  <p className="text-xs text-indigo-600 mt-2 flex items-center gap-1">
                    ✓ This test will appear on the <strong>{seriesList.find(s=>s.id===form.seriesId)?.examName}</strong> landing page.
                  </p>
                )}
              </div>

              {/* Settings toggles */}
              <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                <p className="text-sm font-bold text-slate-700">⚙️ Settings</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                  {[
                    { key: 'negativeMarkingEnabled', label: '❌ Negative Marking' },
                    { key: 'shuffleQuestions', label: '🔀 Shuffle Questions' },
                    { key: 'showResultImmediately', label: '📊 Instant Result' },
                    { key: 'allowReview', label: '🔍 Allow Answer Review' },
                    { key: 'isActive', label: '✅ Published / Active' },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer text-sm">
                      <div onClick={() => setForm({ ...form, [key]: !form[key] })}
                        className={`w-10 h-5 rounded-full transition-colors cursor-pointer relative flex-shrink-0 ${form[key] ? 'bg-primary-600' : 'bg-slate-300'}`}>
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form[key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </div>
                      <span className={form[key] ? 'text-slate-800 font-medium' : 'text-slate-500'}>{label}</span>
                    </label>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="label mb-2 flex items-center gap-5">
                      <label className="flex items-center gap-1.5 cursor-pointer font-normal text-slate-700 select-none">
                        <input type="radio" name="pricingType" checked={form.isFree} onChange={() => setForm({ ...form, isFree: true, price: 0 })} className="w-4 h-4 cursor-pointer text-indigo-600 focus:ring-indigo-500" />
                        Free Test
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer font-normal text-slate-700 select-none">
                        <input type="radio" name="pricingType" checked={!form.isFree} onChange={() => setForm({ ...form, isFree: false, price: 999 })} className="w-4 h-4 cursor-pointer text-indigo-600 focus:ring-indigo-500" />
                        Premium Test
                      </label>
                    </label>
                    {!form.isFree && (
                      <p className="text-[10px] text-indigo-600 mt-1 font-medium bg-indigo-50 p-1.5 rounded-lg border border-indigo-100">⭐️ Unlocked only with Pro Plans.</p>
                    )}
                  </div>
                  {form.negativeMarkingEnabled && <div><label className="label">Neg. Marks Per Wrong</label>
                    <input type="number" step="0.01" value={form.negativeMarkingValue} onChange={e => setForm({ ...form, negativeMarkingValue: +e.target.value })} className="input-field !bg-white" min={0} max={4} /></div>}
                </div>
              </div>

              <div><label className="label">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  className="input-field resize-none" rows={2} placeholder="Brief description..." /></div>

              {/* Note about questions */}
              {!editTest && (
                <div className="flex items-start gap-2 text-xs text-primary-700 bg-primary-50 border border-primary-200 rounded-xl px-4 py-3">
                  <ListChecks size={14} className="flex-shrink-0 mt-0.5" />
                  <span>After creating the test, click <strong>"Questions"</strong> on the test card to assign questions from the bank.</span>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={saving}
                  className="btn-primary flex-1 flex items-center justify-center gap-2 !py-3">
                  {saving
                    ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
                    : editTest ? '💾 Update Test' : '✨ Create Test'
                  }
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 !py-3">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}



    </div>
  );
}
