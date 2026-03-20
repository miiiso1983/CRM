import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadsAPI } from '../../api/axios';
import { StatusBadge, PriorityBadge } from '../common/StatusBadge';
import LoadingSpinner from '../common/LoadingSpinner';
import { formatDate, formatDateTime } from '../../utils/helpers';
import { ACTIVITY_LABELS, CALL_RESULT_LABELS, STATUS_LABELS } from '../../utils/constants';
import { Phone, Clock, FileText, ArrowLeftRight } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function LeadDetail({ leadId, onClose, onUpdate }) {
  const queryClient = useQueryClient();
  const [activityForm, setActivityForm] = useState({ type: 'call', description: '', call_result: 'answered' });
  const [showActivity, setShowActivity] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['lead', leadId],
    queryFn: () => leadsAPI.getById(leadId),
  });

  const addActivityMutation = useMutation({
    mutationFn: (data) => leadsAPI.addActivity(leadId, data),
    onSuccess: () => {
      toast.success('تم تسجيل النشاط');
      queryClient.invalidateQueries(['lead', leadId]);
      onUpdate?.();
      setShowActivity(false);
      setActivityForm({ type: 'call', description: '', call_result: 'answered' });
    },
    onError: (err) => toast.error(err.message || 'حدث خطأ'),
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status) => leadsAPI.update(leadId, { status }),
    onSuccess: () => { toast.success('تم تحديث الحالة'); queryClient.invalidateQueries(['lead', leadId]); onUpdate?.(); },
    onError: (err) => toast.error(err.message || 'حدث خطأ'),
  });

  if (isLoading) return <LoadingSpinner />;

  const lead = data?.data;
  if (!lead) return <p className="text-center text-gray-400">لا توجد بيانات</p>;

  return (
    <div className="space-y-5">
      {/* Lead Info */}
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label text-xs">الاسم</label><p className="font-semibold">{lead.name}</p></div>
        <div><label className="label text-xs">رقم الهاتف</label>
          <a href={`tel:${lead.phone}`} className="font-mono text-primary-500 flex items-center gap-1 hover:underline">
            <Phone size={14} />{lead.phone}
          </a>
        </div>
        <div><label className="label text-xs">الشركة</label><p>{lead.company_name || '-'}</p></div>
        <div><label className="label text-xs">المنصب</label><p>{lead.position || '-'}</p></div>
        <div><label className="label text-xs">البريد</label><p>{lead.email || '-'}</p></div>
        <div><label className="label text-xs">الحالة</label>
          <select
            className="input-field text-sm mt-1"
            value={lead.status}
            onChange={(e) => updateStatusMutation.mutate(e.target.value)}
          >
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div><label className="label text-xs">الأولوية</label><PriorityBadge priority={lead.priority} /></div>
        <div><label className="label text-xs">تاريخ المتابعة</label>
          <p className={`font-medium ${lead.follow_up_date && new Date(lead.follow_up_date) < new Date() ? 'text-red-600' : 'text-gray-800'}`}>
            {formatDate(lead.follow_up_date) || '-'}
          </p>
        </div>
        <div><label className="label text-xs">المسؤول</label><p>{lead.assignee?.name || '-'}</p></div>
      </div>

      {lead.notes && (
        <div className="p-3 bg-gray-50 rounded-xl">
          <label className="label text-xs mb-1">الملاحظات</label>
          <p className="text-sm text-gray-700">{lead.notes}</p>
        </div>
      )}

      {/* Add Activity */}
      <div>
        <button onClick={() => setShowActivity(!showActivity)} className="btn-secondary text-sm w-full justify-center">
          <FileText size={15} /> {showActivity ? 'إخفاء نموذج النشاط' : 'تسجيل نشاط جديد'}
        </button>

        {showActivity && (
          <div className="mt-3 space-y-3 p-4 border border-gray-200 rounded-xl">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label text-xs">نوع النشاط</label>
                <select className="input-field text-sm" value={activityForm.type} onChange={e => setActivityForm(f => ({ ...f, type: e.target.value }))}>
                  {Object.entries(ACTIVITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              {activityForm.type === 'call' && (
                <div>
                  <label className="label text-xs">نتيجة المكالمة</label>
                  <select className="input-field text-sm" value={activityForm.call_result} onChange={e => setActivityForm(f => ({ ...f, call_result: e.target.value }))}>
                    {Object.entries(CALL_RESULT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div>
              <label className="label text-xs">الوصف *</label>
              <textarea className="input-field h-20 text-sm resize-none" placeholder="وصف النشاط..."
                value={activityForm.description}
                onChange={e => setActivityForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <button
              className="btn-primary text-sm"
              disabled={!activityForm.description || addActivityMutation.isPending}
              onClick={() => addActivityMutation.mutate(activityForm)}
            >
              {addActivityMutation.isPending ? 'جاري الحفظ...' : 'حفظ النشاط'}
            </button>
          </div>
        )}
      </div>

      {/* Activity Log */}
      <div>
        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Clock size={16} /> سجل الأنشطة ({lead.activities?.length || 0})
        </h4>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {lead.activities?.length > 0 ? (
            lead.activities.map(activity => (
              <div key={activity.id} className="flex gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-800">{activity.description}</p>
                  {activity.call_result && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      {CALL_RESULT_LABELS[activity.call_result]}
                    </span>
                  )}
                  <p className="text-xs text-gray-400 mt-1">{activity.user?.name} • {formatDateTime(activity.created_at)}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-400 py-4 text-sm">لا توجد أنشطة مسجلة</p>
          )}
        </div>
      </div>
    </div>
  );
}

