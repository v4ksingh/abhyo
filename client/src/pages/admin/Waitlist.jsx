import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Trash2, Mail } from 'lucide-react';
import api from '../../lib/api';

const Waitlist = () => {
  const [waitlist, setWaitlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWaitlist();
  }, []);

  const fetchWaitlist = async () => {
    try {
      const res = await api.get('/admin/waitlist');
      if (res.data.success) {
        setWaitlist(res.data.waitlist);
      }
    } catch (error) {
      toast.error('Failed to fetch waitlist');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this entry?')) return;
    try {
      const res = await api.delete(`/admin/waitlist/${id}`);
      if (res.data.success) {
        toast.success('Entry removed');
        setWaitlist(waitlist.filter((item) => item.id !== id));
      }
    } catch (error) {
      toast.error('Failed to remove entry');
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Waitlist Management</h1>
          <p className="text-gray-500 text-sm mt-1">Manage early access subscriptions from the Coming Soon page</p>
        </div>
        <div className="bg-purple-100 text-purple-800 px-4 py-2 rounded-lg font-semibold flex items-center gap-2">
          <Mail size={16} /> Total: {waitlist.length}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-100">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email Address</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined Date</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {waitlist.length === 0 ? (
              <tr>
                <td colSpan="3" className="px-6 py-8 text-center text-gray-500">
                  No waitlist entries yet.
                </td>
              </tr>
            ) : (
              waitlist.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:text-red-900 transition-colors p-2 hover:bg-red-50 rounded-lg"
                      title="Delete Entry"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Waitlist;
