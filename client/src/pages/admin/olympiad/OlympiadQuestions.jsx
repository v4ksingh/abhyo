import React, { useEffect, useState, useRef } from 'react';
import { Brain, Plus, Upload, Trash2, Edit2, Search, Filter, X, ChevronDown, BookOpen, Download } from 'lucide-react';
import api from '../../../lib/api';
import toast from 'react-hot-toast';

const DIFFICULTIES = ['easy', 'medium', 'hard'];
const DIFF_COLORS = { easy: 'text-green-600 bg-green-50', medium: 'text-yellow-600 bg-yellow-50', hard: 'text-red-600 bg-red-50' };

const emptyQ = { questionText: '', options: [{ label: 'A', text: '' }, { label: 'B', text: '' }, { label: 'C', text: '' }, { label: 'D', text: '' }], correctAnswer: 'A', explanation: '', difficulty: 'medium', marks: 1, negativeMarks: 0, subjectId: '', classId: '', chapterId: '', topicId: '' };

export default function OlympiadQuestions() {
  const [subjects,   setSubjects]   = useState([]);
  const [classes,    setClasses]    = useState([]);
  const [chapters,   setChapters]   = useState([]);
  const [topics,     setTopics]     = useState([]);
  const [questions,  setQuestions]  = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [total,      setTotal]      = useState(0);
  const [page,       setPage]       = useState(1);
  const [showForm,   setShowForm]   = useState(false);
  const [editId,     setEditId]     = useState(null);
  const [form,       setForm]       = useState(emptyQ);
  const [saving,     setSaving]     = useState(false);
  const [filter,     setFilter]     = useState({ subjectId: '', classId: '', chapterId: '', topicId: '', difficulty: '', search: '' });
  const importRef = useRef();
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    api.get('/olympiad/admin/subjects').then(r => setSubjects(r.data.data || []));
    api.get('/olympiad/admin/classes').then(r  => setClasses(r.data.data || []));
  }, []);

  useEffect(() => {
    if (filter.subjectId && filter.classId) {
      api.get('/olympiad/admin/chapters', { params: { subjectId: filter.subjectId, classId: filter.classId } })
        .then(r => setChapters(r.data.data || []));
    } else setChapters([]);
  }, [filter.subjectId, filter.classId]);

  useEffect(() => {
    if (filter.chapterId) {
      api.get('/olympiad/admin/topics', { params: { chapterId: filter.chapterId } })
        .then(r => setTopics(r.data.data || []));
    } else setTopics([]);
  }, [filter.chapterId]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const r = await api.get('/olympiad/admin/questions', { params: { ...filter, page, limit: 20 } });
      setQuestions(r.data.data || []);
      setTotal(r.data.total || 0);
    } catch { toast.error('Failed to load questions'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchQuestions(); }, [filter, page]);

  const openNew = () => { setForm({ ...emptyQ, subjectId: filter.subjectId, classId: filter.classId, chapterId: filter.chapterId, topicId: filter.topicId }); setEditId(null); setShowForm(true); };
  const openEdit = (q) => {
    setForm({
      questionText: q.questionText, options: q.options || emptyQ.options,
      correctAnswer: q.correctAnswer, explanation: q.explanation || '',
      difficulty: q.difficulty, marks: q.marks, negativeMarks: q.negativeMarks,
      subjectId: q.subjectId, classId: q.classId, chapterId: q.chapterId || '', topicId: q.topicId || '',
    });
    setEditId(q.id); setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.questionText.trim()) { toast.error('Question text required'); return; }
    if (!form.subjectId || !form.classId) { toast.error('Subject and Class required'); return; }
    if (form.options.some(o => !o.text.trim())) { toast.error('All 4 options must have text'); return; }
    setSaving(true);
    try {
      if (editId) { await api.put(`/olympiad/admin/questions/${editId}`, form); toast.success('Question updated'); }
      else { await api.post('/olympiad/admin/questions', form); toast.success('Question added'); }
      setShowForm(false); fetchQuestions();
    } catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this question?')) return;
    try { await api.delete(`/olympiad/admin/questions/${id}`); toast.success('Deleted'); fetchQuestions(); }
    catch { toast.error('Failed'); }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    if (!filter.subjectId || !filter.classId) { toast.error('Select Subject and Class before importing'); return; }
    setImporting(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('subjectId', filter.subjectId);
    fd.append('classId', filter.classId);
    if (filter.chapterId) fd.append('chapterId', filter.chapterId);
    if (filter.topicId)   fd.append('topicId', filter.topicId);
    try {
      const r = await api.post('/olympiad/admin/questions/import', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(`Imported ${r.data.imported} questions`);
      fetchQuestions();
    } catch (e) { toast.error(e.response?.data?.error || 'Import failed'); }
    finally { setImporting(false); e.target.value = ''; }
  };

  const downloadTemplate = () => {
    const csv = `Question,Option A,Option B,Option C,Option D,Correct Answer,Explanation,Difficulty,Marks,Negative Marks
"What is 2+2?","3","4","5","6","B","Basic addition","easy","1","0"
"Which planet is closest to the Sun?","Venus","Earth","Mercury","Mars","C","Mercury is closest","medium","1","0"`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'olympiad_questions_template.csv'; a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Brain className="w-6 h-6 text-indigo-600" /> Question Bank
          </h1>
          <p className="text-slate-500 text-sm">{total} question(s)</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={downloadTemplate} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50">
            <Download className="w-4 h-4" /> Template
          </button>
          <input ref={importRef} type="file" accept=".xlsx,.csv" className="hidden" onChange={handleImport} />
          <button onClick={() => importRef.current?.click()} disabled={importing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-emerald-200 text-emerald-700 text-sm font-semibold hover:bg-emerald-50">
            <Upload className="w-4 h-4" /> {importing ? 'Importing...' : 'Import Excel'}
          </button>
          <button onClick={openNew}
            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg transition-all">
            <Plus className="w-4 h-4" /> Add Question
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Subject', key: 'subjectId', opts: subjects.map(s => ({ value: s.id, label: s.name })) },
          { label: 'Class',   key: 'classId',   opts: classes.map(c  => ({ value: c.id, label: c.label })) },
          { label: 'Chapter', key: 'chapterId', opts: chapters.map(ch => ({ value: ch.id, label: ch.name })) },
          { label: 'Topic',   key: 'topicId',   opts: topics.map(t   => ({ value: t.id, label: t.name })) },
          { label: 'Difficulty', key: 'difficulty', opts: DIFFICULTIES.map(d => ({ value: d, label: d.charAt(0).toUpperCase() + d.slice(1) })) },
        ].map(f => (
          <select key={f.key} value={filter[f.key]}
            onChange={e => setFilter(p => ({ ...p, [f.key]: e.target.value, ...(f.key === 'subjectId' ? { classId: '', chapterId: '', topicId: '' } : f.key === 'classId' ? { chapterId: '', topicId: '' } : f.key === 'chapterId' ? { topicId: '' } : {}) }))}
            className="col-span-1 px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">{f.label}</option>
            {f.opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ))}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input value={filter.search} onChange={e => setFilter(p => ({ ...p, search: e.target.value }))}
            placeholder="Search..." className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
      </div>

      {/* Question List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 flex justify-center"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : !questions.length ? (
          <div className="py-16 text-center text-slate-400">
            <Brain className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No questions found. Add or import questions above.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {questions.map((q, i) => (
              <div key={q.id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-black flex items-center justify-center flex-shrink-0">{(page - 1) * 20 + i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 text-sm line-clamp-2">{q.questionText}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {q.options?.map(o => (
                        <span key={o.label} className={`text-xs px-2 py-0.5 rounded-md border ${o.label === q.correctAnswer ? 'bg-green-50 border-green-200 text-green-700 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                          {o.label}: {o.text}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${DIFF_COLORS[q.difficulty]}`}>{q.difficulty}</span>
                      <span className="text-xs text-slate-400">{q.class?.label || ''} · {q.subject?.name || ''} · {q.chapter?.name || ''}</span>
                      <span className="text-xs text-slate-400 ml-auto">{q.marks}M / -{q.negativeMarks}M</span>
                    </div>
                  </div>
                  <div className="flex gap-1 ml-2 flex-shrink-0">
                    <button onClick={() => openEdit(q)} className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(q.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {/* Pagination */}
        {total > 20 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
            <p className="text-sm text-slate-500">Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}</p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-40">Prev</button>
              <button disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Question Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
              <h2 className="font-bold text-slate-900">{editId ? 'Edit Question' : 'Add Question'}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              {/* Subject / Class */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Subject*', key: 'subjectId', opts: subjects.map(s => ({ v: s.id, l: s.name })) },
                  { label: 'Class*',   key: 'classId',   opts: classes.map(c  => ({ v: c.id, l: c.label })) },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">{f.label}</label>
                    <select value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="">Select...</option>
                      {f.opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              {/* Question text */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Question Text*</label>
                <textarea rows={3} value={form.questionText}
                  onChange={e => setForm(p => ({ ...p, questionText: e.target.value }))}
                  placeholder="Enter question..."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              </div>
              {/* Options */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-600">Options*</label>
                {form.options.map((o, idx) => (
                  <div key={o.label} className="flex items-center gap-2">
                    <span className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center flex-shrink-0 ${form.correctAnswer === o.label ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      {o.label}
                    </span>
                    <input value={o.text}
                      onChange={e => {
                        const newOpts = [...form.options];
                        newOpts[idx] = { ...o, text: e.target.value };
                        setForm(p => ({ ...p, options: newOpts }));
                      }}
                      placeholder={`Option ${o.label}`}
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    <button type="button" onClick={() => setForm(p => ({ ...p, correctAnswer: o.label }))}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${form.correctAnswer === o.label ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-green-50'}`}>
                      {form.correctAnswer === o.label ? '✓ Correct' : 'Set Correct'}
                    </button>
                  </div>
                ))}
              </div>
              {/* Explanation + meta */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Explanation (optional)</label>
                <textarea rows={2} value={form.explanation}
                  onChange={e => setForm(p => ({ ...p, explanation: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Difficulty</label>
                  <select value={form.difficulty} onChange={e => setForm(p => ({ ...p, difficulty: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Marks</label>
                  <input type="number" value={form.marks} onChange={e => setForm(p => ({ ...p, marks: parseFloat(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Negative Marks</label>
                  <input type="number" value={form.negativeMarks} onChange={e => setForm(p => ({ ...p, negativeMarks: parseFloat(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t bg-slate-50">
              <button onClick={() => setShowForm(false)} className="px-5 py-2 rounded-xl border border-slate-200 text-sm font-semibold hover:bg-slate-100">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-bold disabled:opacity-60">
                {saving ? 'Saving...' : editId ? 'Update' : 'Save Question'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
