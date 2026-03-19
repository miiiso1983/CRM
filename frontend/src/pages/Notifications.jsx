import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsAPI } from '../api/axios';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Bell, Check, CheckCheck, Trash2 } from 'lucide-react';
import { formatRelative } from '../utils/helpers';
import toast from 'react-hot-toast';

const typeIcons = {
  follow_up_reminder: '⏰',
  meeting_reminder: '📅',
  lead_transferred: '↔️',
  lead_status_changed: '🔄',
  new_lead_assigned: '📋',
  system: '🔔',
};

export default function Notifications() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsAPI.getAll({ limit: 50 }),
    refetchInterval: 30000,
  });

  const markReadMutation = useMutation({
    mutationFn: notificationsAPI.markRead,
    onSuccess: () => queryClient.invalidateQueries(['notifications']),
  });

  const markAllReadMutation = useMutation({
    mutationFn: notificationsAPI.markAllRead,
    onSuccess: () => { toast.success('تم تحديد الكل كمقروء'); queryClient.invalidateQueries(['notifications']); },
  });

  const clearMutation = useMutation({
    mutationFn: notificationsAPI.clear,
    onSuccess: () => { toast.success('تم مسح الإشعارات المقروءة'); queryClient.invalidateQueries(['notifications']); },
  });

  const notifications = data?.data || [];
  const unreadCount = data?.unread_count || 0;

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell size={22} className="text-blue-600" /> الإشعارات
          </h1>
          {unreadCount > 0 && (
            <p className="text-sm text-blue-600">{unreadCount} إشعار غير مقروء</p>
          )}
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button onClick={() => markAllReadMutation.mutate()} className="btn-secondary text-sm">
              <CheckCheck size={14} /> تحديد الكل كمقروء
            </button>
          )}
          <button onClick={() => clearMutation.mutate()} className="btn-secondary text-sm text-red-600 border-red-200 hover:bg-red-50">
            <Trash2 size={14} /> مسح المقروءة
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-2">
        {notifications.length === 0 ? (
          <div className="card text-center py-16">
            <Bell size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-400">لا توجد إشعارات</p>
          </div>
        ) : (
          notifications.map(notif => (
            <div
              key={notif.id}
              className={`card cursor-pointer hover:shadow-card-hover transition-all ${!notif.is_read ? 'border-r-4 border-r-blue-500 bg-blue-50/50' : ''}`}
              onClick={() => !notif.is_read && markReadMutation.mutate(notif.id)}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">{typeIcons[notif.type] || '🔔'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className={`text-sm font-semibold ${!notif.is_read ? 'text-blue-900' : 'text-gray-800'}`}>
                      {notif.title_ar || notif.title}
                    </h4>
                    {!notif.is_read && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">{notif.body_ar || notif.body}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatRelative(notif.created_at)}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

