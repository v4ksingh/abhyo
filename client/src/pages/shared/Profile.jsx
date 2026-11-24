import React, { useState, useEffect } from 'react';
import { Save, User, Loader2, Building2, Search, Check, Building, GraduationCap, X, CheckSquare, ShieldCheck, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../lib/api';
import useAuthStore from '../../store/authStore';
import AdminProfile from '../admin/Profile';

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();

  if (['superadmin', 'admin', 'accountant', 'content_manager', 'teacher'].includes(user?.role)) {
    return <AdminProfile />;
  }
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    mobile: user?.mobile || '',
    city: user?.city || '',
    state: user?.state || '',
    language: user?.language || 'en',
    casteCategory: user?.casteCategory || '',
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  
  const [institutes, setInstitutes] = useState([]);
  const [instituteSearch, setInstituteSearch] = useState('');
  const [selectedInst, setSelectedInst] = useState(user?.institute || null);
  const [isSearchingInst, setIsSearchingInst] = useState(false);
  const [savingInst, setSavingInst] = useState(false);

  useEffect(() => {
    if (user?.role === 'student' && !selectedInst) {
      fetchInstitutes();
    }
  }, []);

  const fetchInstitutes = async (search = '') => {
    setIsSearchingInst(true);
    try {
      const res = await api.get('/public/institutes', { params: { search, limit: 20 } });
      setInstitutes(res.data.data || []);
    } catch (err) {
      console.error(err);
      setInstitutes([]);
    } finally {
      setIsSearchingInst(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      Object.keys(form).forEach(key => {
        if (form[key] !== undefined) formData.append(key, form[key]);
      });
      if (avatarFile) formData.append('avatar', avatarFile);

      const res = await api.put('/auth/update-profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      updateUser(res.data.user);
      toast.success('Identity Updated');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleJoinInstitute = async (instId) => {
    setSavingInst(true);
    try {
      const res = await api.patch('/student/update-institute', { instituteId: instId });
      updateUser(res.data.user);
      setSelectedInst(res.data.user.institute); // This works since we include it in the response
      toast.success('Join Request Sent');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Request failed');
    } finally {
      setSavingInst(false);
    }
  };

  const handleLeaveInstitute = async () => {
    if (!window.confirm('Unlink from institute? Any pending requests will be cancelled.')) return;
    setSavingInst(true);
    try {
      const res = await api.patch('/student/update-institute', { instituteId: null });
      updateUser(res.data.user);
      setSelectedInst(null);
      toast.success('Institute Unlinked');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Unlink failed');
    } finally {
      setSavingInst(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('Mismatch in passwords');
      return;
    }
    setSavingPass(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      toast.success('Key Protocol Updated');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Protocol update failed');
    } finally {
      setSavingPass(false);
    }
  };

  const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
  const getAvatarUrl = () => {
    if (avatarFile) return URL.createObjectURL(avatarFile);
    if (user?.avatar) return user.avatar.startsWith('http') ? user.avatar : `${API_URL}/uploads/${user.avatar}`;
    return null;
  };

  return (
    <div className="max-w-[800px] mx-auto space-y-6 pb-20 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between px-2">
         <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3 tracking-tighter">
           USER PROFILE
         </h1>
         <div className="flex items-center gap-2">
            <span className="bg-indigo-50 text-indigo-600 border border-indigo-100 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest">{user?.role}</span>
         </div>
      </div>

      {/* Main Container Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Avatar & Security */}
        <div className="md:col-span-4 space-y-6">
           <div className="bg-white p-6 rounded-[2rem] border-2 border-slate-100 shadow-sm text-center relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-600" />
              <label className="relative inline-block w-28 h-28 rounded-[2rem] overflow-hidden cursor-pointer border-4 border-slate-50 shadow-md mb-4 transition-transform hover:scale-105 active:scale-95">
                {getAvatarUrl() ? (
                  <img src={getAvatarUrl()} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-900 text-white text-3xl font-black flex items-center justify-center italic">
                    {user?.name?.charAt(0)}
                  </div>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={e => setAvatarFile(e.target.files[0])} />
              </label>
              <h2 className="text-lg font-black text-slate-900 leading-tight truncate">{user?.name}</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 truncate">{user?.email || user?.mobile}</p>
              
              <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-center gap-1.5">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-[9px] font-bold text-slate-500 uppercase">System Status: Active</span>
              </div>
           </div>

           {/* Security Panel */}
           <div className="bg-white p-6 rounded-[2.5rem] border-2 border-slate-100 shadow-sm space-y-4">
              <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                 <ShieldCheck size={16} className="text-indigo-600" /> CHANGE PASSWORD
              </h3>
              <form onSubmit={handleChangePassword} className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Current Password</label>
                    <input type="password" value={passwords.currentPassword} onChange={e => setPasswords({...passwords, currentPassword: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2.5 text-xs font-bold focus:bg-white focus:border-indigo-600 transition-all outline-none" required />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">New Password</label>
                    <input type="password" value={passwords.newPassword} onChange={e => setPasswords({...passwords, newPassword: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2.5 text-xs font-bold focus:bg-white focus:border-indigo-600 transition-all outline-none" minLength={6} required />
                 </div>
                 <button type="submit" disabled={savingPass} className="w-full bg-slate-900 text-white font-black py-4 rounded-xl text-[10px] uppercase tracking-widest hover:bg-black active:scale-[0.98] transition-all">
                    {savingPass ? 'UPDATING...' : 'UPDATE PASSWORD'}
                 </button>
              </form>
           </div>
        </div>

        {/* Right Column: Identity & Institute */}
        <div className="md:col-span-8 space-y-6">
           
           {/* Personal Information */}
           <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm relative overflow-hidden">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3 mb-6">
                 PERSONAL INFORMATION
              </h3>
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Legal Name</label>
                       <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-slate-100 border-2 border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:border-indigo-600 transition-all outline-none" required />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Mobile Number</label>
                       <input type="text" value={form.mobile} onChange={e => setForm({...form, mobile: e.target.value})} className="w-full bg-slate-100 border-2 border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:border-indigo-600 transition-all outline-none" />
                    </div>
                    <div className="col-span-1 md:col-span-2 space-y-1.5">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                       <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full bg-slate-100 border-2 border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:border-indigo-600 transition-all outline-none" />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Language Preference</label>
                       <select value={form.language} onChange={e => setForm({...form, language: e.target.value})} className="w-full bg-slate-100 border-2 border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:border-indigo-600 transition-all outline-none">
                          <option value="en">English (INTL)</option>
                          <option value="hi">Hindi (हिंदी)</option>
                       </select>
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Reservation Category</label>
                       <select value={form.casteCategory} onChange={e => setForm({...form, casteCategory: e.target.value})} className="w-full bg-slate-100 border-2 border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:border-indigo-600 transition-all outline-none">
                          <option value="">NOT SPECIFIED</option>
                          <option value="GEN">GENERAL</option>
                          <option value="OBC">OBC</option>
                          <option value="SC">SC</option>
                          <option value="ST">ST</option>
                          <option value="EWS">EWS</option>
                       </select>
                    </div>
                 </div>
                 <button type="submit" disabled={saving} className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    {saving ? 'SAVING...' : 'SAVE PROFILE CHANGES'}
                 </button>
              </form>
           </div>

           {/* Institutional Link with Approval Status */}
           {user?.role === 'student' && (
              <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500" />
                 <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                       <Building2 size={16} className="text-indigo-400" /> INSTITUTIONAL LINK
                    </h3>
                    {user?.instituteApprovalStatus === 'pending' && (
                       <span className="flex items-center gap-1.5 bg-amber-500/20 text-amber-500 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse border border-amber-500/30">
                          <Clock size={10} /> Approval Pending
                       </span>
                    )}
                    {user?.instituteApprovalStatus === 'approved' && (
                       <span className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-500 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-500/30">
                          <CheckCircle2 size={10} /> Verified Enrollment
                       </span>
                    )}
                 </div>
                 
                 {selectedInst ? (
                   <div className="flex items-center gap-5 bg-white/5 border border-white/10 p-5 rounded-3xl group">
                      <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-500">
                         <Building size={28} />
                      </div>
                      <div className="flex-1">
                         <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">
                            {user?.instituteApprovalStatus === 'pending' ? 'Queued Partner' : 'Certified Partner'}
                         </p>
                         <h4 className="text-lg font-black truncate">{selectedInst.name}</h4>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{selectedInst.city}, {selectedInst.state}</p>
                      </div>
                      <button onClick={handleLeaveInstitute} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-rose-500/20 text-white/40 hover:text-rose-500 flex items-center justify-center transition-all group-hover:bg-white/10" title="Unlink Institute">
                         <X size={18} />
                      </button>
                   </div>
                 ) : (
                   <div className="space-y-4">
                      <div className="relative">
                         <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                         <input 
                           type="text" 
                           placeholder="Search for your coaching center..."
                           className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 dark-input text-sm font-bold placeholder:text-slate-600 focus:bg-white/10 focus:border-indigo-500 outline-none transition-all"
                           value={instituteSearch}
                           onChange={(e) => {
                             setInstituteSearch(e.target.value);
                             fetchInstitutes(e.target.value);
                           }}
                         />
                      </div>
                      
                      {isSearchingInst ? (
                        <div className="flex justify-center py-4"><Loader2 className="animate-spin text-indigo-500" /></div>
                      ) : institutes.length > 0 ? (
                        <div className="grid grid-cols-1 gap-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                           {institutes.map(inst => (
                             <div key={inst.id} className="flex items-center justify-between p-3 bg-white/5 border border-transparent hover:border-white/10 rounded-2xl hover:bg-white/10 transition-all group">
                                <div className="flex items-center gap-3">
                                   <div className="w-9 h-9 bg-slate-800 text-slate-500 rounded-xl flex items-center justify-center group-hover:text-indigo-400 transition-colors">
                                      <Building size={16} />
                                   </div>
                                   <div>
                                      <p className="text-[11px] font-black truncate max-w-[170px] uppercase tracking-tight leading-tight">{inst.name}</p>
                                      <p className="text-[8px] font-black text-slate-500 uppercase">{inst.city}</p>
                                   </div>
                                </div>
                                <button 
                                  onClick={() => handleJoinInstitute(inst.id)} 
                                  disabled={savingInst}
                                  className="bg-indigo-600 text-white text-[9px] font-black uppercase px-4 py-2 rounded-xl hover:bg-indigo-500 transition-all active:scale-95 disabled:opacity-50"
                                >
                                   Link Now
                                </button>
                             </div>
                           ))}
                        </div>
                      ) : instituteSearch && (
                        <div className="flex flex-col items-center py-6 text-slate-600">
                           <AlertCircle size={24} className="mb-2 opacity-50" />
                           <p className="text-[10px] font-bold uppercase tracking-widest italic">Gateway Offline: No partners found.</p>
                        </div>
                      )}
                   </div>
                 )}
              </div>
           )}

        </div>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
        .dark-input:focus { box-shadow: 0 0 20px rgba(79, 70, 229, 0.1); }
      `}</style>
    </div>
  );
}
