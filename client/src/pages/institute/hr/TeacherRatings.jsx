import React, { useState, useEffect } from 'react';
import api from '../../../lib/api';
import toast from 'react-hot-toast';
import { Star } from 'lucide-react';

export default function TeacherRatings() {
  const [ratings, setRatings] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const [form, setForm] = useState({ staffId: '', punctuality: 5, teaching: 5, discipline: 5, communication: 5, feedback: '' });

  const fetchData = async () => {
    try {
      const [resRat, resStaff] = await Promise.all([
        api.get(`/hr/ratings?month=${month}&year=${year}`),
        api.get('/hr/staff?isDisabled=false')
      ]);
      setRatings(resRat.data.data);
      setStaff(resStaff.data.data);
    } catch (e) { toast.error('Failed to fetch data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [month, year]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/hr/ratings', { ...form, month, year });
      toast.success('Rating saved');
      setForm({ staffId: '', punctuality: 5, teaching: 5, discipline: 5, communication: 5, feedback: '' });
      fetchData();
    } catch(e) { toast.error('Error saving'); }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Teacher Performance Ratings</h1>
        <div className="flex items-center gap-2">
          <select value={month} onChange={e=>setMonth(e.target.value)} className="input-field !py-1.5">
            {Array.from({length:12}).map((_,i) => <option key={i+1} value={i+1}>Month {i+1}</option>)}
          </select>
          <select value={year} onChange={e=>setYear(e.target.value)} className="input-field !py-1.5 w-24">
            {[year-1, year, year+1].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <form onSubmit={handleSubmit} className="card p-4 space-y-4">
            <h3 className="font-semibold">Add / Update Rating</h3>
            <div>
              <label className="label">Staff Memeber</label>
              <select required value={form.staffId} onChange={e=>setForm({...form, staffId: e.target.value})} className="input-field">
                <option value="">Select Staff...</option>
                {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            
            {['punctuality', 'teaching', 'discipline', 'communication'].map(metric => (
              <div key={metric}>
                <label className="label capitalize">{metric} (1-10)</label>
                <input type="range" min="1" max="10" value={form[metric]} onChange={e => setForm({...form, [metric]: e.target.value})} className="w-full" />
                <div className="text-right text-xs font-bold text-indigo-600">{form[metric]}/10</div>
              </div>
            ))}

            <div><label className="label">Feedback Notes</label><textarea value={form.feedback} onChange={e=>setForm({...form, feedback: e.target.value})} rows="2" className="input-field"/></div>
            
            <button type="submit" className="btn-primary w-full">Save Rating</button>
          </form>
        </div>

        <div className="md:col-span-2 shadow-sm rounded-xl overflow-hidden bg-white">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="p-4">Staff</th>
                <th className="p-4 text-center">Overall</th>
                <th className="p-4">Feedback</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ratings.map(r => (
                <tr key={r.id} className="hover:bg-slate-50/50">
                  <td className="p-4 font-medium text-slate-900">{r.staff?.name}</td>
                  <td className="p-4 text-center">
                    <div className="flex items-center gap-1 justify-center bg-indigo-50 text-indigo-700 px-2 py-1 rounded w-max mx-auto font-bold border border-indigo-100">
                      <Star fill="currentColor" size={14} className="text-yellow-400" />
                      {r.overall}
                    </div>
                  </td>
                  <td className="p-4 text-xs max-w-[200px] truncate">{r.feedback || '-'}</td>
                </tr>
              ))}
              {ratings.length === 0 && <tr><td colSpan="3" className="p-8 text-center text-slate-500">No ratings found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
