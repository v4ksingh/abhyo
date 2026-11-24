import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Video, Search, CheckCircle, XCircle, ListVideo, PlayCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../lib/api';

export default function VideoSeriesAdmin() {
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', category: '', description: '', isFree: true, price: 0, isActive: true });
  const [editingId, setEditingId] = useState(null);

  // Video Management State
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [videoForm, setVideoForm] = useState({ title: '', description: '', videoUrl: '', videoType: 'youtube', duration: 0, order: 0, isFree: false });
  const [editingVideoId, setEditingVideoId] = useState(null);

  const fetchSeries = async () => {
    setLoading(true);
    try {
      const res = await api.get('/video-series/admin/list');
      setSeries(res.data?.data || []);
    } catch (err) {
      toast.error('Failed to load video series');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSeries(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/video-series/admin/${editingId}`, form);
        toast.success('Series updated');
      } else {
        await api.post('/video-series/admin/create', form);
        toast.success('Series created');
      }
      setShowModal(false);
      fetchSeries();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this series?')) return;
    try {
      await api.delete(`/video-series/admin/${id}`);
      toast.success('Deleted successfully');
      fetchSeries();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const openForm = (s = null) => {
    if (s) {
      setEditingId(s.id);
      setForm({ ...s });
    } else {
      setEditingId(null);
      setForm({ title: '', category: '', description: '', isFree: true, price: 0, isActive: true });
    }
    setShowModal(true);
  };

  // --- Video Management Functions ---
  const openManageVideos = async (s) => {
    setSelectedSeries(s);
    setLoadingVideos(true);
    try {
      const res = await api.get(`/video-series/admin/${s.id}/videos`);
      setVideos(res.data?.data || []);
    } catch {
      toast.error('Failed to load videos');
    } finally {
      setLoadingVideos(false);
    }
  };

  const closeManageVideos = () => {
    setSelectedSeries(null);
    setVideos([]);
    fetchSeries(); // Refresh main list to update counts
  };

  const openVideoForm = (v = null) => {
    if (v) {
      setEditingVideoId(v.id);
      setVideoForm({ ...v });
    } else {
      setEditingVideoId(null);
      setVideoForm({ title: '', description: '', videoUrl: '', videoType: 'youtube', duration: 0, order: videos.length + 1, isFree: false });
    }
    setVideoModalOpen(true);
  };

  const handleVideoSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSeries) return;
    try {
      if (editingVideoId) {
        await api.put(`/video-series/admin/${selectedSeries.id}/videos/${editingVideoId}`, videoForm);
        toast.success('Video updated');
      } else {
        await api.post(`/video-series/admin/${selectedSeries.id}/videos`, videoForm);
        toast.success('Video added');
      }
      setVideoModalOpen(false);
      // Refresh videos
      const res = await api.get(`/video-series/admin/${selectedSeries.id}/videos`);
      setVideos(res.data?.data || []);
    } catch (err) {
      toast.error('Failed to save video');
    }
  };

  const handleDeleteVideo = async (videoId) => {
    if (!window.confirm('Remove this video?')) return;
    try {
      await api.delete(`/video-series/admin/${selectedSeries.id}/videos/${videoId}`);
      toast.success('Video removed');
      setVideos(videos.filter(v => v.id !== videoId));
    } catch {
      toast.error('Failed to delete video');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Video Series</h1>
          <p className="text-sm text-slate-500">Manage video packages</p>
        </div>
        <button onClick={() => openForm()} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> New Series
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p>Loading...</p>
        ) : series.length === 0 ? (
          <p className="col-span-full text-center py-10 text-slate-500">No video series found.</p>
        ) : series.map(s => (
          <div key={s.id} className="card p-5 border border-slate-200 shadow-sm relative group">
            <h3 className="font-bold text-lg text-slate-800 mb-1">{s.title}</h3>
            <p className="text-sm text-slate-500 mb-3">{s.category || 'General'}</p>
            
            <div className="flex items-center gap-4 text-sm text-slate-600 mb-4">
              <span className="flex items-center gap-1"><Video size={14} /> {s.totalVideos} Videos</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${s.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {s.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="flex justify-between mt-auto pt-4 border-t border-slate-100">
              <div className="font-bold text-indigo-600">
                {s.isFree ? 'FREE' : `₹${s.price}`}
              </div>
              <div className="flex gap-2 text-sm">
                 <button onClick={() => openManageVideos(s)} className="btn-secondary !py-1 !px-2 flex items-center gap-1 hover:text-primary-600 bg-slate-50 border-slate-200">
                    <ListVideo size={14} /> Manage Videos
                 </button>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openForm(s)} className="p-1.5 text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-lg">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => handleDelete(s.id)} className="p-1.5 text-slate-400 hover:text-red-600 bg-slate-50 hover:bg-red-50 rounded-lg">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit Series' : 'New Series'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Title</label>
                <input required type="text" className="input-field" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
              </div>
              <div>
                <label className="label">Category</label>
                <input type="text" className="input-field" value={form.category} onChange={e => setForm({...form, category: e.target.value})} />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input-field" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.isFree} onChange={e => setForm({...form, isFree: e.target.checked})} />
                  Is Free?
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.isActive} onChange={e => setForm({...form, isActive: e.target.checked})} />
                  Active
                </label>
              </div>
              {!form.isFree && (
                <div>
                  <label className="label">Price (₹)</label>
                  <input type="number" className="input-field" value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
                </div>
              )}
              <div className="flex gap-3 justify-end pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">{editingId ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGE VIDEOS LIST MODAL */}
      {selectedSeries && !videoModalOpen && (
        <div className="modal-overlay" onClick={closeManageVideos}>
          <div className="modal-content !max-w-3xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <PlayCircle className="text-indigo-600" /> {selectedSeries.title} <span className="text-sm font-normal text-slate-500">— Videos</span>
              </h2>
              <button onClick={() => openVideoForm()} className="btn-primary !py-1.5 !px-3 text-sm flex items-center gap-1">
                <Plus size={16} /> Add Video
              </button>
            </div>
            
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
              {loadingVideos ? (
                <p className="text-slate-500 py-4">Loading videos...</p>
              ) : videos.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <Video size={32} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-slate-500 text-sm">No videos uploaded yet.</p>
                </div>
              ) : videos.map(v => (
                <div key={v.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 transition-colors gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-slate-100 text-slate-600 text-xs font-bold px-1.5 py-0.5 rounded">#{v.order}</span>
                      <h4 className="font-bold text-slate-800 truncate">{v.title}</h4>
                      {v.isFree && <span className="bg-green-100 text-green-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">FREE</span>}
                    </div>
                    <p className="text-xs text-slate-500 truncate">{v.videoUrl}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">{v.duration} mins</span>
                    <div className="flex gap-1">
                      <button onClick={() => openVideoForm(v)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDeleteVideo(v.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
              <button onClick={closeManageVideos} className="btn-secondary">Done</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD/EDIT VIDEO MODAL */}
      {videoModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="text-xl font-bold mb-4">{editingVideoId ? 'Edit Video' : 'Add New Video'}</h2>
            <form onSubmit={handleVideoSubmit} className="space-y-4">
              <div>
                <label className="label">Video Title</label>
                <input required type="text" className="input-field" value={videoForm.title} onChange={e => setVideoForm({...videoForm, title: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Platform</label>
                  <select className="input-field" value={videoForm.videoType} onChange={e => setVideoForm({...videoForm, videoType: e.target.value})}>
                    <option value="youtube">YouTube</option>
                    <option value="vimeo">Vimeo</option>
                    <option value="upload">Custom Upload / AWS</option>
                    <option value="external">External Link</option>
                  </select>
                </div>
                <div>
                  <label className="label">Duration (Mins)</label>
                  <input type="number" className="input-field" value={videoForm.duration} onChange={e => setVideoForm({...videoForm, duration: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="label">Video URL</label>
                <input required type="text" className="input-field" placeholder="e.g. https://youtube.com/..." value={videoForm.videoUrl} onChange={e => setVideoForm({...videoForm, videoUrl: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Sort Order</label>
                  <input type="number" className="input-field" value={videoForm.order} onChange={e => setVideoForm({...videoForm, order: e.target.value})} />
                </div>
                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 text-sm cursor-pointer font-medium text-slate-700">
                    <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" checked={videoForm.isFree} onChange={e => setVideoForm({...videoForm, isFree: e.target.checked})} />
                    Free Preview
                  </label>
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button type="button" onClick={() => setVideoModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">{editingVideoId ? 'Update Video' : 'Add Video'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
