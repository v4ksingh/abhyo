import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Clock, ChevronLeft, ChevronRight, Flag, Send, AlertTriangle,
  CheckCircle, X, BookOpen, BarChart2, Bookmark, Eye, EyeOff,
  Zap, Target, Brain, RotateCcw, ChevronDown, ChevronUp,
  Maximize, Minimize, Check, Trophy, ArrowLeft, RefreshCw,
  Sparkles, HelpCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../../lib/api';

const DEFAULT_PRACTICE_QUESTIONS = {
  Mathematics: [
    {
      id: 'm_1',
      questionText: 'What is the value of (48 ÷ 6) × (15 - 9) + 4²?',
      options: [
        { label: 'A', text: '64' },
        { label: 'B', text: '56' },
        { label: 'C', text: '72' },
        { label: 'D', text: '48' },
      ],
      correctAnswer: 'A',
      correctValue: '64',
      explanation: 'Follow BODMAS: (48 ÷ 6) = 8. (15 - 9) = 6. 8 × 6 = 48. Then 4² = 16. 48 + 16 = 64.',
      difficulty: 'easy',
      marks: 1,
      subject: 'Mathematics',
    },
    {
      id: 'm_2',
      questionText: 'A number is divisible by both 4 and 6. Which of the following numbers MUST also divide it?',
      options: [
        { label: 'A', text: '12' },
        { label: 'B', text: '24' },
        { label: 'C', text: '18' },
        { label: 'D', text: '8' },
      ],
      correctAnswer: 'A',
      correctValue: '12',
      explanation: 'Any number divisible by two numbers must be divisible by their LCM. LCM(4, 6) = 12.',
      difficulty: 'medium',
      marks: 1,
      subject: 'Mathematics',
    },
    {
      id: 'm_3',
      questionText: 'The sum of three consecutive even numbers is 54. What is the largest of these three numbers?',
      options: [
        { label: 'A', text: '20' },
        { label: 'B', text: '18' },
        { label: 'C', text: '22' },
        { label: 'D', text: '16' },
      ],
      correctAnswer: 'A',
      correctValue: '20',
      explanation: 'Let the numbers be x, x+2, x+4. Sum = 3x + 6 = 54 => 3x = 48 => x = 16. Numbers: 16, 18, 20. Largest is 20.',
      difficulty: 'medium',
      marks: 1,
      subject: 'Mathematics',
    },
    {
      id: 'm_4',
      questionText: 'If 2^(x - 1) + 2^(x + 1) = 320, find the value of x.',
      options: [
        { label: 'A', text: '7' },
        { label: 'B', text: '6' },
        { label: 'C', text: '8' },
        { label: 'D', text: '5' },
      ],
      correctAnswer: 'A',
      correctValue: '7',
      explanation: 'Factor out 2^x: 2^x(1/2 + 2) = 320 => 2^x(5/2) = 320 => 2^x = 128 = 2^7 => x = 7.',
      difficulty: 'hard',
      marks: 1,
      subject: 'Mathematics',
    },
    {
      id: 'm_5',
      questionText: 'The diagonal of a rectangle is 25 cm and its breadth is 7 cm. What is its perimeter?',
      options: [
        { label: 'A', text: '62 cm' },
        { label: 'B', text: '56 cm' },
        { label: 'C', text: '68 cm' },
        { label: 'D', text: '74 cm' },
      ],
      correctAnswer: 'A',
      correctValue: '62 cm',
      explanation: 'By Pythagoras theorem: Length = √(25² - 7²) = √(625 - 49) = √576 = 24 cm. Perimeter = 2(24 + 7) = 62 cm.',
      difficulty: 'medium',
      marks: 1,
      subject: 'Mathematics',
    },
  ],
  Science: [
    {
      id: 's_1',
      questionText: 'Which organelle is known as the powerhouse of the cell?',
      options: [
        { label: 'A', text: 'Mitochondria' },
        { label: 'B', text: 'Ribosome' },
        { label: 'C', text: 'Nucleus' },
        { label: 'D', text: 'Endoplasmic Reticulum' },
      ],
      correctAnswer: 'A',
      correctValue: 'Mitochondria',
      explanation: 'Mitochondria produce ATP through cellular respiration, making them the powerhouse of the cell.',
      difficulty: 'easy',
      marks: 1,
      subject: 'Science',
    },
    {
      id: 's_2',
      questionText: 'What is the acceleration due to gravity on the surface of the Earth?',
      options: [
        { label: 'A', text: '9.8 m/s²' },
        { label: 'B', text: '8.9 m/s²' },
        { label: 'C', text: '10.8 m/s²' },
        { label: 'D', text: '9.2 m/s²' },
      ],
      correctAnswer: 'A',
      correctValue: '9.8 m/s²',
      explanation: 'Standard acceleration due to Earth gravity g is approximately 9.8 m/s².',
      difficulty: 'easy',
      marks: 1,
      subject: 'Science',
    },
    {
      id: 's_3',
      questionText: 'Which gas is released during photosynthesis?',
      options: [
        { label: 'A', text: 'Oxygen' },
        { label: 'B', text: 'Carbon Dioxide' },
        { label: 'C', text: 'Nitrogen' },
        { label: 'D', text: 'Hydrogen' },
      ],
      correctAnswer: 'A',
      correctValue: 'Oxygen',
      explanation: 'During photosynthesis, plants convert water and carbon dioxide into glucose and release oxygen (O₂).',
      difficulty: 'easy',
      marks: 1,
      subject: 'Science',
    },
  ],
  Computer: [
    {
      id: 'c_1',
      questionText: 'Which protocol is used for secure communication over the internet?',
      options: [
        { label: 'A', text: 'HTTPS' },
        { label: 'B', text: 'HTTP' },
        { label: 'C', text: 'FTP' },
        { label: 'D', text: 'SMTP' },
      ],
      correctAnswer: 'A',
      correctValue: 'HTTPS',
      explanation: 'HTTPS (Hypertext Transfer Protocol Secure) encrypts data using TLS/SSL.',
      difficulty: 'easy',
      marks: 1,
      subject: 'Computer',
    },
    {
      id: 'c_2',
      questionText: 'Which data structure follows the First-In, First-Out (FIFO) principle?',
      options: [
        { label: 'A', text: 'Queue' },
        { label: 'B', text: 'Stack' },
        { label: 'C', text: 'Tree' },
        { label: 'D', text: 'Graph' },
      ],
      correctAnswer: 'A',
      correctValue: 'Queue',
      explanation: 'A Queue follows FIFO, where the first element added is the first one removed.',
      difficulty: 'medium',
      marks: 1,
      subject: 'Computer',
    },
    {
      id: 'c_3',
      questionText: 'What does CPU stand for in computer systems?',
      options: [
        { label: 'A', text: 'Central Processing Unit' },
        { label: 'B', text: 'Central Process Utility' },
        { label: 'C', text: 'Core Processing Unit' },
        { label: 'D', text: 'Central Power Unit' },
      ],
      correctAnswer: 'A',
      correctValue: 'Central Processing Unit',
      explanation: 'CPU stands for Central Processing Unit, the primary component that executes computer instructions.',
      difficulty: 'easy',
      marks: 1,
      subject: 'Computer',
    },
  ],
};

