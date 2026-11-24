import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Clock, ChevronLeft, ChevronRight, Flag, Send, AlertTriangle,
  CheckCircle, Circle, Bookmark, Eye, EyeOff, Maximize2
} from 'lucide-react';
import api from '../../../lib/api';
import toast from 'react-hot-toast';

// Status colors for question palette
const Q_STATUS = {
  answered:     'bg-green-500 text-white',
  skipped:      'bg-red-100 text-red-600 border border-red-300',
  marked:       'bg-purple-500 text-white',
  markedAnswered:'bg-purple-300 text-purple-900',
  notVisited:   'bg-slate-100 text-slate-500',
};

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

export default function OlympiadExam() {
  const { olympiadId } = useParams();
  const navigate       = useNavigate();

  // Exam state
  const [loading,       setLoading]       = useState(true);
  const [questions,     setQuestions]     = useState([]);
  const [sessionId,     setSessionId]     = useState(null);
  const [currentIdx,    setCurrentIdx]    = useState(0);
  const [answers,       setAnswers]       = useState({});
  const [markedReview,  setMarkedReview]  = useState([]);
  const [visited,       setVisited]       = useState(new Set());
  const [timeLeft,      setTimeLeft]      = useState(0);
  const [examDuration,  setExamDuration]  = useState(0);
  const [marksPerQ,     setMarksPerQ]     = useState(1);
  const [negMarks,      setNegMarks]      = useState(0);
  const [submitted,     setSubmitted]     = useState(false);
  const [submitting,    setSubmitting]    = useState(false);
  const [showPalette,   setShowPalette]   = useState(true);
  const [showConfirm,   setShowConfirm]   = useState(false);
  const [tabViolations, setTabViolations] = useState(0);
  const [fsViolations,  setFsViolations]  = useState(0);

  const timerRef     = useRef(null);
  const autoSaveRef  = useRef(null);
  const answersRef   = useRef(answers);
  const markedRef    = useRef(markedReview);
  const tabRef       = useRef(tabViolations);
  const fsRef        = useRef(fsViolations);

  answersRef.current  = answers;
  markedRef.current   = markedReview;
  tabRef.current      = tabViolations;
  fsRef.current       = fsViolations;

  // ── Start exam ──────────────────────────────────────────────────
  useEffect(() => {
    const start = async () => {
      try {
        const r = await api.post(`/olympiad/student/exam/${olympiadId}/start`);
        const d = r.data.data;
        setQuestions(d.questions || []);
        setSessionId(d.sessionId);
        setTimeLeft(d.timeRemainingSeconds || d.examDurationMinutes * 60);
        setExamDuration(d.examDurationMinutes * 60);
        setMarksPerQ(d.marksPerQuestion || 1);
        setNegMarks(d.negativeMarks || 0);
        // Restore answers from previous auto-save
        if (d.answers) setAnswers(d.answers);
        if (d.markedForReview) setMarkedReview(d.markedForReview);
        setVisited(new Set([0]));
      } catch (e) {
        toast.error(e.response?.data?.error || 'Failed to start exam');
        navigate('/student/olympiad');
      } finally { setLoading(false); }
    };
    start();
    return () => { clearInterval(timerRef.current); clearInterval(autoSaveRef.current); };
  }, [olympiadId]);

  // ── Countdown timer ─────────────────────────────────────────────
  useEffect(() => {
    if (!timeLeft || loading) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); handleSubmit(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [loading]);

  // ── Auto-save every 15s ──────────────────────────────────────────
  useEffect(() => {
    if (loading) return;
    autoSaveRef.current = setInterval(() => {
      api.post(`/olympiad/student/exam/${olympiadId}/autosave`, {
        answers:          answersRef.current,
        markedForReview:  markedRef.current,
        tabSwitchCount:   tabRef.current,
        fullScreenViolations: fsRef.current,
      }).catch(() => {}); // silent
    }, 15000);
    return () => clearInterval(autoSaveRef.current);
  }, [loading, olympiadId]);

  // ── Tab-switch detection ─────────────────────────────────────────
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden) {
        setTabViolations(v => v + 1);
        toast.error('⚠️ Tab switch detected! This is recorded.', { duration: 3000 });
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  // ── Fullscreen enforcement ────────────────────────────────────────
  useEffect(() => {
    const requestFS = () => {
      if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {});
    };
    const onFSChange = () => {
      if (!document.fullscreenElement && !loading && !submitted) {
        setFsViolations(v => v + 1);
        toast.error('⚠️ Please stay in full-screen mode!', { duration: 3000 });
        setTimeout(requestFS, 1000);
      }
    };
    requestFS();
    document.addEventListener('fullscreenchange', onFSChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFSChange);
      if (document.exitFullscreen && document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, [loading, submitted]);

  const handleAnswer = (qId, label) => {
    setAnswers(prev => ({ ...prev, [qId]: label }));
  };

  const toggleMark = (qId) => {
    setMarkedReview(prev => prev.includes(qId) ? prev.filter(id => id !== qId) : [...prev, qId]);
  };

  const goTo = (idx) => {
    setCurrentIdx(idx);
    setVisited(prev => { const s = new Set(prev); s.add(idx); return s; });
  };

  const getQStatus = (idx, qId) => {
    const isMarked   = markedReview.includes(qId);
    const isAnswered = !!answers[qId];
    if (isMarked && isAnswered) return 'markedAnswered';
    if (isMarked)   return 'marked';
    if (isAnswered) return 'answered';
    if (visited.has(idx)) return 'skipped';
    return 'notVisited';
  };

  const handleSubmit = useCallback(async (auto = false) => {
    if (submitted) return;
    setSubmitting(true);
    setSubmitted(true);
    clearInterval(timerRef.current);
    clearInterval(autoSaveRef.current);
    try {
      if (document.exitFullscreen && document.fullscreenElement) await document.exitFullscreen().catch(() => {});
      const r = await api.post(`/olympiad/student/exam/${olympiadId}/submit`, {
        answers: answersRef.current,
        markedForReview: markedRef.current,
      });
      toast.success('✅ Exam submitted successfully!');
      navigate(`/student/olympiad/result/${olympiadId}`);
    } catch (e) {
      toast.error(e.response?.data?.error || 'Submission failed. Please try again.');
      setSubmitting(false);
      setSubmitted(false);
    }
  }, [submitted, olympiadId, navigate]);

  if (loading) return (
    <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center text-white">
      <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-lg font-semibold">Starting Exam...</p>
      <p className="text-slate-400 text-sm mt-1">Loading your personalized question set</p>
    </div>
  );

  if (!questions.length) return (
    <div className="fixed inset-0 bg-slate-900 flex items-center justify-center text-white">
      <div className="text-center">
        <AlertTriangle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">No Questions Available</h2>
        <p className="text-slate-400">Please contact the exam administrator.</p>
        <button onClick={() => navigate('/student/olympiad')} className="mt-6 px-6 py-2 bg-indigo-600 rounded-xl font-semibold">Go Back</button>
      </div>
    </div>
  );

  const q        = questions[currentIdx];
  const answered = Object.keys(answers).length;
  const marked   = markedReview.length;
  const total    = questions.length;
  const timePct  = timeLeft / examDuration;
  const timerColor = timeLeft < 300 ? 'text-red-400' : timeLeft < 600 ? 'text-yellow-400' : 'text-green-400';

  return (
    <div className="fixed inset-0 bg-slate-900 flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 lg:px-6 py-3 bg-slate-800 border-b border-slate-700 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
            <span className="text-white text-xs font-black">O</span>
          </div>
          <div className="hidden sm:block">
            <p className="text-white text-sm font-bold leading-tight">Abhyo Olympiad Exam</p>
            <p className="text-slate-400 text-xs">Attempt all questions carefully</p>
          </div>
        </div>
        {/* Timer */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${timeLeft < 300 ? 'bg-red-500/20 border border-red-500/50 animate-pulse' : 'bg-slate-700'}`}>
          <Clock className={`w-4 h-4 ${timerColor}`} />
          <span className={`text-xl font-black tabular-nums ${timerColor}`}>{formatTime(timeLeft)}</span>
        </div>
        {/* Stats */}
        <div className="hidden md:flex items-center gap-4 text-xs">
          <span className="text-green-400 font-bold">{answered} answered</span>
          <span className="text-slate-400">{total - answered} remaining</span>
          {marked > 0 && <span className="text-purple-400 font-bold">{marked} marked</span>}
        </div>
        <button onClick={() => setShowPalette(p => !p)}
          className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors lg:hidden">
          {showPalette ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-slate-700 flex-shrink-0">
        <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300" style={{ width: `${(answered / total) * 100}%` }} />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Question Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Question */}
          <div className="flex-1 overflow-y-auto p-4 lg:p-8">
            <div className="max-w-3xl mx-auto">
              {/* Question number + marks */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 text-sm">Question</span>
                  <span className="text-xl font-black text-white">{currentIdx + 1}</span>
                  <span className="text-slate-500 text-sm">/ {total}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded-lg bg-green-500/20 text-green-400 font-bold">+{marksPerQ}M</span>
                  {negMarks > 0 && <span className="text-xs px-2 py-1 rounded-lg bg-red-500/20 text-red-400 font-bold">-{negMarks}M</span>}
                  <button onClick={() => toggleMark(q.id)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${markedReview.includes(q.id) ? 'bg-purple-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-purple-500/20 hover:text-purple-400'}`}>
                    <Bookmark className="w-3.5 h-3.5" />
                    {markedReview.includes(q.id) ? 'Marked' : 'Mark for Review'}
                  </button>
                </div>
              </div>

              {/* Question text */}
              <div className="bg-slate-800 rounded-2xl p-6 mb-6 border border-slate-700">
                {q.image && <img src={q.image} alt="Question" className="max-w-full rounded-xl mb-4 max-h-48 object-contain" />}
                <p className="text-white text-base leading-relaxed font-medium">{q.questionText}</p>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {(q.options || []).map((opt, oi) => {
                  const selected = answers[q.id] === opt.label;
                  return (
                    <button
                      key={opt.label}
                      onClick={() => handleAnswer(q.id, opt.label)}
                      className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 text-left transition-all duration-150 group ${
                        selected
                          ? 'border-indigo-500 bg-indigo-500/20 text-white shadow-lg shadow-indigo-500/20'
                          : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-500 hover:bg-slate-700'
                      }`}
                    >
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 transition-all ${selected ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400 group-hover:bg-slate-600'}`}>
                        {opt.label}
                      </span>
                      <span className="font-medium">{opt.text}</span>
                      {selected && <CheckCircle className="w-5 h-5 text-indigo-400 ml-auto flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom Navigation */}
          <div className="bg-slate-800 border-t border-slate-700 px-4 py-3 flex items-center justify-between flex-shrink-0">
            <button onClick={() => goTo(Math.max(0, currentIdx - 1))} disabled={currentIdx === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-700 text-slate-300 font-semibold text-sm disabled:opacity-40 hover:bg-slate-600 transition-all">
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <div className="flex items-center gap-2">
              {answers[q.id] && (
                <button onClick={() => { const a = { ...answers }; delete a[q.id]; setAnswers(a); }}
                  className="px-3 py-2 rounded-xl bg-slate-700 text-slate-300 text-xs font-semibold hover:bg-red-500/20 hover:text-red-400 transition-all">
                  Clear
                </button>
              )}
              <button onClick={() => setShowConfirm(true)}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-sm hover:shadow-lg hover:shadow-indigo-500/30 transition-all">
                <Send className="w-4 h-4" /> Submit
              </button>
            </div>
            <button onClick={() => goTo(Math.min(total - 1, currentIdx + 1))} disabled={currentIdx === total - 1}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-700 text-slate-300 font-semibold text-sm disabled:opacity-40 hover:bg-slate-600 transition-all">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Question Palette */}
        {showPalette && (
          <div className="w-64 bg-slate-800 border-l border-slate-700 flex flex-col flex-shrink-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-700">
              <p className="text-sm font-bold text-white">Question Palette</p>
              <div className="flex flex-wrap gap-1.5 mt-2 text-[10px]">
                {[
                  { key:'answered',     color:'bg-green-500',   label:'Answered' },
                  { key:'skipped',      color:'bg-red-300',     label:'Skipped' },
                  { key:'marked',       color:'bg-purple-500',  label:'Marked' },
                  { key:'notVisited',   color:'bg-slate-600',   label:'Not Visited' },
                ].map(item => (
                  <div key={item.key} className="flex items-center gap-1">
                    <div className={`w-3 h-3 rounded-sm ${item.color}`} />
                    <span className="text-slate-400">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <div className="grid grid-cols-5 gap-1.5">
                {questions.map((qItem, idx) => {
                  const status = getQStatus(idx, qItem.id);
                  return (
                    <button key={qItem.id} onClick={() => goTo(idx)}
                      className={`w-full aspect-square rounded-lg text-xs font-bold transition-all flex items-center justify-center hover:scale-110 ${Q_STATUS[status]} ${currentIdx === idx ? 'ring-2 ring-white ring-offset-1 ring-offset-slate-800' : ''}`}>
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>
            {/* Summary */}
            <div className="px-4 py-3 border-t border-slate-700 space-y-1 text-xs">
              <div className="flex justify-between"><span className="text-slate-400">Answered</span><span className="text-green-400 font-bold">{answered}/{total}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Not Answered</span><span className="text-red-400 font-bold">{total - answered}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Marked</span><span className="text-purple-400 font-bold">{marked}</span></div>
              <div className="flex justify-between mt-2 pt-2 border-t border-slate-700"><span className="text-slate-400">Score (if submitted now)</span><span className="text-white font-black">{answered * marksPerQ}</span></div>
            </div>
          </div>
        )}
      </div>

      {/* Submit Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-800 border border-slate-600 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="text-center mb-5">
              <div className="w-14 h-14 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-7 h-7 text-yellow-400" />
              </div>
              <h2 className="text-lg font-bold text-white">Submit Exam?</h2>
              <p className="text-slate-400 text-sm mt-1">You cannot change answers after submission.</p>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { label: 'Answered', value: answered, color: 'text-green-400' },
                { label: 'Unanswered', value: total - answered, color: 'text-red-400' },
                { label: 'Marked', value: marked, color: 'text-purple-400' },
              ].map(item => (
                <div key={item.label} className="bg-slate-700 rounded-xl p-3 text-center">
                  <p className={`text-2xl font-black ${item.color}`}>{item.value}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{item.label}</p>
                </div>
              ))}
            </div>
            {tabViolations > 0 && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {tabViolations} tab switch violation(s) recorded
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-600 text-slate-300 font-semibold hover:bg-slate-700 transition-all">
                Continue Exam
              </button>
              <button onClick={() => { setShowConfirm(false); handleSubmit(false); }} disabled={submitting}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold disabled:opacity-60 transition-all">
                {submitting ? 'Submitting...' : 'Submit Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
