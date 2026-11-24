import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, ArrowRight } from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'react-hot-toast';

export default function StudentResults() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    api.get('/student/results', { params: { page, limit: 20, status: 'completed' } })
      .then(res => { setResults(res.data.data); setTotal(res.data.pagination?.total || 0); })
      .catch(() => toast.error('Failed to load results'))
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="section-header">📊 My Results</h1>
        <p className="section-subheader">{total} completed tests</p>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="skeleton h-20" />)}</div>
      ) : results.length === 0 ? (
        <div className="card text-center py-12">
          <BarChart3 className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <p className="text-slate-500 mb-4">No completed tests yet. Start your first test!</p>
          <Link to="/student/tests" className="btn-primary inline-block">Browse Tests</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {results.map(r => (
            <Link key={r.id} to={`/student/results/${r.id}`}
              className="card flex items-center gap-4 hover:border-primary-500/30 transition-all group cursor-pointer">
              <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0 font-bold
                ${r.accuracy >= 70 ? 'bg-emerald-500/20 text-emerald-400' : r.accuracy >= 50 ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>
                <span className="text-xl">{r.accuracy || 0}%</span>
                <span className="text-xs">acc</span>
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 text-sm truncate group-hover:text-primary-300 transition-colors">{r.test?.title}</p>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                  <span>Score: <strong className="text-slate-900">{r.score}/{r.totalMarks}</strong></span>
                  <span>•</span>
                  <span>{Math.floor((r.timeTaken || 0) / 60)}m taken</span>
                  <span>•</span>
                  <span>{new Date(r.submittedAt || r.createdAt).toLocaleDateString('en-IN')}</span>
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                {r.globalRank && <p className="text-sm font-bold text-amber-400">#{r.globalRank}</p>}
                <p className="text-xs text-slate-500">Rank</p>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-primary-400 transition-colors mt-1 ml-auto" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {total > 20 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary !px-3 !py-1.5 disabled:opacity-40">Prev</button>
          <span className="text-slate-500 text-sm">{page}/{Math.ceil(total / 20)}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page * 20 >= total} className="btn-secondary !px-3 !py-1.5 disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  );
}
