import React, { useState, useEffect } from 'react';
import api from '../../../lib/api';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2 } from 'lucide-react';

export default function Departments({ isERPMode = false }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', description: '' });
  const [editingId, setEditingId] = useState(null);

  const fetchItems = async () => {
    try {
      const res = await api.get('/hr/departments');
      setItems(res.data.data);
    } catch (e) { toast.error('Failed to fetch departments'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/hr/departments/${editingId}`, form);
        toast.success('Updated');
      } else {
        await api.post('/hr/departments', form);
        toast.success('Created');
      }
      setForm({ name: '', description: '' });
      setEditingId(null);
      fetchItems();
    } catch (e) { toast.error(e.response?.data?.error || 'Error'); }
  };

  const del = async (id) => {
    if (!confirm('Are you sure?')) return;
    try {
      await api.delete(`/hr/departments/${id}`);
      toast.success('Deleted');
      fetchItems();
    } catch (e) { toast.error('Failed to delete'); }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className={isERPMode ? "" : "space-y-6"}>
      {!isERPMode && (
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Departments</h1>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <form onSubmit={handleSubmit} className="card p-4 space-y-4">
            <h3 className="font-semibold">{editingId ? 'Edit Department' : 'Add Department'}</h3>
            <div>
              <label className="label">Name</label>
              <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input-field" />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input-field" rows="3" />
            </div>
            <button type="submit" className="btn-primary w-full">{editingId ? 'Update' : 'Add'}</button>
            {editingId && <button type="button" onClick={() => {setEditingId(null); setForm({name:'', description:''})}} className="btn-secondary w-full mt-2">Cancel</button>}
          </form>
        </div>

        <div className="md:col-span-2">
          <div className={`overflow-hidden ${isERPMode ? 'border border-slate-200 rounded shadow-sm bg-white' : 'card'}`}>
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-900 border-b border-slate-200">
                <tr>
                  <th className="p-4 font-semibold">Name</th>
                  <th className="p-4 font-semibold">Description</th>
                  <th className="p-4 font-semibold w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="p-4 font-medium text-slate-900">{item.name}</td>
                    <td className="p-4">{item.description || '-'}</td>
                    <td className="p-4 flex items-center gap-2">
                      <button onClick={() => {setForm({name: item.name, description: item.description}); setEditingId(item.id);}} className="text-blue-500 hover:text-blue-700 p-1"><Edit2 size={16} /></button>
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
