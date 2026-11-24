import React, { useState, useEffect } from 'react';
import api from '../../../lib/api';
import toast from 'react-hot-toast';

export default function Payroll({ isERPMode = false }) {
  const [payroll, setPayroll] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const currentDate = new Date();
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());

  const fetchPayroll = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/hr/payroll?month=${month}&year=${year}`);
      setPayroll(res.data.data);
    } catch (e) { toast.error('Failed to fetch payroll'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPayroll(); }, [month, year]);

  const handleGenerate = async () => {
    if (!confirm(`Generate payroll for ${month}/${year}?`)) return;
    try {
      await api.post('/hr/payroll/generate', { month, year });
      toast.success('Payroll generated');
      fetchPayroll();
    } catch(e) { toast.error('Failed to generate'); }
  };

  const markPaid = async (id) => {
    if (!confirm('Mark as paid?')) return;
    try {
      await api.put(`/hr/payroll/${id}`, { status: 'paid' });
      toast.success('Marked as paid');
      fetchPayroll();
    } catch(e) { toast.error('Failed to update'); }
  };

  if (loading && payroll.length === 0) return <div className="p-6">Loading...</div>;

  return (
    <div className={isERPMode ? "space-y-4" : "space-y-6"}>
      <div className={`flex flex-wrap justify-between items-center gap-4 ${isERPMode ? 'mb-2' : ''}`}>
        {!isERPMode && <h1 className="text-2xl font-bold text-slate-900">Payroll Processing</h1>}
        {isERPMode && <span className="text-sm font-bold text-slate-800">Payroll Processing</span>}
        <div className="flex items-center gap-2">
          <select value={month} onChange={e=>setMonth(e.target.value)} className="input-field !py-1.5">
            {Array.from({length:12}).map((_,i) => <option key={i+1} value={i+1}>Month {i+1}</option>)}
          </select>
          <select value={year} onChange={e=>setYear(e.target.value)} className="input-field !py-1.5 w-24">
            {[year-1, year, year+1].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={handleGenerate} className="btn-primary py-1.5 ml-2">Generate Salaries</button>
        </div>
      </div>

      <div className={`overflow-hidden ${isERPMode ? 'border border-slate-200 rounded shadow-sm bg-white' : 'card'}`}>
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-900 border-b">
            <tr>
              <th className="p-4">Staff</th>
              <th className="p-4">Basic</th>
              <th className="p-4">Days Worked</th>
              <th className="p-4 text-red-500">Leave Ded.</th>
              <th className="p-4 font-bold text-green-600">Net Salary</th>
              <th className="p-4">Status</th>
              <th className="p-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {payroll.map(p => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="p-4 font-medium text-slate-900">{p.staff?.name} <span className="text-xs text-slate-400 block">{p.staff?.employeeCode}</span></td>
                <td className="p-4">₹{p.basicSalary}</td>
                <td className="p-4">{p.daysWorked} days</td>
                <td className="p-4 text-red-500">-₹{p.leaveDed}</td>
                <td className="p-4 font-bold text-green-600">₹{p.netSalary}</td>
                <td className="p-4">
                  <span className={`badge-${p.status === 'paid' ? 'success' : 'warning'}`}>{p.status.toUpperCase()}</span>
                </td>
                <td className="p-4">
                  {p.status === 'pending' ? (
                    <button onClick={()=>markPaid(p.id)} className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg border border-indigo-200 hover:bg-indigo-100 transition-colors">Mark Paid</button>
                  ) : <span className="text-xs text-slate-400">{new Date(p.paidAt).toLocaleDateString()}</span>}
                </td>
              </tr>
            ))}
            {payroll.length === 0 && <tr><td colSpan="7" className="p-8 text-center text-slate-500">No payroll records for this month. Click generate.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
