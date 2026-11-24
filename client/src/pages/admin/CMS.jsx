import React, { useEffect, useState } from 'react';
import { Layers, FileText, Check, AlertCircle, Loader, Edit, Save, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';

export default function CMS() {
  const [activeTab, setActiveTab] = useState('blog');

  // Blog state
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [editingPost, setEditingPost] = useState(null);
  const [postFormData, setPostFormData] = useState({ slug: '', title: '', excerpt: '', content: '', category: 'General', coverImage: '', readTime: '' });

  // Messages state
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  // Settings state
  const [settings, setSettings] = useState({
    socialLinks: { facebook: '', twitter: '', instagram: '', linkedin: '', youtube: '', whatsapp: '' }
  });
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    fetchPosts();
    fetchMessages();
    fetchSettings();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await api.get('/cms/blog');
      setPosts(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load blog posts');
    } finally {
      setLoadingPosts(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await api.get('/cms/contact');
      setMessages(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load messages');
    } finally {
      setLoadingMessages(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await api.get('/cms/settings');
      if (res.data.success) {
        const dbSettings = res.data.data;
        const socialSetting = dbSettings.find(s => s.key === 'socialLinks');
        if (socialSetting && socialSetting.value) {
          setSettings(prev => ({
            ...prev,
            socialLinks: { ...prev.socialLinks, ...JSON.parse(socialSetting.value) }
          }));
        }
      }
    } catch (err) {
      toast.error('Failed to load settings');
    } finally {
      setLoadingSettings(false);
    }
  };

  // --- Blog Handlers ---
  const startEditPost = (post) => {
    setEditingPost(post);
    setPostFormData({ i: post.id, slug: post.slug, title: post.title, excerpt: post.excerpt || '', content: post.content || '', category: post.category || 'General', coverImage: post.coverImage || '', readTime: post.readTime || '' });
  };

  const startNewPost = () => {
    setEditingPost({ isNew: true });
    setPostFormData({ slug: '', title: '', excerpt: '', content: '', category: 'General', coverImage: '', readTime: '' });
  };

  const handleSavePost = async (e) => {
    e.preventDefault();
    try {
      await api.post('/cms/blog', { ...postFormData, id: editingPost.id });
      toast.success('Post saved successfully!');
      setEditingPost(null);
      fetchPosts();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save post');
    }
  };

  const handleDeletePost = async (id) => {
    if(!window.confirm('Delete this post?')) return;
    try {
      await api.delete(`/cms/blog/${id}`);
      toast.success('Post deleted');
      fetchPosts();
    } catch (err) {
      toast.error('Failed to delete post');
    }
  };

  const updateMessageStatus = async (id, status) => {
    try {
      await api.put(`/cms/contact/${id}/status`, { status });
      fetchMessages();
    } catch (err) { toast.error('Failed to update status'); }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await api.post('/cms/settings', {
        socialLinks: JSON.stringify(settings.socialLinks)
      });
      toast.success('Settings saved successfully!');
    } catch (err) {
      toast.error('Failed to save settings');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Layers className="w-6 h-6 text-indigo-600" /> Content Management
        </h1>
        {activeTab === 'blog' && (
          <button onClick={startNewPost} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create Post
          </button>
        )}
      </div>

      <div className="flex space-x-2 border-b border-slate-200">
        {[
          { id: 'blog', label: 'Blog Posts' },
          { id: 'messages', label: 'Contact Messages' },
          { id: 'settings', label: 'Site Settings' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setEditingPost(null); }}
            className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${activeTab === tab.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>



      {activeTab === 'blog' && (
        <>
          {loadingPosts ? <div><Loader className="w-6 h-6 animate-spin text-indigo-600" /></div> : !editingPost ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-sm text-slate-500">
                  <tr>
                    <th className="p-4 font-semibold">Post Title</th>
                    <th className="p-4 font-semibold">Category</th>
                    <th className="p-4 font-semibold">Status</th>
                    <th className="p-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {posts.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="p-4 font-bold text-slate-900">{p.title}</td>
                      <td className="p-4 text-sm text-slate-500">{p.category}</td>
                      <td className="p-4"><span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded">{p.isPublished ? 'Published' : 'Draft'}</span></td>
                      <td className="p-4 text-right">
                        <button onClick={() => startEditPost(p)} className="text-indigo-600 hover:text-indigo-800 text-sm font-bold mr-4">Edit</button>
                        <button onClick={() => handleDeletePost(p.id)} className="text-red-600 hover:text-red-800 text-sm font-bold">Delete</button>
                      </td>
                    </tr>
                  ))}
                  {posts.length === 0 && (
                    <tr>
                      <td colSpan="4" className="p-8 text-center text-slate-500">No blog posts found. Create one to get started!</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900">{editingPost.isNew ? 'Create Post' : 'Edit Post'}</h2>
                <button onClick={() => setEditingPost(null)} className="text-slate-500 font-bold text-sm">Cancel</button>
              </div>
              <form onSubmit={handleSavePost} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Title</label>
                    <input required value={postFormData.title} onChange={e => setPostFormData({ ...postFormData, title: e.target.value })} className="w-full border border-slate-300 rounded-lg p-2 text-slate-900 bg-white outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Slug</label>
                    <input required value={postFormData.slug} onChange={e => setPostFormData({ ...postFormData, slug: e.target.value })} className="w-full border border-slate-300 rounded-lg p-2 text-slate-900 bg-white outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1">Excerpt</label>
                    <input value={postFormData.excerpt} onChange={e => setPostFormData({ ...postFormData, excerpt: e.target.value })} className="w-full border border-slate-300 rounded-lg p-2 text-slate-900 bg-white outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Category</label>
                    <input value={postFormData.category} onChange={e => setPostFormData({ ...postFormData, category: e.target.value })} className="w-full border border-slate-300 rounded-lg p-2 text-slate-900 bg-white outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Cover Image URL</label>
                    <input value={postFormData.coverImage} onChange={e => setPostFormData({ ...postFormData, coverImage: e.target.value })} className="w-full border border-slate-300 rounded-lg p-2 text-slate-900 bg-white outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">HTML Content</label>
                  <textarea required rows={10} value={postFormData.content} onChange={e => setPostFormData({ ...postFormData, content: e.target.value })} className="w-full border border-slate-300 rounded-lg p-2 font-mono text-sm text-slate-900 bg-white outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="pt-4 flex justify-end">
                  <button type="submit" className="bg-indigo-600 text-white font-bold py-2 px-6 rounded-xl shadow">Save Post</button>
                </div>
              </form>
            </div>
          )}
        </>
      )}

      {activeTab === 'messages' && (
        <div className="space-y-4">
          {loadingMessages ? <div><Loader className="w-6 h-6 animate-spin text-indigo-600" /></div> : messages.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">No contact messages received yet.</div>
          ) : messages.map(msg => (
            <div key={msg.id} className={`bg-white rounded-2xl border p-6 transition-colors ${msg.status === 'unread' ? 'border-indigo-300 bg-indigo-50/30' : 'border-slate-200'}`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{msg.subject}</h3>
                  <p className="text-sm text-slate-500">From: {msg.firstName} {msg.lastName} &lt;{msg.email}&gt; | {msg.phone}</p>
                  <p className="text-xs text-slate-400 mt-1">{new Date(msg.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <select 
                    value={msg.status} 
                    onChange={e => updateMessageStatus(msg.id, e.target.value)}
                    className="text-sm font-bold border border-slate-200 rounded-lg px-3 py-1 cursor-pointer bg-white"
                  >
                    <option value="unread">Unread</option>
                    <option value="read">Read</option>
                    <option value="replied">Replied</option>
                  </select>
                </div>
              </div>
              <div className="text-slate-700">
                <p className="whitespace-pre-wrap">{msg.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          {loadingSettings ? <div><Loader className="w-6 h-6 animate-spin text-indigo-600" /></div> : (
            <form onSubmit={handleSaveSettings} className="space-y-6 max-w-2xl">
              <h2 className="text-xl font-bold text-slate-900">Social Links</h2>
              <div className="space-y-4">
                {Object.keys(settings.socialLinks).map(platform => (
                  <div key={platform}>
                    <label className="block text-sm font-bold text-slate-700 capitalize mb-1">{platform}</label>
                    <input 
                      type="url" 
                      placeholder={`https://${platform}.com/...`}
                      value={settings.socialLinks[platform]}
                      onChange={(e) => setSettings({
                        ...settings,
                        socialLinks: { ...settings.socialLinks, [platform]: e.target.value }
                      })}
                      className="w-full border border-slate-300 rounded-lg p-2 text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button type="submit" className="bg-indigo-600 text-white font-bold py-2 px-6 rounded-xl shadow">Save Settings</button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
