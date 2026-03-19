import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { leadsAPI, usersAPI } from '../../api/axios';
import toast from 'react-hot-toast';
import { ArrowLeftRight } from 'lucide-react';

export default function TransferModal({ lead, onClose, onSuccess }) {
  const [selectedManager, setSelectedManager] = useState('');

  const { data: managersData, isLoading } = useQuery({
    queryKey: ['managers'],
    queryFn: usersAPI.getManagers,
  });

  const managers = managersData?.data || [];

  const transferMutation = useMutation({
    mutationFn: () => leadsAPI.transfer(lead.id, { manager_id: parseInt(selectedManager) }),
    onSuccess: () => {
      toast.success('تم تحويل العميل بنجاح');
      onSuccess?.();
    },
    onError: (err) => toast.error(err.message || 'حدث خطأ'),
  });

  return (
    <div className="space-y-5">
      {/* Lead Info */}
      <div className="p-4 bg-blue-50 rounded-xl">
        <p className="font-semibold text-blue-900">{lead.name}</p>
        <p className="text-sm text-blue-700">{lead.phone}</p>
      </div>

      <div>
        <label className="label">اختر المدير المباشر</label>
        {isLoading ? (
          <p className="text-gray-400 text-sm">جاري تحميل المديرين...</p>
        ) : managers.length === 0 ? (
          <p className="text-gray-400 text-sm">لا يوجد مديرون متاحون</p>
        ) : (
          <select
            className="input-field"
            value={selectedManager}
            onChange={e => setSelectedManager(e.target.value)}
          >
            <option value="">-- اختر مديراً --</option>
            {managers.map(m => (
              <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
            ))}
          </select>
        )}
      </div>

      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
        ⚠️ بعد التحويل، سيتمكن المدير المباشر من رؤية هذا العميل وإدارة اجتماعاته.
      </div>

      <div className="flex justify-end gap-3">
        <button className="btn-secondary" onClick={onClose}>إلغاء</button>
        <button
          className="btn-primary"
          disabled={!selectedManager || transferMutation.isPending}
          onClick={() => transferMutation.mutate()}
        >
          <ArrowLeftRight size={16} />
          {transferMutation.isPending ? 'جاري التحويل...' : 'تحويل العميل'}
        </button>
      </div>
    </div>
  );
}

