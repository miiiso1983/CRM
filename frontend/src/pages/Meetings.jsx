import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { meetingsAPI, leadsAPI } from '../api/axios';
import { Plus, Calendar, MapPin, Video, Phone, CheckCircle, X } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Modal from '../components/common/Modal';
import { formatDateTime } from '../utils/helpers';
import { MEETING_STATUS_LABELS, MEETING_TYPE_LABELS } from '../utils/constants';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

function MeetingCard({ meeting, onUpdate }) {
  const statusColors = {
    scheduled: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
    postponed: 'bg-yellow-100 text-yellow-700',
  };

  const typeIcons = { in_person: MapPin, online: Video, phone: Phone };
  const TypeIcon = typeIcons[meeting.meeting_type] || MapPin;

  return (
    <div className="card hover:shadow-card-hover transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-gray-900">{meeting.title}</h3>
          <p className="text-sm text-primary-500">{meeting.lead?.name} • {meeting.lead?.phone}</p>
        </div>
        <span className={`badge ${statusColors[meeting.status]}`}>{MEETING_STATUS_LABELS[meeting.status]}</span>
      </div>

      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-blue-500" />
          <span>{formatDateTime(meeting.meeting_date)}</span>
        </div>
        {meeting.location && (
          <div className="flex items-center gap-2">
            <TypeIcon size={14} className="text-blue-500" />
            <span>{meeting.location}</span>
          </div>
        )}
      </div>

      {meeting.description && (
        <p className="text-sm text-gray-500 mt-3 line-clamp-2">{meeting.description}</p>
      )}

      <div className="flex gap-2 mt-4">
        {meeting.status === 'scheduled' && (
          <>
            <button onClick={() => onUpdate(meeting.id, { status: 'completed' })} className="btn-secondary text-xs py-1.5 text-green-600 border-green-200 hover:bg-green-50">
              <CheckCircle size={13} /> مكتمل
            </button>
            <button onClick={() => onUpdate(meeting.id, { status: 'cancelled' })} className="btn-secondary text-xs py-1.5 text-red-600 border-red-200 hover:bg-red-50">
              <X size={13} /> ألغ
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function CreateMeetingForm({ onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [leadSearch, setLeadSearch] = useState('');
  const [leads, setLeads] = useState([]);
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm();
  const selectedLeadId = watch('lead_id');

  const searchLeads = async (query) => {
    setLeadSearch(query);
    if (query.length < 2) { setLeads([]); return; }
    try {
      const res = await leadsAPI.getAll({ search: query, limit: 10 });
      setLeads(res.data || []);
    } catch {}
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await meetingsAPI.create(data);
      toast.success('تم جدولة الاجتماع بنجاح');
      onSuccess?.();
    } catch (err) {
      toast.error(err.message || 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="label">البحث عن عميل *</label>
        <input type="text" className="input-field" placeholder="ابحث بالاسم أو رقم الهاتف..."
          value={leadSearch} onChange={e => searchLeads(e.target.value)} />
        {leads.length > 0 && (
          <div className="border border-gray-200 rounded-xl mt-1 max-h-40 overflow-y-auto shadow-md">
            {leads.map(l => (
              <button key={l.id} type="button" onClick={() => { setValue('lead_id', l.id); setLeadSearch(`${l.name} (${l.phone})`); setLeads([]); }}
                className="w-full text-right px-3 py-2 hover:bg-blue-50 text-sm border-b border-gray-100 last:border-0">
                {l.name} • {l.phone}
              </button>
            ))}
          </div>
        )}
        <input type="hidden" {...register('lead_id', { required: 'يجب اختيار عميل' })} />
        {errors.lead_id && <p className="text-red-500 text-xs mt-1">{errors.lead_id.message}</p>}
      </div>

      <div>
        <label className="label">عنوان الاجتماع *</label>
        <input type="text" className="input-field" placeholder="موضوع الاجتماع"
          {...register('title', { required: 'العنوان مطلوب' })} />
        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">التاريخ والوقت *</label>
          <input type="datetime-local" className="input-field"
            {...register('meeting_date', { required: 'التاريخ مطلوب' })} />
          {errors.meeting_date && <p className="text-red-500 text-xs mt-1">{errors.meeting_date.message}</p>}
        </div>
        <div>
          <label className="label">نوع الاجتماع</label>
          <select className="input-field" {...register('meeting_type')}>
            <option value="in_person">حضوري</option>
            <option value="online">عبر الإنترنت</option>
            <option value="phone">هاتفي</option>
          </select>
        </div>
      </div>

      <div>
        <label className="label">الموقع / الرابط</label>
        <input type="text" className="input-field" placeholder="مكان الاجتماع أو رابط الاجتماع الإلكتروني"
          {...register('location')} />
      </div>

      <div>
        <label className="label">وصف / ملاحظات</label>
        <textarea className="input-field h-20 resize-none" {...register('description')} />
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'جاري الجدولة...' : 'جدولة الاجتماع'}
        </button>
      </div>
    </form>
  );
}

export default function Meetings() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ status: '', page: 1 });
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['meetings', filters],
    queryFn: () => meetingsAPI.getAll(filters),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => meetingsAPI.update(id, data),
    onSuccess: () => { toast.success('تم تحديث الاجتماع'); queryClient.invalidateQueries(['meetings']); },
    onError: (err) => toast.error(err.message || 'حدث خطأ'),
  });

  const meetings = data?.data || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">الاجتماعات</h1>
          <p className="text-sm text-gray-500">إجمالي: {data?.pagination?.total || 0}</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus size={16} /> جدولة اجتماع
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {[['', 'الكل'], ['scheduled', 'مجدول'], ['completed', 'مكتمل'], ['cancelled', 'ملغي']].map(([val, label]) => (
          <button key={val} onClick={() => setFilters(f => ({ ...f, status: val }))}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filters.status === val ? 'bg-primary-500 text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'}`}>
            {label}
          </button>
        ))}
      </div>

      {isLoading ? <LoadingSpinner /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {meetings.length === 0 ? (
            <div className="col-span-full text-center py-16 text-gray-400">
              <Calendar size={40} className="mx-auto mb-3 opacity-30" />
              <p>لا توجد اجتماعات</p>
            </div>
          ) : (
            meetings.map(meeting => (
              <MeetingCard key={meeting.id} meeting={meeting}
                onUpdate={(id, data) => updateMutation.mutate({ id, data })} />
            ))
          )}
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="جدولة اجتماع جديد" size="lg">
        <CreateMeetingForm onSuccess={() => { setShowCreate(false); queryClient.invalidateQueries(['meetings']); }} />
      </Modal>
    </div>
  );
}

