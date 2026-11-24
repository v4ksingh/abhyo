import React, { useState, useEffect } from 'react';
import { Award, Download, Clock, XCircle, Search, Trophy } from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

export default function StudentCertificates() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isOlympiad = user?.isOlympiadUser;

  useEffect(() => {
    api.get('/student/certificates')
      .then(res => setRequests(res.data.data || []))
      .catch(() => toast.error('Failed to load certificates'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="section-header">My Certificates</h1>
        <p className="section-subheader">View and download your earned course certificates</p>
      </div>
      
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {[1,2,3].map(i => <div key={i} className="h-48 skeleton rounded-2xl" />)}
        </div>
      ) : requests.length === 0 ? (
        <div className="card text-center py-20 border-dashed">
          {isOlympiad ? (
            <>
              <Trophy className="mx-auto text-indigo-300 mb-3" size={48} strokeWidth={1.5} />
              <h3 className="text-lg font-bold text-slate-800">No Olympiad certificates yet</h3>
              <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">Complete an Olympiad exam to earn your verified digital certificate.</p>
              <button onClick={() => navigate('/student/olympiad')} className="btn-secondary mt-5">Go to Olympiad Dashboard</button>
            </>
          ) : (
            <>
              <Award className="mx-auto text-slate-300 mb-3" size={48} strokeWidth={1.5} />
              <h3 className="text-lg font-bold text-slate-800">No certificates yet</h3>
              <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">Complete courses 100% to request your certificates from your institute.</p>
              <button onClick={() => navigate('/student/courses')} className="btn-secondary mt-5">Go to Courses</button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {requests.map(req => (
            <div key={req.id} className="card p-0 flex flex-col overflow-hidden group">
              <div className="bg-slate-900 relative aspect-video flex items-center justify-center p-6 text-center">
                {req.course?.thumbnail ? (
                  <img src={req.course.thumbnail} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
                ) : null}
                <div className="relative z-10 flex flex-col items-center">
                  <Award size={40} className={req.status === 'approved' ? 'text-emerald-400' : 'text-slate-400'} />
                  <h3 className="text-white font-bold text-lg mt-3 drop-shadow-md line-clamp-2">{req.course?.title}</h3>
                </div>
                <div className="absolute top-3 right-3">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-lg backdrop-blur-sm ${
                    req.status === 'approved' ? 'bg-emerald-500/90 text-white' :
                    req.status === 'rejected' ? 'bg-red-500/90 text-white' :
                    'bg-white/90 text-slate-800'
                  }`}>
                    {req.status === 'approved' && <Award size={12} />}
                    {req.status === 'pending' && <Clock size={12} />}
                    {req.status === 'rejected' && <XCircle size={12} />}
                    {req.status}
                  </span>
                </div>
              </div>
              
              <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">Issued To</p>
                  <p className="text-sm font-bold text-slate-800">{req.fullName}</p>
                </div>
                
                {req.status === 'approved' && req.certificateUrl ? (
                  <a href={req.certificateUrl} target="_blank" rel="noreferrer" className="w-full btn-primary py-2.5 text-sm flex items-center justify-center gap-2">
                    <Download size={16} /> Download Certificate
                  </a>
                ) : req.status === 'rejected' ? (
                  <div className="bg-red-50 text-red-700 text-xs p-3 rounded-xl font-medium border border-red-100">
                    <span className="font-bold block mb-0.5">Request Rejected:</span>
                    {req.remarks || 'Please contact your institute for more details.'}
                  </div>
                ) : (
                  <div className="bg-slate-50 text-slate-600 text-xs p-3 rounded-xl font-medium border border-slate-100">
                    Your request is under review. Please check back later.
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
