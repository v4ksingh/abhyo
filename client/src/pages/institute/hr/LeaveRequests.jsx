import React, { useState, useEffect } from 'react';
import api from '../../../lib/api';
import toast from 'react-hot-toast';
import { Check, X, Plus } from 'lucide-react';

export default function LeaveRequests({ forceApply = false, isERPMode = false }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showApply, setShowApply] = useState(forceApply);
  const [staff, setStaff] = useState([]);
  const [types, setTypes] = useState([]);
  const [form, setForm] = useState({ staffId: '', leaveTypeId: '', startDate: '', endDate: '', reason: '' });

  const fetchData = async () => {
    try {
      const [resReq, resStaff, resTypes] = await Promise.all([
        api.get('/hr/leave-requests'),
        api.get('/hr/staff?isDisabled=false'),
        api.get('/hr/leave-types')
      ]);
      setRequests(resReq.data.data);
      setStaff(resStaff.data.data);
      setTypes(resTypes.data.data);
    } catch (e) { toast.error('Failed to fetch leave data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleApply = async (e) => {
    e.preventDefault();
    try {
      await api.post('/hr/leave-requests', form);
      toast.success('Leave applied');
      setShowApply(false);
      fetchData();
    } catch (e) { toast.error(e.response?.data?.error || 'Error applied'); }
  };

  const handleReview = async (id, status) => {
    if (!confirm(`Mark as ${status}?`)) return;
    try {
      await api.put(`/hr/leave-requests/${id}/review`, { status, reviewNote: '' });
      toast.success('Updated');
      fetchData();
    } catch(e) { toast.error('Error'); }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className={isERPMode ? "space-y-4" : "space-y-6"}>
      {!isERPMode && (
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900">{forceApply ? 'Apply Leave' : 'Leave Requests'}</h1>
          {!forceApply && <button onClick={() => setShowApply(true)} className="btn-primary flex items-center gap-2"><Plus size={18} /> Apply Leave</button>}
        </div>
      )}

      {isERPMode && !forceApply && (
        <div className="flex justify-between items-center bg-white border border-slate-200 px-4 py-2 rounded shadow-sm">
          <span className="text-sm font-bold text-slate-800 flex items-center gap-2">Leave Requests</span>
          <button onClick={() => setShowApply(true)} className="px-3 py-1.5 bg-slate-800 text-white hover:bg-slate-700 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors">
            <Plus size={13} /> Apply Leave
          </button>
        </div>
      )}

      {showApply && (
        <form onSubmit={handleApply} className={`max-w-xl space-y-4 p-5 ${isERPMode ? 'border border-slate-200 rounded shadow-sm bg-white' : 'card'}`}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Staff</label>
              <select required value={form.staffId} onChange={e=>setForm({...form, staffId: e.target.value})} className="input-field">
                <option value="">Select Staff...</option>
                {staff.map(s => <option key={s.id} value={s.id}>{s.name} ({s.employeeCode})</option>)}
              </select>
            </div>
            <div>
              <label className="label">Leave Type</label>
              <select required value={form.leaveTypeId} onChange={e=>setForm({...form, leaveTypeId: e.target.value})} className="input-field">
                <option value="">Select Type...</option>
                {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Start Date</label><input type="date" required value={form.startDate} onChange={e=>setForm({...form, startDate: e.target.value})} className="input-field"/></div>
            <div><label className="label">End Date</label><input type="date" required value={form.endDate} onChange={e=>setForm({...form, endDate: e.target.value})} className="input-field"/></div>
          </div>
          <div><label className="label">Reason</label><textarea required value={form.reason} onChange={e=>setForm({...form, reason: e.target.value})} rows="3" className="input-field"/></div>
          <div className="flex gap-3 pt-2">
            {!forceApply && <button type="button" onClick={()=>setShowApply(false)} className="btn-secondary w-full">Cancel</button>}
            <button type="submit" className="btn-primary w-full">Submit Application</button>
          </div>
        </form>
      )}

      {!forceApply && (
        <div className={`overflow-hidden ${isERPMode ? 'border border-slate-200 rounded shadow-sm bg-white' : 'card'}`}>
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-900 border-b">
              <tr>
                <th className="p-4">Staff</th>
                <th className="p-4">Leave Type</th>
                <th className="p-4">Dates</th>
                <th className="p-4">Reason</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.map(req => (
                <tr key={req.id} className="hover:bg-slate-50">
                  <td className="p-4 font-medium text-slate-900">{req.staff?.name}<br/><span className="text-xs font-normal text-slate-500">{req.staff?.employeeCode}</span></td>
                  <td className="p-4">{req.leaveType?.name} <span className="text-xs bg-slate-100 px-1 rounded ml-1">{req.days} days</span></td>
                  <td className="p-4">{req.startDate} <br/>to {req.endDate}</td>
                  <td className="p-4 max-w-[200px] truncate" title={req.reason}>{req.reason}</td>
                  <td className="p-4">
                    <span className={`badge-${req.status === 'approved' ? 'success' : req.status === 'rejected' ? 'danger' : 'warning'}`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    {req.status === 'pending' ? (
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleReview(req.id, 'approved')} className="bg-green-100 text-green-700 p-1.5 rounded-lg hover:bg-green-200"><Check size={16} /></button>
                        <button onClick={() => handleReview(req.id, 'rejected')} className="bg-red-100 text-red-700 p-1.5 rounded-lg hover:bg-red-200"><X size={16} /></button>
                      </div>
                    ) : '-'}
                  </td>
                </tr>
              ))}
              {requests.length === 0 && <tr><td colSpan="6" className="p-8 text-center text-slate-500">No leave requests found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
