import React, { useEffect, useState } from 'react';
import { BarChart3, Trophy, Award, Download, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../../lib/api';
import toast from 'react-hot-toast';

const GradeBadge = ({ grade }) => ({
  Gold:        <span className="text-xs font-black px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">🥇 Gold</span>,
  Silver:      <span className="text-xs font-black px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">🥈 Silver</span>,
  Bronze:      <span className="text-xs font-black px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">🥉 Bronze</span>,
  Distinction: <span className="text-xs font-black px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">⭐ Distinction</span>,
  Merit:       <span className="text-xs font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">✨ Merit</span>,
}[grade] || <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{grade || '—'}</span>);

export default function OlympiadResults() {
  const [results,   setResults]   = useState([]);
  const [olympiads, setOlympiads] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [publishing,setPublishing]= useState(false);
  const [generating,setGenerating]= useState(false);
  const [filter,    setFilter]    = useState({ olympiadId: '' });

  useEffect(() => {
    api.get('/olympiad/admin/olympiads').then(r => setOlympiads(r.data.data || []));
  }, []);

  useEffect(() => {
    setLoading(true);
    api.get('/olympiad/admin/results', { params: filter })
      .then(r => setResults(r.data.data || []))
      .catch(() => toast.error('Failed'))
      .finally(() => setLoading(false));
  }, [filter]);

  const handlePublishRanks = async () => {
    if (!filter.olympiadId) { toast.error('Select an olympiad to publish ranks'); return; }
    if (!window.confirm('Publish ranks? This will calculate national/state/district ranks for all students.')) return;
    setPublishing(true);
    try {
      const r = await api.post('/olympiad/admin/results/publish-ranks', { olympiadId: filter.olympiadId });
      toast.success(`✅ Ranks published for ${r.data.total} students!`);
      // Refresh
      const res = await api.get('/olympiad/admin/results', { params: filter });
      setResults(res.data.data || []);
    } catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
    finally { setPublishing(false); }
  };

  const handleGenerateCertificates = async () => {
    if (!filter.olympiadId) { toast.error('Select an olympiad first'); return; }
    setGenerating(true);
    try {
      const r = await api.post('/olympiad/admin/certificates/generate-all', { olympiadId: filter.olympiadId });
      toast.success(`🎓 ${r.data.generated} certificates generated!`);
    } catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
    finally { setGenerating(false); }
  };

  const exportCSV = () => {
    const headers = ['National Rank', 'Student', 'State', 'Class', 'Obtained', 'Total', 'Accuracy', 'Grade', 'Percentile'];
    const rows = results.map(r => [r.nationalRank||'—', r.student?.name, r.studentState, `Class ${r.studentClass}`, r.obtainedMarks, r.totalMarks, `${r.accuracy}%`, r.grade||'—', `${r.percentile}%`]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'olympiad_results.csv'; a.click();
  };

  const isPublished = results.some(r => r.rankPublished);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-600" /> Results & Rankings
          </h1>
          <p className="text-slate-500 text-sm">{results.length} results</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50">
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={handleGenerateCertificates} disabled={generating || !isPublished}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-purple-200 text-purple-700 text-sm font-semibold hover:bg-purple-50 disabled:opacity-50">
            <Award className="w-4 h-4" /> {generating ? 'Generating...' : 'Generate Certificates'}
          </button>
          <button onClick={handlePublishRanks} disabled={publishing}
            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg disabled:opacity-60 transition-all">
            <Trophy className="w-4 h-4" /> {publishing ? 'Publishing...' : 'Publish Ranks'}
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex gap-3">
        <select value={filter.olympiadId} onChange={e => setFilter({ olympiadId: e.target.value })}
          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">All Olympiads</option>
          {olympiads.map(o => <option key={o.id} value={o.id}>{o.title}</option>)}
        </select>
        {isPublished && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm font-semibold">
            <CheckCircle className="w-4 h-4" /> Ranks Published
          </div>
        )}
        {!isPublished && results.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm">
            <AlertCircle className="w-4 h-4" /> Ranks not yet published
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 flex justify-center"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : !results.length ? (
          <div className="py-16 text-center text-slate-400"><BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No results found</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {['Rank', 'Student', 'Class', 'Score', 'Correct/Wrong/Skip', 'Accuracy', 'Time', 'Percentile', 'Grade'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.map((r, i) => (
                  <tr key={r.id} className={`hover:bg-slate-50 transition-colors ${i < 3 && r.rankPublished ? 'bg-gradient-to-r from-yellow-50/40' : ''}`}>
                    <td className="px-4 py-3">
                      <span className={`text-lg font-black ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-slate-400' : i === 2 ? 'text-orange-500' : 'text-slate-700'}`}>
                        {r.nationalRank ? `#${r.nationalRank}` : `#${i+1}`}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900 text-sm">{r.student?.name}</p>
                      <p className="text-xs text-slate-400">{r.studentState} · {r.student?.email}</p>
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-slate-700">Class {r.studentClass}</td>
                    <td className="px-4 py-3">
                      <span className="font-black text-slate-900">{r.obtainedMarks}</span>
                      <span className="text-slate-400 text-xs">/{r.totalMarks}</span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="text-green-600 font-bold">{r.correctAnswers}✓</span>
                      {' · '}
                      <span className="text-red-500 font-bold">{r.wrongAnswers}✗</span>
                      {' · '}
                      <span className="text-slate-400">{r.skippedAnswers}–</span>
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-slate-700">{r.accuracy}%</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{Math.floor(r.timeTakenSeconds/60)}m {r.timeTakenSeconds%60}s</td>
                    <td className="px-4 py-3 text-sm font-bold text-indigo-600">{r.percentile}%</td>
                    <td className="px-4 py-3"><GradeBadge grade={r.grade} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
