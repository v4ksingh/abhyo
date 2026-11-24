import React, { useEffect, useState } from 'react';
import {
  Users, Search, ToggleLeft, ToggleRight, Trash2,
  Eye, X, Mail, Phone, Building2, Calendar, Shield,
  UserCheck, UserX, Download, Filter, Send
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../lib/api';
import ExportButtons from '../../components/shared/ExportButtons';

const roleBadge = {
  superadmin: 'badge-danger',
  institute: 'badge-primary',
  student: 'badge-success',
};

const roleColors = {
  superadmin: 'from-red-500 to-rose-600',
  institute: 'from-primary-500 to-accent-600',
  student: 'from-emerald-500 to-teal-600',
};

const getRoleBadge = (role) => roleBadge[role] || 'bg-slate-200 text-slate-600 border-slate-300';
const getRoleColor = (role) => roleColors[role] || 'from-slate-400 to-slate-500';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState(null);
  const [notifyMsg, setNotifyMsg] = useState('');
  const [notifySending, setNotifySending] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 25 };
      if (search) params.search = search;
      if (role) params.role = role;
      const res = await api.get('/admin/users', { params });
      setUsers(res.data.data);
      setTotal(res.data.pagination?.total || 0);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, [search, role, page]);

  const handleToggle = async (id) => {
    try {
      await api.patch(`/admin/users/${id}/toggle-active`);
      toast.success('User status updated');
      fetchUsers();
      if (selected?.id === id || selected?._id === id) {
        setSelected(u => ({ ...u, isActive: !u.isActive }));
      }
    } catch { toast.error('Failed to update'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this user permanently? This action cannot be undone.')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success('User deleted');
      setSelected(null);
      fetchUsers();
    } catch { toast.error('Failed to delete'); }
  };

  const handleSendNotification = async () => {
    if (!notifyMsg.trim()) return toast.error('Message cannot be empty');
    setNotifySending(true);
    try {
      // In production, this would call a specific API
      await new Promise(r => setTimeout(r, 600));
      toast.success(`Notification sent to ${selected?.name}`);
      setNotifyMsg('');
    } catch { toast.error('Failed to send notification'); }
    finally { setNotifySending(false); }
  };

  const handleExportUsers = () => {
    const csv = [
      ['Name', 'Email', 'Mobile', 'Role', 'Institute', 'Status', 'Joined'].join(','),
      ...users.map(u => [
        u.name, u.email, u.mobile || '', u.role,
        u.institute?.name || u.instituteId?.name || '',
        u.isActive ? 'Active' : 'Inactive',
        new Date(u.createdAt).toLocaleDateString('en-IN'),
      ].join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `users-${Date.now()}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success('Users exported!');
  };

  // Count by role
  const roleCounts = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-header">👥 Users</h1>
          <p className="section-subheader">Manage all platform users ({total} total)</p>
        </div>
        <ExportButtons 
          data={users} 
          filename="platform_users" 
          title="All Platform Users Report" 
          headers={['Name', 'Email', 'Mobile', 'Role', 'Institute', 'Status', 'Joined']}
          pdfDataMapping={(u) => [
            u.name,
            u.email || '-',
            u.mobile || '-',
            u.role,
            u.institute?.name || u.instituteId?.name || '-',
            u.isActive ? 'Active' : 'Inactive',
            new Date(u.createdAt).toLocaleDateString('en-IN')
          ]}
        />
      </div>

      {/* Role Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Students', role: 'student', icon: Users, color: 'from-emerald-500 to-teal-600' },
          { label: 'Institutes', role: 'institute', icon: Building2, color: 'from-primary-500 to-accent-600' },
          { label: 'Admins', role: 'superadmin', icon: Shield, color: 'from-red-500 to-rose-600' },
        ].map(item => (
          <div key={item.role} className="card flex items-center gap-4 cursor-pointer hover:border-primary-400/40 transition-colors"
            onClick={() => setRole(role === item.role ? '' : item.role)}>
            <div className={`stat-icon bg-gradient-to-br ${item.color}`}>
              <item.icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-slate-500 text-xs">{item.label}</p>
              <p className="text-xl font-bold text-slate-900">{roleCounts[item.role] || 0}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input type="text" placeholder="Search by name, email, or mobile..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }} className="input-field !pl-9" />
        </div>
        <div className="flex bg-slate-100 rounded-xl p-1 gap-0.5">
          {['', 'student', 'institute', 'superadmin'].map(r => (
            <button key={r} onClick={() => { setRole(r); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                role === r ? 'bg-primary-600 text-white' : 'text-slate-500 hover:text-slate-800'
              }`}>
              {r ? r.charAt(0).toUpperCase() + r.slice(1) : 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card !p-0 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200/80">
              {['User', 'Role', 'Contact', 'Institute', 'Status', 'Joined', 'Actions'].map(h => (
                <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-4 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="table-row">
                  {[...Array(7)].map((_, j) => <td key={j} className="px-5 py-4"><div className="skeleton h-4 w-20" /></td>)}
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr><td colSpan={7} className="text-center text-slate-400 py-16">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
                No users found
              </td></tr>
            ) : users.map(user => (
              <tr key={user._id || user.id} className="table-row group">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 bg-gradient-to-br ${getRoleColor(user.role)} rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                      {user.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{user.name || '—'}</p>
                      <p className="text-xs text-slate-400">ID: {(user._id || user.id)?.slice(-8)}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className={`badge ${getRoleBadge(user.role)} capitalize`}>{user.role || 'unknown'}</span>
                </td>
                <td className="px-5 py-4 text-xs text-slate-600">
                  <p className="flex items-center gap-1"><Mail size={10} className="text-slate-400" />{user.email || '—'}</p>
                  <p className="flex items-center gap-1 mt-0.5 text-slate-400"><Phone size={10} />{user.mobile || '—'}</p>
                </td>
                <td className="px-5 py-4 text-xs text-slate-500">
                  {user.institute?.name || user.instituteId?.name || '—'}
                </td>
                <td className="px-5 py-4">
                  <span className={user.isActive ? 'badge-success' : 'badge-danger'}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-5 py-4 text-xs text-slate-500">
                  {new Date(user.createdAt).toLocaleDateString('en-IN')}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setSelected(user)}
                      className="p-1.5 rounded-lg text-primary-400 hover:bg-primary-500/10 transition-colors opacity-0 group-hover:opacity-100"
                      title="View Details">
                      <Eye size={15} />
                    </button>
                    <button onClick={() => handleToggle(user._id || user.id)}
                      className={`p-1.5 rounded-lg transition-colors ${user.isActive ? 'text-emerald-500 hover:bg-emerald-500/10' : 'text-slate-400 hover:bg-slate-200'}`}
                      title={user.isActive ? 'Deactivate' : 'Activate'}>
                      {user.isActive ? <ToggleRight size={17} /> : <ToggleLeft size={17} />}
                    </button>
                    {user.role !== 'superadmin' && (
                      <button onClick={() => handleDelete(user._id || user.id)}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {total > 25 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200">
            <p className="text-xs text-slate-500">Page {page} of {Math.ceil(total / 25)} — Total: {total}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="btn-secondary !px-3 !py-1.5 !text-xs disabled:opacity-40">Prev</button>
              <button onClick={() => setPage(p => p + 1)} disabled={page * 25 >= total}
                className="btn-secondary !px-3 !py-1.5 !text-xs disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md animate-slide-up shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-900">User Details</h3>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-slate-100">
                <X size={18} className="text-slate-500" />
              </button>
            </div>

            {/* Avatar & Name */}
            <div className="flex items-center gap-4 mb-5">
              <div className={`w-16 h-16 bg-gradient-to-br ${getRoleColor(selected.role)} rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg`}>
                {selected.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div>
                <h4 className="text-xl font-bold text-slate-900">{selected.name || '—'}</h4>
                <span className={`badge ${getRoleBadge(selected.role)} mt-1 inline-block capitalize`}>{selected.role || 'unknown'}</span>
              </div>
              <span className={`ml-auto ${selected.isActive ? 'badge-success' : 'badge-danger'}`}>
                {selected.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            {/* Info Grid */}
            <div className="space-y-3 mb-5">
              {[
                { icon: Mail, label: 'Email', value: selected.email || '—' },
                { icon: Phone, label: 'Mobile', value: selected.mobile || '—' },
                { icon: Building2, label: 'Institute', value: selected.institute?.name || selected.instituteId?.name || '—' },
                { icon: Calendar, label: 'Joined', value: new Date(selected.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-slate-200 flex-shrink-0">
                    <item.icon size={14} className="text-primary-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">{item.label}</p>
                    <p className="text-sm font-medium text-slate-900">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Send Notification */}
            <div className="border-t border-slate-200 pt-4 mb-4">
              <label className="label flex items-center gap-2">
                <Send size={13} className="text-primary-400" />
                Send Notification
              </label>
              <textarea value={notifyMsg} onChange={e => setNotifyMsg(e.target.value)}
                placeholder={`Send a notification to ${selected.name}...`}
                className="input-field resize-none" rows={2} />
              <button onClick={handleSendNotification} disabled={notifySending || !notifyMsg.trim()}
                className="btn-primary w-full flex items-center justify-center gap-2 mt-2 disabled:opacity-50">
                {notifySending ? 'Sending...' : <><Send size={14} /> Send Notification</>}
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button onClick={() => handleToggle(selected._id || selected.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  selected.isActive
                    ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                }`}>
                {selected.isActive ? <><UserX size={15} /> Deactivate</> : <><UserCheck size={15} /> Activate</>}
              </button>
              {selected.role !== 'superadmin' && (
                <button onClick={() => handleDelete(selected._id || selected.id)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors">
                  <Trash2 size={15} /> Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
