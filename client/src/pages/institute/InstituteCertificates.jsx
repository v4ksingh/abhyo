import React, { useState, useEffect } from 'react';
import { Award, Check, X, Search, FileText, Upload } from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'react-hot-toast';
import { getImageUrl } from '../../lib/imageUrl';

export default function InstituteCertificates() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [statusForm, setStatusForm] = useState({ status: '', remarks: '' });
  const [certificateFile, setCertificateFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/institute/certificates');
      setRequests(res.data.data || []);
    } catch (e) {
      toast.error('Failed to load certificate requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    
    setSubmitting(true);
    const formData = new FormData();
    formData.append('status', statusForm.status);
    formData.append('remarks', statusForm.remarks);
    if (certificateFile) {
      formData.append('certificateFile', certificateFile);
    }
    
    try {
      await api.put(`/institute/certificates/${selectedRequest.id}`, formData);
      toast.success('Certificate status updated');
      setSelectedRequest(null);
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = requests.filter(r => 
    r.fullName.toLowerCase().includes(search.toLowerCase()) || 
    r.course?.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="section-header">Certificate Requests</h1>
          <p className="section-subheader">Manage student certificate requests for completed courses</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" placeholder="Search requests..." 
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
          />
        </div>
      </div>
      
      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-20 skeleton rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-20 border-dashed">
          <Award className="mx-auto text-slate-300 mb-3" size={48} strokeWidth={1.5} />
          <h3 className="text-lg font-bold text-slate-800">No requests found</h3>
          <p className="text-slate-500 text-sm mt-1">Students will appear here once they request a certificate.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <th className="px-5 py-4">Student</th>
                  <th className="px-5 py-4">Course</th>
                  <th className="px-5 py-4">Contact</th>
                  <th className="px-5 py-4">Requested Date</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(req => (
                  <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {req.student?.avatar ? (
                          <img src={getImageUrl(req.student.avatar)} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-bold">{req.fullName.charAt(0)}</div>
                        )}
                        <div>
                          <p className="text-sm font-bold text-slate-800">{req.fullName}</p>
                          <p className="text-[10px] text-slate-500">{req.student?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-xs font-semibold text-slate-700 max-w-[200px] truncate">{req.course?.title}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-[11px] text-slate-600 font-medium">{req.email}</p>
                      <p className="text-[11px] text-slate-600 font-medium">{req.mobile}</p>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-600 font-medium">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider border ${
                        req.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                        req.status === 'rejected' ? 'bg-red-50 text-red-600 border-red-200' :
                        'bg-amber-50 text-amber-600 border-amber-200'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button 
                        onClick={() => { setSelectedRequest(req); setStatusForm({ status: req.status, remarks: req.remarks || '' }); setCertificateFile(null); }}
                        className="btn-secondary py-1.5 px-3 text-xs"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800">Review Request</h3>
              <button onClick={() => setSelectedRequest(null)} className="p-1 text-slate-400 hover:bg-white rounded"><X size={16} /></button>
            </div>
            
            <div className="p-5">
              <div className="bg-slate-50 rounded-xl p-4 mb-5 border border-slate-100 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Student Name</p><p className="font-semibold text-slate-800">{selectedRequest.fullName}</p></div>
                  <div><p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Course</p><p className="font-semibold text-slate-800">{selectedRequest.course?.title}</p></div>
                  <div className="col-span-2"><p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Shipping Address</p><p className="font-medium text-slate-600">{selectedRequest.address || 'N/A'}</p></div>
                </div>
              </div>

              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Action Status</label>
                  <select 
                    value={statusForm.status} onChange={e => setStatusForm({...statusForm, status: e.target.value})}
                    className="w-full bg-white text-slate-800 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approve & Issue Certificate</option>
                    <option value="rejected">Reject</option>
                  </select>
                </div>

                {statusForm.status === 'approved' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Upload Custom Certificate (Optional - Auto-generates if skipped)</label>
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:bg-slate-50 transition-colors">
                      <input type="file" id="cert-upload" className="hidden" accept=".pdf,image/*" onChange={e => setCertificateFile(e.target.files[0])} />
                      <label htmlFor="cert-upload" className="cursor-pointer flex flex-col items-center">
                        <Upload size={20} className="text-primary-500 mb-2" />
                        <span className="text-xs font-bold text-slate-700">{certificateFile ? certificateFile.name : 'Click to browse file'}</span>
                        {!certificateFile && selectedRequest.certificateUrl && <span className="text-[10px] text-emerald-600 mt-1">Certificate already uploaded. Upload new to replace.</span>}
                      </label>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Remarks (Optional)</label>
                  <textarea 
                    value={statusForm.remarks} onChange={e => setStatusForm({...statusForm, remarks: e.target.value})}
                    className="w-full bg-white text-slate-800 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none min-h-[80px]"
                    placeholder="Message to the student..."
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setSelectedRequest(null)} className="flex-1 btn-secondary">Cancel</button>
                  <button type="submit" disabled={submitting} className="flex-1 btn-primary disabled:opacity-50">
                    {submitting ? 'Saving...' : 'Save Decision'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
