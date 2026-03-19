import { useQuery } from '@tanstack/react-query';
import { dashboardAPI, leadsAPI } from '../api/axios';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Download, BarChart3, TrendingUp, Users } from 'lucide-react';
import { STATUS_LABELS } from '../utils/constants';
import toast from 'react-hot-toast';
import { downloadBlob } from '../utils/helpers';

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#a855f7', '#ef4444', '#6366f1', '#14b8a6', '#84cc16'];

export default function Reports() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-reports'],
    queryFn: dashboardAPI.getData,
  });

  const handleExport = async () => {
    try {
      const blob = await dashboardAPI.export();
      downloadBlob(blob, `alteam-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success('تم تصدير التقرير بنجاح');
    } catch {
      toast.error('فشل تصدير التقرير');
    }
  };

  if (isLoading) return <LoadingSpinner text="جاري تحميل التقارير..." />;

  const stats = data?.data?.summary || {};
  const leadStats = data?.data?.lead_stats || [];
  const monthlyTrend = data?.data?.monthly_trend || [];
  const teamPerformance = data?.data?.team_performance || [];

  const pieData = leadStats.map(item => ({
    name: STATUS_LABELS[item.status] || item.status,
    value: parseInt(item.count),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 size={24} className="text-blue-600" /> التقارير والإحصائيات
          </h1>
          <p className="text-gray-500 text-sm mt-1">نظرة شاملة على أداء الفريق والمبيعات</p>
        </div>
        <button onClick={handleExport} className="btn-primary">
          <Download size={16} /> تصدير Excel
        </button>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي العملاء', value: stats.total_leads || 0, color: 'bg-blue-500', icon: '👥' },
          { label: 'تم التعاقد', value: stats.contracted || 0, color: 'bg-emerald-500', icon: '✅' },
          { label: 'نسبة التحويل', value: `${stats.conversion_rate || 0}%`, color: 'bg-purple-500', icon: '📊' },
          { label: 'متابعة اليوم', value: stats.today_follow_ups || 0, color: 'bg-amber-500', icon: '⏰' },
        ].map((kpi, i) => (
          <div key={i} className="card flex items-center gap-4">
            <div className={`${kpi.color} w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0`}>
              {kpi.icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
              <p className="text-sm text-gray-500">{kpi.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-blue-600" /> الاتجاه الشهري
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fontFamily: 'Cairo' }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [v, 'عميل']} />
              <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2.5}
                dot={{ fill: '#2563eb', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Status Distribution */}
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4">🎯 توزيع الحالات</h3>
          {pieData.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="45%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1.5 overflow-y-auto max-h-52">
                {pieData.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-gray-600 flex-1">{item.name}</span>
                    <span className="font-bold">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-400 py-10">لا توجد بيانات</p>
          )}
        </div>
      </div>

      {/* Team Performance */}
      {teamPerformance.length > 0 && (
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Users size={18} className="text-purple-600" /> أداء الفريق
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={teamPerformance} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fontFamily: 'Cairo' }} width={100} />
              <Tooltip formatter={(v) => [v, 'عميل']} />
              <Bar dataKey="total_leads" fill="#3b82f6" radius={[0, 4, 4, 0]} name="إجمالي العملاء" />
              <Bar dataKey="contracted" fill="#10b981" radius={[0, 4, 4, 0]} name="تم التعاقد" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

