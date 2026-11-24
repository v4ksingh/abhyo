import React, { useState, useEffect } from 'react';
import api from '../../../lib/api';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, PowerOff, CheckCircle2, ArrowDownRight, User } from 'lucide-react';

export default function StaffDirectory({ disabled = false, isERPMode = false }) {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', mobile: '', departmentId: '', designationId: '', salary: '', joiningDate: '' });
  const [editingId, setEditingId] = useState(null);

  const fetchData = async () => {
    try {
      const [resStaff, resDept, resDesig] = await Promise.all([
        api.get(`/hr/staff?isDisabled=${disabled}`),
        api.get('/hr/departments'),
        api.get('/hr/designations'),
      ]);
      setStaff(resStaff.data.data);
      setDepartments(resDept.data.data);
      setDesignations(resDesig.data.data);
    } catch (e) { toast.error('Failed to fetch data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [disabled]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/hr/staff/${editingId}`, form);
        toast.success('Updated');
      } else {
        await api.post('/hr/staff', form);
        toast.success('Created');
      }
      setShowModal(false);
      fetchData();
    } catch (e) { toast.error(e.response?.data?.error || 'Error'); }
  };

  const toggleStatus = async (id) => {
    if (!confirm('Toggle staff active status?')) return;
    try {
      await api.put(`/hr/staff/${id}/toggle-status`);
      toast.success('Status updated');
      fetchData();
    } catch (e) { toast.error('Error'); }
  };

  const del = async (id) => {
    if (!confirm('Delete staff completely?')) return;
    try {
      await api.delete(`/hr/staff/${id}`);
      toast.success('Deleted');
      fetchData();
    } catch (e) { toast.error('Error deleting'); }
  };

  const openAdd = () => { setForm({ name: '', email: '', mobile: '', departmentId: '', designationId: '', salary: '', joiningDate: '' }); setEditingId(null); setShowModal(true); };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className={isERPMode ? "space-y-4" : "space-y-6"}>
      {!isERPMode && (
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-900">{disabled ? 'Disabled Staff' : 'Staff Directory'}</h1>
          {!disabled && <button onClick={openAdd} className="btn-primary flex items-center gap-2"><Plus size={18} /> Add Staff</button>}
        </div>
      )}

      {isERPMode && (
        <div className="flex justify-between items-center bg-white border border-slate-200 px-4 py-2 rounded shadow-sm">
          <div className="flex gap-4 items-center">
            <span className="text-sm font-bold text-slate-800 flex items-center gap-2"><User size={16} /> Staff Directory</span>
            <select className="text-xs border border-slate-200 rounded px-2 py-1 bg-slate-50 text-slate-600 focus:outline-none">
              <option value="all">All Departments</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          {!disabled && (
            <button onClick={openAdd} className="px-3 py-1.5 bg-slate-800 text-white hover:bg-slate-700 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors">
              <Plus size={13} /> Add Staff
            </button>
          )}
        </div>
      )}

      {isERPMode ? (
        <div className="bg-white border border-slate-200 shadow-sm rounded overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500">
                  <th className="p-3 font-bold border-r border-slate-200">Staff Info</th>
                  <th className="p-3 font-bold border-r border-slate-200">Dept & Designation</th>
                  <th className="p-3 font-bold border-r border-slate-200">Contact</th>
                  <th className="p-3 font-bold border-r border-slate-200">Status</th>
                  <th className="p-3 font-bold text-right w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staff.map(s => (
                  <tr key={s.id} className={`hover:bg-blue-50/30 transition-colors group ${s.isDisabled ? 'opacity-70' : ''}`}>
                    <td className="p-3 border-r border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-xs uppercase">
                          {s.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{s.name}</p>
                          <p className="text-[10px] text-slate-500 font-mono">{s.employeeCode || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 border-r border-slate-100">
                      <p className="text-xs font-semibold text-slate-700">{s.department?.name || '-'}</p>
                      <p className="text-[10px] text-slate-500">{s.designation?.name || '-'}</p>
                    </td>
                    <td className="p-3 border-r border-slate-100">
                      <p className="text-xs text-slate-700">{s.mobile || '-'}</p>
                      <p className="text-[10px] text-slate-500">{s.email || '-'}</p>
                    </td>
                    <td className="p-3 border-r border-slate-100">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${s.isDisabled ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                        {s.isDisabled ? 'Disabled' : 'Active'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => {setForm({...s, departmentId: s.departmentId || '', designationId: s.designationId || ''}); setEditingId(s.id); setShowModal(true);}} className="p-1.5 rounded border border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors" title="Edit"><Edit size={12} /></button>
                        <button onClick={() => toggleStatus(s.id)} className={`p-1.5 rounded border ${s.isDisabled ? 'border-emerald-200 bg-emerald-50 text-emerald-600' : 'border-orange-200 bg-orange-50 text-orange-500'} hover:opacity-80 transition-colors`} title={s.isDisabled ? "Enable" : "Disable"}><PowerOff size={12} /></button>
                        <button onClick={() => del(s.id)} className="p-1.5 rounded border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 transition-colors" title="Delete"><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {staff.length === 0 && (
                  <tr><td colSpan="5" className="py-16 text-center text-xs text-slate-400">No staff found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {staff.map(s => (
            <div key={s.id} className={`card p-5 border-t-4 ${s.isDisabled ? 'border-t-slate-400' : 'border-t-indigo-500'}`}>
              <div className="flex justify-between items-start">
                <div className="flex gap-3 items-center">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-lg">
                    {s.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 leading-tight">{s.name}</h3>
                    <p className="text-xs text-slate-500">{s.employeeCode}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => {setForm({...s, departmentId: s.departmentId || '', designationId: s.designationId || ''}); setEditingId(s.id); setShowModal(true);}} className="text-blue-500 p-1"><Edit size={16} /></button>
                  <button onClick={() => toggleStatus(s.id)} className={`${s.isDisabled ? 'text-green-500' : 'text-orange-500'} p-1`} title={s.isDisabled ? "Enable" : "Disable"}><PowerOff size={16} /></button>
                  <button onClick={() => del(s.id)} className="text-red-500 p-1"><Trash2 size={16} /></button>
                </div>
              </div>
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <p><span className="font-medium">Dept:</span> {s.department?.name || '-'}</p>
                <p><span className="font-medium">Designation:</span> {s.designation?.name || '-'}</p>
                <p><span className="font-medium">Mobile:</span> {s.mobile || '-'}</p>
              </div>
            </div>
          ))}
          {staff.length === 0 && <div className="col-span-full text-center p-8 text-slate-500">No staff found.</div>}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-fade-in">
          <div className={`bg-white rounded shadow-2xl w-full max-w-md overflow-hidden ${isERPMode ? 'border border-slate-200' : ''}`}>
            {isERPMode ? (
              <div className="bg-slate-800 px-4 py-3 flex items-center justify-between">
                <h2 className="text-sm font-bold text-white flex items-center gap-2"><ArrowDownRight size={14} className="text-blue-300" />{editingId ? 'Edit Staff Details' : 'Add New Staff'}</h2>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white text-lg leading-none">×</button>
              </div>
            ) : (
              <div className="p-6 pb-2 border-b border-slate-100">
                <h2 className="text-xl font-bold">{editingId ? 'Edit Staff' : 'Add Staff'}</h2>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <div>
                <label className={isERPMode ? "block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1" : "label"}>Name</label>
                <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={isERPMode ? "w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400" : "input-field"} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={isERPMode ? "block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1" : "label"}>Email</label>
                  <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className={isERPMode ? "w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400" : "input-field"} />
                </div>
                <div>
                  <label className={isERPMode ? "block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1" : "label"}>Mobile</label>
                  <input type="text" value={form.mobile} onChange={e => setForm({...form, mobile: e.target.value})} className={isERPMode ? "w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400" : "input-field"} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={isERPMode ? "block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1" : "label"}>Department</label>
                  <select value={form.departmentId} onChange={e => setForm({...form, departmentId: e.target.value})} className={isERPMode ? "w-full border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400" : "input-field"}>
                    <option value="">Select...</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={isERPMode ? "block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1" : "label"}>Designation</label>
                  <select value={form.designationId} onChange={e => setForm({...form, designationId: e.target.value})} className={isERPMode ? "w-full border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400" : "input-field"}>
                    <option value="">Select...</option>
                    {designations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={isERPMode ? "block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1" : "label"}>Base Salary (₹)</label>
                  <input type="number" value={form.salary} onChange={e => setForm({...form, salary: e.target.value})} className={isERPMode ? "w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-slate-400" : "input-field"} />
                </div>
                <div>
                  <label className={isERPMode ? "block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1" : "label"}>Joining Date</label>
                  <input type="date" value={form.joiningDate} onChange={e => setForm({...form, joiningDate: e.target.value})} className={isERPMode ? "w-full border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400" : "input-field"} />
                </div>
              </div>
              <div className={isERPMode ? "flex justify-end gap-2 pt-2 border-t border-slate-100 mt-2" : "flex gap-3 justify-end pt-4"}>
                <button type="button" onClick={() => setShowModal(false)} className={isERPMode ? "px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded border border-slate-200 transition-colors" : "btn-secondary"}>Cancel</button>
                <button type="submit" className={isERPMode ? "px-4 py-1.5 text-xs font-bold bg-slate-800 text-white hover:bg-slate-700 rounded transition-colors flex items-center gap-1.5" : "btn-primary"}>
                  {isERPMode ? <><CheckCircle2 size={13} /> {editingId ? 'Update' : 'Save'}</> : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