// Helper: Normalize any incoming questions (array of strings or object options) into standard format
function normalizeQuestions(rawList, defaultSubject = 'Olympiad') {
  if (!Array.isArray(rawList)) return [];
  return rawList.map((q, idx) => {
    let opts = [];
    if (Array.isArray(q.options)) {
      opts = q.options.map((opt, oIdx) => {
        const label = String.fromCharCode(65 + oIdx);
        if (typeof opt === 'object' && opt !== null) {
          return {
            label: opt.label || label,
            text: opt.text || opt.value || String(opt),
          };
        }
        return { label, text: String(opt) };
      });
    }

    // Determine correct answer label and text
    const rawCorrect = q.correctAnswer || (opts[0] ? opts[0].label : 'A');
    let correctLabel = 'A';
    let correctValue = '';
    const matchedByText = opts.find(o => o.text === rawCorrect);
    const matchedByLabel = opts.find(o => o.label.toUpperCase() === String(rawCorrect).toUpperCase());

    if (matchedByText) {
      correctLabel = matchedByText.label;
      correctValue = matchedByText.text;
    } else if (matchedByLabel) {
      correctLabel = matchedByLabel.label;
      correctValue = matchedByLabel.text;
    } else {
      correctLabel = rawCorrect;
      correctValue = rawCorrect;
    }

    return {
      id: q.id || `q_${idx + 1}`,
      questionText: q.questionText || q.question || `Question ${idx + 1}`,
      questionTextHindi: q.questionTextHindi || null,
      options: opts,
      correctAnswer: correctLabel,
      correctValue: correctValue,
      explanation: q.explanation || 'Official national Olympiad benchmark question.',
      difficulty: q.difficulty || 'medium',
      marks: q.marks || 1,
      negativeMarks: q.negativeMarks || 0,
      subject: q.subject || defaultSubject,
      image: q.image || null,
    };
  });
}

