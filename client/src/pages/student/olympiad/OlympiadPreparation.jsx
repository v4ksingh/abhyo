import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  BookOpen, FileText, Target, CheckCircle2, Clock,
  Calendar, Download, ArrowLeft, RotateCcw, AlertCircle, Check,
  ChevronRight, Copy, Layers, Eye, Video, Play, ExternalLink, Sparkles, Receipt
} from 'lucide-react';
import api from '../../../lib/api';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────────────────────
// COMPACT DEFAULT PRACTICE QUESTIONS (FOR INTERACTIVE MOCK DRILL)
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_PRACTICE_QUESTIONS = {
  Mathematics: [
    {
      id: 'm_1',
      question: 'What is the value of (48 ÷ 6) × (15 - 9) + 4²?',
      options: ['64', '56', '72', '48'],
      correctAnswer: '64',
      explanation: 'Follow BODMAS: (48 ÷ 6) = 8. (15 - 9) = 6. 8 × 6 = 48. Then 4² = 16. 48 + 16 = 64.',
      difficulty: 'Easy',
      marks: 1,
    },
    {
      id: 'm_2',
      question: 'A number is divisible by both 4 and 6. Which of the following numbers MUST also divide it?',
      options: ['12', '24', '18', '8'],
      correctAnswer: '12',
      explanation: 'Any number divisible by two numbers must be divisible by their LCM. LCM(4, 6) = 12.',
      difficulty: 'Medium',
      marks: 1,
    },
    {
      id: 'm_3',
      question: 'The sum of three consecutive even numbers is 54. What is the largest of these three numbers?',
      options: ['20', '18', '22', '16'],
      correctAnswer: '20',
      explanation: 'Let the numbers be x, x+2, x+4. Sum = 3x + 6 = 54 => 3x = 48 => x = 16. Numbers: 16, 18, 20. Largest is 20.',
      difficulty: 'Medium',
      marks: 1,
    },
    {
      id: 'm_4',
      question: 'If 2^(x - 1) + 2^(x + 1) = 320, find the value of x.',
      options: ['7', '6', '8', '5'],
      correctAnswer: '7',
      explanation: 'Factor out 2^x: 2^x(1/2 + 2) = 320 => 2^x(5/2) = 320 => 2^x = 128 = 2^7 => x = 7.',
      difficulty: 'Hard',
      marks: 1,
    },
    {
      id: 'm_5',
      question: 'The diagonal of a rectangle is 25 cm and its breadth is 7 cm. What is its perimeter?',
      options: ['62 cm', '56 cm', '68 cm', '74 cm'],
      correctAnswer: '62 cm',
      explanation: 'By Pythagoras theorem: Length = √(25² - 7²) = √(625 - 49) = √576 = 24 cm. Perimeter = 2(24 + 7) = 62 cm.',
      difficulty: 'Medium',
      marks: 1,
    },
  ],
  Science: [
    {
      id: 's_1',
      question: 'Which organelle is known as the powerhouse of the cell?',
      options: ['Mitochondria', 'Ribosome', 'Nucleus', 'Endoplasmic Reticulum'],
      correctAnswer: 'Mitochondria',
      explanation: 'Mitochondria produce ATP through cellular respiration, making them the powerhouse of the cell.',
      difficulty: 'Easy',
      marks: 1,
    },
    {
      id: 's_2',
      question: 'What is the acceleration due to gravity on the surface of the Earth?',
      options: ['9.8 m/s²', '8.9 m/s²', '10.8 m/s²', '9.2 m/s²'],
      correctAnswer: '9.8 m/s²',
      explanation: 'Standard acceleration due to Earth gravity g is approximately 9.8 m/s².',
      difficulty: 'Easy',
      marks: 1,
    },
    {
      id: 's_3',
      question: 'Which gas is released during photosynthesis?',
      options: ['Oxygen', 'Carbon Dioxide', 'Nitrogen', 'Hydrogen'],
      correctAnswer: 'Oxygen',
      explanation: 'During photosynthesis, plants convert water and carbon dioxide into glucose and release oxygen (O₂).',
      difficulty: 'Easy',
      marks: 1,
    },
  ],
  Computer: [
    {
      id: 'c_1',
      question: 'Which protocol is used for secure communication over the internet?',
      options: ['HTTPS', 'HTTP', 'FTP', 'SMTP'],
      correctAnswer: 'HTTPS',
      explanation: 'HTTPS (Hypertext Transfer Protocol Secure) encrypts data using TLS/SSL.',
      difficulty: 'Easy',
      marks: 1,
    },
    {
      id: 'c_2',
      question: 'Which data structure follows the First-In, First-Out (FIFO) principle?',
      options: ['Queue', 'Stack', 'Tree', 'Graph'],
      correctAnswer: 'Queue',
      explanation: 'A Queue follows FIFO, where the first element added is the first one removed.',
      difficulty: 'Medium',
      marks: 1,
    },
    {
      id: 'c_3',
      question: 'What does CPU stand for in computer systems?',
      options: ['Central Processing Unit', 'Central Process Utility', 'Core Processing Unit', 'Central Power Unit'],
      correctAnswer: 'Central Processing Unit',
      explanation: 'CPU stands for Central Processing Unit, the primary component that executes computer instructions.',
      difficulty: 'Easy',
      marks: 1,
    },
    {
      id: 'c_4',
      question: 'What is the output of bool(0) or bool("False") in Python?',
      options: ['True', 'False', 'None', 'Error'],
      correctAnswer: 'True',
      explanation: 'bool(0) is False. Any non-empty string in Python evaluates to True, so bool("False") is True. False or True is True.',
      difficulty: 'Medium',
      marks: 1,
    },
  ],
};

