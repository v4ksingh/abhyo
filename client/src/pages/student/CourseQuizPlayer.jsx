import React, { useState, useEffect } from 'react';
import { Target, Clock, CheckCircle2, AlertCircle, ChevronRight, ChevronLeft, RefreshCw, XCircle, BrainCircuit, Play, Award, RotateCcw, ShieldCheck } from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'react-hot-toast';

export default function CourseQuizPlayer({ quizId, onBack }) {
  const [quiz, setQuiz] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Take quiz state
  const [taking, setTaking] = useState(null); // 'intro', 'quiz', 'result'
  const [currentAnswers, setCurrentAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  useEffect(() => {
    fetchQuiz();
    fetchAttempts();
  }, [quizId]);

  const fetchQuiz = async () => {
    try {
      const res = await api.get(`/lms/course-quizzes/${quizId}`);
      const fetchedQuiz = res.data.data;
      if (fetchedQuiz?.questions) {
        fetchedQuiz.questions = fetchedQuiz.questions.map(q => ({
          ...q,
          options: typeof q.options === 'string' ? JSON.parse(q.options) : (q.options || [])
        }));
      }
      setQuiz(fetchedQuiz);
    } catch { toast.error('Failed to load quiz'); }
  };

  const fetchAttempts = async () => {
    try {
      const res = await api.get(`/lms/course-quizzes/${quizId}/my-attempts`);
      setAttempts(res.data.data || []);
      setLoading(false);
    } catch { setLoading(false); }
  };

  const startQuiz = () => {
    if (quiz.maxAttempts && attempts.length >= quiz.maxAttempts) {
      return toast.error('No attempts remaining');
    }
    setCurrentAnswers({});
    setCurrentQuestionIndex(0);
    setTaking('quiz');
    if (quiz.timeLimit) {
      setTimeLeft(quiz.timeLimit * 60);
    }
  };

  useEffect(() => {
    if (taking === 'quiz' && timeLeft !== null && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (taking === 'quiz' && timeLeft === 0) {
      submitQuiz(); // Auto submit
    }
  }, [taking, timeLeft]);

  const handleSubmitHover = (qId, val) => {
    setCurrentAnswers(prev => ({ ...prev, [qId]: val }));
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const submitQuiz = async () => {
    setSubmitting(true);
    try {
      const timeTaken = quiz.timeLimit ? (quiz.timeLimit * 60) - timeLeft : null;
      const res = await api.post(`/lms/course-quizzes/${quizId}/attempt`, {
        answers: currentAnswers,
        timeTaken
      });
      setLastResult(res.data.data);
      setTaking('result');
      fetchAttempts();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !quiz) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // INTRO SCREEN
  if (!taking || taking === 'intro') {
    const remainingAttempts = quiz.maxAttempts ? quiz.maxAttempts - attempts.length : null;
    
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 animate-fade-in">
        {/* Hero Section */}
        <div className="relative bg-white rounded-[1.5rem] border border-slate-100 shadow-lg overflow-hidden mb-6 group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-700 opacity-95" />
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative p-8 md:p-10 text-center">
            <div className="mx-auto w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 shadow-inner border border-white/20 group-hover:scale-105 transition-transform duration-500">
              <BrainCircuit size={32} className="text-white" />
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white mb-2 tracking-tight drop-shadow-md">{quiz.title}</h2>
            {quiz.description && <p className="text-indigo-100/90 text-xs md:text-sm max-w-xl mx-auto leading-relaxed font-medium">{quiz.description}</p>}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 hover:border-emerald-200 group">
             <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
               <ShieldCheck size={20} />
             </div>
             <div>
               <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Pass Requirement</p>
               <p className="text-lg font-black text-slate-800">{quiz.passingScore}%</p>
             </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 hover:border-amber-200 group">
             <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">
               <Clock size={20} />
             </div>
             <div>
               <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Time Limit</p>
               <p className="text-lg font-black text-slate-800">{quiz.timeLimit ? `${quiz.timeLimit} Min` : 'None'}</p>
             </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 hover:border-blue-200 group">
             <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
               <RotateCcw size={20} />
             </div>
             <div>
               <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Total Attempts</p>
               <p className="text-lg font-black text-slate-800">{quiz.maxAttempts || 'Unlimited'}</p>
             </div>
          </div>
        </div>

        {/* Action Area */}
        <div className="flex justify-center mb-10">
          {remainingAttempts === 0 ? (
            <div className="bg-rose-50 border border-rose-200 text-rose-600 rounded-xl p-4 flex items-center gap-3 w-full max-w-md shadow-sm">
              <div className="bg-white rounded-full p-1.5 shadow-sm"><AlertCircle size={20} className="text-rose-500" /></div>
              <div>
                <h3 className="font-bold text-sm">No attempts remaining</h3>
                <p className="text-[11px] font-medium text-rose-600/80 mt-0.5">You have exhausted all allowed attempts for this quiz.</p>
              </div>
            </div>
          ) : (
            <button onClick={startQuiz} className="group relative inline-flex items-center justify-center gap-2 bg-slate-900 text-white font-black text-sm px-8 py-3.5 rounded-xl overflow-hidden hover:scale-105 transition-all shadow-lg shadow-slate-900/20 w-full md:w-auto">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative z-10">Start Assessment</span>
              <Play size={16} className="relative z-10" fill="currentColor" />
            </button>
          )}
        </div>

        {/* Previous Attempts */}
        {attempts.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
              <Award className="text-indigo-500" size={20} /> Your Activity History
            </h3>
            <div className="grid gap-3">
              {attempts.map((a, i) => (
                <div key={a.id} className="group flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl hover:bg-white hover:shadow-sm hover:border-indigo-100 transition-all">
                  <div className="flex items-center gap-3 mb-3 md:mb-0">
                    <div className="w-10 h-10 bg-white rounded-lg shadow-sm border border-slate-100 flex items-center justify-center font-black text-slate-400 group-hover:text-indigo-500 transition-colors">
                      #{attempts.length - i}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 mb-0.5">{new Date(a.completedAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      {a.timeTaken !== null && (
                        <p className="text-[10px] font-medium text-slate-500 flex items-center gap-1.5">
                          <Clock size={10} /> Time taken: {Math.floor(a.timeTaken/60)}:{(a.timeTaken%60).toString().padStart(2,'0')}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-200">
                    <div className="text-right">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Score</p>
                      <span className={`text-xl font-black ${a.passed ? 'text-emerald-500' : 'text-rose-500'}`}>{a.score}%</span>
                    </div>
                    <div className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                      a.passed ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'
                    }`}>
                      {a.passed ? 'Passed' : 'Failed'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // QUIZ SCREEN
  if (taking === 'quiz') {
    const currentQ = quiz.questions[currentQuestionIndex];
    const totalQ = quiz.questions?.length || 0;
    const isLastQ = currentQuestionIndex === totalQ - 1;

    return (
      <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in relative pb-32">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 sticky top-4 z-40 shadow-sm flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-800">{quiz.title}</h2>
            <p className="text-xs text-slate-500">{totalQ} Questions</p>
          </div>
          {timeLeft !== null && (
            <div className={`px-4 py-2 rounded-xl font-bold font-mono tracking-wider ${timeLeft < 60 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-slate-100 text-slate-700'}`}>
              <Clock size={16} className="inline mr-2 opacity-50" />
              {formatTime(timeLeft)}
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column - Questions */}
          <div className="flex-1 space-y-6">
            {currentQ && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
                <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Question {currentQuestionIndex + 1} of {totalQ}</span>
                  <span className="text-xs font-bold text-slate-400">{currentQ.points} point{currentQ.points !== 1?'s':''}</span>
                </div>
                <div className="p-6 md:p-8">
                  <p className="text-lg font-semibold text-slate-800 mb-8 leading-relaxed">{currentQ.question}</p>
                  
                  {currentQ.type === 'mcq' && (
                    <div className="space-y-3">
                      {currentQ.options?.map((opt, optIdx) => {
                        const isSelected = String(currentAnswers[currentQ.id]) === String(optIdx);
                        return (
                          <button
                            key={optIdx}
                            onClick={() => handleSubmitHover(currentQ.id, String(optIdx))}
                            className={`w-full text-left p-5 rounded-xl border-2 transition-all flex items-center gap-4 group ${
                              isSelected 
                                ? 'border-indigo-500 bg-indigo-50 text-indigo-900 shadow-[0_0_0_4px_rgba(99,102,241,0.1)]'
                                : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${isSelected ? 'border-indigo-500 bg-indigo-500 scale-110' : 'border-slate-300 group-hover:border-indigo-300'}`}>
                              {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-full animate-zoom-in" />}
                            </div>
                            <span className="text-[15px] font-medium leading-relaxed">{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {currentQ.type === 'true_false' && (
                    <div className="flex gap-4">
                      {['true', 'false'].map((val) => {
                        const isSelected = currentAnswers[currentQ.id] === val;
                        return (
                          <button
                            key={val}
                            onClick={() => handleSubmitHover(currentQ.id, val)}
                            className={`flex-1 p-6 rounded-xl border-2 font-black uppercase tracking-widest text-lg transition-all ${
                              isSelected
                                ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-[0_0_0_4px_rgba(99,102,241,0.1)] scale-[1.02]'
                                : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50 text-slate-500'
                            }`}
                          >
                            {val}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {currentQ.type === 'short' && (
                    <div className="mt-4">
                      <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Your Answer</label>
                      <input
                        type="text"
                        placeholder="Type your answer here..."
                        className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 ring-indigo-50 rounded-xl px-5 py-4 text-slate-800 placeholder-slate-400 transition-all font-medium text-[15px] outline-none"
                        value={currentAnswers[currentQ.id] || ''}
                        onChange={(e) => handleSubmitHover(currentQ.id, e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Palette */}
          <div className="w-full lg:w-80 flex-shrink-0">
             <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sticky top-24">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Target size={18} className="text-indigo-500" /> Question Palette
                </h3>
                
                <div className="grid grid-cols-5 gap-2.5">
                   {quiz.questions?.map((q, idx) => {
                      const isAnswered = currentAnswers[q.id] !== undefined && currentAnswers[q.id] !== '';
                      const isCurrent = currentQuestionIndex === idx;
                      
                      let btnClass = 'border-slate-200 text-slate-500 hover:border-slate-300 bg-white'; // Default unattempted
                      if (isCurrent) {
                        btnClass = 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-4 ring-indigo-500/20';
                      } else if (isAnswered) {
                        btnClass = 'border-emerald-500 bg-emerald-500 text-white shadow-md shadow-emerald-500/20';
                      }

                      return (
                        <button
                          key={idx}
                          onClick={() => setCurrentQuestionIndex(idx)}
                          className={`w-full aspect-square rounded-xl flex items-center justify-center text-sm font-bold transition-all border-2 ${btnClass}`}
                        >
                           {idx + 1}
                        </button>
                      )
                   })}
                </div>
                
                <div className="mt-8 space-y-3 pt-6 border-t border-slate-100">
                   <div className="flex items-center gap-3">
                     <div className="w-5 h-5 rounded-md bg-emerald-500 border-2 border-emerald-500 shadow-sm flex-shrink-0"></div> 
                     <span className="text-xs font-semibold text-slate-600">Answered</span>
                   </div>
                   <div className="flex items-center gap-3">
                     <div className="w-5 h-5 rounded-md bg-white border-2 border-slate-200 shadow-sm flex-shrink-0"></div> 
                     <span className="text-xs font-semibold text-slate-600">Not Answered</span>
                   </div>
                   <div className="flex items-center gap-3">
                     <div className="w-5 h-5 rounded-md bg-indigo-50 border-2 border-indigo-500 flex-shrink-0"></div> 
                     <span className="text-xs font-semibold text-slate-600">Current Question</span>
                   </div>
                </div>
             </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 py-4 px-6 z-40 sm:left-64 sm:right-[300px] lg:right-[340px]">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
               <p className="text-sm font-bold text-slate-500 mr-4">{Object.keys(currentAnswers).length} / {totalQ} answered</p>
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
               <button 
                 onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                 disabled={currentQuestionIndex === 0}
                 className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
               >
                 <ChevronLeft size={18} /> Prev
               </button>
               
               {!isLastQ ? (
                 <button 
                   onClick={() => setCurrentQuestionIndex(prev => Math.min(totalQ - 1, prev + 1))}
                   className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-indigo-50 text-indigo-600 font-bold hover:bg-indigo-100 flex items-center justify-center gap-2 transition-all"
                 >
                   Next <ChevronRight size={18} />
                 </button>
               ) : (
                 <button 
                   onClick={submitQuiz}
                   disabled={submitting}
                   className="flex-1 sm:flex-none btn-primary px-6 py-2.5"
                 >
                   {submitting ? 'Submitting...' : 'Submit Quiz'}
                 </button>
               )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // RESULTS SCREEN
  if (taking === 'result' && lastResult) {
    const { attempt, passed, score, earnedPoints, totalPoints, result } = lastResult;
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-sm mb-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary-500 to-indigo-500" />
          
          <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4 ${passed ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'}`}>
            {passed ? <CheckCircle2 size={40} /> : <XCircle size={40} />}
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-2">{passed ? 'Congratulations!' : 'Keep Practicing'}</h2>
          <p className="text-slate-500 font-medium mb-8">You scored {score}% ({earnedPoints} / {totalPoints} points)</p>
          
          <div className="flex justify-center gap-4">
            <button onClick={() => setTaking('intro')} className="btn-secondary">Back to Details</button>
          </div>
        </div>

        {quiz.showAnswers && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 mb-4 px-2 tracking-tight">Review Answers</h3>
            {quiz.questions?.map((q, idx) => {
              const res = result[q.id];
              const isCorrect = res?.correct;
              const bgColor = isCorrect ? 'bg-emerald-50/50 border-emerald-200' : 'bg-red-50/50 border-red-200';
              const icon = isCorrect ? <CheckCircle2 className="text-emerald-500" size={20}/> : <XCircle className="text-red-500" size={20}/>;

              return (
                <div key={q.id} className={`rounded-2xl border p-5 ${bgColor}`}>
                  <div className="flex gap-4">
                    <div className="pt-1 flex-shrink-0">{icon}</div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900 mb-4">{idx + 1}. {q.question}</p>
                      
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Your Answer</p>
                          <p className={`text-sm font-bold ${isCorrect ? 'text-emerald-700' : 'text-red-700'}`}>
                            {q.type === 'mcq' ? (q.options[res.given] || '—') : String(res.given || '—')}
                          </p>
                        </div>
                        {!isCorrect && (
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Correct Answer</p>
                            <p className="text-sm font-bold text-emerald-700">
                              {q.type === 'mcq' ? q.options[res.correctAnswer] : String(res.correctAnswer)}
                            </p>
                          </div>
                        )}
                      </div>

                      {res.explanation && (
                        <div className="mt-4 p-3 bg-white/60 rounded-xl">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Explanation</p>
                          <p className="text-[13px] text-slate-700">{res.explanation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return null;
}
