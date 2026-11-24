import React, { useState, useEffect } from 'react';
import api from '../../../lib/api';
import toast from 'react-hot-toast';
import { Edit2, Trash2 } from 'lucide-react';

export default function Designations({ isERPMode = false }) {
  const [items, setItems] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', departmentId: '', description: '' });
  const [editingId, setEditingId] = useState(null);

  const fetchData = async () => {
    try {
      const [resDesig, resDept] = await Promise.all([
        api.get('/hr/designations'),
        api.get('/hr/departments')
      ]);
      setItems(resDesig.data.data);
      setDepartments(resDept.data.data);
    } catch (e) { toast.error('Failed to fetch data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/hr/designations/${editingId}`, form);
        toast.success('Updated');
      } else {
        await api.post('/hr/designations', form);
        toast.success('Created');
      }
      setForm({ name: '', departmentId: '', description: '' });
      setEditingId(null);
      fetchData();
    } catch (e) { toast.error(e.response?.data?.error || 'Error'); }
  };

  const del = async (id) => {
    if (!confirm('Are you sure?')) return;
    try {
      await api.delete(`/hr/designations/${id}`);
      toast.success('Deleted');
      fetchData();
    } catch (e) { toast.error('Failed to delete'); }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className={isERPMode ? "" : "space-y-6"}>
      {!isERPMode && <h1 className="text-2xl font-bold text-slate-900 mb-6">Designations</h1>}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <form onSubmit={handleSubmit} className="card p-4 space-y-4">
            <h3 className="font-semibold">{editingId ? 'Edit Designation' : 'Add Designation'}</h3>
            <div>
              <label className="label">Name</label>
              <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input-field" />
            </div>
            <div>
              <label className="label">Department</label>
              <select value={form.departmentId} onChange={e => setForm({...form, departmentId: e.target.value})} className="input-field">
                <option value="">No Department</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Description</label>
              <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input-field" rows="3" />
            </div>
            <button type="submit" className="btn-primary w-full">{editingId ? 'Update' : 'Add'}</button>
            {editingId && <button type="button" onClick={() => {setEditingId(null); setForm({name:'', departmentId:'', description:''})}} className="btn-secondary w-full mt-2">Cancel</button>}
          </form>
        </div>

        <div className="md:col-span-2">
          <div className={`overflow-hidden ${isERPMode ? 'border border-slate-200 rounded shadow-sm bg-white' : 'card'}`}>
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-900 border-b border-slate-200">
                <tr>
                  <th className="p-4 font-semibold">Name</th>
                  <th className="p-4 font-semibold">Department</th>
                  <th className="p-4 font-semibold w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="p-4 font-medium text-slate-900">{item.name}</td>
                    <td className="p-4">{item.department?.name || '-'}</td>
                    <td className="p-4 flex items-center gap-2">
                      <button onClick={() => {setForm({name: item.name, departmentId: item.departmentId || '', description: item.description}); setEditingId(item.id);}} className="text-blue-500 hover:text-blue-700 p-1"><Edit2 size={16} /></button>
                      <button onClick={() => del(item.id)} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
