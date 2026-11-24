import React, { useState, useEffect } from 'react';
import {
  Plus, Trash2, Edit2, ChevronDown, ChevronUp, CheckCircle2,
  Clock, Target, BookOpen, BarChart3, Eye, EyeOff, Save,
  AlertCircle, Users, X, ToggleLeft, ToggleRight, Layers,
  Upload, Download
} from 'lucide-react';
import Papa from 'papaparse';
import api from '../../lib/api';
import { toast } from 'react-hot-toast';

// ── Question Form ───────────────────────────────────────────
function QuestionForm({ question, onChange, onSave, onCancel }) {
  const [form, setForm] = useState(() => {
    if (question) {
      return {
        ...question,
        options: typeof question.options === 'string' 
          ? JSON.parse(question.options) 
          : (question.options || ['', '', '', ''])
      };
    }
    return {
      question: '', type: 'mcq',
      options: ['', '', '', ''], correctAnswer: '0',
      explanation: '', points: 1, order: 0,
    };
  });

  const update = (key, val) => {
    const next = { ...form, [key]: val };
    setForm(next);
    onChange?.(next);
  };

  const addOption = () => {
    const opts = [...(form.options || [])];
    opts.push('');
    update('options', opts);
  };

  const removeOption = (idx) => {
    const opts = [...(form.options || [])];
    if (opts.length <= 2) return toast.error('Minimum 2 options required');
    opts.splice(idx, 1);
    
    let currAns = Number(form.correctAnswer);
    if (currAns === idx) currAns = 0;
    else if (currAns > idx) currAns -= 1;
    
    setForm({ ...form, options: opts, correctAnswer: String(currAns) });
  };

  return (
    <div className="bg-slate-50/80 border-2 border-indigo-100/60 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl shadow-indigo-100/20 my-4 transition-all">
      <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
        <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
          <Edit2 size={18} className="text-indigo-500" />
          {question ? 'Edit Question' : 'Design New Question'}
        </h3>
        <button type="button" onClick={onCancel} className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors">
          <X size={18} />
        </button>
      </div>

      <div className="space-y-5">
        <div>
          <label className="label text-sm font-bold text-slate-700">Question Text *</label>
          <textarea
            className="input-field min-h-[100px] text-base resize-y shadow-inner bg-white focus:bg-indigo-50/30"
            placeholder="Type your question here..."
            value={form.question}
            onChange={e => update('question', e.target.value)}
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="label text-sm font-bold text-slate-700">Type</label>
            <div className="relative">
              <select className="input-field py-3 bg-white font-medium shadow-sm appearance-none" value={form.type} onChange={e => {
                const t = e.target.value;
                let newAnswer = form.correctAnswer;
                if (t === 'true_false') newAnswer = 'true';
                if (t === 'mcq') newAnswer = '0';
                if (t === 'short') newAnswer = '';
                
                const next = { ...form, type: t, correctAnswer: newAnswer };
                setForm(next);
                onChange?.(next);
              }}>
                <option value="mcq">Multiple Choice (MCQ)</option>
                <option value="true_false">True / False</option>
                <option value="short">Short Answer</option>
              </select>
              <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="label text-sm font-bold text-slate-700">Points Weight</label>
            <input type="number" min="1" className="input-field py-3 bg-white font-bold text-indigo-600 shadow-sm" value={form.points} onChange={e => update('points', Number(e.target.value))} />
          </div>
        </div>

        {form.type === 'mcq' && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <label className="label !mb-0 text-sm font-bold text-slate-700">Answer Options</label>
              <span className="text-[10px] uppercase font-black tracking-widest text-emerald-500 bg-emerald-50 px-2 py-1 rounded-md">
                Select Correct Answer
              </span>
            </div>
            
            <div className="space-y-3">
              {(form.options || []).map((opt, idx) => {
                const isSelected = String(form.correctAnswer) === String(idx);
                return (
                  <div key={idx} className={`flex items-center gap-3 p-2 rounded-xl transition-colors border-2 ${isSelected ? 'bg-emerald-50/50 border-emerald-200' : 'border-transparent hover:border-slate-100'}`}>
                    <button type="button"
                      onClick={() => update('correctAnswer', String(idx))}
                      className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all shadow-sm ${isSelected ? 'border-emerald-500 bg-emerald-500 shadow-emerald-500/30' : 'border-slate-300 bg-white hover:border-emerald-400'}`}
                    >
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </button>
                    <input
                      className={`input-field flex-1 py-2.5 bg-white transition-colors ${isSelected ? 'font-medium text-emerald-900 border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400/20' : ''}`}
                      placeholder={`Option ${idx + 1}`}
                      value={opt}
                      onChange={e => {
                        const opts = [...(form.options || [])];
                        opts[idx] = e.target.value;
                        update('options', opts);
                      }}
                    />
                    <button type="button" onClick={() => removeOption(idx)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0">
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
            
            <button type="button" onClick={addOption} className="mt-4 flex items-center gap-1.5 text-sm font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-lg transition-colors">
              <Plus size={14} /> Add new option
            </button>
          </div>
        )}

        {form.type === 'true_false' && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <label className="label text-sm font-bold text-slate-700 mb-4">Select Correct Answer</label>
            <div className="flex gap-4">
              {['true', 'false'].map(v => (
                <button key={v} type="button"
                  onClick={() => update('correctAnswer', v)}
                  className={`flex-1 py-4 rounded-xl border-2 font-black text-lg capitalize transition-all shadow-sm ${form.correctAnswer === v ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-emerald-500/20 scale-[1.02]' : 'border-slate-200 bg-white text-slate-400 hover:border-emerald-300 hover:text-slate-600'}`}
                >
                  {v}
                  {form.correctAnswer === v && <Target size={16} className="inline ml-2 opacity-50" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {form.type === 'short' && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <label className="label text-sm font-bold text-slate-700">Expected Answer</label>
            <p className="text-[11px] text-slate-500 mb-3">The exact word or phrase students must type for auto-grading.</p>
            <input className="input-field py-3 font-semibold text-slate-800" placeholder="e.g. photosynthesis" value={form.correctAnswer} onChange={e => update('correctAnswer', e.target.value)} />
          </div>
        )}

        <div>
          <label className="flex items-center gap-2 label text-sm font-bold text-slate-700">
            Explanation <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 bg-slate-100 px-2 py-0.5 rounded">Optional</span>
          </label>
          <textarea className="input-field min-h-[70px] bg-white shadow-sm" placeholder="Explain why this is the correct answer. Students will see this after they attempt the quiz..." value={form.explanation} onChange={e => update('explanation', e.target.value)} />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6">
        <button type="button" onClick={onCancel} className="px-6 py-2.5 text-sm font-bold text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors">
          Cancel
        </button>
        <button type="button" onClick={() => onSave(form)} className="px-8 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/30 rounded-xl transition-all hover:-translate-y-0.5 flex items-center gap-2">
          <Save size={16} /> Save Question
        </button>
      </div>
    </div>
  );
}

// ── Quiz Card ───────────────────────────────────────────────
function QuizCard({ quiz, courseId, onRefresh }) {
  const [expanded, setExpanded] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [addingQ, setAddingQ] = useState(false);
  const [editingQ, setEditingQ] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const loadQuestions = async () => {
    try {
      const res = await api.get(`/lms/course-quizzes/${quiz.id}`);
      setQuestions(res.data.data.questions || []);
    } catch { toast.error('Failed to load questions'); }
  };

  useEffect(() => { if (expanded) loadQuestions(); }, [expanded]);

  const handleTogglePublish = async () => {
    try {
      await api.put(`/lms/course-quizzes/${quiz.id}`, { isPublished: !quiz.isPublished });
      toast.success(quiz.isPublished ? 'Quiz unpublished' : 'Quiz published!');
      onRefresh();
    } catch { toast.error('Failed to update'); }
  };

  const handleDeleteQuiz = async () => {
    if (!window.confirm('Delete this quiz and all its questions?')) return;
    try {
      await api.delete(`/lms/course-quizzes/${quiz.id}`);
      toast.success('Quiz deleted');
      onRefresh();
    } catch { toast.error('Failed to delete'); }
  };

  const handleSaveQuestion = async (form) => {
    try {
      if (editingQ) {
        await api.put(`/lms/course-quizzes/${quiz.id}/questions/${editingQ.id}`, form);
        toast.success('Question updated');
        setEditingQ(null);
      } else {
        await api.post(`/lms/course-quizzes/${quiz.id}/questions`, { ...form, order: questions.length });
        toast.success('Question added');
        setAddingQ(false);
      }
      loadQuestions();
    } catch { toast.error('Failed to save question'); }
  };

  const handleDeleteQuestion = async (qId) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      await api.delete(`/lms/course-quizzes/${quiz.id}/questions/${qId}`);
      toast.success('Question deleted');
      loadQuestions();
    } catch { toast.error('Failed to delete'); }
  };

  const loadAnalytics = async () => {
    try {
      const res = await api.get(`/lms/course-quizzes/${quiz.id}/analytics`);
      setAnalytics(res.data.data);
      setShowAnalytics(true);
    } catch { toast.error('Failed to load analytics'); }
  };

  const handleCSVUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data;
        if (!rows.length) return toast.error('No questions found in CSV');

        const toastId = toast.loading(`Importing ${rows.length} questions...`);
        let successCount = 0;
        
        try {
          for (const row of rows) {
            const questionStr = row.Question || row.question;
            if (!questionStr) continue;

            const t = (row.Type || row.type || 'mcq').toLowerCase().trim();
            const typeMap = { 'mcq': 'mcq', 'true_false': 'true_false', 'true/false': 'true_false', 'short': 'short' };
            const finalType = typeMap[t] || 'mcq';

            const opts = [];
            if (row.Option1 || row.option1) opts.push(row.Option1 || row.option1);
            if (row.Option2 || row.option2) opts.push(row.Option2 || row.option2);
            if (row.Option3 || row.option3) opts.push(row.Option3 || row.option3);
            if (row.Option4 || row.option4) opts.push(row.Option4 || row.option4);

            await api.post(`/lms/course-quizzes/${quiz.id}/questions`, {
              question: questionStr,
              type: finalType,
              options: opts.length > 0 ? opts : undefined,
              correctAnswer: String(row.CorrectAnswer || row.correctAnswer || '0'),
              explanation: row.Explanation || row.explanation || '',
              points: Number(row.Points || row.points || 1),
              order: questions.length + successCount
            });
            successCount++;
          }
          toast.success(`${successCount} questions imported!`, { id: toastId });
          loadQuestions();
        } catch (err) {
          toast.error('Import failed midway: ' + (err.response?.data?.error || err.message), { id: toastId });
          loadQuestions();
        }
        e.target.value = '';
      },
      error: (err) => toast.error('Parse error: ' + err.message)
    });
  };

  const totalPoints = questions.reduce((s, q) => s + (q.points || 1), 0);

  return (
    <div className={`bg-white rounded-2xl border shadow-sm transition-all hover:shadow-md ${quiz.isPublished ? 'border-emerald-200' : 'border-slate-200'}`}>
      {/* Header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${quiz.isPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {quiz.isPublished ? 'Published' : 'Draft'}
              </span>
              {quiz.timeLimit && (
                <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Clock size={10} /> {quiz.timeLimit} min
                </span>
              )}
              <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Target size={10} /> Pass: {quiz.passingScore}%
              </span>
            </div>
            <h3 className="font-bold text-slate-900 text-base">{quiz.title}</h3>
            {quiz.description && <p className="text-sm text-slate-500 mt-0.5 line-clamp-1">{quiz.description}</p>}

            <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
              <span className="flex items-center gap-1"><BookOpen size={12} /> {quiz.questions?.length || 0} Questions</span>
              <span className="flex items-center gap-1"><Target size={12} /> {totalPoints} pts</span>
              {quiz.maxAttempts && <span className="flex items-center gap-1"><Layers size={12} /> Max {quiz.maxAttempts} attempts</span>}
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={loadAnalytics} className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Analytics">
              <BarChart3 size={16} />
            </button>
            <button onClick={handleTogglePublish} className={`p-2 rounded-lg transition-colors ${quiz.isPublished ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`} title={quiz.isPublished ? 'Unpublish' : 'Publish'}>
              {quiz.isPublished ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
            </button>
            <button onClick={handleDeleteQuiz} className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Delete">
              <Trash2 size={16} />
            </button>
            <button onClick={() => setExpanded(!expanded)} className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* Questions Panel */}
      {expanded && (
        <div className="border-t border-slate-100 p-5 space-y-3">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
            <h4 className="font-semibold text-slate-700 text-sm">Questions ({questions.length})</h4>
            <div className="flex items-center gap-2">
              <input type="file" id={`csv-upload-${quiz.id}`} accept=".csv" className="hidden" onChange={handleCSVUpload} />
              <label htmlFor={`csv-upload-${quiz.id}`} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1 cursor-pointer">
                <Upload size={13} /> Import CSV
              </label>
              <a href={encodeURI("data:text/csv;charset=utf-8,Question,Type,Option1,Option2,Option3,Option4,CorrectAnswer,Explanation,Points\n\"What is the capital of France?\",\"mcq\",\"Berlin\",\"Madrid\",\"Paris\",\"Rome\",\"2\",\"Paris is the capital of France.\",\"1\"\n\"The earth is flat.\",\"true_false\",\"\",\"\",\"\",\"\",\"false\",\"\",\"1\"")} download="quiz_import_sample.csv" className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1 text-slate-500" title="Download Sample CSV Template">
                <Download size={13} /> Sample CSV
              </a>
              <button onClick={() => { setAddingQ(true); setEditingQ(null); }} className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1 shadow-sm">
                <Plus size={13} /> Add Question
              </button>
            </div>
          </div>

          {questions.sort((a, b) => a.order - b.order).map((q, idx) => (
            <div key={q.id}>
              {editingQ?.id === q.id ? (
                <QuestionForm question={editingQ} onSave={handleSaveQuestion} onCancel={() => setEditingQ(null)} />
              ) : (
                <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 group">
                  <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800">{q.question}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold bg-white border border-slate-200 text-slate-500 px-1.5 py-0.5 rounded capitalize">{q.type.replace('_', '/')}</span>
                      <span className="text-[10px] text-slate-400">{q.points} pt{q.points !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditingQ(q); setAddingQ(false); }} className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-white rounded-lg transition-colors">
                      <Edit2 size={13} />
                    </button>
                    <button onClick={() => handleDeleteQuestion(q.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {addingQ && (
            <QuestionForm onSave={handleSaveQuestion} onCancel={() => setAddingQ(false)} />
          )}

          {questions.length === 0 && !addingQ && (
            <div className="text-center py-8 text-slate-400">
              <BookOpen className="w-8 h-8 mx-auto mb-2 text-slate-200" />
              <p className="text-sm">No questions yet. Click "Add Question" to start building.</p>
            </div>
          )}
        </div>
      )}

      {/* Analytics Modal */}
      {showAnalytics && analytics && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowAnalytics(false)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white z-10">
              <h3 className="font-bold text-slate-900 flex items-center gap-2"><BarChart3 size={18} className="text-primary-500" /> Quiz Analytics</h3>
              <button onClick={() => setShowAnalytics(false)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-5">
              {/* Stats */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Total Attempts', value: analytics.stats.total, color: 'bg-blue-50 text-blue-700' },
                  { label: 'Passed', value: analytics.stats.passed, color: 'bg-emerald-50 text-emerald-700' },
                  { label: 'Failed', value: analytics.stats.failed, color: 'bg-red-50 text-red-700' },
                  { label: 'Avg Score', value: `${analytics.stats.avgScore}%`, color: 'bg-violet-50 text-violet-700' },
                ].map(s => (
                  <div key={s.label} className={`${s.color} rounded-xl p-3 text-center`}>
                    <p className="text-2xl font-black">{s.value}</p>
                    <p className="text-xs font-semibold mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Pass rate bar */}
              <div>
                <div className="flex justify-between text-sm font-semibold text-slate-700 mb-1">
                  <span>Pass Rate</span><span>{analytics.stats.passRate}%</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${analytics.stats.passRate}%` }} />
                </div>
              </div>

              {/* Attempt list */}
              {analytics.attempts.length > 0 && (
                <div>
                  <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2"><Users size={15} /> Student Attempts</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {analytics.attempts.map(a => (
                      <div key={a.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl text-sm">
                        <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                          {a.student?.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-800 truncate">{a.student?.name}</p>
                          <p className="text-xs text-slate-500">{new Date(a.completedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={`font-black text-base ${a.passed ? 'text-emerald-600' : 'text-red-500'}`}>{a.score}%</p>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${a.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{a.passed ? 'PASSED' : 'FAILED'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {analytics.attempts.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  <Users className="w-8 h-8 mx-auto mb-2 text-slate-200" />
                  <p className="text-sm">No student attempts yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Create Quiz Modal ────────────────────────────────────────
function CreateQuizModal({ courseId, modules, onCreated, onClose }) {
  const [form, setForm] = useState({
    title: '', description: '', moduleId: '', lessonId: '',
    timeLimit: '', passingScore: 60, shuffleQuestions: false,
    showAnswers: true, maxAttempts: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/lms/courses/${courseId}/course-quizzes`, {
        ...form,
        timeLimit: form.timeLimit ? Number(form.timeLimit) : null,
        maxAttempts: form.maxAttempts ? Number(form.maxAttempts) : null,
      });
      toast.success('Quiz created!');
      onCreated();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create quiz');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 flex items-center gap-2"><Plus size={18} className="text-primary-500" /> New Quiz</h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="label">Quiz Title *</label>
            <input required className="input-field" placeholder="e.g. Chapter 1 Assessment" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input-field min-h-[70px]" placeholder="Brief description..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className="label">Attach to Module (optional)</label>
            <select className="input-field" value={form.moduleId} onChange={e => setForm({ ...form, moduleId: e.target.value })}>
              <option value="">— Course Level —</option>
              {modules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Time Limit (min)</label>
              <input type="number" min="1" className="input-field" placeholder="None" value={form.timeLimit} onChange={e => setForm({ ...form, timeLimit: e.target.value })} />
            </div>
            <div>
              <label className="label">Passing Score (%)</label>
              <input type="number" min="1" max="100" className="input-field" value={form.passingScore} onChange={e => setForm({ ...form, passingScore: Number(e.target.value) })} />
            </div>
            <div>
              <label className="label">Max Attempts</label>
              <input type="number" min="1" className="input-field" placeholder="∞" value={form.maxAttempts} onChange={e => setForm({ ...form, maxAttempts: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-3">
            <label className="flex items-center gap-2 cursor-pointer flex-1 p-3 border border-slate-200 rounded-xl hover:border-primary-300 transition-colors">
              <input type="checkbox" className="w-4 h-4" checked={form.shuffleQuestions} onChange={e => setForm({ ...form, shuffleQuestions: e.target.checked })} />
              <span className="text-sm font-medium text-slate-700">Shuffle Questions</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer flex-1 p-3 border border-slate-200 rounded-xl hover:border-primary-300 transition-colors">
              <input type="checkbox" className="w-4 h-4" checked={form.showAnswers} onChange={e => setForm({ ...form, showAnswers: e.target.checked })} />
              <span className="text-sm font-medium text-slate-700">Show Answers After</span>
            </label>
          </div>
          <div className="flex gap-3 pt-3 border-t border-slate-100">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">Create Quiz</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main QuizBuilder Component ───────────────────────────────
export default function QuizBuilder({ courseId, modules = [] }) {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/lms/courses/${courseId}/course-quizzes`);
      setQuizzes(res.data.data || []);
    } catch { toast.error('Failed to load quizzes'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (courseId) fetchQuizzes(); }, [courseId]);

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">📝 Quiz Builder</h3>
          <p className="text-sm text-slate-500 mt-0.5">{quizzes.length} quiz{quizzes.length !== 1 ? 'zes' : ''} · Click a quiz to manage questions</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Quiz
        </button>
      </div>

      {/* Quiz list */}
      <div className="space-y-4">
        {quizzes.map(q => (
          <QuizCard key={q.id} quiz={q} courseId={courseId} onRefresh={fetchQuizzes} />
        ))}
      </div>

      {quizzes.length === 0 && (
        <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
          <BookOpen className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="font-semibold text-slate-700">No quizzes yet</p>
          <p className="text-sm text-slate-500 mb-4">Create your first quiz to assess student knowledge.</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary">Create First Quiz</button>
        </div>
      )}

      {showCreate && (
        <CreateQuizModal
          courseId={courseId}
          modules={modules}
          onCreated={() => { setShowCreate(false); fetchQuizzes(); }}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}
