import React, { useEffect, useState } from 'react';
import {
  UserCog, Plus, Trash2, Edit3, X, Save, Eye, EyeOff,
  Shield, Calculator, BookOpen, GraduationCap, RefreshCw,
  CheckCircle2, Mail, Phone, Lock, Users
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../lib/api';

const ROLES = [
  {
    value: 'admin',
    label: 'Admin',
    description: 'Manage users, institutes, dashboard — cannot access financials or settings',
    icon: Shield,
    color: 'from-blue-500 to-indigo-600',
    badge: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  {
    value: 'accountant',
    label: 'Accountant',
    description: 'View revenue reports and transactions only',
    icon: Calculator,
    color: 'from-emerald-500 to-teal-600',
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
  {
    value: 'content_manager',
    label: 'Content Manager',
    description: 'Create/edit questions, tests, exam series, and CMS pages',
    icon: BookOpen,
    color: 'from-amber-500 to-orange-500',
    badge: 'bg-amber-100 text-amber-700 border-amber-200',
  },
  {
    value: 'teacher',
    label: 'Teacher',
    description: 'Upload and manage questions in the question bank only',
    icon: GraduationCap,
    color: 'from-purple-500 to-violet-600',
    badge: 'bg-purple-100 text-purple-700 border-purple-200',
  },
];

const getRoleInfo = (role) => ROLES.find(r => r.value === role) || {
  label: role, icon: Users, color: 'from-slate-400 to-slate-500', badge: 'bg-slate-100 text-slate-600 border-slate-200'
};

const emptyForm = { name: '', email: '', mobile: '', role: 'admin', password: '' };

export default function AdminStaff() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // null = create, id = edit
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/staff');
      setStaff(res.data.data || []);
    } catch {
      toast.error('Failed to load staff');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStaff(); }, []);

  const openCreate = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setShowPass(false);
    setShowModal(true);
  };

  const openEdit = (member) => {
    setEditTarget(member.id);
    setForm({ name: member.name, email: member.email, mobile: member.mobile || '', role: member.role, password: '' });
    setShowPass(false);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.email || !form.role) return toast.error('Name, email, and role are required');
    if (!editTarget && !form.password) return toast.error('Password is required for new staff');
    setSaving(true);
    try {
      if (editTarget) {
        await api.put(`/admin/staff/${editTarget}`, form);
        toast.success('Staff updated ✅');
      } else {
        await api.post('/admin/staff', form);
        toast.success('Staff account created! 🎉');
      }
      setShowModal(false);
      fetchStaff();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this staff member? They will lose all admin access immediately.')) return;
    setDeleting(id);
    try {
      await api.delete(`/admin/staff/${id}`);
      toast.success('Staff removed');
      fetchStaff();
    } catch {
      toast.error('Failed to remove');
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleActive = async (member) => {
    try {
      await api.put(`/admin/staff/${member.id}`, { isActive: !member.isActive });
      toast.success(member.isActive ? 'Account deactivated' : 'Account activated');
      fetchStaff();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const roleCounts = staff.reduce((acc, m) => { acc[m.role] = (acc[m.role] || 0) + 1; return acc; }, {});

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-header flex items-center gap-2">
            <UserCog className="text-primary-500" size={28} /> Staff Management
          </h1>
          <p className="section-subheader">Manage platform staff accounts and their access levels</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Staff Member
        </button>
      </div>

      {/* Role Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {ROLES.map(r => {
          const count = roleCounts[r.value] || 0;
          return (
            <div key={r.value} className="card flex items-center gap-4 hover:border-primary-400/30 transition-colors">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${r.color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                <r.icon size={20} className="text-white" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">{r.label}</p>
                <p className="text-2xl font-black text-slate-800">{count}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Access Matrix */}
      <div className="card">
        <h2 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2"><Shield size={15} className="text-primary-400"/>Role Access Matrix</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-slate-400 font-semibold py-2 pr-4 uppercase tracking-wider">Feature</th>
                {ROLES.map(r => (
                  <th key={r.value} className="text-center text-slate-500 font-semibold py-2 px-3 uppercase tracking-wider">{r.label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {[
                { label: 'Dashboard', admin: true, accountant: false, content_manager: false, teacher: false },
                { label: 'Users & Institutes', admin: true, accountant: false, content_manager: false, teacher: false },
                { label: 'Revenue & Transactions', admin: true, accountant: true, content_manager: false, teacher: false },
                { label: 'Tests & Exam Series', admin: true, accountant: false, content_manager: true, teacher: false },
                { label: 'Question Bank', admin: true, accountant: false, content_manager: true, teacher: true },
                { label: 'Plans & Subscriptions', admin: false, accountant: false, content_manager: false, teacher: false },
                { label: 'System Settings', admin: false, accountant: false, content_manager: false, teacher: false },
              ].map(row => (
                <tr key={row.label} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-2.5 pr-4 text-slate-600 font-medium">{row.label}</td>
                  {ROLES.map(r => (
                    <td key={r.value} className="text-center py-2.5 px-3">
                      {row[r.value]
                        ? <CheckCircle2 size={14} className="text-emerald-500 mx-auto" />
                        : <span className="w-3.5 h-0.5 bg-slate-200 rounded-full inline-block" />}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-slate-400 mt-3">* Superadmin always has full access to all features.</p>
      </div>

      {/* Staff List */}
      <div className="card !p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-800 text-sm">All Staff Members ({staff.length})</h2>
        </div>
        {loading ? (
          <div className="space-y-0">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-slate-50">
                <div className="skeleton w-10 h-10 rounded-xl" />
                <div className="flex-1 space-y-2"><div className="skeleton h-3 w-40" /><div className="skeleton h-3 w-24" /></div>
              </div>
            ))}
          </div>
        ) : staff.length === 0 ? (
          <div className="py-20 text-center">
            <UserCog size={40} className="mx-auto mb-3 text-slate-300" />
            <p className="text-slate-400 font-medium">No staff members yet</p>
            <p className="text-slate-400 text-sm">Add your first staff member to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {staff.map(member => {
              const ri = getRoleInfo(member.role);
              return (
                <div key={member.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 px-5 py-4 hover:bg-slate-50/60 transition-colors group">
                  {/* Avatar */}
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${ri.color} flex items-center justify-center text-white font-black text-base flex-shrink-0 shadow-sm`}>
                    {member.name?.charAt(0)?.toUpperCase()}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="font-semibold text-slate-900 text-sm">{member.name}</p>
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${ri.badge}`}>{ri.label}</span>
                      {!member.isActive && <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">Inactive</span>}
                    </div>
                    <div className="flex items-center gap-4 flex-wrap text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Mail size={10} />{member.email}</span>
                      {member.mobile && <span className="flex items-center gap-1"><Phone size={10} />{member.mobile}</span>}
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleToggleActive(member)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        member.isActive ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      }`}>
                      {member.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onClick={() => openEdit(member)}
                      className="p-2 rounded-lg text-primary-500 hover:bg-primary-50 border border-transparent hover:border-primary-200 transition-colors">
                      <Edit3 size={14} />
                    </button>
                    <button onClick={() => handleDelete(member.id)} disabled={deleting === member.id}
                      className="p-2 rounded-lg text-red-400 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors">
                      {deleting === member.id ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content !max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <UserCog size={18} className="text-primary-500" />
                {editTarget ? 'Edit Staff Member' : 'Add Staff Member'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100">
                <X size={18} className="text-slate-500" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Role Selector */}
              <div>
                <label className="label">Role</label>
                <div className="grid grid-cols-2 gap-2">
                  {ROLES.map(r => (
                    <button key={r.value} type="button" onClick={() => set('role', r.value)}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border-2 text-left transition-all ${
                        form.role === r.value ? 'border-primary-400 bg-primary-50' : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}>
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${r.color} flex items-center justify-center flex-shrink-0`}>
                        <r.icon size={15} className="text-white" />
                      </div>
                      <div>
                        <p className={`text-xs font-bold ${form.role === r.value ? 'text-primary-700' : 'text-slate-700'}`}>{r.label}</p>
                      </div>
                    </button>
                  ))}
                </div>
                {form.role && (
                  <p className="text-[11px] text-slate-500 mt-2 px-1">{ROLES.find(r => r.value === form.role)?.description}</p>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="label">Full Name</label>
                <input value={form.name} onChange={e => set('name', e.target.value)} className="input-field" placeholder="e.g. Ravi Sharma" />
              </div>

              {/* Email */}
              <div>
                <label className="label">Email Address</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className="input-field !pl-9" placeholder="staff@example.com" />
                </div>
              </div>

              {/* Mobile */}
              <div>
                <label className="label">Mobile <span className="text-slate-400 font-normal">(optional)</span></label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input value={form.mobile} onChange={e => set('mobile', e.target.value)} className="input-field !pl-9" placeholder="+91 98765 43210" />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="label">
                  {editTarget ? 'New Password' : 'Password'}
                  {editTarget && <span className="text-slate-400 font-normal ml-1">(leave blank to keep current)</span>}
                </label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type={showPass ? 'text' : 'password'} value={form.password}
                    onChange={e => set('password', e.target.value)}
                    className="input-field !pl-9 !pr-10"
                    placeholder={editTarget ? '••••••••' : 'Min 8 characters'} />
                  <button type="button" onClick={() => setShowPass(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                {saving ? 'Saving...' : editTarget ? 'Save Changes' : 'Create Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
