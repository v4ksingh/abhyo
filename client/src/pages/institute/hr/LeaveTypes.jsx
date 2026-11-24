import React, { useState, useEffect } from 'react';
import api from '../../../lib/api';
import toast from 'react-hot-toast';
import { Edit2, Trash2 } from 'lucide-react';

export default function LeaveTypes({ isERPMode = false }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', totalDays: 12, isPaid: true, description: '' });
  const [editingId, setEditingId] = useState(null);

  const fetchItems = async () => {
    try {
      const res = await api.get('/hr/leave-types');
      setItems(res.data.data);
    } catch (e) { toast.error('Failed to fetch leave types'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/hr/leave-types/${editingId}`, form);
        toast.success('Updated');
      } else {
        await api.post('/hr/leave-types', form);
        toast.success('Created');
      }
      setForm({ name: '', totalDays: 12, isPaid: true, description: '' });
      setEditingId(null);
      fetchItems();
    } catch (e) { toast.error(e.response?.data?.error || 'Error'); }
  };

  const del = async (id) => {
    if (!confirm('Are you sure?')) return;
    try {
      await api.delete(`/hr/leave-types/${id}`);
      toast.success('Deleted');
      fetchItems();
    } catch (e) { toast.error('Failed to delete'); }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className={isERPMode ? "" : "space-y-6"}>
      {!isERPMode && <h1 className="text-2xl font-bold text-slate-900 mb-6">Leave Types</h1>}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <form onSubmit={handleSubmit} className="card p-4 space-y-4">
            <h3 className="font-semibold">{editingId ? 'Edit Leave Type' : 'Add Leave Type'}</h3>
            <div><label className="label">Name</label><input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input-field" /></div>
            <div><label className="label">Total Days Allowed</label><input type="number" required value={form.totalDays} onChange={e => setForm({...form, totalDays: parseInt(e.target.value)})} className="input-field" /></div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isPaid" checked={form.isPaid} onChange={e => setForm({...form, isPaid: e.target.checked})} className="w-4 h-4 text-primary-600 rounded" />
              <label htmlFor="isPaid" className="text-sm font-medium text-slate-700">Is Paid Leave?</label>
            </div>
            <div><label className="label">Description</label><textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input-field" rows="2" /></div>
            <button type="submit" className="btn-primary w-full">{editingId ? 'Update' : 'Add'}</button>
            {editingId && <button type="button" onClick={() => {setEditingId(null); setForm({name:'', totalDays:12, isPaid:true, description:''})}} className="btn-secondary w-full mt-2">Cancel</button>}
          </form>
        </div>

        <div className={`md:col-span-2 overflow-hidden bg-white ${isERPMode ? 'border border-slate-200 rounded shadow-sm' : 'shadow-sm rounded-xl'}`}>
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b"><tr><th className="p-4">Name</th><th className="p-4">Days</th><th className="p-4">Type</th><th className="p-4">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/50">
                  <td className="p-4 font-medium">{item.name}</td>
                  <td className="p-4">{item.totalDays}</td>
                  <td className="p-4"><span className={item.isPaid ? 'badge-success' : 'badge-warning'}>{item.isPaid ? 'Paid' : 'Unpaid'}</span></td>
                  <td className="p-4 flex gap-2">
                    <button onClick={() => {setForm({name: item.name, totalDays: item.totalDays, isPaid: item.isPaid, description: item.description}); setEditingId(item.id);}} className="text-blue-500 hover:text-blue-700"><Edit2 size={16} /></button>
                    <button onClick={() => del(item.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