export default function OlympiadPreparation() {
  const { regId } = useParams();
  const navigate  = useNavigate();

  // Data state
  const [prepData,   setPrepData]   = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [activeTab,  setActiveTab]  = useState('syllabus'); // 'syllabus' | 'mocktests' | 'materials' | 'pattern'
  const [copiedRoll, setCopiedRoll] = useState(false);
  const [materialFilter, setMaterialFilter] = useState('all');

  // Interactive Mock Test State
  const [activeMockTest, setActiveMockTest] = useState(null);
  const [testMode,       setTestMode]       = useState(false);
  const [qIndex,         setQIndex]         = useState(0);
  const [userAnswers,    setUserAnswers]    = useState({});
  const [markedReview,   setMarkedReview]   = useState([]);
  const [testTimeLeft,   setTestTimeLeft]   = useState(0);
  const [testCompleted,  setTestCompleted]  = useState(false);
  const [testResult,     setTestResult]     = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!regId) {
      toast.error('Invalid registration ID');
      navigate('/student/olympiad', { replace: true });
      return;
    }

    api.get(`/olympiad/student/preparation/${regId}`)
      .then(r => setPrepData(r.data.data))
      .catch(err => {
        api.get(`/olympiad/student/admit-card/${regId}`)
          .then(admitRes => {
            const d = admitRes.data.data;
            setPrepData({
              registrationId: d.registrationId || regId,
              rollNumber: d.rollNumber,
              classSelected: d.classSelected,
              board: d.board,
              medium: d.medium,
              paymentStatus: 'paid',
              amountPaid: 150,
              studentName: d.studentName,
              studentEmail: d.studentEmail,
              studentAvatar: d.studentAvatar,
              olympiad: {
                title: d.olympiadTitle,
                examDate: d.examDate,
                examStartTime: d.examStartTime,
                examDurationMinutes: d.examDuration,
                totalQuestions: d.totalQuestions,
                marksPerQuestion: d.marksPerQuestion,
                negativeMarks: d.negativeMarks,
                subject: { name: d.subjectName || 'Mathematics' },
              },
              studyMaterials: [],
            });
          })
          .catch(() => {
            toast.error('Failed to load Olympiad preparation data');
            navigate('/student/olympiad', { replace: true });
          });
      })
      .finally(() => setLoading(false));
  }, [regId, navigate]);

  const selectedClass = prepData?.classSelected || 6;
  const subjectName   = prepData?.olympiad?.subject?.name || 'Mathematics';

  // Categorize study materials provided by admin
  const adminSyllabusMaterials = useMemo(() => {
    return (prepData?.studyMaterials || []).filter(m => m.type === 'syllabus');
  }, [prepData?.studyMaterials]);

  const adminMockTests = useMemo(() => {
    return (prepData?.studyMaterials || []).filter(m => m.type === 'practice');
  }, [prepData?.studyMaterials]);

  const adminStudyMaterials = useMemo(() => {
    return (prepData?.studyMaterials || []).filter(m => m.type !== 'syllabus' && m.type !== 'practice');
  }, [prepData?.studyMaterials]);

  const olympiadSyllabusPdf = prepData?.olympiad?.syllabusPdfUrl;

  // Filtered study materials
  const filteredStudyMaterials = useMemo(() => {
    if (materialFilter === 'all') return adminStudyMaterials;
    return adminStudyMaterials.filter(m => m.type === materialFilter);
  }, [adminStudyMaterials, materialFilter]);

  // Practice mock test pool
  const practiceMockTests = useMemo(() => {
    const defaultQs = DEFAULT_PRACTICE_QUESTIONS[subjectName] || DEFAULT_PRACTICE_QUESTIONS.Mathematics;
    const dbQs = (prepData?.officialQuestions || []).map((q, idx) => ({
      id: q.id || `db_${idx}`,
      question: q.questionText,
      options: Array.isArray(q.options) ? q.options : [],
      correctAnswer: q.correctAnswer || (q.options ? q.options[0] : ''),
      explanation: q.explanation || 'Official national Olympiad benchmark question.',
      difficulty: q.difficulty || 'Medium',
      marks: q.marks || 1,
    }));
    const combined = [...dbQs, ...defaultQs];

    return [
      {
        id: 'practice_mock_1',
        title: `Class ${selectedClass} ${subjectName} Practice Test`,
        durationMinutes: 20,
        totalQuestions: combined.length,
        questions: combined,
      },
    ];
  }, [subjectName, selectedClass, prepData?.officialQuestions]);

  // Helpers to open or download PDF/file safely
  const getResourceUrl = (url) => {
    if (!url) return '';
    const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api');
    const serverRoot = apiBase.replace(/\/api\/?$/, ''); // e.g. https://abhyo.com/server

    // If it's already a full URL pointing to /uploads/ on this domain,
    // it was saved with the wrong host prefix (missing /server proxy path).
    // Remap it through the correct server root.
    try {
      const parsed = new URL(url);
      if (parsed.pathname.startsWith('/uploads/')) {
        // e.g. https://abhyo.com/uploads/... → https://abhyo.com/server/uploads/...
        return `${serverRoot}${parsed.pathname}`;
      }
      // External URL (Google Drive, YouTube, etc.) — use as-is
      return url;
    } catch {
      // Not a valid absolute URL — treat as relative path
    }
    // Relative path like /uploads/study-materials/xxx.pdf
    return `${serverRoot}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const handleOpenResource = (url) => {
    if (!url) {
      toast.error('Resource link is not available.');
      return;
    }
    window.open(getResourceUrl(url), '_blank', 'noopener,noreferrer');
  };

  const handleDownloadResource = (url, fallbackFilename = 'Olympiad_Document.pdf') => {
    if (!url) {
      toast.error('File link not available.');
      return;
    }
    const link = document.createElement('a');
    link.href = getResourceUrl(url);
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.download = fallbackFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyRoll = () => {
    if (prepData?.rollNumber) {
      navigator.clipboard.writeText(prepData.rollNumber);
      setCopiedRoll(true);
      toast.success('Roll Number copied!');
      setTimeout(() => setCopiedRoll(false), 2000);
    }
  };

  // Mock test runner — Launches the full-screen real CBT exam interface
  const startMockTest = (mockTest) => {
    if (!mockTest.questions || mockTest.questions.length === 0) {
      toast.error('No questions available for this test.');
      return;
    }
    navigate(`/student/olympiad/mock-exam/${regId}`, {
      state: {
        mockTest,
        returnPath: `/student/olympiad/preparation/${regId}`,
        prepData: {
          olympiadTitle: prepData?.olympiad?.title,
          subjectName,
          selectedClass,
          rollNumber: prepData?.rollNumber,
          studentName: prepData?.studentName,
        },
      },
    });
  };

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!prepData) return null;

  const currentQ = activeMockTest?.questions?.[qIndex];

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-16">

      {/* ───────────────────────────────────────────────────────────────────
          1. CLEAN TOP HEADER CARD
          ─────────────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate('/student/olympiad')}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shrink-0"
              title="Return to Olympiad Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate">
                  {prepData.olympiad?.title || 'National Olympiad'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100 shrink-0">
                  Class {selectedClass}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold shrink-0">
                  {subjectName}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                <span className="flex items-center gap-1 font-mono font-semibold text-slate-700">
                  Roll No: {prepData.rollNumber}
                  <button onClick={handleCopyRoll} className="text-slate-400 hover:text-indigo-600 ml-1 p-0.5" title="Copy Roll Number">
                    {copiedRoll ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </span>
                {prepData.olympiad?.examDate && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Exam: {new Date(prepData.olympiad.examDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
            <button
              onClick={() => navigate('/student/olympiad/study-materials')}
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              <span>Study Materials</span>
            </button>
            <button
              onClick={() => navigate(`/student/olympiad/receipt/${regId}`)}
              className="px-3.5 py-2 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Receipt className="w-4 h-4 text-emerald-600" />
              <span>Fee Slip</span>
            </button>
            <button
              onClick={() => navigate(`/student/olympiad/admit-card/${regId}`)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>Admit Card</span>
            </button>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────────
          2. NAVIGATION TABS
          ─────────────────────────────────────────────────────────────────── */}
      <div className="flex border-b border-slate-200 gap-1 sm:gap-2 overflow-x-auto pb-px">
        {[
          {
            id: 'syllabus',
            label: 'Syllabus (PDF)',
            icon: BookOpen,
            count: (olympiadSyllabusPdf ? 1 : 0) + adminSyllabusMaterials.length,
          },
          {
            id: 'mocktests',
            label: 'Mock Tests',
            icon: Target,
            count: adminMockTests.length + (practiceMockTests.length > 0 ? 1 : 0),
          },
          {
            id: 'materials',
            label: 'Study Material',
            icon: Download,
            count: adminStudyMaterials.length,
          },
          { id: 'pattern', label: 'Exam Pattern', icon: Layers },
        ].map(tab => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setTestMode(false);
              }}
              className={`pb-3 px-3.5 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                isActive
                  ? 'border-indigo-600 text-indigo-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && tab.count > 0 && (
                <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ───────────────────────────────────────────────────────────────────
          TAB 1: SYLLABUS (PDF ONLY - PROVIDED BY ADMIN)
          ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'syllabus' && (
        <div className="space-y-4">

          {/* Master Syllabus PDF from Olympiad */}
          {olympiadSyllabusPdf && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-base">
                      Official Exam Syllabus (PDF)
                    </h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                      Class {selectedClass}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Official syllabus document uploaded by administrator for {subjectName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                <button
                  onClick={() => handleOpenResource(olympiadSyllabusPdf)}
                  className="flex-1 sm:flex-initial px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View PDF</span>
                </button>
                <button
                  onClick={() => handleDownloadResource(olympiadSyllabusPdf, `Class_${selectedClass}_Syllabus.pdf`)}
                  className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>
          )}

          {/* Additional Syllabus Files uploaded by admin */}
          {adminSyllabusMaterials.map((mat) => (
            <div
              key={mat.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{mat.title}</h3>
                  {mat.description && <p className="text-xs text-slate-500 mt-0.5">{mat.description}</p>}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                <button
                  onClick={() => handleOpenResource(mat.fileUrl || mat.externalUrl)}
                  className="flex-1 sm:flex-initial px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View PDF</span>
                </button>
                <button
                  onClick={() => handleDownloadResource(mat.fileUrl || mat.externalUrl, `${mat.title}.pdf`)}
                  className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>
          ))}

          {/* Pending upload notice */}
          {!olympiadSyllabusPdf && adminSyllabusMaterials.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2">
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-100">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Syllabus PDF will be uploaded by admin soon</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                The administrator is preparing the official Class {selectedClass} syllabus PDF for {subjectName}.
              </p>
            </div>
          )}

        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────
          TAB 2: MOCK TESTS
          ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'mocktests' && (
        <div className="space-y-5">

          {/* Real Exam Simulation Banner */}
          <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 rounded-2xl p-5 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-indigo-200 text-[11px] font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Real Exam Environment
              </div>
              <h3 className="text-base sm:text-lg font-black text-white">
                CBT Mock Test Simulation
              </h3>
              <p className="text-xs text-indigo-200 max-w-xl">
                Experience the authentic examination hall interface: live countdown timer, question navigator palette, Hindi/English bilingual switch, anti-cheat monitoring, and instant solution breakdown.
              </p>
            </div>
            <div className="hidden lg:flex items-center gap-2 shrink-0">
              <div className="px-3 py-1.5 rounded-xl bg-white/10 text-center">
                <span className="block text-xs font-black text-white">Bilingual</span>
                <span className="text-[10px] text-indigo-300">EN + HI</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-white/10 text-center">
                <span className="block text-xs font-black text-white">Live Timer</span>
                <span className="text-[10px] text-indigo-300">Auto-Submit</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-white/10 text-center">
                <span className="block text-xs font-black text-white">Instant</span>
                <span className="text-[10px] text-indigo-300">Solutions</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Interactive Practice Tests */}
            {practiceMockTests.map(mock => (
              <div
                key={mock.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-indigo-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-13 h-13 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100 shadow-2xs">
                    <Target className="w-7 h-7 text-indigo-600" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-extrabold text-slate-900 text-base">{mock.title}</h3>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                        Official Benchmark
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1 font-semibold text-slate-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                        {mock.totalQuestions} Questions
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-semibold text-slate-700">
                        <Clock className="w-3.5 h-3.5 text-indigo-600" />
                        {mock.durationMinutes} Minutes
                      </span>
                      <span>•</span>
                      <span className="text-emerald-600 font-semibold">
                        Instant Score & Review
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => startMockTest(mock)}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm shadow-indigo-200 hover:-translate-y-0.5 transition-all shrink-0"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start Real Mock Test</span>
                </button>
              </div>
            ))}

            {/* Admin-Created Olympiad Mock Tests */}
            {adminMockTests.length > 0 && (
              <div className="space-y-3 pt-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Additional Practice Papers</span>
                  <span className="text-xs font-semibold text-slate-400">({adminMockTests.length})</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {adminMockTests.map(mock => (
                    <div
                      key={mock.id}
                      className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                          Class {mock.classLevel || selectedClass}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 mt-1">{mock.title}</h4>
                        {mock.description && (
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{mock.description}</p>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                        {mock.fileUrl && (
                          <button
                            onClick={() => handleOpenResource(mock.fileUrl)}
                            className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Download Paper</span>
                          </button>
                        )}
                        {mock.externalUrl && (
                          <button
                            onClick={() => handleOpenResource(mock.externalUrl)}
                            className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Launch Test</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {adminMockTests.length === 0 && practiceMockTests.length === 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2">
                <p className="text-xs text-slate-500">No mock tests published yet by admin.</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────
          TAB 3: STUDY MATERIAL
          ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'materials' && (
        <div className="space-y-4">

          {/* Filter Pills (only if materials exist) */}
          {adminStudyMaterials.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: 'all', label: 'All' },
                { id: 'pdf', label: 'PDFs' },
                { id: 'notes', label: 'Notes' },
                { id: 'video', label: 'Videos' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setMaterialFilter(f.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    materialFilter === f.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}

          {/* Materials Grid */}
          {filteredStudyMaterials.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredStudyMaterials.map(mat => (
                <div
                  key={mat.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {mat.type}
                      </span>
                      {mat.classLevel && (
                        <span className="text-[10px] font-bold text-slate-400">Class {mat.classLevel}</span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">{mat.title}</h4>
                    {mat.description && (
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{mat.description}</p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                    {mat.fileUrl && (
                      <button
                        onClick={() => handleDownloadResource(mat.fileUrl, `${mat.title}.pdf`)}
                        className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                    )}
                    {mat.videoUrl && (
                      <button
                        onClick={() => handleOpenResource(mat.videoUrl)}
                        className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Watch</span>
                      </button>
                    )}
                    {mat.externalUrl && !mat.fileUrl && !mat.videoUrl && (
                      <button
                        onClick={() => handleOpenResource(mat.externalUrl)}
                        className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open Link</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
              <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-800">Study materials will be uploaded soon</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  The administrator has not uploaded study materials for Class {selectedClass} yet.
                </p>
              </div>
              <button
                onClick={() => navigate('/student/olympiad/study-materials')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5" />
                Browse All Study Materials
              </button>
            </div>
          )}

        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────
          TAB 4: EXAM PATTERN & MARKING
          ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'pattern' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-5">
          <div>
            <h3 className="text-base font-bold text-slate-900">Exam Pattern & Marking Scheme</h3>
            <p className="text-xs text-slate-500 mt-0.5">Class {selectedClass} • {subjectName}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Questions</span>
              <p className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                {prepData.olympiad?.totalQuestions || 40}
              </p>
              <span className="text-[11px] text-slate-500">MCQs</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Duration</span>
              <p className="text-xl sm:text-2xl font-black text-indigo-600 mt-0.5">
                {prepData.olympiad?.examDurationMinutes || 60}
              </p>
              <span className="text-[11px] text-slate-500">Minutes</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Marks / Question</span>
              <p className="text-xl sm:text-2xl font-black text-emerald-600 mt-0.5">
                +{prepData.olympiad?.marksPerQuestion || 1}
              </p>
              <span className="text-[11px] text-slate-500">Correct Answer</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Negative Mark</span>
              <p className="text-xl sm:text-2xl font-black text-amber-600 mt-0.5">
                {prepData.olympiad?.negativeMarks || 0}
              </p>
              <span className="text-[11px] text-slate-500">Wrong Answer</span>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-900">Exam Instructions</h4>
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                <span>Monitored examination environment. Keep your window focused during the test.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                <span>Keep your Admit Card and Roll Number ready before the exam begins.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                <span>Responses are automatically saved in real time.</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
