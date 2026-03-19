export default function LoadingSpinner({ size = 'md', text = 'جاري التحميل...' }) {
  const sizes = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' };

  return (
    <div className="flex flex-col items-center justify-center p-8 gap-3">
      <div className={`${sizes[size]} animate-spin rounded-full border-4 border-gray-200 border-t-blue-600`} />
      {text && <p className="text-gray-500 text-sm">{text}</p>}
    </div>
  );
}

export function FullPageLoader() {
  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gradient">Al Team CRM</h2>
        <p className="text-gray-500 mt-1">جاري تحميل النظام...</p>
      </div>
    </div>
  );
}

