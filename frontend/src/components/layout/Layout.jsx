import { Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { Bell, Menu, X } from 'lucide-react';
import Sidebar from './Sidebar';
import useAuthStore from '../../store/authStore';
import { notificationsAPI } from '../../api/axios';
import toast from 'react-hot-toast';

let socket;

export default function Layout() {
  const { user } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch unread notifications count
  const fetchUnreadCount = async () => {
    try {
      const res = await notificationsAPI.getAll({ limit: 1 });
      setUnreadCount(res.unread_count || 0);
    } catch {}
  };

  useEffect(() => {
    fetchUnreadCount();

    // Socket.io connection
    socket = io('/', { autoConnect: true });

    socket.on('connect', () => {
      if (user?.id) {
        socket.emit('join_room', user.id);
      }
    });

    socket.on('notification', (notification) => {
      setUnreadCount((prev) => prev + 1);
      toast(notification.title_ar || notification.title, {
        icon: '🔔',
        duration: 5000,
      });
    });

    return () => {
      socket?.disconnect();
    };
  }, [user?.id]);

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 right-0 h-full z-40 transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar unreadCount={unreadCount} />
      </div>

      {/* Main Content */}
      <div className="lg:mr-64 min-h-screen">
        {/* Top Bar */}
        <header className="bg-white shadow-sm sticky top-0 z-20 px-4 lg:px-6 py-3 flex items-center justify-between">
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="flex items-center gap-4 mr-auto">
            <button
              onClick={() => { fetchUnreadCount(); }}
              className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <Bell size={20} className="text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -left-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-l from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                {user?.name?.charAt(0) || '?'}
              </div>
              <span className="hidden sm:block text-sm font-medium text-gray-700">{user?.name}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

