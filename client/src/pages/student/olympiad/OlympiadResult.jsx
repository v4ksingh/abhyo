import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Trophy, Award, Target, Clock, BarChart3, ArrowLeft, Download, Star, CheckCircle, XCircle, Minus, Medal } from 'lucide-react';
import api from '../../../lib/api';
import toast from 'react-hot-toast';

const RankCard = ({ label, rank, color }) => (
  <div className={`rounded-2xl p-4 border text-center ${color}`}>
    <p className="text-xs font-semibold opacity-70 mb-1">{label}</p>
    <p className="text-3xl font-black">{rank ? `#${rank}` : 'TBD'}</p>
  </div>
);

const GradeDisplay = ({ grade }) => {
  const cfg = {
    Gold:        { emoji: '🥇', color: 'from-yellow-400 to-amber-500', text: 'text-yellow-900' },
    Silver:      { emoji: '🥈', color: 'from-slate-300 to-slate-400',  text: 'text-slate-800' },
    Bronze:      { emoji: '🥉', color: 'from-orange-400 to-amber-600', text: 'text-orange-900' },
    Distinction: { emoji: '⭐', color: 'from-purple-500 to-indigo-600', text: 'text-white' },
    Merit:       { emoji: '✨', color: 'from-blue-500 to-cyan-600',     text: 'text-white' },
  };
  const g = cfg[grade] || cfg['Merit'];
  return (
    <div className={`bg-gradient-to-br ${g.color} rounded-2xl p-5 text-center`}>
      <div className="text-5xl mb-2">{g.emoji}</div>
      <p className={`text-xl font-black ${g.text}`}>{grade || 'Merit'}</p>
      <p className={`text-sm opacity-80 ${g.text}`}>Grade Achieved</p>
    </div>
  );
};