export default function OlympiadMockExam() {
  const { regId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const stateMockTest = location.state?.mockTest;
  const returnPath = location.state?.returnPath || (regId ? `/student/olympiad/preparation/${regId}` : '/student/olympiad');

  // Core state
  const [loading, setLoading] = useState(true);
  const [testTitle, setTestTitle] = useState('Olympiad Mock Test');
  const [subjectName, setSubjectName] = useState('Mathematics');
  const [classLevel, setClassLevel] = useState(6);
  const [durationMinutes, setDurationMinutes] = useState(20);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);

  // User interactions
  const [responses, setResponses] = useState({}); // { [qId]: { selectedOption, selectedValue, timeTaken } }
  const [markedForReview, setMarkedForReview] = useState({}); // { [qId]: boolean }
  const [visitedIndices, setVisitedIndices] = useState(new Set([0]));
  const [timeRemaining, setTimeRemaining] = useState(20 * 60);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [reviewMode, setReviewMode] = useState(false);

  // UI state
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showPanel, setShowPanel] = useState(true);
  const [activeSection, setActiveSection] = useState('navigator'); // 'navigator' | 'summary'
  const [showLangHindi, setShowLangHindi] = useState(false);
  const [translations, setTranslations] = useState({});
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Anti-Cheat: Tab Switch Detection
  const MAX_TAB_SWITCHES = 3;
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showAntiCheatWarning, setShowAntiCheatWarning] = useState(false);
  const [antiCheatPenaltyTime, setAntiCheatPenaltyTime] = useState(0);
  const penaltyIntervalRef = useRef(null);
  const handleSubmitRef = useRef(null);

  const timerRef = useRef(null);
  const timeRef = useRef(0);
  const loadedRef = useRef(false);
  const qStartedAtRef = useRef(Date.now());

  // ── Load Mock Test ──────────────────────────────────────────────
  useEffect(() => {
    const loadTest = async () => {
      try {
        if (stateMockTest && Array.isArray(stateMockTest.questions) && stateMockTest.questions.length > 0) {
          const normQs = normalizeQuestions(stateMockTest.questions, location.state?.prepData?.subjectName || 'Olympiad');
          setQuestions(normQs);
          setTestTitle(stateMockTest.title || 'Official Olympiad Mock Test');
          const dur = stateMockTest.durationMinutes || 20;
          setDurationMinutes(dur);
          setTimeRemaining(dur * 60);
          timeRef.current = dur * 60;
          if (location.state?.prepData?.subjectName) setSubjectName(location.state.prepData.subjectName);
          if (location.state?.prepData?.selectedClass) setClassLevel(location.state.prepData.selectedClass);
          loadedRef.current = true;
          setLoading(false);
          return;
        }

        // If no state (e.g. refreshed page), load via registration API
        if (regId) {
          const r = await api.get(`/olympiad/student/preparation/${regId}`);
          const d = r.data.data;
          const sName = d.olympiad?.subject?.name || 'Mathematics';
          const cLevel = d.classSelected || 6;
          setSubjectName(sName);
          setClassLevel(cLevel);

          const defaultQs = DEFAULT_PRACTICE_QUESTIONS[sName] || DEFAULT_PRACTICE_QUESTIONS.Mathematics;
          const dbQs = (d.officialQuestions || []).map((q, idx) => ({
            id: q.id || `db_${idx}`,
            questionText: q.questionText,
            options: Array.isArray(q.options) ? q.options : [],
            correctAnswer: q.correctAnswer || (q.options ? q.options[0] : 'A'),
            explanation: q.explanation || 'Official national Olympiad benchmark question.',
            difficulty: q.difficulty || 'medium',
            marks: q.marks || 1,
            subject: sName,
          }));

          const combined = [...dbQs, ...defaultQs];
          const normQs = normalizeQuestions(combined, sName);
          setQuestions(normQs);
          setTestTitle(`Class ${cLevel} ${sName} Practice Mock Test`);
          const dur = 20;
          setDurationMinutes(dur);
          setTimeRemaining(dur * 60);
          timeRef.current = dur * 60;
          loadedRef.current = true;
        } else {
          // Fallback to default mathematics
          const normQs = normalizeQuestions(DEFAULT_PRACTICE_QUESTIONS.Mathematics, 'Mathematics');
          setQuestions(normQs);
          setTestTitle('National Olympiad Mock Test');
          setTimeRemaining(20 * 60);
          timeRef.current = 20 * 60;
          loadedRef.current = true;
        }
      } catch (err) {
        console.error('Error loading mock test:', err);
        toast.error('Failed to initialize mock test.');
      } finally {
        setLoading(false);
      }
    };

    loadTest();
  }, [regId, stateMockTest]);

  // ── Timer ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!loadedRef.current || submitted) return;
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
  }, [loadedRef.current, submitted]);

  // ── Anti-Cheat: Tab Switch Detection ────────────────────────────
  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  });

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!loadedRef.current || showSubmitModal || submitted) return;
      if (document.hidden) {
        setTabSwitchCount(prev => {
          const newCount = prev + 1;
          if (newCount >= MAX_TAB_SWITCHES) {
            toast.error('🚫 Mock Test Auto-Submitted: Maximum tab switches exceeded.', { duration: 5000 });
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
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(penaltyIntervalRef.current);
    };
  }, [showSubmitModal, submitted]);

  // ── Fullscreen toggle ───────────────────────────────────────────
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    }
  };

  // ── Auto Translation (Hindi) ────────────────────────────────────
  useEffect(() => {
    if (!showLangHindi || !questions[currentIdx]) return;
    const q = questions[currentIdx];
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
        console.error('Translation API error:', err);
      }
    };
    doTranslate();
  }, [currentIdx, showLangHindi, questions, translations]);

  // ── Helpers ─────────────────────────────────────────────────────
  const formatTime = useCallback((secs) => {
    if (!secs || secs < 0) return '00:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }, []);

  const currentQ = questions[currentIdx];
  const isUrgent = timeRemaining > 0 && timeRemaining <= 300;
  const isWarning = timeRemaining > 300 && timeRemaining <= 600;

  const answeredCount = useMemo(() => {
    return Object.values(responses).filter(r => r && r.selectedOption).length;
  }, [responses]);

  const reviewCount = useMemo(() => {
    return Object.values(markedForReview).filter(Boolean).length;
  }, [markedForReview]);

  const unattemptedCount = Math.max(0, questions.length - answeredCount);

  // ── Actions ─────────────────────────────────────────────────────
  const handleAnswer = (label, text) => {
    const qId = currentQ?.id;
    if (!qId) return;
    const timeTaken = Math.floor((Date.now() - qStartedAtRef.current) / 1000);
    setResponses(prev => ({
      ...prev,
      [qId]: { questionId: qId, selectedOption: label, selectedValue: text, timeTaken },
    }));
  };

  const handleClear = () => {
    const qId = currentQ?.id;
    if (!qId) return;
    setResponses(prev => {
      const copy = { ...prev };
      delete copy[qId];
      return copy;
    });
  };

  const handleMarkReview = () => {
    const qId = currentQ?.id;
    if (!qId) return;
    setMarkedForReview(prev => ({ ...prev, [qId]: !prev[qId] }));
  };

  const goTo = (idx) => {
    setCurrentIdx(idx);
    setVisitedIndices(v => new Set([...v, idx]));
    qStartedAtRef.current = Date.now();
  };

  const goNext = () => goTo(Math.min(questions.length - 1, currentIdx + 1));
  const goPrev = () => goTo(Math.max(0, currentIdx - 1));

  const handleSaveNext = () => {
    goNext();
  };

  const handleMarkReviewAndNext = () => {
    handleMarkReview();
    goNext();
  };

  const handleSubmit = (isAuto = false) => {
    if (submitting || submitted) return;
    setSubmitting(true);
    clearInterval(timerRef.current);

    // Calculate score & breakdown
    let correct = 0;
    let wrong = 0;
    let skipped = 0;

    const breakdown = questions.map((q, idx) => {
      const resp = responses[q.id];
      const selected = resp?.selectedOption || null;
      const selectedVal = resp?.selectedValue || null;

      let isCorrect = false;
      if (!selected) {
        skipped++;
      } else {
        // Match either label 'A' or text value
        isCorrect = (
          selected.toUpperCase() === String(q.correctAnswer).toUpperCase() ||
          (selectedVal && String(selectedVal).trim().toLowerCase() === String(q.correctValue || '').trim().toLowerCase())
        );
        if (isCorrect) correct++;
        else wrong++;
      }

      return {
        ...q,
        questionIndex: idx + 1,
        selectedOption: selected,
        selectedValue: selectedVal,
        isCorrect,
      };
    });

    const total = questions.length;
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
    const accuracy = (correct + wrong) > 0 ? Math.round((correct / (correct + wrong)) * 100) : 0;

    setTestResult({
      total,
      correct,
      wrong,
      skipped,
      score: correct,
      percentage,
      accuracy,
      breakdown,
      timeTakenSecs: (durationMinutes * 60) - Math.max(0, timeRemaining),
    });

    setSubmitted(true);
    setShowSubmitModal(false);
    setSubmitting(false);

    if (isAuto) {
      toast('⏰ Time up! Mock test submitted.', { icon: '⏰' });
    } else {
      toast.success('🎉 Mock test submitted! Instant analysis ready.');
    }
  };

  const handleRetake = () => {
    setResponses({});
    setMarkedForReview({});
    setVisitedIndices(new Set([0]));
    setCurrentIdx(0);
    const totalSec = durationMinutes * 60;
    setTimeRemaining(totalSec);
    timeRef.current = totalSec;
    setTabSwitchCount(0);
    setSubmitted(false);
    setTestResult(null);
    setReviewMode(false);
    qStartedAtRef.current = Date.now();
  };

  // ── Question status ─────────────────────────────────────────────
  const getQStatus = (idx) => {
    const q = questions[idx];
    if (!q) return 'unvisited';
    const r = responses[q.id];
    const isMarked = !!markedForReview[q.id];
    const isAns = !!r?.selectedOption;

    if (isMarked && isAns) return 'review-answered';
    if (isMarked) return 'review';
    if (isAns) return 'answered';
    if (visitedIndices.has(idx)) return 'visited';
    return 'unvisited';
  };

  const statusStyle = {
    unvisited:        'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200',
    visited:          'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100',
    current:          'bg-indigo-600 text-white shadow-md shadow-indigo-300 ring-2 ring-indigo-400 font-black',
    answered:         'bg-emerald-500 text-white hover:bg-emerald-600 font-bold',
    review:           'bg-amber-400 text-white hover:bg-amber-500 font-bold',
    'review-answered':'bg-violet-600 text-white hover:bg-violet-700 font-bold',
  };

  // ── Loading Screen ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-900 text-white space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-400 flex items-center justify-center animate-spin">
          <Brain className="w-6 h-6 text-indigo-400" />
        </div>
        <p className="text-sm font-semibold text-slate-300">Initializing Exam Interface…</p>
      </div>
    );
  }

  // ── SUBMITTED: RESULT & ANALYSIS VIEW ───────────────────────────
  if (submitted && testResult) {
    if (reviewMode) {
      return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
          {/* Header */}
          <header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-4 sticky top-0 z-30 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setReviewMode(false)}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors"
                title="Back to Scorecard"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <h1 className="text-base font-extrabold text-slate-900">Question-by-Question Review</h1>
                <p className="text-xs text-slate-500">{testTitle} • Score: {testResult.score}/{testResult.total} ({testResult.percentage}%)</p>
              </div>
            </div>
            <button
              onClick={() => navigate(returnPath)}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors shadow-xs"
            >
              Exit Review
            </button>
          </header>

          {/* Question List */}
          <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 space-y-5">
            {testResult.breakdown.map((q, qIdx) => {
              const isCorrect = q.isCorrect;
              const isSkipped = !q.selectedOption;

              return (
                <div
                  key={q.id}
                  className={`bg-white rounded-2xl border p-5 sm:p-6 shadow-xs space-y-4 transition-all ${
                    isSkipped
                      ? 'border-slate-200'
                      : isCorrect
                      ? 'border-emerald-300 ring-1 ring-emerald-200'
                      : 'border-rose-300 ring-1 ring-rose-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-black">
                        {qIdx + 1}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-700">
                        {q.subject}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isSkipped && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                          Skipped
                        </span>
                      )}
                      {!isSkipped && isCorrect && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 flex items-center gap-1">
                          <CheckCircle size={13} /> Correct (+{q.marks || 1}m)
                        </span>
                      )}
                      {!isSkipped && !isCorrect && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 flex items-center gap-1">
                          <X size={13} /> Incorrect (0m)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Question Text */}
                  <p className="text-base font-semibold text-slate-900 leading-relaxed">
                    {q.questionText}
                  </p>

                  {/* Options */}
                  <div className="space-y-2">
                    {q.options.map((opt) => {
                      const isStudentSelected = q.selectedOption === opt.label || q.selectedValue === opt.text;
                      const isRightAnswer = q.correctAnswer === opt.label || q.correctValue === opt.text;

                      let optClasses = 'border-slate-200 bg-white text-slate-700';
                      if (isRightAnswer) {
                        optClasses = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold ring-1 ring-emerald-400';
                      } else if (isStudentSelected && !isRightAnswer) {
                        optClasses = 'border-rose-400 bg-rose-50 text-rose-900 font-semibold ring-1 ring-rose-300';
                      }

                      return (
                        <div
                          key={opt.label}
                          className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-sm transition-all ${optClasses}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${
                              isRightAnswer
                                ? 'bg-emerald-600 text-white'
                                : isStudentSelected
                                ? 'bg-rose-600 text-white'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {opt.label}
                            </span>
                            <span>{opt.text}</span>
                          </div>

                          <div className="flex items-center gap-1.5 text-xs font-bold shrink-0">
                            {isRightAnswer && (
                              <span className="text-emerald-700 flex items-center gap-1">
                                <Check size={14} /> Correct Option
                              </span>
                            )}
                            {isStudentSelected && !isRightAnswer && (
                              <span className="text-rose-600 flex items-center gap-1">
                                <X size={14} /> Your Answer
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation */}
                  {q.explanation && (
                    <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 flex items-start gap-2">
                      <Sparkles size={15} className="text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-bold text-amber-800">Explanation: </strong>
                        <span>{q.explanation}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </main>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="bg-slate-800/90 border border-slate-700 rounded-3xl p-6 sm:p-8 w-full max-w-xl text-center space-y-6 shadow-2xl backdrop-blur-md">
          {/* Trophy Header */}
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/30">
            <Trophy className="w-10 h-10 text-white" />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Mock Exam Analysis</span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">{testTitle}</h2>
            <p className="text-xs text-slate-400">Class {classLevel} • {subjectName} • Real Exam Simulation</p>
          </div>

          {/* Primary Score */}
          <div className="bg-slate-900/60 border border-slate-700/80 rounded-2xl p-4 flex items-center justify-around">
            <div>
              <p className="text-xs text-slate-400 font-semibold">Total Score</p>
              <p className="text-3xl font-black text-white mt-0.5">
                {testResult.score} <span className="text-lg text-slate-500 font-bold">/ {testResult.total}</span>
              </p>
            </div>
            <div className="w-px h-10 bg-slate-700" />
            <div>
              <p className="text-xs text-slate-400 font-semibold">Percentage</p>
              <p className="text-3xl font-black text-indigo-400 mt-0.5">{testResult.percentage}%</p>
            </div>
            <div className="w-px h-10 bg-slate-700" />
            <div>
              <p className="text-xs text-slate-400 font-semibold">Accuracy</p>
              <p className="text-3xl font-black text-emerald-400 mt-0.5">{testResult.accuracy}%</p>
            </div>
          </div>

          {/* Stats Breakdown */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-2xl p-3">
              <span className="text-xs font-bold text-emerald-400">Correct</span>
              <p className="text-2xl font-black text-emerald-300 mt-0.5">{testResult.correct}</p>
            </div>
            <div className="bg-rose-950/40 border border-rose-800/60 rounded-2xl p-3">
              <span className="text-xs font-bold text-rose-400">Incorrect</span>
              <p className="text-2xl font-black text-rose-300 mt-0.5">{testResult.wrong}</p>
            </div>
            <div className="bg-slate-900/40 border border-slate-700/60 rounded-2xl p-3">
              <span className="text-xs font-bold text-slate-400">Skipped</span>
              <p className="text-2xl font-black text-slate-300 mt-0.5">{testResult.skipped}</p>
            </div>
          </div>

          {tabSwitchCount > 0 && (
            <div className="bg-amber-950/40 border border-amber-800/50 rounded-xl p-2.5 text-xs text-amber-300 flex items-center justify-center gap-1.5">
              <AlertTriangle size={14} className="text-amber-400 shrink-0" />
              <span>{tabSwitchCount} tab switch warning(s) logged during test.</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-2">
            <button
              onClick={() => setReviewMode(true)}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-extrabold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
            >
              <HelpCircle size={16} /> Review Detailed Solutions
            </button>

            <div className="flex gap-3">
              <button
                onClick={handleRetake}
                className="flex-1 py-3 rounded-2xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <RotateCcw size={14} /> Retake Test
              </button>
              <button
                onClick={() => navigate(returnPath)}
                className="flex-1 py-3 rounded-2xl border border-slate-600 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
              >
                Back to Preparation
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── MAIN CBT TEST WINDOW ─────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col select-none text-slate-900">

      {/* ══ HEADER BAR ══════════════════════════════════════════ */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="px-4 lg:px-6 py-2.5 flex items-center justify-between gap-3">
          {/* Logo & Test Info */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shrink-0 shadow-sm shadow-indigo-200">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="font-extrabold text-slate-900 text-sm truncate leading-tight">
                {testTitle}
              </h1>
              <p className="text-xs text-slate-500 font-medium truncate">
                Class {classLevel} · {subjectName} · {questions.length} Questions
              </p>
            </div>
          </div>

          {/* Mini Progress */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="text-center px-2">
              <div className="text-xs font-bold text-emerald-600">{answeredCount}</div>
              <div className="text-[10px] text-slate-400 font-medium">Done</div>
            </div>
            <div className="w-px h-6 bg-slate-200" />
            <div className="text-center px-2">
              <div className="text-xs font-bold text-amber-500">{reviewCount}</div>
              <div className="text-[10px] text-slate-400 font-medium">Review</div>
            </div>
            <div className="w-px h-6 bg-slate-200" />
            <div className="text-center px-2">
              <div className="text-xs font-bold text-slate-600">{unattemptedCount}</div>
              <div className="text-[10px] text-slate-400 font-medium">Left</div>
            </div>
          </div>

          {/* Right Header: Timer, Fullscreen, Panel Toggle, Submit */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Live Timer */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono font-extrabold text-sm transition-all ${
              isUrgent
                ? 'bg-red-50 text-red-600 border border-red-300 animate-pulse shadow-xs shadow-red-200'
                : isWarning
                ? 'bg-amber-50 text-amber-600 border border-amber-300'
                : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
            }`}>
              <Clock size={15} className="shrink-0" />
              <span className="tabular-nums">{formatTime(timeRemaining)}</span>
            </div>

            {/* Language Hindi/English toggle */}
            <button
              onClick={() => setShowLangHindi(h => !h)}
              className={`text-xs px-2.5 py-1.5 rounded-xl font-bold border transition-all flex items-center gap-1 ${
                showLangHindi
                  ? 'bg-indigo-100 text-indigo-700 border-indigo-300'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
              }`}
            >
              <span>हि</span> {showLangHindi ? 'EN' : 'HI'}
            </button>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors hidden md:flex"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
            </button>

            {/* Side Panel Toggle */}
            <button
              onClick={() => setShowPanel(p => !p)}
              className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors"
            >
              {showPanel ? <EyeOff size={13} /> : <Eye size={13} />}
              <span>{showPanel ? 'Hide' : 'Palette'}</span>
            </button>

            {/* Primary Submit Button */}
            <button
              onClick={() => setShowSubmitModal(true)}
              className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-extrabold px-4 py-1.5 rounded-xl shadow-xs transition-all text-xs"
            >
              <Send size={13} /> Submit
            </button>
          </div>
        </div>

        {/* Progress line */}
        <div className="h-1 bg-slate-100 relative">
          <div
            className="absolute left-0 top-0 h-1 rounded-r-full transition-all duration-300"
            style={{
              width: `${(answeredCount / Math.max(questions.length, 1)) * 100}%`,
              background: 'linear-gradient(to right, #6366f1, #8b5cf6)',
            }}
          />
        </div>
      </header>

      {/* ══ WORKSPACE BODY ══════════════════════════════════════ */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── QUESTION SOLVING AREA ────────────────────────────── */}
        <main className="flex-1 overflow-y-auto">
          {currentQ ? (
            <div className="max-w-3xl mx-auto px-4 lg:px-6 py-6 space-y-5">

              {/* Meta bar */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="w-8 h-8 bg-indigo-600 text-white rounded-xl flex items-center justify-center text-sm font-black shadow-xs shrink-0">
                    {currentIdx + 1}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {currentQ.subject}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold uppercase tracking-wider ${
                    currentQ.difficulty === 'easy' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    currentQ.difficulty === 'hard' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                    'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {currentQ.difficulty}
                  </span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                    +{currentQ.marks || 1} mark
                  </span>
                  {currentQ.negativeMarks > 0 && (
                    <span className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-lg">
                      -{currentQ.negativeMarks} mark
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleMarkReview}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      markedForReview[currentQ.id]
                        ? 'bg-amber-50 text-amber-600 border-amber-300 shadow-xs'
                        : 'bg-white text-slate-500 border-slate-200 hover:border-amber-300 hover:text-amber-600'
                    }`}
                  >
                    <Bookmark size={13} className={markedForReview[currentQ.id] ? 'fill-amber-500' : ''} />
                    {markedForReview[currentQ.id] ? 'Marked for Review' : 'Mark Review'}
                  </button>
                </div>
              </div>

              {/* Question Text Box */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
                <p className={`text-slate-900 text-base leading-relaxed font-semibold ${
                  showLangHindi && (currentQ.questionTextHindi || translations[currentQ.id]?.qText) ? 'opacity-50 text-sm' : ''
                }`}>
                  {currentQ.questionText}
                </p>

                {/* Hindi view */}
                {(currentQ.questionTextHindi || translations[currentQ.id]?.qText) && showLangHindi && (
                  <p
                    className="mt-3 text-slate-800 text-base font-semibold leading-relaxed border-t border-slate-100 pt-3"
                    style={{ fontFamily: "'Noto Sans Devanagari', serif" }}
                  >
                    {currentQ.questionTextHindi || translations[currentQ.id]?.qText}
                    {!currentQ.questionTextHindi && translations[currentQ.id]?.qText && (
                      <span className="text-[10px] text-indigo-500 ml-2 font-normal" title="Auto-translated">✨ Auto</span>
                    )}
                  </p>
                )}

                {currentQ.image && (
                  <img
                    src={currentQ.image}
                    alt="Question Diagram"
                    className="mt-4 max-h-60 rounded-xl object-contain border border-slate-100 bg-slate-50 p-2 w-full"
                  />
                )}
              </div>

              {/* Options List */}
              <div className="space-y-3">
                {(currentQ.options || []).map((option) => {
                  const isSelected = responses[currentQ.id]?.selectedOption === option.label;
                  return (
                    <button
                      key={option.label}
                      onClick={() => handleAnswer(option.label, option.text)}
                      className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 text-left transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 group ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50 shadow-md shadow-indigo-100'
                          : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-xs'
                      }`}
                    >
                      {/* Label Bubble */}
                      <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-extrabold shrink-0 transition-all ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-600'
                      }`}>
                        {option.label}
                      </span>

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium leading-relaxed ${
                          isSelected ? 'text-indigo-950 font-bold' : 'text-slate-800'
                        }`}>
                          {option.text}
                        </p>
                        {(translations[currentQ.id]?.options[option.label]) && showLangHindi && (
                          <p className="text-sm font-medium text-slate-700 mt-1" style={{ fontFamily: "'Noto Sans Devanagari', serif" }}>
                            {translations[currentQ.id].options[option.label]}
                          </p>
                        )}
                      </div>

                      {/* Check indicator */}
                      {isSelected ? (
                        <CheckCircle className="w-5 h-5 text-indigo-600 shrink-0" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-slate-200 shrink-0 group-hover:border-indigo-300 transition-colors" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Action Buttons Row */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  {responses[currentQ.id]?.selectedOption && (
                    <button
                      onClick={handleClear}
                      className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-rose-600 font-semibold border border-slate-200 hover:border-rose-200 px-3 py-2 rounded-xl bg-white hover:bg-rose-50 transition-colors"
                    >
                      <RotateCcw size={12} /> Clear Response
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={goPrev}
                    disabled={currentIdx === 0}
                    className="flex items-center gap-1 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-semibold text-xs disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft size={14} /> Previous
                  </button>

                  <button
                    onClick={handleMarkReviewAndNext}
                    className="hidden sm:flex items-center gap-1 px-3 py-2 rounded-xl border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 font-semibold text-xs transition-colors"
                  >
                    <Bookmark size={13} /> Review & Next
                  </button>

                  <button
                    onClick={handleSaveNext}
                    className="flex items-center gap-1 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all"
                  >
                    <span>{currentIdx === questions.length - 1 ? 'Save' : 'Save & Next'}</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400">
              No question loaded.
            </div>
          )}
        </main>

        {/* ── RIGHT PANEL (PALETTE & SUMMARY) ──────────────────── */}
        {showPanel && (
          <aside className="w-72 bg-white border-l border-slate-200 shrink-0 hidden md:flex flex-col overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-slate-200">
              {[
                { id: 'navigator', label: 'Navigator', icon: Target },
                { id: 'summary',   label: 'Summary',   icon: BarChart2 },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSection(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold transition-colors ${
                    activeSection === tab.id
                      ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <tab.icon size={13} /> {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {activeSection === 'navigator' && (
                <div>
                  {/* Status Count Badges */}
                  <div className="grid grid-cols-4 gap-2 p-3 border-b border-slate-100">
                    {[
                      { val: answeredCount,    label: 'Done',   color: 'text-emerald-600', bg: 'bg-emerald-50' },
                      { val: reviewCount,      label: 'Review', color: 'text-amber-500',   bg: 'bg-amber-50' },
                      { val: unattemptedCount, label: 'Left',   color: 'text-slate-600',   bg: 'bg-slate-100' },
                      { val: questions.length, label: 'Total',  color: 'text-indigo-600',  bg: 'bg-indigo-50' },
                    ].map(s => (
                      <div key={s.label} className={`${s.bg} rounded-xl p-2 text-center`}>
                        <div className={`font-black text-sm ${s.color}`}>{s.val}</div>
                        <div className="text-[9px] text-slate-500 font-bold mt-0.5">{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Legend */}
                  <div className="px-3 py-2 border-b border-slate-100 flex flex-wrap gap-2 text-[10px]">
                    {[
                      { color: 'bg-emerald-500', label: 'Answered' },
                      { color: 'bg-amber-400',   label: 'Review' },
                      { color: 'bg-violet-600',  label: 'Ans+Review' },
                      { color: 'bg-slate-100 border border-slate-300', label: 'Unvisited' },
                    ].map(l => (
                      <div key={l.label} className="flex items-center gap-1">
                        <div className={`w-3 h-3 rounded ${l.color}`} />
                        <span className="text-slate-500 font-medium">{l.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Question Grid */}
                  <div className="p-3">
                    <div className="grid grid-cols-5 gap-1.5">
                      {questions.map((q, idx) => {
                        const isCurrent = idx === currentIdx;
                        const status = isCurrent ? 'current' : getQStatus(idx);
                        return (
                          <button
                            key={idx}
                            onClick={() => goTo(idx)}
                            className={`aspect-square rounded-lg text-xs font-bold transition-all ${statusStyle[status]}`}
                          >
                            {idx + 1}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'summary' && (
                <div className="p-3 space-y-3">
                  {/* Progress Box */}
                  <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
                    <div className="text-xs text-indigo-600 font-bold uppercase tracking-wider mb-2">
                      Exam Progress
                    </div>
                    <div className="relative h-2 bg-indigo-100 rounded-full overflow-hidden">
                      <div
                        className="absolute left-0 top-0 h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all"
                        style={{ width: `${(answeredCount / Math.max(questions.length, 1)) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-indigo-700 font-bold mt-2">
                      {answeredCount} of {questions.length} Attempted ({Math.round((answeredCount / Math.max(questions.length, 1)) * 100)}%)
                    </p>
                  </div>

                  {/* Time box */}
                  <div className={`rounded-2xl p-4 border ${
                    isUrgent ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Clock size={14} className={isUrgent ? 'text-red-500' : 'text-slate-500'} />
                      <span className="text-xs font-bold text-slate-700">Time Left</span>
                    </div>
                    <div className={`font-black text-2xl tabular-nums ${
                      isUrgent ? 'text-red-600' : 'text-slate-900'
                    }`}>
                      {formatTime(timeRemaining)}
                    </div>
                    {isUrgent && (
                      <p className="text-[11px] text-red-500 font-semibold mt-1 animate-pulse">
                        ⚠️ Less than 5 minutes remaining!
                      </p>
                    )}
                  </div>

                  {/* Subject overview */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-4">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Subject
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-800">{subjectName}</span>
                      <span className="text-xs font-bold text-indigo-600">Class {classLevel}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Submit */}
            <div className="p-3 border-t border-slate-200">
              <button
                onClick={() => setShowSubmitModal(true)}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold py-3 rounded-xl text-sm shadow-md transition-all hover:-translate-y-0.5"
              >
                <Send size={14} /> Submit Test
              </button>
              <p className="text-center text-[10px] text-slate-400 mt-2">
                Real-time auto-saving active
              </p>
            </div>
          </aside>
        )}

      </div>

      {/* ══ ANTI-CHEAT WARNING MODAL ════════════════════════════ */}
      {showAntiCheatWarning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 animate-fade-in text-center border-t-8 border-red-500">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">Exam Proctor Alert!</h2>
            <p className="text-base text-slate-600 font-medium mb-6">
              Tab switching or leaving the exam window is strictly monitored. 
              You have switched tabs <strong className="text-red-600 text-xl">{tabSwitchCount}</strong> time(s).
            </p>
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-8 text-left">
              <p className="text-red-700 font-bold text-sm mb-1">
                ⚠️ Test will automatically submit after {MAX_TAB_SWITCHES} violations.
              </p>
              <p className="text-red-500 text-xs">Stay in full-screen during official tests.</p>
            </div>
            
            <button
              disabled={antiCheatPenaltyTime > 0}
              onClick={() => setShowAntiCheatWarning(false)}
              className="w-full py-4 rounded-2xl font-black text-white text-base transition-all disabled:opacity-100 disabled:bg-slate-300 disabled:cursor-not-allowed bg-red-600 hover:bg-red-700 shadow-xl shadow-red-200"
            >
              {antiCheatPenaltyTime > 0 ? `Please wait ${antiCheatPenaltyTime}s...` : 'I Understand, Resume Test'}
            </button>
          </div>
        </div>
      )}

      {/* ══ SUBMIT CONFIRMATION MODAL ═══════════════════════════ */}
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
                  <h3 className="text-xl font-extrabold text-slate-900">Submit Mock Test?</h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Instant scorecard will be generated.</p>
                </div>
              </div>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center hover:bg-slate-200 transition-colors"
              >
                <X size={16} className="text-slate-500" />
              </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
                <p className="text-2xl font-black text-emerald-600">{answeredCount}</p>
                <p className="text-xs text-emerald-700 font-bold mt-1">Answered</p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
                <p className="text-2xl font-black text-amber-500">{reviewCount}</p>
                <p className="text-xs text-amber-700 font-bold mt-1">For Review</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
                <p className="text-2xl font-black text-slate-600">{unattemptedCount}</p>
                <p className="text-xs text-slate-500 font-bold mt-1">Skipped</p>
              </div>
            </div>

            {/* Unattempted Warning */}
            {unattemptedCount > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5 flex items-start gap-3">
                <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 font-medium">
                  You have <strong>{unattemptedCount} unanswered</strong> question(s). You can still continue the test to answer them.
                </p>
              </div>
            )}

            {/* Time left */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-600 text-xs font-semibold">
                <Clock size={15} /> Time Remaining
              </div>
              <span className={`font-black tabular-nums text-sm ${isUrgent ? 'text-red-600' : 'text-slate-800'}`}>
                {formatTime(timeRemaining)}
              </span>
            </div>

            {/* Modal Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                disabled={submitting}
                className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-all disabled:opacity-50"
              >
                Continue Test
              </button>
              <button
                onClick={() => handleSubmit(false)}
                disabled={submitting}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-extrabold text-xs shadow-lg shadow-indigo-200 hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {submitting ? 'Submitting…' : 'Submit Now'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
