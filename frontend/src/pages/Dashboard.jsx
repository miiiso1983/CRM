import { useQuery } from '@tanstack/react-query';
import { dashboardAPI } from '../api/axios';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, Phone, TrendingUp, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import { STATUS_LABELS } from '../utils/constants';
import { formatDateTime } from '../utils/helpers';
import useAuthStore, { getRoleKey } from '../store/authStore';

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

function SubordinateStatsSection({ data = [] }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <TrendingUp size={18} className="text-primary-600" /> إحصائيات أداء المرؤوسين
        </h3>
        <span className="text-xs text-gray-400">تحديث تلقائي كل دقيقة</span>
      </div>

      {data.length > 0 ? (
        <>
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500">
                  <th className="py-3 px-3 text-right font-semibold">المندوب</th>
                  <th className="py-3 px-3 text-right font-semibold">مكالمات اليوم</th>
                  <th className="py-3 px-3 text-right font-semibold">العملاء المهتمون</th>
                  <th className="py-3 px-3 text-right font-semibold">العملاء الجدد هذا الشهر</th>
                  <th className="py-3 px-3 text-right font-semibold">المتعاقدون</th>
                  <th className="py-3 px-3 text-right font-semibold">متابعات اليوم</th>
                  <th className="py-3 px-3 text-right font-semibold">إجمالي العملاء</th>
                </tr>
              </thead>
              <tbody>
                {data.map((member) => (
                  <tr key={member.id} className="border-b border-gray-50 last:border-0">
                    <td className="py-3 px-3 font-semibold text-gray-900">{member.name}</td>
                    <td className="py-3 px-3 text-gray-700">{member.calls_today}</td>
                    <td className="py-3 px-3 text-gray-700">{member.interested_leads}</td>
                    <td className="py-3 px-3 text-gray-700">{member.new_leads_this_month}</td>
                    <td className="py-3 px-3 text-gray-700">{member.contracted_leads}</td>
                    <td className="py-3 px-3 text-gray-700">{member.follow_ups_due_today}</td>
                    <td className="py-3 px-3 text-gray-700">{member.total_assigned_leads}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 gap-3 md:hidden">
            {data.map((member) => (
              <div key={member.id} className="rounded-2xl border border-gray-100 p-4 bg-gray-50/70">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-gray-900">{member.name}</h4>
                  <span className="text-xs px-2 py-1 rounded-full bg-white text-gray-600 border border-gray-200">
                    {member.total_assigned_leads} عميل
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-gray-400">مكالمات اليوم</p><p className="font-bold text-gray-900">{member.calls_today}</p></div>
                  <div><p className="text-gray-400">العملاء المهتمون</p><p className="font-bold text-gray-900">{member.interested_leads}</p></div>
                  <div><p className="text-gray-400">الجدد هذا الشهر</p><p className="font-bold text-gray-900">{member.new_leads_this_month}</p></div>
                  <div><p className="text-gray-400">المتعاقدون</p><p className="font-bold text-gray-900">{member.contracted_leads}</p></div>
                  <div><p className="text-gray-400">متابعات اليوم</p><p className="font-bold text-gray-900">{member.follow_ups_due_today}</p></div>
                  <div><p className="text-gray-400">إجمالي العملاء</p><p className="font-bold text-gray-900">{member.total_assigned_leads}</p></div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="text-sm text-gray-400 text-center py-6">لا يوجد مندوبون تابعون لعرض الإحصائيات حالياً</p>
      )}
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
  const subordinateStats = data?.data?.subordinate_stats || [];
  const roleName = getRoleKey(user);
  const canViewSubordinateStats = ['manager', 'admin'].includes(roleName) || Number(user?.role?.level || 0) >= 2;

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

      {canViewSubordinateStats && <SubordinateStatsSection data={subordinateStats} />}

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
                  <stop offset="5%" stopColor="#2BB8B0" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#1A6085" stopOpacity={0.9} />
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
            <Calendar size={18} className="text-primary-500" /> الاجتماعات القادمة
          </h3>
          {upcomingMeetings.length > 0 ? (
            <div className="space-y-3">
              {upcomingMeetings.map(m => (
                <div key={m.id} className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar size={14} className="text-primary-500" />
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
            <Phone size={18} className="text-primary-700" /> آخر الأنشطة
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

