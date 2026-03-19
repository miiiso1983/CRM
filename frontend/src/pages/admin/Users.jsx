import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersAPI } from '../../api/axios';
import { Plus, Edit2, ToggleLeft, ToggleRight, UserCog } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import { RoleBadge } from '../../components/common/StatusBadge';
import { useForm } from 'react-hook-form';
import { useQuery as useRolesQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';

function UserForm({ onSuccess, initialData }) {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: initialData || {} });

  const { data: managersData } = useQuery({ queryKey: ['managers'], queryFn: usersAPI.getManagers });
  const managers = managersData?.data || [];

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      if (initialData?.id) {
        await usersAPI.update(initialData.id, data);
        toast.success('تم تحديث المستخدم');
      } else {
        await usersAPI.create(data);
        toast.success('تم إنشاء المستخدم');
      }
      onSuccess?.();
    } catch (err) {
      toast.error(err.message || 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">الاسم الكامل *</label>
          <input type="text" className="input-field" {...register('name', { required: 'الاسم مطلوب' })} />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label className="label">البريد الإلكتروني *</label>
          <input type="email" className="input-field" {...register('email', { required: 'البريد مطلوب' })} />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <label className="label">{initialData ? 'كلمة المرور الجديدة' : 'كلمة المرور *'}</label>
          <input type="password" className="input-field" {...register('password', { required: !initialData && 'كلمة المرور مطلوبة', minLength: { value: 6, message: '6 أحرف على الأقل' } })} />
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
        </div>
        <div>
          <label className="label">رقم الهاتف</label>
          <input type="tel" className="input-field" {...register('phone')} />
        </div>
        <div>
          <label className="label">الدور *</label>
          <select className="input-field" {...register('role_id', { required: 'الدور مطلوب' })}>
            <option value="">اختر الدور</option>
            <option value="1">مدير عام (Level 3)</option>
            <option value="2">مدير مباشر (Level 2)</option>
            <option value="3">مندوب مبيعات (Level 1)</option>
          </select>
          {errors.role_id && <p className="text-red-500 text-xs mt-1">{errors.role_id.message}</p>}
        </div>
        <div>
          <label className="label">المدير المباشر</label>
          <select className="input-field" {...register('manager_id')}>
            <option value="">بدون مدير</option>
            {managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
      </div>
      <div className="flex justify-end">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'جاري الحفظ...' : initialData ? 'تحديث' : 'إنشاء المستخدم'}
        </button>
      </div>
    </form>
  );
}

export default function Users() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [filters, setFilters] = useState({ page: 1, search: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['users', filters],
    queryFn: () => usersAPI.getAll(filters),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }) => usersAPI.update(id, { is_active }),
    onSuccess: () => { toast.success('تم تحديث الحالة'); queryClient.invalidateQueries(['users']); },
    onError: (err) => toast.error(err.message),
  });

  const users = data?.data || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <UserCog size={22} className="text-blue-600" /> إدارة المستخدمين
          </h1>
          <p className="text-sm text-gray-500">إجمالي: {data?.pagination?.total || 0} مستخدم</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus size={16} /> مستخدم جديد
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">المستخدم</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">الدور</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">المدير</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">الحالة</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr><td colSpan={5} className="py-8"><LoadingSpinner size="sm" /></td></tr>
            ) : users.map(user => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </td>
                <td className="px-4 py-3"><RoleBadge role={user.role} /></td>
                <td className="px-4 py-3 text-gray-600 text-sm">{user.manager?.name || '-'}</td>
                <td className="px-4 py-3">
                  <span className={`badge ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {user.is_active ? 'نشط' : 'معطل'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => setEditUser(user)} className="p-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200">
                      <Edit2 size={13} />
                    </button>
                    <button onClick={() => toggleMutation.mutate({ id: user.id, is_active: !user.is_active })}
                      className={`p-1.5 rounded-lg ${user.is_active ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-green-100 text-green-600 hover:bg-green-200'}`}>
                      {user.is_active ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="إنشاء مستخدم جديد" size="lg">
        <UserForm onSuccess={() => { setShowCreate(false); queryClient.invalidateQueries(['users']); }} />
      </Modal>

      <Modal isOpen={!!editUser} onClose={() => setEditUser(null)} title={`تعديل: ${editUser?.name}`} size="lg">
        {editUser && <UserForm initialData={editUser} onSuccess={() => { setEditUser(null); queryClient.invalidateQueries(['users']); }} />}
      </Modal>
    </div>
  );
}

