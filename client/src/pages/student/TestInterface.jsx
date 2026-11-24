import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Clock, ChevronLeft, ChevronRight, Flag, Send, AlertTriangle,
  CheckCircle, X, BookOpen, BarChart2, Bookmark, Eye, EyeOff,
  Zap, Target, Brain, RotateCcw, ChevronDown, ChevronUp
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../lib/api';

export default function TestInterface() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const chosenLang = location.state?.language
    || sessionStorage.getItem(`test_lang_${testId}`)
    || 'en';

  const [test, setTest]             = useState(null);
  const [resultId, setResultId]     = useState(null);
  const [questions, setQuestions]   = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [responses, setResponses]   = useState({});
  const [markedForReview, setMarkedForReview] = useState({});
  const [timeRemaining, setTimeRemaining]     = useState(0);
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showPanel, setShowPanel]   = useState(true);
  const [qStartedAt, setQStartedAt] = useState(Date.now());
  const [activeSection, setActiveSection] = useState('navigator'); // navigator | summary
  const [showLangHindi, setShowLangHindi] = useState(chosenLang === 'hi');
  const [translations, setTranslations] = useState({}); // Stores auto-translated texts { [qId]: { qText, options: { A: text, B: text } } }
  
  // Anti-Cheat states
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showAntiCheatWarning, setShowAntiCheatWarning] = useState(false);
  const [antiCheatPenaltyTime, setAntiCheatPenaltyTime] = useState(0);
  const penaltyIntervalRef = useRef(null);
  const handleSubmitRef = useRef(null);

  const timerRef      = useRef(null);
  const timeRef       = useRef(0);   // mirror timeRemaining without stale closure
  const loadedRef     = useRef(false);

  // ── Load test ────────────────────────────────────────────
  useEffect(() => {
    const startTest = async () => {
      try {
        const res = await api.get(`/tests/${testId}/start?_t=${Date.now()}`);
        const { test: testData, resultId: rid, timeRemaining: tr, questions: qs } = res.data.data;
        setTest(testData);
        setResultId(rid);
        setTimeRemaining(tr);
        timeRef.current = tr;
        setQuestions(qs || []);
        loadedRef.current = true;
      } catch (err) {
        toast.error(err.response?.data?.error || 'Failed to start test');
        navigate('/student/tests');
      } finally {
        setLoading(false);
      }
    };
    startTest();
    return () => clearInterval(timerRef.current);
  }, [testId]);

  // ── Timer (fixed: runs after load, uses ref to avoid stale closure) ──
  useEffect(() => {
    if (!loadedRef.current) return;
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      timeRef.current -= 1;
      if (timeRef.current <= 0) {
        clearInterval(timerRef.current);
        handleSubmit(true);
      } else {
        setTimeRemaining(timeRef.current);
      }
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [resultId]); // starts as soon as resultId is set (test loaded)

  // ── Auto Translation ──────────────────────────────────────
  useEffect(() => {
    if (!showLangHindi || !questions[currentIdx]) return;
    const q = questions[currentIdx];
    
    // If we already have native Hindi or we already translated it, do nothing.
    if (q.questionTextHindi || translations[q.id]) return;

    const doTranslate = async () => {
      try {
        const transCache = { options: {} };
        const tr = async (txt) => {
          if (!txt || typeof txt !== 'string') return '';
          const r = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=hi&dt=t&q=${encodeURIComponent(txt)}`);
          const d = await r.json();
          return d[0].map(item => item[0]).join('');
        };

        transCache.qText = await tr(q.questionText);
        if (q.options) {
          await Promise.all(q.options.map(async (opt) => {
            transCache.options[opt.label] = await tr(opt.text);
          }));
        }
        setTranslations(prev => ({ ...prev, [q.id]: transCache }));
      } catch (err) {
        console.error("Translation API error:", err);
      }
    };
    doTranslate();
  }, [currentIdx, showLangHindi, questions, translations]);

  // ── Helpers ───────────────────────────────────────────────
  const formatTime = useCallback((secs) => {
    if (!secs || secs < 0) return '00:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }, []);

  // ── Anti-Cheat: Tab Switch Detection ──────────────────────
  const MAX_TAB_SWITCHES = 3;

  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  });

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!loadedRef.current || showSubmitModal) return;
      if (document.hidden) {
        setTabSwitchCount(prev => {
          const newCount = prev + 1;
          if (newCount >= MAX_TAB_SWITCHES) {
            toast.error('🚫 Test Terminated: Maximum tab switches exceeded.', { duration: 5000 });
            if (handleSubmitRef.current) handleSubmitRef.current(true);
          } else {
            setShowAntiCheatWarning(true);
            setAntiCheatPenaltyTime(5);
            clearInterval(penaltyIntervalRef.current);
            penaltyIntervalRef.current = setInterval(() => {
              setAntiCheatPenaltyTime(time => {
                if (time <= 1) {
                  clearInterval(penaltyIntervalRef.current);
                  return 0;
                }
                return time - 1;
              });
            }, 1000);
          }
          return newCount;
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(penaltyIntervalRef.current);
    };
  }, [showSubmitModal]);

  const pct = questions.length ? Math.round((timeRemaining / (test?.duration * 60 || 1)) * 100) : 100;
  const isUrgent = timeRemaining > 0 && timeRemaining <= 300;
  const isWarning = timeRemaining > 300 && timeRemaining <= 600;

  const answeredCount   = Object.values(responses).filter(r => r.selectedOption).length;
  const reviewCount     = Object.values(markedForReview).filter(Boolean).length;
  const unattemptedCount = questions.length - answeredCount;
  const currentQ        = questions[currentIdx];

  // ── Actions ───────────────────────────────────────────────
  const handleAnswer = (label) => {
    const qId = currentQ?.id;
    if (!qId) return;
    const timeTaken = Math.floor((Date.now() - qStartedAt) / 1000);
    setResponses(prev => ({
      ...prev,
      [qId]: { ...prev[qId], questionId: qId, selectedOption: label, timeTaken },
    }));
  };

  const handleClear = () => {
    const qId = currentQ?.id;
    if (!qId) return;
    setResponses(prev => ({ ...prev, [qId]: { ...prev[qId], selectedOption: null } }));
  };

  const handleMarkReview = () => {
    const qId = currentQ?.id;
    if (!qId) return;
    setMarkedForReview(prev => ({ ...prev, [qId]: !prev[qId] }));
  };

  const goTo = (idx) => {
    setCurrentIdx(idx);
    setQStartedAt(Date.now());
  };

  const goNext = () => goTo(Math.min(questions.length - 1, currentIdx + 1));
  const goPrev = () => goTo(Math.max(0, currentIdx - 1));

  const handleSaveNext = () => {
    goNext();
  };

  const handleSubmit = async (isAuto = false) => {
    if (submitting) return;
    setSubmitting(true);
    clearInterval(timerRef.current);
    try {
      const res = await api.post(`/tests/${testId}/submit`, {
        resultId,
        responses: Object.values(responses),
        isAutoSubmit: isAuto,
      });
      toast.success(isAuto ? '⏰ Time up! Test submitted.' : '🎉 Test submitted successfully!');
      navigate(`/student/results/${res.data.data.resultId}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Submission failed');
      setSubmitting(false);
    }
  };

  // ── Question status ───────────────────────────────────────
  const getQStatus = (idx) => {
    const q = questions[idx];
    if (!q) return 'unvisited';
    const r = responses[q.id];
    if (markedForReview[q.id] && r?.selectedOption) return 'review-answered';
    if (markedForReview[q.id]) return 'review';
    if (r?.selectedOption) return 'answered';
    if (idx === currentIdx) return 'current';
    return 'unvisited';
  };

  const statusStyle = {
    unvisited:       'bg-slate-100 text-slate-600 hover:bg-slate-200',
    current:         'bg-indigo-600 text-white shadow-lg shadow-indigo-300 scale-105',
    answered:        'bg-emerald-500 text-white hover:bg-emerald-600',
    review:          'bg-amber-400 text-white hover:bg-amber-500',
    'review-answered':'bg-violet-500 text-white hover:bg-violet-600',
  };

  // ── Subject breakdown ─────────────────────────────────────
  const subjectStats = questions.reduce((acc, q) => {
    if (!acc[q.subject]) acc[q.subject] = { total: 0, answered: 0 };
    acc[q.subject].total++;
    if (responses[q.id]?.selectedOption) acc[q.subject].answered++;
    return acc;
  }, {});

  // ── Loading state ─────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-5" />
          <h2 className="text-slate-700 font-bold text-lg mb-1">Loading your test…</h2>
          <p className="text-slate-400 text-sm">Setting up a secure environment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col select-none">

      {/* ══ TOP HEADER ══════════════════════════════════════ */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3 px-4 py-2.5">
          {/* Logo + Title */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-slate-900 text-sm truncate leading-tight">{test?.title}</h1>
              <p className="text-xs text-slate-400 font-medium">
                {questions.length} Qs · {test?.totalMarks} Marks
                {test?.negativeMarkingEnabled && ` · −${test.negativeMarkingValue} Negative`}
              </p>
            </div>
          </div>

          {/* Progress mini */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="text-center">
              <div className="text-xs font-bold text-emerald-600">{answeredCount}</div>
              <div className="text-[10px] text-slate-400">Done</div>
            </div>
            <div className="w-px h-6 bg-slate-200" />
            <div className="text-center">
              <div className="text-xs font-bold text-amber-500">{reviewCount}</div>
              <div className="text-[10px] text-slate-400">Review</div>
            </div>
            <div className="w-px h-6 bg-slate-200" />
            <div className="text-center">
              <div className="text-xs font-bold text-slate-600">{unattemptedCount}</div>
              <div className="text-[10px] text-slate-400">Left</div>
            </div>
          </div>

          {/* Timer */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-mono font-extrabold text-base transition-all
            ${isUrgent  ? 'bg-red-50 text-red-600 border-2 border-red-300 animate-pulse shadow-red-200 shadow-md'
            : isWarning ? 'bg-amber-50 text-amber-600 border-2 border-amber-300'
            :             'bg-indigo-50 text-indigo-700 border-2 border-indigo-100'}`}>
            <Clock size={16} className="flex-shrink-0" />
            <span className="tabular-nums">{formatTime(timeRemaining)}</span>
          </div>

          {/* Panel toggle */}
          <button
            onClick={() => setShowPanel(p => !p)}
            className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors"
          >
            {showPanel ? <EyeOff size={13} /> : <Eye size={13} />}
            {showPanel ? 'Hide' : 'Show'}
          </button>

          {/* Submit */}
          <button
            onClick={() => setShowSubmitModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold px-5 py-2 rounded-xl shadow-md shadow-indigo-200 hover:-translate-y-0.5 transition-all text-sm"
          >
            <Send size={13} /> Submit
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-slate-100 relative">
          <div
            className="absolute left-0 top-0 h-1 rounded-r-full transition-all duration-500"
            style={{
              width: `${(answeredCount / Math.max(questions.length, 1)) * 100}%`,
              background: 'linear-gradient(to right, #6366f1, #8b5cf6)',
            }}
          />
        </div>
      </header>

      {/* ══ BODY ════════════════════════════════════════════ */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Question Area ───────────────────────────────── */}
        <main className="flex-1 overflow-y-auto">
          {currentQ ? (
            <div className="max-w-3xl mx-auto px-4 lg:px-6 py-6 space-y-5">

              {/* Question meta bar */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Number badge */}
                  <span className="w-9 h-9 bg-indigo-600 text-white rounded-xl flex items-center justify-center text-sm font-extrabold shadow-sm flex-shrink-0">
                    {currentIdx + 1}
                  </span>
                  <span className="badge-info text-xs">{currentQ.subject}</span>
                  {currentQ.topic && <span className="text-xs text-slate-400 font-medium">{currentQ.topic}</span>}
                  <span className={`badge text-xs ${
                    currentQ.difficulty === 'easy'   ? 'bg-emerald-100 text-emerald-700' :
                    currentQ.difficulty === 'hard'   ? 'bg-red-100 text-red-700' :
                                                        'bg-amber-100 text-amber-700'
                  }`}>{currentQ.difficulty || 'medium'}</span>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">+{currentQ.marks}m</span>
                  {(test?.negativeMarkingEnabled && (currentQ.negativeMarks > 0 || test?.negativeMarkingValue > 0)) &&
                    <span className="text-xs font-bold text-red-500 bg-red-50 border border-red-200 px-2 py-0.5 rounded-lg">−{currentQ.negativeMarks || test?.negativeMarkingValue}m</span>}
                </div>

                <div className="flex items-center gap-2">
                  {/* Hindi toggle */}
                  <button
                    onClick={() => setShowLangHindi(h => !h)}
                    className={`text-xs px-3 py-1.5 rounded-xl font-semibold border transition-all flex items-center gap-1.5
                      ${showLangHindi ? 'bg-indigo-100 text-indigo-700 border-indigo-300' : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'}`}
                  >
                    <span>हि</span> {showLangHindi ? 'EN' : 'Hindi'}
                  </button>

                  {/* Mark for review */}
                  <button
                    onClick={handleMarkReview}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border
                      ${markedForReview[currentQ.id]
                        ? 'bg-amber-50 text-amber-600 border-amber-300 shadow-sm'
                        : 'bg-white text-slate-500 border-slate-200 hover:border-amber-300 hover:text-amber-500'}`}
                  >
                    <Bookmark size={13} className={markedForReview[currentQ.id] ? 'fill-amber-500' : ''} />
                    {markedForReview[currentQ.id] ? 'Marked' : 'Mark Review'}
                  </button>
                </div>
              </div>

              {/* Question Text */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                {/* English */}
                <p className={`text-slate-900 text-base leading-relaxed font-medium ${showLangHindi && (currentQ.questionTextHindi || translations[currentQ.id]?.qText) ? 'opacity-50 text-sm' : ''}`}>
                  {currentQ.questionText}
                </p>
                {/* Hindi */}
                {(currentQ.questionTextHindi || translations[currentQ.id]?.qText) && showLangHindi && (
                  <p className={`mt-3 text-slate-700 text-base font-medium leading-relaxed border-t border-slate-100 pt-3`}
                     style={{ fontFamily: "'Noto Sans Devanagari', serif" }}>
                    {currentQ.questionTextHindi || translations[currentQ.id]?.qText}
                    {!currentQ.questionTextHindi && translations[currentQ.id]?.qText && <span className="text-[10px] text-indigo-400 ml-2 font-normal" title="Auto-translated">✨ Auto</span>}
                  </p>
                )}
                {currentQ.image && (
                  <img src={currentQ.image} alt="Question" className="mt-4 max-h-60 rounded-xl object-contain border border-slate-100 bg-slate-50 p-2 w-full" />
                )}
              </div>

              {/* Options */}
              <div className="space-y-3">
                {(currentQ.options || []).map((option) => {
                  const isSelected = responses[currentQ.id]?.selectedOption === option.label;
                  return (
                    <button
                      key={option.label}
                      onClick={() => handleAnswer(option.label)}
                      className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 text-left transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 group
                        ${isSelected
                          ? 'border-indigo-500 bg-indigo-50 shadow-md shadow-indigo-100'
                          : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm'}`}
                    >
                      {/* Label bubble */}
                      <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-extrabold flex-shrink-0 transition-all
                        ${isSelected ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-600'}`}>
                        {option.label}
                      </span>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium leading-relaxed ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>
                          {option.text}
                        </p>
                        {(option.textHindi || (translations[currentQ.id] && translations[currentQ.id].options[option.label])) && showLangHindi && (
                          <p className="text-sm font-medium text-slate-700 mt-1" style={{ fontFamily: "'Noto Sans Devanagari', serif" }}>
                            {option.textHindi || translations[currentQ.id].options[option.label]}
                          </p>
                        )}
                      </div>

                      {/* Check */}
                      {isSelected
                        ? <CheckCircle className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                        : <div className="w-5 h-5 rounded-full border-2 border-slate-200 flex-shrink-0 group-hover:border-indigo-300 transition-colors" />
                      }
                    </button>
                  );
                })}
              </div>

              {/* Actions row */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2">
                  {responses[currentQ.id]?.selectedOption && (
                    <button
                      onClick={handleClear}
                      className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-500 transition-colors font-semibold border border-slate-200 hover:border-red-200 px-3 py-2 rounded-xl bg-white hover:bg-red-50"
                    >
                      <RotateCcw size={12} /> Clear
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-semibold hidden sm:block">
                    {currentIdx + 1} of {questions.length}
                  </span>

                  <button
                    onClick={goPrev}
                    disabled={currentIdx === 0}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-semibold text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft size={15} /> Prev
                  </button>

                  <button
                    onClick={handleSaveNext}
                    disabled={currentIdx === questions.length - 1}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-200 hover:-translate-y-0.5"
                  >
                    Save & Next <ChevronRight size={15} />
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-slate-400">No questions found.</p>
            </div>
          )}
        </main>

        {/* ── RIGHT PANEL ─────────────────────────────────── */}
        {showPanel && (
          <aside className="w-72 bg-white border-l border-slate-200 flex-shrink-0 hidden md:flex flex-col overflow-hidden">

            {/* Tab bar */}
            <div className="flex border-b border-slate-200">
              {[
                { id: 'navigator', label: 'Navigator', icon: Target },
                { id: 'summary',   label: 'Summary',   icon: BarChart2 },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSection(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold transition-colors
                    ${activeSection === tab.id
                      ? 'text-indigo-600 border-b-2 border-indigo-600'
                      : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <tab.icon size={13} /> {tab.label}
                </button>
              ))}
            </div>

            {/* Panel content */}
            <div className="flex-1 overflow-y-auto">

              {activeSection === 'navigator' && (
                <div>
                  {/* Stats row */}
                  <div className="grid grid-cols-4 gap-2 p-3 border-b border-slate-100">
                    {[
                      { val: answeredCount,                    label: 'Done',    color: 'text-emerald-600', bg: 'bg-emerald-50'  },
                      { val: reviewCount,                      label: 'Review',  color: 'text-amber-500',   bg: 'bg-amber-50'    },
                      { val: unattemptedCount,                 label: 'Left',    color: 'text-slate-600',   bg: 'bg-slate-100'   },
                      { val: questions.length,                 label: 'Total',   color: 'text-indigo-600',  bg: 'bg-indigo-50'   },
                    ].map(s => (
                      <div key={s.label} className={`${s.bg} rounded-xl p-2 text-center`}>
                        <div className={`font-extrabold text-sm ${s.color}`}>{s.val}</div>
                        <div className="text-[9px] text-slate-400 font-semibold mt-0.5">{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Legend */}
                  <div className="px-3 py-2 border-b border-slate-100 flex flex-wrap gap-2">
                    {[
                      { color: 'bg-emerald-500', label: 'Answered'     },
                      { color: 'bg-amber-400',   label: 'Review'       },
                      { color: 'bg-violet-500',  label: 'Ans+Review'   },
                      { color: 'bg-slate-100 border border-slate-300', label: 'Unvisited' },
                    ].map(l => (
                      <div key={l.label} className="flex items-center gap-1">
                        <div className={`w-3 h-3 rounded ${l.color}`} />
                        <span className="text-[10px] text-slate-500 font-medium">{l.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Grid */}
                  <div className="p-3">
                    <div className="grid grid-cols-5 gap-1.5">
                      {questions.map((q, idx) => (
                        <button
                          key={idx}
                          onClick={() => goTo(idx)}
                          className={`aspect-square rounded-lg text-xs font-bold transition-all ${statusStyle[getQStatus(idx)]}`}
                        >
                          {idx + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'summary' && (
                <div className="p-3 space-y-3">
                  {/* Overall */}
                  <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
                    <div className="text-xs text-indigo-500 font-bold uppercase tracking-wider mb-2">Overall Progress</div>
                    <div className="relative h-2.5 bg-indigo-100 rounded-full overflow-hidden">
                      <div
                        className="absolute left-0 top-0 h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all"
                        style={{ width: `${(answeredCount / Math.max(questions.length, 1)) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-indigo-600 font-semibold mt-2">
                      {answeredCount}/{questions.length} Questions answered ({Math.round((answeredCount / Math.max(questions.length, 1)) * 100)}%)
                    </p>
                  </div>

                  {/* Time left */}
                  <div className={`rounded-2xl p-4 border ${isUrgent ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Clock size={14} className={isUrgent ? 'text-red-500' : 'text-slate-500'} />
                      <span className="text-xs font-bold text-slate-600">Time Remaining</span>
                    </div>
                    <div className={`font-extrabold text-2xl ${isUrgent ? 'text-red-600' : 'text-slate-900'} tabular-nums`}>
                      {formatTime(timeRemaining)}
                    </div>
                    {isUrgent && <p className="text-xs text-red-500 font-semibold mt-1 animate-pulse">⚠️ Less than 5 minutes!</p>}
                  </div>

                  {/* Subject-wise */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-4">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Subject Breakdown</div>
                    <div className="space-y-2.5">
                      {Object.entries(subjectStats).map(([subj, s]) => (
                        <div key={subj}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-slate-700">{subj}</span>
                            <span className="text-xs text-slate-500">{s.answered}/{s.total}</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all"
                              style={{ width: `${(s.answered / s.total) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Marks preview */}
                  {test?.negativeMarkingEnabled && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-4">
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Estimated Score</div>
                      <div className="flex items-end gap-1">
                        <span className="text-2xl font-extrabold text-indigo-600">
                          {(answeredCount * (test.totalMarks / questions.length)).toFixed(0)}
                        </span>
                        <span className="text-slate-400 text-sm font-medium mb-0.5">/ {test.totalMarks}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">*Based on {answeredCount} answered questions</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Submit at bottom */}
            <div className="p-3 border-t border-slate-200">
              <button
                onClick={() => setShowSubmitModal(true)}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold py-3 rounded-xl text-sm shadow-md transition-all hover:-translate-y-0.5"
              >
                <Send size={14} /> Submit Test
              </button>
              <p className="text-center text-[10px] text-slate-400 mt-2">All your answers are saved automatically</p>
            </div>
          </aside>
        )}
      </div>

      {/* ══ ANTI-CHEAT MODAL ════════════════════════════════ */}
      {showAntiCheatWarning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 animate-fade-in text-center border-t-8 border-red-500">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-2">Warning!</h2>
            <p className="text-lg text-slate-600 font-medium mb-6">
              Tab switching or leaving the browser window is strictly prohibited. 
              You have switched tabs <strong className="text-red-600 text-xl">{tabSwitchCount}</strong> time(s).
            </p>
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-8">
              <p className="text-red-700 font-bold text-sm mb-1">Test will automatically submit after {MAX_TAB_SWITCHES} warnings.</p>
              <p className="text-red-500 text-xs">Do not minimize or switch tabs again.</p>
            </div>
            
            <button
              disabled={antiCheatPenaltyTime > 0}
              onClick={() => setShowAntiCheatWarning(false)}
              className="w-full py-4 rounded-2xl font-black text-white text-lg transition-all disabled:opacity-100 disabled:bg-slate-300 disabled:cursor-not-allowed bg-red-600 hover:bg-red-700 shadow-xl shadow-red-200"
            >
              {antiCheatPenaltyTime > 0 ? `Please wait ${antiCheatPenaltyTime}s...` : 'I Understand, Resume Test'}
            </button>
          </div>
        </div>
      )}

      {/* ══ SUBMIT MODAL ════════════════════════════════════ */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-7 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900">Submit Test?</h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">This cannot be undone.</p>
                </div>
              </div>
              <button onClick={() => setShowSubmitModal(false)} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center hover:bg-slate-200 transition-colors">
                <X size={16} className="text-slate-500" />
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
                <p className="text-2xl font-extrabold text-emerald-600">{answeredCount}</p>
                <p className="text-xs text-emerald-600 font-semibold mt-1">✅ Answered</p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
                <p className="text-2xl font-extrabold text-amber-500">{reviewCount}</p>
                <p className="text-xs text-amber-600 font-semibold mt-1">🔖 For Review</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
                <p className="text-2xl font-extrabold text-slate-600">{unattemptedCount}</p>
                <p className="text-xs text-slate-500 font-semibold mt-1">⬜ Skipped</p>
              </div>
            </div>

            {/* Warning */}
            {unattemptedCount > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5 flex items-start gap-3">
                <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-700 font-medium">
                  You have <strong>{unattemptedCount} unattempted</strong> question(s). These will be marked as skipped.
                </p>
              </div>
            )}

            {/* Time remaining */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                <Clock size={15} /> Time Remaining
              </div>
              <span className={`font-extrabold tabular-nums ${isUrgent ? 'text-red-600' : 'text-slate-800'}`}>{formatTime(timeRemaining)}</span>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                disabled={submitting}
                className="flex-1 py-3 rounded-2xl border-2 border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all disabled:opacity-50"
              >
                Continue Test
              </button>
              <button
                onClick={() => handleSubmit(false)}
                disabled={submitting}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-extrabold text-sm shadow-lg shadow-indigo-200 hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting…</>
                ) : (
                  <><Send size={14} /> Submit Now</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
