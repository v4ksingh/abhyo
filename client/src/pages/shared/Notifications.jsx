import React, { useEffect, useState } from 'react';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../lib/api';

import useAuthStore from '../../store/authStore';

const typeIcons = {
  test_assigned: '📝',
  test_reminder: '⏰',
  result_published: '📊',
  institute_approved: '✅',
  payment_success: '💳',
  general: '🔔',
};

export default function NotificationsPage() {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    try {
      const res = await api.get('/notifications');
      let list = res.data.data || [];
      if (user?.isOlympiadUser) {
        list = list.filter(n => {
          const text = `${n.title || ''} ${n.message || ''}`.toLowerCase();
          return !text.includes('free trial') && !text.includes('trial activated');
        });
      }
      setNotifications(list);
      setUnreadCount(list.filter(n => !n.isRead).length);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const markRead = async (id) => {
    await api.patch(`/notifications/${id}/read`);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    await api.patch('/notifications/read-all');
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
    toast.success('All notifications marked as read');
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-header">🔔 Notifications</h1>
          <p className="section-subheader">{unreadCount} unread</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="btn-secondary flex items-center gap-2 !py-2 !px-3 !text-xs">
            <CheckCheck size={14} /> Mark All Read
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-16" />)}</div>
      ) : notifications.length === 0 ? (
        <div className="card text-center py-12">
          <Bell className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <p className="text-slate-500">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <div key={n.id}
              onClick={() => !n.isRead && markRead(n.id)}
              className={`card flex items-start gap-4 cursor-pointer transition-all !py-4 !px-4
                ${!n.isRead ? 'border-primary-500/30 bg-primary-500/5' : 'opacity-70'}`}>
              <span className="text-2xl flex-shrink-0">{typeIcons[n.type] || '🔔'}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 text-sm">{n.title}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{n.message}</p>
                <p className="text-xs text-slate-500 mt-1">{new Date(n.createdAt).toLocaleString('en-IN')}</p>
              </div>
              {!n.isRead && <div className="w-2 h-2 rounded-full bg-primary-500 mt-1 flex-shrink-0" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
