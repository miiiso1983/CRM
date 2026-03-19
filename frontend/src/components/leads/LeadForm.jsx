import { useForm } from 'react-hook-form';
import { leadsAPI } from '../../api/axios';
import toast from 'react-hot-toast';
import { useState } from 'react';

export default function LeadForm({ onSuccess, initialData }) {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: initialData || {},
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      if (initialData?.id) {
        await leadsAPI.update(initialData.id, data);
        toast.success('تم تحديث العميل بنجاح');
      } else {
        await leadsAPI.create(data);
        toast.success('تم إضافة العميل بنجاح');
      }
      onSuccess?.();
    } catch (err) {
      if (err.existing_lead) {
        toast.error(`رقم الهاتف مسجل مسبقاً للعميل: ${err.existing_lead.name}`);
      } else {
        toast.error(err.message || 'حدث خطأ');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Phone */}
        <div>
          <label className="label">رقم الهاتف *</label>
          <input type="tel" className={`input-field ${errors.phone ? 'border-red-500' : ''}`}
            placeholder="05XXXXXXXX"
            {...register('phone', { required: 'رقم الهاتف مطلوب' })} />
          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
        </div>

        {/* Name */}
        <div>
          <label className="label">الاسم الكامل *</label>
          <input type="text" className={`input-field ${errors.name ? 'border-red-500' : ''}`}
            placeholder="اسم العميل"
            {...register('name', { required: 'الاسم مطلوب' })} />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>

        {/* Company */}
        <div>
          <label className="label">اسم الشركة</label>
          <input type="text" className="input-field" placeholder="اسم الشركة (اختياري)"
            {...register('company_name')} />
        </div>

        {/* Email */}
        <div>
          <label className="label">البريد الإلكتروني</label>
          <input type="email" className="input-field" placeholder="email@example.com"
            {...register('email')} />
        </div>

        {/* Position */}
        <div>
          <label className="label">المنصب / الوظيفة</label>
          <input type="text" className="input-field" placeholder="مدير مبيعات، مهندس... (اختياري)"
            {...register('position')} />
        </div>

        {/* Priority */}
        <div>
          <label className="label">الأولوية</label>
          <select className="input-field" {...register('priority')}>
            <option value="medium">متوسطة</option>
            <option value="high">عالية</option>
            <option value="low">منخفضة</option>
          </select>
        </div>

        {/* Source */}
        <div>
          <label className="label">مصدر العميل</label>
          <select className="input-field" {...register('source')}>
            <option value="">اختر المصدر</option>
            <option value="referral">إحالة</option>
            <option value="social_media">وسائل التواصل</option>
            <option value="website">الموقع الإلكتروني</option>
            <option value="call">مكالمة واردة</option>
            <option value="other">أخرى</option>
          </select>
        </div>

        {/* First Contact Date */}
        <div>
          <label className="label">تاريخ أول اتصال</label>
          <input type="date" className="input-field" {...register('first_contact_date')} />
        </div>

        {/* Follow-up Date */}
        <div>
          <label className="label">تاريخ المتابعة</label>
          <input type="date" className="input-field" {...register('follow_up_date')} />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="label">ملاحظات</label>
        <textarea className="input-field h-24 resize-none" placeholder="أضف ملاحظاتك هنا..."
          {...register('notes')} />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              جاري الحفظ...
            </span>
          ) : initialData ? 'تحديث البيانات' : 'إضافة العميل'}
        </button>
      </div>
    </form>
  );
}

