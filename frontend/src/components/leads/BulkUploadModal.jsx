import { useState, useRef } from 'react';
import { leadsAPI } from '../../api/axios';
import { Upload, FileSpreadsheet, CheckCircle, XCircle, AlertTriangle, Download } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BulkUploadModal({ onSuccess }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState(null);
  const fileRef = useRef();

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) {
      setFile(f);
      setResults(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return toast.error('يرجى اختيار ملف');
    setUploading(true);
    try {
      const res = await leadsAPI.bulkUpload(file);
      setResults(res.results);
      toast.success(res.message);
      if (res.results.created > 0) onSuccess?.();
    } catch (err) {
      toast.error(err.message || 'حدث خطأ أثناء الرفع');
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const headers = ['الاسم,رقم الهاتف,الشركة,البريد الإلكتروني,المصدر,الأولوية,ملاحظات'];
    const sample = ['أحمد محمد,0512345678,شركة التقنية,ahmed@example.com,website,high,عميل مهتم'];
    const csv = '\uFEFF' + headers.join('\n') + '\n' + sample.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leads_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Template Download */}
      <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-blue-800 font-semibold text-sm">📋 قالب الملف</p>
            <p className="text-blue-600 text-xs mt-1">حمّل القالب واملأه ببيانات العملاء</p>
          </div>
          <button onClick={downloadTemplate} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
            <Download size={14} /> تحميل القالب
          </button>
        </div>
        <div className="mt-3 text-xs text-blue-700 space-y-1">
          <p>• الأعمدة المطلوبة: <strong>الاسم</strong> و <strong>رقم الهاتف</strong></p>
          <p>• الأعمدة الاختيارية: الشركة، البريد، المصدر، الأولوية (low/medium/high)، ملاحظات</p>
          <p>• الصيغ المدعومة: CSV, Excel (.xlsx, .xls)</p>
        </div>
      </div>

      {/* File Upload */}
      <div
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          file ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
        }`}
      >
        <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} className="hidden" />
        {file ? (
          <div className="flex items-center justify-center gap-3">
            <FileSpreadsheet size={28} className="text-green-600" />
            <div className="text-right">
              <p className="font-semibold text-green-700">{file.name}</p>
              <p className="text-xs text-green-600">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
          </div>
        ) : (
          <div>
            <Upload size={32} className="mx-auto text-gray-400 mb-2" />
            <p className="text-gray-600 font-medium">اسحب الملف هنا أو اضغط للاختيار</p>
            <p className="text-xs text-gray-400 mt-1">CSV, Excel — حد أقصى 10MB</p>
          </div>
        )}
      </div>

      {/* Upload Button */}
      {file && !results && (
        <button onClick={handleUpload} disabled={uploading} className="btn-primary w-full justify-center">
          {uploading ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              جاري الرفع والمعالجة...
            </span>
          ) : (
            <span className="flex items-center gap-2"><Upload size={16} /> رفع ومعالجة الملف</span>
          )}
        </button>
      )}

      {/* Results */}
      {results && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-green-50 rounded-xl text-center border border-green-200">
              <CheckCircle size={20} className="mx-auto text-green-600 mb-1" />
              <p className="text-xl font-bold text-green-700">{results.created}</p>
              <p className="text-xs text-green-600">تم إضافتهم</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-xl text-center border border-yellow-200">
              <AlertTriangle size={20} className="mx-auto text-yellow-600 mb-1" />
              <p className="text-xl font-bold text-yellow-700">{results.duplicates}</p>
              <p className="text-xs text-yellow-600">مكرر</p>
            </div>
            <div className="p-3 bg-red-50 rounded-xl text-center border border-red-200">
              <XCircle size={20} className="mx-auto text-red-600 mb-1" />
              <p className="text-xl font-bold text-red-700">{results.errors}</p>
              <p className="text-xs text-red-600">أخطاء</p>
            </div>
          </div>

          {/* Details table */}
          {results.details.length > 0 && (
            <div className="max-h-48 overflow-y-auto border rounded-xl">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-right px-3 py-2">صف</th>
                    <th className="text-right px-3 py-2">الاسم</th>
                    <th className="text-right px-3 py-2">الهاتف</th>
                    <th className="text-right px-3 py-2">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {results.details.map((d, i) => (
                    <tr key={i} className={d.status === 'created' ? 'bg-green-50' : d.status === 'duplicate' ? 'bg-yellow-50' : 'bg-red-50'}>
                      <td className="px-3 py-1.5">{d.row}</td>
                      <td className="px-3 py-1.5">{d.name}</td>
                      <td className="px-3 py-1.5 font-mono">{d.phone}</td>
                      <td className="px-3 py-1.5">{d.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

