import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  Heart,
  MessageSquare,
  UserPlus,
  Check,
  Trash2,
  CheckCheck,
  ArrowRight,
} from 'lucide-react';
import { NotificationItem } from '../types';
import { notificationsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface NotificationsPageProps {
  onNavigate: (page: string, params?: any) => void;
  onViewIdeaById: (postId: string) => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({
  onNavigate,
  onViewIdeaById,
}) => {
  const { setUnreadNotificationsCount } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await notificationsApi.getNotifications();
      if (res.success) {
        setNotifications(res.notifications);
        setUnreadNotificationsCount(res.unreadCount);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [setUnreadNotificationsCount]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadNotificationsCount(0);
    } catch {
      // ignore
    }
  };

  const handleMarkOneRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadNotificationsCount((prev) => Math.max(0, prev - 1));
    } catch {
      // ignore
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await notificationsApi.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch {
      // ignore
    }
  };

  const handleItemClick = (n: NotificationItem) => {
    if (!n.read) {
      handleMarkOneRead(n._id);
    }

    if (n.post) {
      const postId = typeof n.post === 'object' ? n.post._id : n.post;
      if (postId) onViewIdeaById(postId);
    } else if (n.sender) {
      const username = typeof n.sender === 'object' ? n.sender.username : null;
      if (username) onNavigate('profile', { username });
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />;
      case 'comment':
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'follow':
        return <UserPlus className="w-4 h-4 text-emerald-500" />;
      default:
        return <Bell className="w-4 h-4 text-amber-500" />;
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMins = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Notifications</h1>
          <p className="text-xs text-slate-500 mt-1">
            Activity and engagements with your ideas and profile.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            id="mark-all-read-btn"
            onClick={handleMarkAllAsRead}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark all as read</span>
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="bg-white rounded-2xl border border-slate-200/60 p-4 animate-pulse flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-full bg-slate-200" />
              <div className="flex-1 space-y-2">
                <div className="w-3/4 h-3 bg-slate-200 rounded" />
                <div className="w-1/4 h-2 bg-slate-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
            <Bell className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1">All caught up!</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            When people like your ideas, leave comments, or start following your work, you will see notifications here.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {notifications.map((n) => {
            const senderObj = typeof n.sender === 'object' ? n.sender : { name: 'Someone', username: 'user', avatar: '' };

            return (
              <div
                key={n._id}
                onClick={() => handleItemClick(n)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  n.read
                    ? 'bg-white border-slate-200/70 hover:border-slate-300'
                    : 'bg-blue-50/40 border-blue-200/80 hover:bg-blue-50/60 shadow-2xs'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative">
                    <img
                      src={
                        senderObj.avatar ||
                        `https://api.dicebear.com/7.x/shapes/svg?seed=${senderObj.username}`
                      }
                      alt={senderObj.name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200"
                    />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white shadow-xs border border-slate-200 flex items-center justify-center">
                      {getIcon(n.type)}
                    </div>
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-slate-800 leading-snug">
                      <span className="font-bold text-slate-900">{senderObj.name}</span>{' '}
                      <span className="text-slate-600">{n.text}</span>
                    </p>
                    <span className="text-[11px] text-slate-400">{formatTime(n.createdAt)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {!n.read && (
                    <span className="w-2 h-2 rounded-full bg-blue-600" title="Unread" />
                  )}

                  <button
                    onClick={(e) => handleDelete(e, n._id)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                    title="Delete notification"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