export default function OlympiadResult() {
  const { olympiadId } = useParams();
  const navigate       = useNavigate();
  const [result,   setResult]   = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    api.get(`/olympiad/student/result/${olympiadId}`)
      .then(r => setResult(r.data.data))
      .catch(() => toast.error('Result not found'))
      .finally(() => setLoading(false));
  }, [olympiadId]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!result) return <div className="text-center py-16 text-slate-400"><Trophy className="w-16 h-16 mx-auto mb-3 opacity-20" /><p>Result not found or not yet published.</p></div>;

  const pct = result.rankPublished ? result.percentile : null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/student/olympiad')} className="p-2 rounded-xl hover:bg-slate-100"><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <h1 className="font-black text-slate-900 text-xl">Your Result</h1>
          <p className="text-slate-500 text-sm">{result.olympiad?.title}</p>
        </div>
        {result.certificate && (
          <button onClick={() => navigate(`/student/olympiad/certificate/${result.certificate.certificateId}`)}
            className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 text-white text-sm font-bold hover:shadow-lg transition-all">
            <Download className="w-4 h-4" /> Certificate
          </button>
        )}
      </div>

      {/* Score Hero */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-7 text-white">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="text-center sm:text-left">
            <p className="text-indigo-200 text-sm mb-1">Total Score</p>
            <p className="text-6xl font-black leading-none">{result.obtainedMarks}</p>
            <p className="text-indigo-200 text-sm mt-1">out of {result.totalMarks}</p>
          </div>
          {result.grade && (
            <div className="sm:ml-auto bg-white/20 backdrop-blur rounded-2xl px-6 py-4 text-center">
              <p className="text-3xl mb-1">{result.grade === 'Gold' ? '🥇' : result.grade === 'Silver' ? '🥈' : result.grade === 'Bronze' ? '🥉' : result.grade === 'Distinction' ? '⭐' : '✨'}</p>
              <p className="font-black text-lg">{result.grade}</p>
              <p className="text-white/70 text-xs">Grade</p>
            </div>
          )}
        </div>
        {/* Progress bar */}
        <div className="mt-5">
          <div className="flex justify-between text-xs text-indigo-200 mb-1">
            <span>Score</span>
            <span>{Math.round((result.obtainedMarks / result.totalMarks) * 100)}%</span>
          </div>
          <div className="h-3 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-1000"
              style={{ width: `${Math.round((result.obtainedMarks / result.totalMarks) * 100)}%` }} />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: CheckCircle, label: 'Correct',   value: result.correctAnswers,  color: 'bg-green-50 border-green-200 text-green-700' },
          { icon: XCircle,     label: 'Wrong',     value: result.wrongAnswers,    color: 'bg-red-50 border-red-200 text-red-600' },
          { icon: Minus,       label: 'Skipped',   value: result.skippedAnswers,  color: 'bg-slate-50 border-slate-200 text-slate-600' },
          { icon: Target,      label: 'Accuracy',  value: `${result.accuracy}%`,  color: 'bg-blue-50 border-blue-200 text-blue-700' },
        ].map(s => (
          <div key={s.label} className={`flex flex-col items-center p-4 rounded-2xl border ${s.color}`}>
            <s.icon className="w-5 h-5 mb-1" />
            <p className="text-2xl font-black">{s.value}</p>
            <p className="text-xs opacity-70">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Time */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3">
        <Clock className="w-5 h-5 text-slate-400" />
        <span className="text-slate-600 text-sm">Time Taken:</span>
        <span className="font-bold text-slate-900">{Math.floor(result.timeTakenSeconds / 60)} min {result.timeTakenSeconds % 60} sec</span>
        {pct !== null && (
          <>
            <div className="ml-auto flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-500" />
              <span className="text-indigo-700 font-black">{pct}th Percentile</span>
            </div>
          </>
        )}
      </div>

      {/* Ranks */}
      {result.rankPublished && (
        <div>
          <h2 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Medal className="w-5 h-5 text-yellow-500" /> Your Rankings
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <RankCard label="National Rank"  rank={result.nationalRank}  color="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200 text-indigo-800" />
            <RankCard label="State Rank"     rank={result.stateRank}     color="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 text-emerald-800" />
            <RankCard label="District Rank"  rank={result.districtRank}  color="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 text-orange-800" />
            <RankCard label="Class Rank"     rank={result.classRank}     color="bg-gradient-to-br from-pink-50 to-rose-50 border-pink-200 text-pink-800" />
          </div>
        </div>
      )}

      {!result.rankPublished && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-center gap-3 text-yellow-700">
          <Trophy className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">Rankings will be published by the administrator after the exam. Check back soon!</p>
        </div>
      )}

      {/* Answer Review */}
      {result.answerReview?.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <button onClick={() => setShowReview(p => !p)}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
            <span className="font-bold text-slate-900">Answer Review ({result.answerReview.length} questions)</span>
            <span className="text-indigo-600 text-sm font-semibold">{showReview ? 'Hide' : 'Show'}</span>
          </button>
          {showReview && (
            <div className="divide-y divide-slate-100">
              {result.answerReview.map((a, i) => (
                <div key={a.qId} className={`px-6 py-3 flex items-center gap-3 ${a.isCorrect ? 'bg-green-50/40' : a.skipped ? '' : 'bg-red-50/40'}`}>
                  <span className="text-xs font-bold text-slate-500 w-6">{i+1}</span>
                  <div className="flex-1">
                    <p className="text-xs text-slate-500">Your answer: <span className={`font-bold ${a.isCorrect ? 'text-green-600' : a.skipped ? 'text-slate-500' : 'text-red-600'}`}>{a.selected || '—'}</span></p>
                    {!a.isCorrect && !a.skipped && <p className="text-xs text-green-600 font-semibold">Correct: {a.correct}</p>}
                  </div>
                  {a.isCorrect  ? <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" /> :
                   a.skipped    ? <Minus className="w-4 h-4 text-slate-400 flex-shrink-0" /> :
                                  <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
