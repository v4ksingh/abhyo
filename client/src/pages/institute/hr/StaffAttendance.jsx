import React, { useState, useEffect } from 'react';
import api from '../../../lib/api';
import toast from 'react-hot-toast';

export default function StaffAttendance({ isERPMode = false }) {
  const [staff, setStaff] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // local state mapped by staffId
  const [records, setRecords] = useState({});

  const fetchAttendance = async (targetDate) => {
    setLoading(true);
    try {
      const res = await api.get(`/hr/attendance?date=${targetDate}`);
      setStaff(res.data.staff);
      setAttendance(res.data.data);
      
      const newRec = {};
      res.data.staff.forEach(s => {
        const exist = res.data.data.find(a => a.staffId === s.id);
        newRec[s.id] = exist ? exist.status : 'present';
      });
      setRecords(newRec);
    } catch (e) { toast.error('Failed to load attendance'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAttendance(date); }, [date]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = Object.keys(records).map(staffId => ({
        staffId, status: records[staffId], date
      }));
      await api.post('/hr/attendance', { date, records: payload });
      toast.success('Attendance saved');
      fetchAttendance(date);
    } catch(e) { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const markAll = (status) => {
    const newRec = {};
    staff.forEach(s => newRec[s.id] = status);
    setRecords(newRec);
  };

  if (loading && staff.length === 0) return <div className="p-6">Loading...</div>;

  return (
    <div className={isERPMode ? "space-y-4" : "space-y-6"}>
      <div className={`flex flex-wrap justify-between items-center gap-4 ${isERPMode ? 'mb-2' : ''}`}>
        {!isERPMode && <h1 className="text-2xl font-bold text-slate-900">Staff Attendance</h1>}
        {isERPMode && <span className="text-sm font-bold text-slate-800">Staff Attendance</span>}
        <div className={`flex items-center gap-4 bg-white p-2 ${isERPMode ? 'rounded shadow-sm' : 'rounded-xl shadow-sm'} border border-slate-200`}>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input-field !py-1.5" />
          <button onClick={handleSave} disabled={saving} className="btn-primary py-1.5 px-4">{saving ? 'Saving...' : 'Save Attendance'}</button>
        </div>
      </div>

      <div className={`overflow-hidden ${isERPMode ? 'border border-slate-200 rounded shadow-sm bg-white' : 'card'}`}>
        <div className="bg-slate-50 p-3 border-b border-slate-200 flex items-center justify-between">
          <span className="font-semibold text-slate-700">Mark All:</span>
          <div className="flex gap-2">
            <button onClick={() => markAll('present')} className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200">Present</button>
            <button onClick={() => markAll('absent')} className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200">Absent</button>
            <button onClick={() => markAll('half_day')} className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-sm hover:bg-yellow-200">Half Day</button>
          </div>
        </div>
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-white border-b">
            <tr>
              <th className="p-4">Employee</th>
              <th className="p-4">Code</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {staff.map(s => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="p-4 font-medium text-slate-900">{s.name}</td>
                <td className="p-4 text-xs font-mono">{s.employeeCode}</td>
                <td className="p-4">
                  <select 
                    value={records[s.id] || 'present'} 
                    onChange={e => setRecords({...records, [s.id]: e.target.value})}
                    className={`input-field !py-1 w-32 font-medium ${
                      records[s.id] === 'present' ? 'bg-green-50 text-green-700 border-green-200' :
                      records[s.id] === 'absent' ? 'bg-red-50 text-red-700 border-red-200' :
                      records[s.id] === 'half_day' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-slate-100'
                    }`}
                  >
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="half_day">Half Day</option>
                    <option value="on_leave">On Leave</option>
                  </select>
                </td>
              </tr>
            ))}
            {staff.length === 0 && <tr><td colSpan="3" className="p-8 text-center text-slate-500">No active staff found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
