import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadsAPI, usersAPI } from '../api/axios';
import { Plus, Phone, Search, Filter, Download, ArrowLeftRight, Upload } from 'lucide-react';
import { StatusBadge, PriorityBadge } from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Modal from '../components/common/Modal';
import SearchBar from '../components/common/SearchBar';
import LeadForm from '../components/leads/LeadForm';
import LeadDetail from '../components/leads/LeadDetail';
import TransferModal from '../components/leads/TransferModal';
import BulkUploadModal from '../components/leads/BulkUploadModal';
import { formatDate, formatPhone } from '../utils/helpers';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import { STATUS_LABELS } from '../utils/constants';

export default function Leads() {
  const queryClient = useQueryClient();
  const { isAdmin, isManager } = useAuthStore();
  const [filters, setFilters] = useState({ page: 1, limit: 20, search: '', status: '', priority: '' });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [transferLead, setTransferLead] = useState(null);
  const [showPhoneSearch, setShowPhoneSearch] = useState(false);
  const [phoneSearchResult, setPhoneSearchResult] = useState(null);
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['leads', filters],
    queryFn: () => leadsAPI.getAll(filters),
  });

  const leads = data?.data || [];
  const pagination = data?.pagination || {};

  const handleSearch = (val) => setFilters(f => ({ ...f, search: val, page: 1 }));

  const handlePhoneSearch = async (phone) => {
    if (!phone) return;
    try {
      const res = await leadsAPI.searchByPhone(phone);
      setPhoneSearchResult(res);
      setShowPhoneSearch(true);
    } catch {
      toast.error('حدث خطأ في البحث');
    }
  };

  if (isLoading && !leads.length) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">العملاء المحتملون</h1>
          <p className="text-sm text-gray-500">إجمالي: {pagination.total || 0} عميل</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {!isManager() && (
            <>
              <button onClick={() => setShowBulkUpload(true)} className="btn-secondary flex items-center gap-1.5">
                <Upload size={16} /> رفع جماعي
              </button>
              <button onClick={() => setShowCreateModal(true)} className="btn-primary">
                <Plus size={16} /> إضافة عميل
              </button>
            </>
          )}
        </div>
      </div>

      {/* Phone Search Banner */}
      <div className="card bg-gradient-to-l from-blue-50 to-purple-50 border-blue-200">
        <div className="flex items-center gap-3 flex-wrap">
          <Phone size={20} className="text-blue-600" />
          <span className="font-semibold text-gray-700">البحث برقم الهاتف:</span>
          <div className="flex gap-2 flex-1 min-w-0">
            <input
              type="tel"
              className="input-field flex-1 min-w-0"
              placeholder="05XXXXXXXX"
              onKeyDown={(e) => e.key === 'Enter' && handlePhoneSearch(e.target.value)}
              id="phone-search-input"
            />
            <button
              className="btn-primary flex-shrink-0"
              onClick={() => handlePhoneSearch(document.getElementById('phone-search-input').value)}
            >
              <Search size={16} /> بحث
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <SearchBar onSearch={handleSearch} placeholder="بحث بالاسم أو رقم الهاتف..." className="flex-1 min-w-48" />
        <select
          className="input-field w-auto"
          value={filters.status}
          onChange={(e) => setFilters(f => ({ ...f, status: e.target.value, page: 1 }))}
        >
          <option value="">جميع الحالات</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select
          className="input-field w-auto"
          value={filters.priority}
          onChange={(e) => setFilters(f => ({ ...f, priority: e.target.value, page: 1 }))}
        >
          <option value="">جميع الأولويات</option>
          <option value="high">عالية</option>
          <option value="medium">متوسطة</option>
          <option value="low">منخفضة</option>
        </select>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">الاسم</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">رقم الهاتف</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">الشركة</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">المنصب</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">الحالة</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">الأولوية</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">المتابعة</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">المسؤول</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr><td colSpan={9} className="py-8"><LoadingSpinner size="sm" /></td></tr>
              ) : leads.length === 0 ? (
                <tr><td colSpan={9} className="py-12 text-center text-gray-400">لا توجد بيانات</td></tr>
              ) : (
                leads.map(lead => (
                  <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <button onClick={() => setSelectedLead(lead)} className="font-medium text-blue-600 hover:underline text-right">
                        {lead.name}
                      </button>
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-700">{formatPhone(lead.phone)}</td>
                    <td className="px-4 py-3 text-gray-600">{lead.company_name || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{lead.position || '-'}</td>
                    <td className="px-4 py-3"><StatusBadge status={lead.status} /></td>
                    <td className="px-4 py-3"><PriorityBadge priority={lead.priority} /></td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(lead.follow_up_date)}</td>
                    <td className="px-4 py-3 text-gray-600">{lead.assignee?.name || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <a href={`tel:${lead.phone}`} className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200" title="اتصال">
                          <Phone size={14} />
                        </a>
                        {!isManager() && (
                          <button onClick={() => setTransferLead(lead)} className="p-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200" title="تحويل">
                            <ArrowLeftRight size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 p-4 border-t border-gray-100">
            <button disabled={!pagination.hasPrev} onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))} className="btn-secondary disabled:opacity-50 text-sm">
              السابق
            </button>
            <span className="text-sm text-gray-600">صفحة {pagination.page} من {pagination.totalPages}</span>
            <button disabled={!pagination.hasNext} onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))} className="btn-secondary disabled:opacity-50 text-sm">
              التالي
            </button>
          </div>
        )}
      </div>

      {/* Create Lead Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="إضافة عميل محتمل جديد" size="lg">
        <LeadForm onSuccess={() => { setShowCreateModal(false); queryClient.invalidateQueries(['leads']); }} />
      </Modal>

      {/* Lead Detail Modal */}
      <Modal isOpen={!!selectedLead} onClose={() => setSelectedLead(null)} title={`تفاصيل العميل: ${selectedLead?.name}`} size="xl">
        {selectedLead && <LeadDetail leadId={selectedLead.id} onClose={() => setSelectedLead(null)} onUpdate={() => queryClient.invalidateQueries(['leads'])} />}
      </Modal>

      {/* Transfer Modal */}
      <Modal isOpen={!!transferLead} onClose={() => setTransferLead(null)} title="تحويل العميل إلى المدير">
        {transferLead && <TransferModal lead={transferLead} onClose={() => setTransferLead(null)} onSuccess={() => { setTransferLead(null); queryClient.invalidateQueries(['leads']); }} />}
      </Modal>

      {/* Bulk Upload Modal */}
      <Modal isOpen={showBulkUpload} onClose={() => setShowBulkUpload(false)} title="رفع العملاء بالجملة" size="lg">
        <BulkUploadModal onSuccess={() => { queryClient.invalidateQueries(['leads']); }} />
      </Modal>

      {/* Phone Search Result Modal */}
      <Modal isOpen={showPhoneSearch} onClose={() => { setShowPhoneSearch(false); setPhoneSearchResult(null); }} title="نتيجة البحث برقم الهاتف" size="lg">
        {phoneSearchResult && (
          <div>
            {phoneSearchResult.found ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                  <p className="text-green-700 font-semibold">✅ تم العثور على سجل لهذا الرقم</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="label">الاسم</label><p className="text-gray-900 font-medium">{phoneSearchResult.data.name}</p></div>
                  <div><label className="label">رقم الهاتف</label><p className="font-mono">{phoneSearchResult.data.phone}</p></div>
                  <div><label className="label">الشركة</label><p>{phoneSearchResult.data.company_name || '-'}</p></div>
                  <div><label className="label">الحالة</label><StatusBadge status={phoneSearchResult.data.status} /></div>
                </div>
                <div>
                  <label className="label">سجل الأنشطة ({phoneSearchResult.data.activities?.length || 0})</label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {phoneSearchResult.data.activities?.map(a => (
                      <div key={a.id} className="text-sm p-2 bg-gray-50 rounded-lg">
                        <p className="text-gray-800">{a.description}</p>
                        <p className="text-xs text-gray-400">{a.user?.name} • {formatDate(a.created_at, 'YYYY/MM/DD HH:mm')}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone size={24} className="text-gray-400" />
                </div>
                <p className="text-gray-600 font-medium">لا يوجد سجل لهذا الرقم</p>
                <p className="text-gray-400 text-sm mt-1">يمكنك إضافته كعميل جديد</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

