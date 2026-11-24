import React, { useEffect, useState } from 'react';
import { Plus, Search, Upload, UserPlus, BarChart3, Mail, Phone, Award, IdCard, Clock, Check, X, Shield, User, GraduationCap, Download, BookOpen } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import ExportButtons from '../../components/shared/ExportButtons';
import { getImageUrl } from '../../lib/imageUrl';

export default function StudentsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('enrolled');
  const [students, setStudents] = useState([]);
  const [pendingStudents, setPendingStudents] = useState([]);
  const [courseRequests, setCourseRequests] = useState([]);
  const [batches, setBatches] = useState([]);
  const [institute, setInstitute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [courseReqLoading, setCourseReqLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [batchFilter, setBatchFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCSVModal, setShowCSVModal] = useState(false);
  const [showPerfModal, setShowPerfModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentPerf, setStudentPerf] = useState(null);
  const [addForm, setAddForm] = useState({ name: '', mobile: '', email: '', password: '', batchId: '' });
  const [showBatchSelectModal, setShowBatchSelectModal] = useState(false);
  const [selectedCourseRequest, setSelectedCourseRequest] = useState(null);
  const [selectedBatchId, setSelectedBatchId] = useState('');

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 25 };
      if (search) params.search = search;
      if (batchFilter) params.batchId = batchFilter;
      const res = await api.get('/institute/students', { params });
      setStudents(res.data.data || []);
      setTotal(res.data.pagination?.total || 0);
    } catch (err) { 
      console.error(err);
      toast.error('Failed to load students'); 
    } finally { setLoading(false); }
  };

  const fetchPendingStudents = async () => {
    setPendingLoading(true);
    try {
      const res = await api.get('/institute/students/pending');
      setPendingStudents(res.data.data || []);
    } catch (err) { 
      console.error(err);
      toast.error('Failed to load pending queue'); 
    } finally { setPendingLoading(false); }
  };

  const fetchCourseRequests = async () => {
    setCourseReqLoading(true);
    try {
      const res = await api.get('/lms/enrollment-requests?status=pending');
      setCourseRequests(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load course requests');
    } finally { setCourseReqLoading(false); }
  };

  const fetchBatchesAndProfile = async () => {
    try {
      const [b, p] = await Promise.all([
        api.get('/institute/batches'),
        api.get('/institute/profile')
      ]);
      setBatches(b.data?.data || []);
      let profile = p.data?.data;
      if (profile && typeof profile.courses === 'string') {
        try { profile.courses = JSON.parse(profile.courses); } catch(e) {}
      }
      setInstitute(profile);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { 
    if (activeTab === 'enrolled') fetchStudents(); 
    else if (activeTab === 'pending') fetchPendingStudents();
    else if (activeTab === 'course-requests') fetchCourseRequests();
  }, [search, batchFilter, page, activeTab]);

  useEffect(() => { fetchBatchesAndProfile(); }, []);

  const handleApprove = async (studentId, status) => {
    try {
      await api.post('/institute/students/approve', { studentId, status });
      toast.success(status === 'approved' ? 'Identity Authorized' : 'Request Terminated');
      fetchPendingStudents();
      if (status === 'approved') fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Authorization failed');
    }
  };

  const handleApproveCourseRequest = async (status) => {
    if (status === 'approved' && !selectedBatchId) {
      toast.error('Please select a batch to approve');
      return;
    }
    
    try {
      await api.put(`/lms/enrollment-requests/${selectedCourseRequest.id}/approve`, {
        status,
        batchId: selectedBatchId || undefined
      });
      toast.success(`Request ${status} successfully`);
      setShowBatchSelectModal(false);
      setSelectedCourseRequest(null);
      setSelectedBatchId('');
      fetchCourseRequests();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to process request');
    }
  };

  const initiateCourseApprove = (req) => {
    setSelectedCourseRequest(req);
    setShowBatchSelectModal(true);
  };

  const handleRejectCourseRequest = async (id) => {
    if (!window.confirm('Are you sure you want to reject this request?')) return;
    try {
      await api.put(`/lms/enrollment-requests/${id}/approve`, { status: 'rejected' });
      toast.success('Request rejected');
      fetchCourseRequests();
    } catch (err) {
      toast.error('Failed to reject request');
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      await api.post('/institute/students/add', addForm);
      toast.success('Student added successfully!');
      setShowAddModal(false);
      setAddForm({ name: '', mobile: '', email: '', password: '', batchId: '' });
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add student');
    }
  };

  const handleCSVUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await api.post('/institute/students/bulk-upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(`${res.data.data.created} students added!`);
      setShowCSVModal(false);
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.error || 'CSV upload failed');
    }
  };

  const viewPerformance = async (student) => {
    setSelectedStudent(student);
    try {
      const res = await api.get(`/institute/students/${student.id}/performance`);
      setStudentPerf(res.data.data);
      setShowPerfModal(true);
    } catch { toast.error('Failed to load performance'); }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-100">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full mb-3">
            <GraduationCap size={14} className="text-indigo-600" />
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Enrollment Center</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Student <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Directory</span>
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage enrollments, monitor performance, and issue certificates.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <ExportButtons 
            data={students} 
            filename="students_report" 
            title="Student Enrollment Report" 
            headers={['Name', 'Email', 'Mobile', 'Batch', 'Category', 'Status']}
            pdfDataMapping={(s) => [s.name, s.email||'-', s.mobile||'-', s.batch?.name||'-', s.casteCategory||'-', s.isActive?'Active':'Inactive']}
          />
          <button onClick={() => setShowCSVModal(true)} className="bg-white text-slate-600 px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all border border-slate-200 shadow-sm flex items-center gap-2">
            <Upload size={14} /> Bulk Upload
          </button>
          <button onClick={() => setShowAddModal(true)} className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-0.5 transition-all flex items-center gap-2">
            <Plus size={16} /> Add Student
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-2xl w-fit border border-slate-200/60">
           <button onClick={() => setActiveTab('enrolled')} className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${activeTab === 'enrolled' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}>
              Enrolled Students <span className="ml-1.5 px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[10px]">{total}</span>
           </button>
           <button onClick={() => setActiveTab('pending')} className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2 ${activeTab === 'pending' ? 'bg-white text-amber-600 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}>
              Pending Requests
              {pendingStudents.length > 0 ? (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-md text-[10px] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" /> {pendingStudents.length}
                </span>
              ) : (
                <span className="ml-1.5 px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[10px]">0</span>
              )}
           </button>
           <button onClick={() => setActiveTab('course-requests')} className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2 ${activeTab === 'course-requests' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}>
              Course Requests
              {courseRequests.length > 0 ? (
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-md text-[10px] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" /> {courseRequests.length}
                </span>
              ) : (
                <span className="ml-1.5 px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[10px]">0</span>
              )}
           </button>
        </div>

        {activeTab === 'enrolled' && (
           <div className="flex flex-col sm:flex-row gap-3">
             <div className="relative">
               <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
               <input type="text" placeholder="Search students..." value={search}
                 onChange={e => { setSearch(e.target.value); setPage(1); }} className="w-full sm:w-64 bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium text-slate-900 focus:border-indigo-500 focus:ring-4 ring-indigo-50 transition-all outline-none shadow-sm" />
             </div>
             <div className="relative">
               <select value={batchFilter} onChange={e => { setBatchFilter(e.target.value); setPage(1); }}
                 className="w-full sm:w-48 bg-white border border-slate-200 rounded-xl pl-4 pr-10 py-2.5 text-sm font-medium text-slate-600 focus:border-indigo-500 focus:ring-4 ring-indigo-50 transition-all outline-none appearance-none cursor-pointer shadow-sm">
                 <option value="">All Batches</option>
                 {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
               </select>
               <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                 <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="m6 9 6 6 6-6"/></svg>
               </div>
             </div>
           </div>
        )}
      </div>

      {activeTab === 'enrolled' ? (
        <div className="space-y-6">

           {loading ? (
             <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
               {[...Array(6)].map((_, i) => <div key={i} className="h-44 bg-slate-100 rounded-[2rem]" />)}
             </div>
           ) : students.length === 0 ? (
             <div className="bg-slate-50 rounded-[3rem] text-center py-20 border-4 border-dashed border-white">
               <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest">No matching records found in the current matrix.</p>
             </div>
           ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {students.map(s => (
                 <div key={s.id} className="relative bg-white p-6 rounded-[2rem] border border-slate-100 hover:border-indigo-200 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-indigo-50 group overflow-hidden">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-50/50 to-transparent rounded-bl-full -z-10 transition-transform group-hover:scale-110" />
                   <div className="flex items-start gap-4 mb-5">
                     <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl flex items-center justify-center text-xl font-black shadow-lg shadow-indigo-200 group-hover:-translate-y-1 transition-transform duration-300">
                       {s.name?.charAt(0).toUpperCase()}
                     </div>
                     <div className="flex-1 min-w-0 pt-1">
                       <h3 className="font-bold text-slate-900 text-lg truncate leading-tight">{s.name}</h3>
                       <div className="flex flex-wrap gap-2 mt-2">
                          {s.batch && <span className="bg-slate-100 text-slate-600 text-[9px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">{s.batch?.name}</span>}
                          <span className={`text-[9px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${s.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                             {s.isActive ? 'Active' : 'Banned'}
                          </span>
                       </div>
                     </div>
                   </div>
                   
                   <div className="space-y-2 mb-6 bg-slate-50/50 rounded-xl p-3 border border-slate-100/50 group-hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3 text-[11px] font-medium text-slate-600">
                         <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-sm border border-slate-100"><Mail size={12} className="text-indigo-500" /></div>
                         <span className="truncate">{s.email || 'No email provided'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] font-medium text-slate-600">
                         <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-sm border border-slate-100"><Phone size={12} className="text-indigo-500" /></div>
                         <span className="truncate">{s.mobile || 'No contact provided'}</span>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-3">
                     <button onClick={() => viewPerformance(s)} className="flex flex-col items-center justify-center gap-1.5 py-2.5 bg-white border border-slate-100 text-slate-500 rounded-xl hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 transition-all group/btn" title="Performance">
                        <BarChart3 size={18} className="group-hover/btn:scale-110 transition-transform" />
                        <span className="text-[9px] font-bold uppercase tracking-wider">Perf</span>
                     </button>
                     <button onClick={() => navigate(`/institute/students/${s.id}/id-card`)} className="flex flex-col items-center justify-center gap-1.5 py-2.5 bg-white border border-slate-100 text-slate-500 rounded-xl hover:bg-purple-50 hover:border-purple-200 hover:text-purple-600 transition-all group/btn" title="ID Card">
                        <IdCard size={18} className="group-hover/btn:scale-110 transition-transform" />
                        <span className="text-[9px] font-bold uppercase tracking-wider">ID Card</span>
                     </button>
                   </div>
                 </div>
               ))}
             </div>
           )}

           {total > 25 && (
             <div className="flex items-center justify-center gap-4 py-6">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="bg-white border-2 border-slate-100 p-3 rounded-2xl disabled:opacity-30 hover:bg-slate-50 transition-all"><X size={14} className="rotate-45" /></button>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sector {page}</span>
                <button onClick={() => setPage(p => p + 1)} disabled={page * 25 >= total} className="bg-white border-2 border-slate-100 p-3 rounded-2xl disabled:opacity-30 hover:bg-slate-50 transition-all"><Plus size={14} /></button>
             </div>
           )}
        </div>
      ) : (
        <div className="space-y-6">
           <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-[2rem] border border-amber-100/50 flex items-center gap-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-100/50 to-transparent rounded-bl-full -z-10" />
              <div className="w-14 h-14 bg-white/80 backdrop-blur-sm rounded-2xl flex items-center justify-center text-amber-500 shadow-sm border border-amber-100">
                 <Shield size={24} className="animate-pulse" />
              </div>
              <div>
                 <h2 className="text-sm font-bold text-amber-800 uppercase tracking-widest">Authorization Queue</h2>
                 <p className="text-xs font-medium text-amber-700/80 mt-1">Review and approve enrollment requests from external students.</p>
              </div>
           </div>

           {pendingLoading ? (
             <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
               {[...Array(3)].map((_, i) => <div key={i} className="h-44 bg-slate-50 rounded-[2rem] animate-pulse border border-slate-100" />)}
             </div>
           ) : pendingStudents.length === 0 ? (
             <div className="bg-slate-50/50 rounded-[3rem] text-center py-20 border-2 border-dashed border-slate-200">
               <User size={48} className="text-slate-300 mx-auto mb-4" />
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Awaiting new authorization signals...</p>
             </div>
           ) : (
             <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
               {pendingStudents.map(s => (
                 <div key={s.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-amber-50 transition-all duration-300 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-50/50 to-transparent rounded-bl-full -z-10 transition-transform group-hover:scale-110" />
                    <div className="absolute top-6 right-6">
                       <div className="flex items-center gap-2 bg-amber-50 text-amber-600 px-2 py-1 rounded-md border border-amber-100/50">
                         <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                         <span className="text-[8px] font-bold uppercase tracking-wider">Pending</span>
                       </div>
                    </div>
                    
                    <div className="mb-5">
                       <h3 className="font-bold text-slate-900 text-lg leading-tight truncate pr-20">{s.name}</h3>
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">Requested: {new Date(s.createdAt).toLocaleDateString()}</p>
                    </div>

                    <div className="space-y-2 mb-6 bg-slate-50/50 rounded-xl p-3 border border-slate-100/50">
                       <div className="flex items-center gap-3 text-[11px] font-medium text-slate-600">
                          <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-sm border border-slate-100"><Mail size={12} className="text-slate-400" /></div>
                          <span className="truncate">{s.email || 'No email provided'}</span>
                       </div>
                       <div className="flex items-center gap-3 text-[11px] font-medium text-slate-600">
                          <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-sm border border-slate-100"><Phone size={12} className="text-slate-400" /></div>
                          <span className="truncate">{s.mobile || 'No contact provided'}</span>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                       <button onClick={() => handleApprove(s.id, 'approved')} className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold text-[10px] uppercase tracking-wider py-3 rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 hover:-translate-y-0.5">
                          <Check size={14} /> Authorize
                       </button>
                       <button onClick={() => handleApprove(s.id, 'rejected')} className="bg-white text-slate-500 font-bold text-[10px] uppercase tracking-wider py-3 rounded-xl border border-slate-200 hover:border-rose-200 hover:text-rose-600 hover:bg-rose-50 transition-all flex items-center justify-center gap-2">
                          <X size={14} /> Reject
                       </button>
                    </div>
                 </div>
               ))}
             </div>
           )}
        </div>
      )}

      {activeTab === 'course-requests' && (
        <div className="space-y-6">
           <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-[2rem] border border-indigo-100/50 flex items-center gap-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-100/50 to-transparent rounded-bl-full -z-10" />
              <div className="w-14 h-14 bg-white/80 backdrop-blur-sm rounded-2xl flex items-center justify-center text-indigo-500 shadow-sm border border-indigo-100">
                 <BookOpen size={24} className="animate-pulse" />
              </div>
              <div>
                 <h2 className="text-sm font-bold text-indigo-800 uppercase tracking-widest">Course Enrollments</h2>
                 <p className="text-xs font-medium text-indigo-700/80 mt-1">Review and assign batches to students requesting courses.</p>
              </div>
           </div>

           {courseReqLoading ? (
             <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
               {[...Array(3)].map((_, i) => <div key={i} className="h-44 bg-slate-50 rounded-[2rem] animate-pulse border border-slate-100" />)}
             </div>
           ) : courseRequests.length === 0 ? (
             <div className="bg-slate-50/50 rounded-[3rem] text-center py-20 border-2 border-dashed border-slate-200">
               <BookOpen size={48} className="text-slate-300 mx-auto mb-4" />
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No pending course requests.</p>
             </div>
           ) : (
             <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
               {courseRequests.map(req => (
                 <div key={req.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-50 transition-all duration-300 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-50/50 to-transparent rounded-bl-full -z-10 transition-transform group-hover:scale-110" />
                    
                    <div className="mb-5">
                       <h3 className="font-bold text-slate-900 text-lg leading-tight truncate">{req.student?.name}</h3>
                       <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">{req.student?.email || req.student?.mobile}</p>
                    </div>

                    <div className="space-y-2 mb-6 bg-indigo-50/50 rounded-xl p-3 border border-indigo-100/50">
                       <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Requested Course</p>
                       <p className="font-semibold text-indigo-900 line-clamp-2">{req.course?.title}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                       <button onClick={() => initiateCourseApprove(req)} className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold text-[10px] uppercase tracking-wider py-3 rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 hover:-translate-y-0.5">
                          <Check size={14} /> Approve
                       </button>
                       <button onClick={() => handleRejectCourseRequest(req.id)} className="bg-white text-slate-500 font-bold text-[10px] uppercase tracking-wider py-3 rounded-xl border border-slate-200 hover:border-rose-200 hover:text-rose-600 hover:bg-rose-50 transition-all flex items-center justify-center gap-2">
                          <X size={14} /> Reject
                       </button>
                    </div>
                 </div>
               ))}
             </div>
           )}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowAddModal(false)}>
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-2xl w-full max-w-md relative overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-50/80 to-transparent rounded-bl-full -z-10" />
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                 <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                   <UserPlus size={24} />
                 </div>
                 Add Student
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-xl transition-all">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">Full Name *</label>
                <input type="text" value={addForm.name} onChange={e => setAddForm({ ...addForm, name: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 focus:border-indigo-500 focus:ring-4 ring-indigo-50 outline-none transition-all shadow-sm" required placeholder="e.g. John Doe" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">Phone Number</label>
                  <input type="tel" value={addForm.mobile} onChange={e => setAddForm({ ...addForm, mobile: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 focus:border-indigo-500 focus:ring-4 ring-indigo-50 outline-none transition-all shadow-sm" placeholder="e.g. 9876543210" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">Email Address</label>
                  <input type="email" value={addForm.email} onChange={e => setAddForm({ ...addForm, email: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 focus:border-indigo-500 focus:ring-4 ring-indigo-50 outline-none transition-all shadow-sm" placeholder="e.g. john@example.com" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">Password</label>
                <input type="text" value={addForm.password} onChange={e => setAddForm({ ...addForm, password: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 focus:border-indigo-500 focus:ring-4 ring-indigo-50 outline-none transition-all shadow-sm" placeholder="Leave empty to auto-generate" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">Assign Batch</label>
                <div className="relative">
                  <select value={addForm.batchId} onChange={e => setAddForm({ ...addForm, batchId: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl pl-4 pr-10 py-3 text-sm font-medium text-slate-700 focus:border-indigo-500 focus:ring-4 ring-indigo-50 transition-all outline-none appearance-none cursor-pointer shadow-sm">
                    <option value="">No Batch Assigned</option>
                    {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-6">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 bg-white text-slate-600 font-bold py-3.5 rounded-xl text-xs uppercase tracking-wide hover:bg-slate-50 transition-all border border-slate-200">Cancel</button>
                <button type="submit" className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-wide hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-200 hover:-translate-y-0.5">Add Student</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCSVModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowCSVModal(false)}>
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-2xl w-full max-w-md relative overflow-hidden text-center" onClick={e => e.stopPropagation()}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-50/80 to-transparent rounded-bl-full -z-10" />
            
            <div className="flex items-center justify-between mb-2">
               <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                 <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                   <Upload size={24} />
                 </div>
                 Bulk Import
               </h3>
               <button onClick={() => setShowCSVModal(false)} className="p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-xl transition-all">
                 <X size={20} />
               </button>
            </div>
            
            <p className="text-sm font-medium text-slate-500 mb-6 text-left">Upload a CSV file to add multiple students at once.</p>

            <div className="mb-8 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Required Columns:</p>
                <a href={`data:text/csv;charset=utf-8,name,mobile,email,password,batch%0AJohn Doe,9876543210,john@example.com,pass123,%0AJane Smith,8765432109,jane@example.com,securepass,%0A`} download="demo_students.csv" className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-md transition-colors border border-indigo-100 cursor-pointer">
                  <Download size={12} /> Template CSV
                </a>
              </div>
              <div className="flex flex-wrap gap-2">
                 {['name', 'mobile', 'email', 'password', 'batch'].map(col => (
                    <span key={col} className="text-xs font-medium text-slate-700 bg-white px-2 py-1 rounded-md border border-slate-200 shadow-sm">{col}</span>
                 ))}
              </div>
            </div>
            
            <label className="block group cursor-pointer">
              <div className="border-2 border-dashed border-slate-200 group-hover:border-indigo-400 rounded-[2rem] p-10 text-center transition-all bg-slate-50/50 group-hover:bg-indigo-50/30">
                <div className="w-16 h-16 bg-white border border-slate-100 shadow-sm rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:border-indigo-100 group-hover:text-indigo-600 transition-all">
                   <Upload className="w-6 h-6 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                </div>
                <p className="text-sm font-bold text-slate-700 mb-1 group-hover:text-indigo-700 transition-colors">Click to select CSV file</p>
                <p className="text-xs font-medium text-slate-400">or drag and drop here</p>
                <input type="file" accept=".csv" className="hidden" onChange={handleCSVUpload} />
              </div>
            </label>
          </div>
        </div>
      )}

      {showPerfModal && studentPerf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowPerfModal(false)}>
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-indigo-50/80 to-transparent rounded-bl-full -z-10" />
            
            <div className="flex items-start justify-between mb-8">
               <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm border border-indigo-100/50">
                      <BarChart3 size={24} />
                    </div>
                    {selectedStudent?.name}'s Performance
                  </h3>
               </div>
               <button onClick={() => setShowPerfModal(false)} className="p-2 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-xl transition-all"><X size={20} /></button>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { label: 'Total Tests', value: studentPerf.analytics?.totalTests || 0, icon: Clock },
                { label: 'Average Score', value: `${Math.round(studentPerf.analytics?.avgScore || 0)}%`, icon: BarChart3 },
                { label: 'Peak Score', value: studentPerf.analytics?.bestScore || 0, icon: Award },
              ].map(s => (
                <div key={s.label} className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex flex-col items-center justify-center text-center">
                  <s.icon className="w-6 h-6 text-indigo-400 mb-2" />
                  <p className="text-2xl font-black text-slate-800 leading-none mb-1">{s.value}</p>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{s.label}</p>
                </div>
              ))}
            </div>
            
            <h4 className="text-xs font-bold text-slate-500 mb-4 uppercase tracking-widest border-b border-slate-100 pb-2">Recent Test Assessments</h4>
            {studentPerf.results && studentPerf.results.length > 0 ? (
               <div className="space-y-3 mb-8">
                 {studentPerf.results.map(r => {
                   const resultId = r._id || r.id;
                   return (
                     <div key={resultId} className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-4 hover:border-indigo-300 hover:shadow-md transition-all">
                        <div>
                          <p className="text-sm font-bold text-slate-800 mb-1">{r.test?.title || 'Unknown Test'}</p>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                               Score: {r.score} / {r.test?.totalMarks || '?'}
                            </span>
                            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                               Accuracy: {r.accuracy}%
                            </span>
                          </div>
                        </div>
                        <button onClick={() => { setShowPerfModal(false); navigate(`/institute/results/${resultId}`); }} 
                                className="px-4 py-2 bg-slate-50 text-slate-600 hover:bg-indigo-600 hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border border-slate-200 hover:border-indigo-600">
                          Detailed Analytics
                        </button>
                     </div>
                   );
                 })}
               </div>
            ) : (
               <div className="bg-slate-50 rounded-2xl p-8 text-center border border-dashed border-slate-200 mb-8">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">No completed test records found.</p>
               </div>
            )}

            <button onClick={() => setShowPerfModal(false)} className="w-full bg-slate-100 text-slate-600 font-bold py-4 rounded-xl text-xs uppercase tracking-wider hover:bg-slate-200 transition-all border border-slate-200">Close Window</button>
          </div>
        </div>
      )}

      {showBatchSelectModal && selectedCourseRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowBatchSelectModal(false)}>
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-2xl w-full max-w-md relative overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-50/80 to-transparent rounded-bl-full -z-10" />
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                 <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                   <BookOpen size={24} />
                 </div>
                 Assign Batch
              </h3>
              <button onClick={() => setShowBatchSelectModal(false)} className="p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-xl transition-all">
                <X size={20} />
              </button>
            </div>
            
            <p className="text-sm text-slate-600 mb-6">Select a batch to assign <strong>{selectedCourseRequest.student?.name}</strong> to for the course <strong>{selectedCourseRequest.course?.title}</strong>.</p>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">Select Batch <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select value={selectedBatchId} onChange={e => setSelectedBatchId(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl pl-4 pr-10 py-3 text-sm font-medium text-slate-700 focus:border-indigo-500 focus:ring-4 ring-indigo-50 transition-all outline-none appearance-none cursor-pointer shadow-sm">
                    <option value="">-- Choose Batch --</option>
                    {batches.filter(b => !b.courseId || b.courseId === selectedCourseRequest.courseId).map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-6">
                <button type="button" onClick={() => setShowBatchSelectModal(false)} className="flex-1 bg-white text-slate-600 font-bold py-3.5 rounded-xl text-xs uppercase tracking-wide hover:bg-slate-50 transition-all border border-slate-200">Cancel</button>
                <button type="button" onClick={() => handleApproveCourseRequest('approved')} className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-wide hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg shadow-emerald-200 hover:-translate-y-0.5">Confirm Approval</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  );
}
