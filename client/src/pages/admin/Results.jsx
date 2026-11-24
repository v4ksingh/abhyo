import React, { useEffect, useState, useCallback } from 'react';
import { ClipboardList, Search, Download, Filter, Eye, X, TrendingUp, Award, Target } from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'react-hot-toast';
import ExportButtons from '../../components/shared/ExportButtons';

const statusColors = {
  completed: 'badge-success',
  'auto-submitted': 'badge-warning',
  in_progress: 'badge-info',
};

const AccuracyBar = ({ value }) => (
  <div className="flex items-center gap-2">
    <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${
          value >= 70 ? 'bg-emerald-500' : value >= 50 ? 'bg-amber-500' : 'bg-red-400'
        }`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
    <span className={`text-xs font-semibold w-10 text-right ${
      value >= 70 ? 'text-emerald-500' : value >= 50 ? 'text-amber-500' : 'text-red-400'
    }`}>{value}%</span>
  </div>
);

export default function AdminResults() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState(null);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 25 };
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/results', { params });
      let data = res.data.data || [];
      if (search) {
        const q = search.toLowerCase();
        data = data.filter(r =>
          r.user?.name?.toLowerCase().includes(q) ||
          r.test?.title?.toLowerCase().includes(q)
        );
      }
      setResults(data);
      setTotal(res.data.pagination?.total || 0);
    } catch {
      toast.error('Failed to load results');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => { fetchResults(); }, [fetchResults]);

  const handleExportCSV = () => {
    const csv = [
      ['Student', 'Email', 'Test', 'Score', 'Total', 'Accuracy', 'Status', 'Date'].join(','),
      ...results.map(r => [
        r.user?.name || '', r.user?.email || '',
        `"${r.test?.title || ''}"`,
        r.score || 0, r.totalMarks || 0,
        `${r.accuracy || 0}%`,
        r.status, new Date(r.submittedAt || r.createdAt).toLocaleDateString('en-IN'),
      ].join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `results-${Date.now()}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success('Results exported!');
  };

  // Summary stats
  const avgAccuracy = results.length
    ? Math.round(results.reduce((sum, r) => sum + (r.accuracy || 0), 0) / results.length)
    : 0;
  const completedCount = results.filter(r => r.status === 'completed').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-header">📊 All Results</h1>
          <p className="section-subheader">Platform-wide test results ({total} total)</p>
        </div>
        <ExportButtons 
          data={results} 
          filename="test_results" 
          title="All Test Results Report" 
          headers={['Student', 'Email', 'Test', 'Score', 'Total', 'Accuracy', 'Status', 'Date']}
          pdfDataMapping={(r) => [
            r.user?.name || '-',
            r.user?.email || '-',
            r.test?.title || '-',
            r.score || 0,
            r.totalMarks || 0,
            `${r.accuracy || 0}%`,
            r.status,
            new Date(r.submittedAt || r.createdAt).toLocaleDateString('en-IN')
          ]}
        />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Results', value: total, icon: ClipboardList, color: 'from-blue-500 to-blue-600' },
          { label: 'Avg Accuracy', value: `${avgAccuracy}%`, icon: Target, color: 'from-emerald-500 to-emerald-600' },
          { label: 'Completed', value: completedCount, icon: Award, color: 'from-purple-500 to-purple-600' },
        ].map(card => (
          <div key={card.label} className="card flex items-center gap-4">
            <div className={`stat-icon bg-gradient-to-br ${card.color}`}>
              <card.icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-slate-500 text-xs">{card.label}</p>
              <p className="text-xl font-bold text-slate-900">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input type="text" placeholder="Search by student name or test..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="input-field !pl-9" />
        </div>
        <div className="flex bg-slate-100 rounded-xl p-1 gap-0.5">
          {[
            { val: '', label: 'All' },
            { val: 'completed', label: 'Completed' },
            { val: 'auto-submitted', label: 'Auto-Submitted' },
          ].map(({ val, label }) => (
            <button key={val} onClick={() => { setStatusFilter(val); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === val ? 'bg-primary-600 text-white' : 'text-slate-500 hover:text-slate-800'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card !p-0 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200">
              {['Student', 'Test', 'Score', 'Accuracy', 'Rank', 'Status', 'Date', 'Action'].map(h => (
                <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="table-row">
                  {[...Array(8)].map((_, j) => <td key={j} className="px-4 py-3"><div className="skeleton h-4 w-16" /></td>)}
                </tr>
              ))
            ) : results.length === 0 ? (
              <tr><td colSpan={8} className="text-center text-slate-400 py-16">
                <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-40" />
                No results found
              </td></tr>
            ) : results.map(r => (
              <tr key={r._id || r.id} className="table-row group">
                <td className="px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{r.user?.name || '—'}</p>
                    <p className="text-xs text-slate-400">{r.user?.email || ''}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-slate-600 max-w-36">
                  <p className="line-clamp-2">{r.test?.title || '—'}</p>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm font-bold text-slate-900">{r.score}</span>
                  <span className="text-xs text-slate-400">/{r.totalMarks}</span>
                </td>
                <td className="px-4 py-3 min-w-28">
                  <AccuracyBar value={r.accuracy || 0} />
                </td>
                <td className="px-4 py-3 text-sm text-primary-500 font-semibold">
                  {r.globalRank ? `#${r.globalRank}` : '—'}
                </td>
                <td className="px-4 py-3">
                  <span className={statusColors[r.status] || 'badge-info'}>
                    {r.status?.replace('-', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                  {new Date(r.submittedAt || r.createdAt).toLocaleDateString('en-IN')}
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => setSelected(r)}
                    className="p-1.5 rounded-lg text-primary-400 hover:bg-primary-500/10 transition-colors opacity-0 group-hover:opacity-100">
                    <Eye size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {total > 25 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
            <p className="text-xs text-slate-500">Showing page {page} of {Math.ceil(total / 25)}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="btn-secondary !px-3 !py-1 !text-xs disabled:opacity-40">Prev</button>
              <button onClick={() => setPage(p => p + 1)} disabled={page * 25 >= total}
                className="btn-secondary !px-3 !py-1 !text-xs disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-900">Result Details</h3>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-slate-100">
                <X size={18} className="text-slate-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                  {selected.user?.name?.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{selected.user?.name}</p>
                  <p className="text-xs text-slate-500">{selected.user?.email}</p>
                </div>
                <span className={`ml-auto ${statusColors[selected.status] || 'badge-info'}`}>
                  {selected.status?.replace('-', ' ')}
                </span>
              </div>

              <div>
                <p className="text-xs text-slate-500 mb-1">Test</p>
                <p className="text-sm font-semibold text-slate-900">{selected.test?.title || '—'}</p>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { label: 'Score', value: `${selected.score}/${selected.totalMarks}`, color: 'text-slate-900' },
                  { label: 'Accuracy', value: `${selected.accuracy}%`, color: selected.accuracy >= 70 ? 'text-emerald-500' : selected.accuracy >= 50 ? 'text-amber-500' : 'text-red-400' },
                  { label: 'Global Rank', value: selected.globalRank ? `#${selected.globalRank}` : 'N/A', color: 'text-primary-500' },
                ].map(m => (
                  <div key={m.label} className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-500">{m.label}</p>
                    <p className={`text-xl font-bold ${m.color}`}>{m.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: 'Correct', value: selected.correctAnswers || 0, color: 'text-emerald-500' },
                  { label: 'Wrong', value: selected.wrongAnswers || 0, color: 'text-red-400' },
                  { label: 'Skipped', value: selected.skippedAnswers || 0, color: 'text-slate-500' },
                  { label: 'Time Taken', value: selected.timeTaken ? `${Math.round(selected.timeTaken / 60)} min` : '—', color: 'text-blue-500' },
                ].map(m => (
                  <div key={m.label} className="flex justify-between p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-500">{m.label}</span>
                    <span className={`font-semibold ${m.color}`}>{m.value}</span>
                  </div>
                ))}
              </div>

              <p className="text-xs text-slate-400 text-center">
                Submitted: {new Date(selected.submittedAt || selected.createdAt).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
