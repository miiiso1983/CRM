import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Phone, Calendar, Bell, LogOut,
  UserCog, BarChart3, Building2, ClipboardList,
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

const navItems = {
  sales: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'الرئيسية' },
    { to: '/leads', icon: Phone, label: 'العملاء المحتملون' },
    { to: '/calendar', icon: Calendar, label: 'التقويم' },
    { to: '/notifications', icon: Bell, label: 'الإشعارات' },
  ],
  manager: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'الرئيسية' },
    { to: '/leads', icon: ClipboardList, label: 'العملاء المحتملون' },
    { to: '/meetings', icon: Users, label: 'الاجتماعات' },
    { to: '/calendar', icon: Calendar, label: 'التقويم' },
    { to: '/notifications', icon: Bell, label: 'الإشعارات' },
  ],
  admin: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'الرئيسية' },
    { to: '/leads', icon: ClipboardList, label: 'جميع العملاء' },
    { to: '/meetings', icon: Users, label: 'الاجتماعات' },
    { to: '/calendar', icon: Calendar, label: 'التقويم' },
    { to: '/users', icon: UserCog, label: 'إدارة المستخدمين' },
    { to: '/reports', icon: BarChart3, label: 'التقارير' },
    { to: '/notifications', icon: Bell, label: 'الإشعارات' },
  ],
};

export default function Sidebar({ unreadCount = 0 }) {
  const { user, logout, isAdmin, isManager, isSales } = useAuthStore();
  const navigate = useNavigate();

  const roleName = isAdmin() ? 'admin' : isManager() ? 'manager' : 'sales';
  const items = navItems[roleName] || navItems.sales;

  const handleLogout = () => {
    logout();
    toast.success('تم تسجيل الخروج بنجاح');
    navigate('/login');
  };

  return (
    <div className="h-full flex flex-col bg-gradient-primary text-white w-64 fixed top-0 right-0 z-40 shadow-2xl">
      {/* Logo */}
      <div className="p-6 border-b border-white/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Building2 size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Al Team</h1>
            <p className="text-xs text-white/70">نظام إدارة العملاء</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="px-6 py-4 border-b border-white/20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/30 rounded-full flex items-center justify-center text-sm font-bold">
            {user?.name?.charAt(0) || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
            <p className="text-xs text-white/70">{user?.role?.name_ar}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 overflow-y-auto">
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'active' : ''}`
                }
              >
                <item.icon size={18} />
                <span>{item.label}</span>
                {item.to === '/notifications' && unreadCount > 0 && (
                  <span className="mr-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-white/20">
        <button onClick={handleLogout} className="sidebar-link w-full text-red-300 hover:text-red-200">
          <LogOut size={18} />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </div>
  );
}

