import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Plus, Edit2, Trash2, Eye, Search, Filter, CheckCircle, XCircle, Calendar, Clock } from 'lucide-react';
import api from '../../../lib/api';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['all', 'draft', 'open', 'closed', 'ongoing', 'completed', 'cancelled'];

const StatusBadge = ({ status }) => {
  const cfg = {
    draft:     { cls: 'bg-slate-100 text-slate-600', label: 'Draft' },
    open:      { cls: 'bg-green-100 text-green-700', label: 'Open' },
    closed:    { cls: 'bg-yellow-100 text-yellow-700', label: 'Closed' },
    ongoing:   { cls: 'bg-blue-100 text-blue-700',  label: 'Ongoing' },
    completed: { cls: 'bg-purple-100 text-purple-700', label: 'Completed' },
    cancelled: { cls: 'bg-red-100 text-red-700',    label: 'Cancelled' },
  };
  const { cls, label } = cfg[status] || cfg.draft;
  return <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cls}`}>{label}</span>;
};

export default function OlympiadList() {
  const navigate   = useNavigate();
  const [olympiads, setOlympiads] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [status,    setStatus]    = useState('all');
  const [deleting,  setDeleting]  = useState(null);

  const fetchOlympiads = async () => {
    setLoading(true);
    try {
      const params = {};
      if (status !== 'all') params.status = status;
      const r = await api.get('/olympiad/admin/olympiads', { params });
      setOlympiads(r.data.data || []);
    } catch { toast.error('Failed to load olympiads'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOlympiads(); }, [status]);

  const handleDelete = async (id, title) => {
    const name = title ? `"${title}"` : 'this olympiad';
    if (!window.confirm(`Are you sure you want to delete ${name}? This will permanently remove the olympiad and its related records. This action cannot be undone.`)) return;
    setDeleting(id);
    try {
      await api.delete(`/olympiad/admin/olympiads/${id}`);
      toast.success('Olympiad deleted successfully');
      fetchOlympiads();
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to delete olympiad'); }
    finally { setDeleting(null); }
  };

  const handlePublish = async (id, newStatus) => {
    try {
      await api.put(`/olympiad/admin/olympiads/${id}`, { status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
      fetchOlympiads();
    } catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
  };

  const filtered = olympiads.filter(o =>
    o.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <Trophy className="w-6 h-6 text-indigo-600" />
            Olympiads
          </h1>
          <p className="text-slate-500 text-sm mt-1">{olympiads.length} olympiad(s) total</p>
        </div>
        <button
          onClick={() => navigate('/admin/olympiad/new')}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" /> Create Olympiad
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search olympiads..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUS_OPTIONS.map(s => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${status === s ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 flex justify-center">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">No olympiads found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {['Title', 'Subject', 'Exam Date', 'Duration', 'Fee', 'Registrations', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(o => (
                  <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900 max-w-[200px] truncate">{o.title}</p>
                      <p className="text-xs text-slate-400">Reg: {o.registrationStartDate} – {o.registrationEndDate}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-lg text-xs font-bold" style={{ background: (o.subject?.color || '#6366f1') + '20', color: o.subject?.color || '#6366f1' }}>
                        {o.subject?.name || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {o.examDate ? new Date(o.examDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">{o.examDurationMinutes} min</td>
                    <td className="px-4 py-3 text-sm font-bold text-emerald-600">₹{o.registrationFee}</td>
                    <td className="px-4 py-3 text-sm font-bold text-slate-900">{o.totalRegistrations || 0}</td>
                    <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => window.open(`/olympiad/${o.id}`, '_blank')}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors" title="View Public Detail Page">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => navigate(`/admin/olympiad/edit/${o.id}`)}
                          className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600 transition-colors" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {o.status === 'draft' && (
                          <button onClick={() => handlePublish(o.id, 'open')}
                            className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 transition-colors" title="Publish">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => handleDelete(o.id, o.title)} disabled={deleting === o.id}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors" title="Delete Olympiad">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
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
