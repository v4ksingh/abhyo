import React, { useState, useEffect, useRef } from 'react';
import { Megaphone, Users, CheckCircle2, ChevronDown, Send, Image as ImageIcon, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../lib/api';
import { getImageUrl } from '../../lib/imageUrl';

export default function Announcements() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    batchId: 'all',
    image: ''
  });

  useEffect(() => {
    api.get('/institute/batches')
      .then(res => setBatches(res.data.data || []))
      .catch(() => toast.error('Failed to load batches'))
      .finally(() => setLoading(false));
  }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setUploadingImg(true);
    const fd = new FormData();
    fd.append('image', file);

    try {
      const res = await api.post('/institute/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData(prev => ({ ...prev, image: res.data.url }));
      toast.success('Image uploaded successfully');
    } catch (err) {
      toast.error('Failed to upload image');
    } finally {
      setUploadingImg(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error('Please enter a title and message');
      return;
    }

    setSending(true);
    try {
      const res = await api.post('/institute/announcements', formData);
      toast.success(res.data.message || 'Announcement sent!');
      setFormData({ title: '', message: '', batchId: 'all', image: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send announcement');
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="card text-center py-10 text-slate-400">Loading workspace...</div>;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-10">
      <div>
        <h1 className="section-header flex items-center gap-2">
          <Megaphone className="w-8 h-8 text-indigo-600" />
          Send Announcements
        </h1>
        <p className="section-subheader">Broadcast important messages, updates, and reminders directly to your students' dashboard.</p>
      </div>

      <div className="card !p-0 overflow-hidden border-none shadow-xl shadow-slate-200/50">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-700 p-8 text-white">
          <h2 className="text-xl font-bold mb-2">Compose Message</h2>
          <p className="text-indigo-100 text-sm">Students will receive a real-time notification on their device.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 bg-white">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Target Audience</label>
            <div className="relative">
              <select
                className="input-field w-full appearance-none pr-10 border-slate-200 bg-slate-50 focus:bg-white"
                value={formData.batchId}
                onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
              >
                <option value="all">🌍 All Registered Students</option>
                {batches.map(b => (
                  <option key={b.id} value={b.id}>📁 Batch: {b.name}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-400">
                <ChevronDown className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {formData.batchId === 'all' ? 'Message will be delivered to every active student.' : 'Only students inside this specific batch will be notified.'}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Announcement Title</label>
            <input
              type="text"
              placeholder="E.g., Tomorrow's Mock Test Rescheduled"
              className="input-field w-full"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Message Content</label>
            <textarea
              placeholder="Type your detailed message here..."
              className="input-field w-full min-h-[120px] resize-y"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              maxLength={2000}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Attach Image (Optional)</label>
            {formData.image ? (
              <div className="relative w-48 h-32 rounded-xl overflow-hidden border-2 border-indigo-100 shadow-sm">
                <img src={getImageUrl(formData.image)} alt="Attachment" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, image: '' })}
                  className="absolute top-2 right-2 p-1 bg-white/90 rounded-full text-rose-500 hover:bg-rose-50 hover:text-rose-600 shadow-sm"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full sm:w-64 h-24 border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-indigo-50/50 transition-colors"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageUpload}
                />
                {uploadingImg ? (
                  <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <ImageIcon className="w-6 h-6 text-slate-400 mb-2" />
                    <span className="text-xs font-medium text-slate-500">Click to upload image</span>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
            <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Instant push delivery</span>
            </div>
            <button
              type="submit"
              disabled={sending || !formData.title || !formData.message}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 px-8 rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {sending ? 'Sending...' : (
                <>
                  <Send className="w-4 h-4 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
                  Broadcast Message
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
