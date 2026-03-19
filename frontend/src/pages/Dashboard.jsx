import { useQuery } from '@tanstack/react-query';
import { dashboardAPI } from '../api/axios';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, Phone, TrendingUp, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import { STATUS_LABELS } from '../utils/constants';
import { formatDateTime } from '../utils/helpers';
import useAuthStore from '../store/authStore';

const STATUS_PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#a855f7', '#ef4444', '#6366f1', '#14b8a6', '#84cc16'];

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className="text-3xl font-bold mt-1 text-gray-900">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon size={22} className="text-white" />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardAPI.getData,
    refetchInterval: 60000,
  });

  if (isLoading) return <LoadingSpinner text="جاري تحميل الإحصائيات..." />;

  const stats = data?.data?.summary || {};
  const leadStats = data?.data?.lead_stats || [];
  const monthlyTrend = data?.data?.monthly_trend || [];
  const recentActivities = data?.data?.recent_activities || [];
  const upcomingMeetings = data?.data?.upcoming_meetings || [];

  const pieData = leadStats.map(item => ({
    name: STATUS_LABELS[item.status] || item.status,
    value: parseInt(item.count),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          مرحباً، <span className="text-gradient">{user?.name} 👋</span>
        </h1>
        <p className="text-gray-500 mt-1">{user?.role?.name_ar} - Al Team CRM</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="إجمالي العملاء" value={stats.total_leads || 0} color="bg-blue-500" sub="جميع الحالات" />
        <StatCard icon={Phone} label="هذا الشهر" value={stats.this_month_leads || 0} color="bg-purple-500" sub="عميل جديد" />
        <StatCard icon={CheckCircle} label="تم التعاقد" value={stats.contracted || 0} color="bg-emerald-500" sub={`${stats.conversion_rate || 0}% نسبة التحويل`} />
        <StatCard icon={AlertCircle} label="متابعة اليوم" value={stats.today_follow_ups || 0} color="bg-amber-500" sub="يستوجب الاتصال" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4">📈 الاتجاه الشهري</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fontFamily: 'Cairo' }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [v, 'عميل']} />
              <Bar dataKey="count" fill="url(#gradient)" radius={[4, 4, 0, 0]} />
              <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.9} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status Pie */}
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4">🎯 توزيع الحالات</h3>
          {pieData.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={STATUS_PIE_COLORS[i % STATUS_PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {pieData.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: STATUS_PIE_COLORS[i % STATUS_PIE_COLORS.length] }} />
                    <span className="text-gray-600">{item.name}</span>
                    <span className="font-bold mr-auto">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">لا توجد بيانات</p>
          )}
        </div>
      </div>

      {/* Upcoming Meetings + Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Meetings */}
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar size={18} className="text-blue-600" /> الاجتماعات القادمة
          </h3>
          {upcomingMeetings.length > 0 ? (
            <div className="space-y-3">
              {upcomingMeetings.map(m => (
                <div key={m.id} className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar size={14} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">{m.title}</p>
                    <p className="text-xs text-gray-500">{m.lead?.name} • {formatDateTime(m.meeting_date)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-6 text-sm">لا توجد اجتماعات قادمة</p>
          )}
        </div>

        {/* Recent Activities */}
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Phone size={18} className="text-purple-600" /> آخر الأنشطة
          </h3>
          {recentActivities.length > 0 ? (
            <div className="space-y-3">
              {recentActivities.slice(0, 5).map(act => (
                <div key={act.id} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-800">{act.description}</p>
                    <p className="text-xs text-gray-400">{act.user?.name} • {formatDateTime(act.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-6 text-sm">لا توجد أنشطة حديثة</p>
          )}
        </div>
      </div>
    </div>
  );
}

