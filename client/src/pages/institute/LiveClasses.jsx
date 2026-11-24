import React, { useState, useEffect } from 'react';
import { Video, Calendar as CalendarIcon, Users, Plus, Copy, Trash2, Clock, PlayCircle, Lock, Edit2, CheckCircle, BarChart3 } from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'react-hot-toast';
import useAuthStore from '../../store/authStore';

export default function LiveClasses() {
  const { user } = useAuthStore();
  const isInstitute = user?.role === 'institute';
  
  const [classes, setClasses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [filter, setFilter] = useState('all');
  
  const [form, setForm] = useState({
    title: '', topic: '', description: '', batchId: '', scheduledAt: '', 
    duration: 60, meetingUrl: '', meetingPlatform: 'Google Meet', meetingPassword: '',
    tags: '', isRecorded: false
  });

  const openCreateModal = () => {
    setEditId(null);
    setForm({ 
      title: '', topic: '', description: '', batchId: '', scheduledAt: '', 
      duration: 60, meetingUrl: '', meetingPlatform: 'Google Meet', meetingPassword: '',
      tags: '', isRecorded: false 
    });
    setShowModal(true);
  };

  const handleEdit = (cls) => {
    setEditId(cls.id);
    let sched = '';
    if (cls.scheduledAt) {
      sched = new Date(new Date(cls.scheduledAt).getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
    }
    setForm({
      title: cls.title,
      topic: cls.topic || '',
      description: cls.description || '',
      batchId: cls.batchId || '',
      scheduledAt: sched,
      duration: cls.duration,
      meetingUrl: cls.meetingUrl,
      meetingPlatform: cls.meetingPlatform || 'Google Meet',
      meetingPassword: cls.meetingPassword || '',
      tags: cls.tags || '',
      isRecorded: cls.isRecorded || false
    });
    setShowModal(true);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const endpoint = isInstitute ? '/institute/live-classes' : '/student/live-classes';
      const [clsRes, btcRes] = await Promise.all([
        api.get(endpoint),
        isInstitute ? api.get('/institute/batches') : Promise.resolve({ data: { data: [] } })
      ]);
      setClasses(clsRes.data.data || []);
      setBatches(btcRes.data.data || []);

      if (isInstitute) {
        const analyticsRes = await api.get('/institute/live-classes/analytics');
        setAnalytics(analyticsRes.data.data);
      }
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/institute/live-classes/${editId}`, form);
        toast.success('Live class updated!');
      } else {
        await api.post('/institute/live-classes', form);
        toast.success('Live class scheduled!');
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save live class');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this class?')) return;
    try {
      await api.delete(`/institute/live-classes/${id}`);
      toast.success('Deleted successfully');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete live class');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.patch(`/institute/live-classes/${id}/status`, { status: newStatus });
      toast.success(`Class marked as ${newStatus}`);
      fetchData();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const copyLink = (url) => {
    navigator.clipboard.writeText(url);
    toast.success('Meeting link copied!');
  };

  const filteredClasses = classes.filter(cls => filter === 'all' ? true : cls.status === filter);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">🎙️ Live Classes</h1>
          <p className="text-slate-500 mt-1">Schedule and manage your live interactive sessions</p>
        </div>
        {isInstitute && (
          <button onClick={openCreateModal} className="btn-primary flex items-center gap-2 px-6 py-2.5 shadow-lg shadow-indigo-500/30">
            <Plus size={18} /> Schedule Class
          </button>
        )}
      </div>

      {/* Analytics Cards */}
      {isInstitute && analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
              <Video size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Total</p>
              <h3 className="text-2xl font-black text-slate-800">{analytics.total}</h3>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center shrink-0">
              <PlayCircle size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Live Now</p>
              <h3 className="text-2xl font-black text-slate-800">{analytics.live}</h3>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
              <CheckCircle size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Completed</p>
              <h3 className="text-2xl font-black text-slate-800">{analytics.completed}</h3>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
              <CalendarIcon size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">This Week</p>
              <h3 className="text-2xl font-black text-slate-800">{analytics.thisWeek}</h3>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl w-fit overflow-x-auto">
        {['all', 'scheduled', 'live', 'completed', 'cancelled'].map(f => (
          <button 
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-bold capitalize transition-all ${filter === f ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Classes Grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-64 rounded-3xl" />)}
        </div>
      ) : filteredClasses.length === 0 ? (
        <div className="card text-center py-20 border-2 border-dashed border-slate-200 bg-slate-50">
          <div className="w-20 h-20 bg-indigo-100/50 rounded-full flex items-center justify-center mx-auto mb-5">
             <Video className="w-10 h-10 text-indigo-500" />
          </div>
          <h3 className="text-2xl font-black text-slate-800 mb-2">No Classes Found</h3>
          <p className="text-slate-500 max-w-sm mx-auto font-medium leading-relaxed">There are no live classes matching your current filter.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map(cls => {
            const isLive = cls.status === 'live';
            const isCompleted = cls.status === 'completed';
            const isCancelled = cls.status === 'cancelled';
            const isScheduled = cls.status === 'scheduled';
            
            const statusTheme = isLive 
              ? 'from-red-500 to-rose-600'
              : isCompleted 
                ? 'from-emerald-500 to-teal-600' 
                : isCancelled
                  ? 'from-slate-500 to-slate-600'
                  : 'from-indigo-500 to-violet-600';

            return (
              <div key={cls.id} className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col group">
                <div className={`p-5 relative overflow-hidden bg-gradient-to-br ${statusTheme}`}>
                  <div className="absolute top-0 right-0 p-4 opacity-20">
                    <Video className="w-32 h-32 -mt-10 -mr-10" />
                  </div>
                  
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-3">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider backdrop-blur-md bg-white/20 text-white border border-white/20">
                        {isLive && <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>}
                        {cls.status}
                      </div>

                      {isInstitute && (
                        <div className="flex gap-2">
                          <button onClick={() => handleEdit(cls)} className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleDelete(cls.id)} className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <h3 className="font-extrabold text-white text-xl mb-1 line-clamp-2" title={cls.title}>{cls.title}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-white/90 text-[10px] font-bold uppercase tracking-wider bg-black/10 px-2 py-0.5 rounded border border-white/10">{cls.meetingPlatform}</span>
                      {cls.isRecorded && <span className="text-white/90 text-[10px] font-bold uppercase tracking-wider bg-black/10 px-2 py-0.5 rounded border border-white/10">Recorded</span>}
                    </div>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col gap-4">
                  {cls.topic && <p className="text-sm font-semibold text-slate-600 line-clamp-2 bg-slate-50 p-3 rounded-2xl border border-slate-100">{cls.topic}</p>}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white border border-slate-200 p-3 rounded-2xl flex flex-col gap-2">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                        <CalendarIcon size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">Scheduled</p>
                        <p className="text-xs font-black text-slate-800 leading-tight mt-1">
                          {new Date(cls.scheduledAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 p-3 rounded-2xl flex flex-col gap-2">
                      <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                        <Clock size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">Duration</p>
                        <p className="text-xs font-black text-slate-800 leading-tight mt-1">{cls.duration} mins</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-blue-500" />
                      <span>{cls.batch ? cls.batch.name : 'All Students'}</span>
                    </div>
                  </div>
                  
                  {isInstitute && (
                    <div className="flex gap-2 pt-2 border-t border-slate-100">
                      {isScheduled && (
                        <button onClick={() => handleStatusChange(cls.id, 'live')} className="flex-1 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-xs font-bold transition-colors">Go Live</button>
                      )}
                      {isLive && (
                        <button onClick={() => handleStatusChange(cls.id, 'completed')} className="flex-1 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl text-xs font-bold transition-colors">Mark Completed</button>
                      )}
                      {(isScheduled || isLive) && (
                        <button onClick={() => handleStatusChange(cls.id, 'cancelled')} className="flex-1 py-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl text-xs font-bold transition-colors">Cancel</button>
                      )}
                    </div>
                  )}
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
                  <a href={cls.meetingUrl} target="_blank" rel="noopener noreferrer" 
                     className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                       isCancelled ? 'bg-slate-200 text-slate-500 pointer-events-none' :
                       isCompleted ? 'bg-slate-200 text-slate-500 pointer-events-none' :
                       isLive ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/30' : 
                       'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30'
                     }`}>
                    {isCancelled || isCompleted ? <Lock size={16} /> : <PlayCircle size={18} className="animate-pulse" />} 
                    {isCancelled ? 'Cancelled' : isCompleted ? 'Ended' : isLive ? 'Join Live Now' : 'Join Class'}
                  </a>
                  
                  {isInstitute && !isCancelled && !isCompleted && (
                    <button onClick={() => copyLink(cls.meetingUrl)} className="w-12 h-12 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl flex items-center justify-center transition-colors shrink-0" title="Copy Link">
                      <Copy size={18} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-2xl font-black text-slate-900 mb-6">{editId ? 'Edit Live Class' : 'Schedule Live Class'}</h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label">Class Title *</label>
                <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="input-field" placeholder="e.g. Physics Revision - Mechanics" required />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="label">Topic/Agenda</label>
                  <input type="text" value={form.topic} onChange={e => setForm({...form, topic: e.target.value})} className="input-field" placeholder="Main topic to cover" />
                </div>
                <div>
                  <label className="label">Select Batch</label>
                  <select value={form.batchId} onChange={e => setForm({...form, batchId: e.target.value})} className="input-field">
                    <option value="">-- Open for all my students --</option>
                    {batches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Detailed Description</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input-field resize-none h-24" placeholder="What students will learn..."></textarea>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="label">Scheduled Time *</label>
                  <input type="datetime-local" value={form.scheduledAt} onChange={e => setForm({...form, scheduledAt: e.target.value})} className="input-field" required />
                </div>
                <div>
                  <label className="label">Duration (mins) *</label>
                  <input type="number" min="15" value={form.duration} onChange={e => setForm({...form, duration: e.target.value})} className="input-field" required />
                </div>
              </div>

              <div className="space-y-5 p-5 bg-slate-50 border border-slate-200 rounded-2xl mt-6">
                <h4 className="text-base font-bold text-slate-800 flex items-center gap-2"><Video size={18}/> Meeting Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                   <div>
                    <label className="label">Platform</label>
                    <select value={form.meetingPlatform} onChange={e => setForm({...form, meetingPlatform: e.target.value})} className="input-field">
                      <option value="Google Meet">Google Meet</option>
                      <option value="Zoom">Zoom</option>
                      <option value="Microsoft Teams">Microsoft Teams</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Meeting Password</label>
                    <input type="text" value={form.meetingPassword} onChange={e => setForm({...form, meetingPassword: e.target.value})} className="input-field" placeholder="Leave empty if none" />
                  </div>
                </div>
                <div>
                  <label className="label">Meeting URL/Link *</label>
                  <input type="url" value={form.meetingUrl} onChange={e => setForm({...form, meetingUrl: e.target.value})} className="input-field" placeholder="https://meet.google.com/..." required />
                </div>
                <label className="flex items-center gap-3 cursor-pointer p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50">
                  <input type="checkbox" checked={form.isRecorded} onChange={e => setForm({...form, isRecorded: e.target.checked})} className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300" />
                  <span className="font-semibold text-slate-700">This session will be recorded</span>
                </label>
              </div>

              <div className="flex gap-4 pt-6 mt-6 border-t border-slate-100">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 py-3">Cancel</button>
                <button type="submit" className="btn-primary flex-1 py-3 shadow-lg shadow-indigo-500/30">{editId ? 'Save Changes' : 'Schedule Class'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
