import React, { useEffect, useState } from 'react';
import { Trophy, Medal } from 'lucide-react';
import api from '../../lib/api';

export default function Leaderboard() {
  const [results, setResults] = useState([]);
  const [tests, setTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState('');
  const [scope, setScope] = useState('global');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/tests', { params: { limit: 50 } }).then(res => {
      setTests(res.data.data);
      if (res.data.data.length > 0) setSelectedTest(res.data.data[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedTest) return;
    setLoading(true);
    api.get('/student/leaderboard', { params: { testId: selectedTest, scope } })
      .then(res => setResults(res.data.data))
      .finally(() => setLoading(false));
  }, [selectedTest, scope]);

  const rankIcon = (i) => {
    if (i === 0) return '🥇';
    if (i === 1) return '🥈';
    if (i === 2) return '🥉';
    return `#${i + 1}`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="section-header">🏆 Leaderboard</h1>
        <p className="section-subheader">Top performers for each test</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <select value={selectedTest} onChange={e => setSelectedTest(e.target.value)} className="input-field flex-1 min-w-48">
          <option value="">Select Test</option>
          {tests.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
        </select>
        <div className="flex bg-slate-100 rounded-xl p-1">
          {['global', 'institute'].map(s => (
            <button key={s} onClick={() => setScope(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${scope === s ? 'bg-primary-600 text-white' : 'text-slate-500'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(10)].map((_, i) => <div key={i} className="skeleton h-16" />)}</div>
      ) : results.length === 0 ? (
        <div className="card text-center py-12">
          <Trophy className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <p className="text-slate-500">No results yet for this test</p>
        </div>
      ) : (
        <div className="space-y-2">
          {results.map((r, i) => (
            <div key={r.id}
              className={`card flex items-center gap-4 !py-3 transition-all
                ${i === 0 ? 'border-amber-500/30 bg-amber-500/5' : i === 1 ? 'border-gray-400/20' : i === 2 ? 'border-amber-700/20' : ''}`}>
              <div className="w-10 text-center text-xl font-bold flex-shrink-0">
                {rankIcon(i)}
              </div>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-slate-900 font-semibold text-sm
                bg-gradient-to-br from-primary-500 to-accent-500 flex-shrink-0`}>
                {r.user?.name?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 text-sm">{r.user?.name}</p>
                {r.institute && <p className="text-xs text-slate-500">{r.institute?.name}</p>}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-bold text-slate-900">{r.score}</p>
                <p className="text-xs text-slate-500">{r.accuracy}% acc</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-slate-500">{Math.floor((r.timeTaken || 0) / 60)}m</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
