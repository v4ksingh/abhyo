import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Send, History, CheckCircle, XCircle, Clock } from 'lucide-react';
import api from '../../lib/api';
import useAuthStore from '../../store/authStore';

const EmailBroadcast = () => {
  const { user } = useAuthStore();
  const isSuperadmin = user?.role === 'superadmin' || user?.role === 'admin';
  const [activeTab, setActiveTab] = useState('compose');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  
  const [formData, setFormData] = useState({
    subject: '',
    body: '',
    targetGroup: 'all'
  });

  useEffect(() => {
    if (activeTab === 'history') {
      fetchLogs();
    }
  }, [activeTab]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/emails/logs');
      if (res.data.success) {
        setLogs(res.data.data);
      }
    } catch (error) {
      toast.error('Failed to load email logs');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!formData.subject || !formData.body) {
      return toast.error('Subject and body are required');
    }

    if (!window.confirm('Are you sure you want to broadcast this email?')) return;

    try {
      setLoading(true);
      const res = await api.post('/admin/emails/broadcast', formData);
      if (res.data.success) {
        toast.success(res.data.message);
        setFormData({ subject: '', body: '', targetGroup: 'all' });
        setActiveTab('history');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to send broadcast');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Notifications</h1>
          <p className="text-gray-500 text-sm mt-1">Send broadcast emails to your users</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('compose')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'compose' ? 'bg-white text-indigo-600 shadow' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <Send size={16} className="inline mr-2" /> Compose
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'history' ? 'bg-white text-indigo-600 shadow' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <History size={16} className="inline mr-2" /> History Logs
          </button>
        </div>
      </div>

      {activeTab === 'compose' && (
        <form onSubmit={handleSend} className="bg-white rounded-xl shadow border border-gray-200 p-6">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
              <select
                value={formData.targetGroup}
                onChange={(e) => setFormData({...formData, targetGroup: e.target.value})}
                className="w-full border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 bg-white"
              >
                <option value="all">All Users (Students & Teachers)</option>
                <option value="students">All Students</option>
                <option value="teachers">All Teachers & Instructors</option>
                {isSuperadmin && <option value="institutes">All Institutes</option>}
                <option value="specific">Specific Email Addresses</option>
              </select>
            </div>

            {formData.targetGroup === 'specific' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Addresses (comma separated)</label>
                <input
                  type="text"
                  value={formData.specificEmails || ''}
                  onChange={(e) => setFormData({...formData, specificEmails: e.target.value})}
                  placeholder="user1@example.com, user2@example.com"
                  className="w-full border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 bg-white"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                placeholder="Enter email subject"
                className="w-full border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Body (HTML supported)</label>
              <textarea
                value={formData.body}
                onChange={(e) => setFormData({...formData, body: e.target.value})}
                rows="10"
                placeholder="<h1>Hello,</h1><p>Write your message here...</p>"
                className="w-full border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 font-mono text-sm text-gray-900 bg-white"
                required
              ></textarea>
              <p className="mt-2 text-xs text-gray-500">You can use basic HTML tags for formatting (e.g., &lt;b&gt;, &lt;br&gt;, &lt;a&gt;).</p>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg flex items-center gap-2 disabled:opacity-50"
            >
              <Send size={16} /> {loading ? 'Sending...' : 'Send Broadcast'}
            </button>
          </div>
        </form>
      )}

      {activeTab === 'history' && (
        <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Subject</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Target</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Recipients</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">Loading logs...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">No broadcast emails sent yet.</td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(log.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 max-w-xs truncate" title={log.subject}>
                      {log.subject}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                      {log.targetGroup.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.recipientCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {log.status === 'sent' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle size={14} /> Sent
                        </span>
                      ) : log.status === 'failed' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800" title={log.errorMessage}>
                          <XCircle size={14} /> Failed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <Clock size={14} /> Pending
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EmailBroadcast;
