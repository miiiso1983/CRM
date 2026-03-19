// API Configuration
// Use 'http://10.0.2.2:5001/api' for Android emulator
// Use 'http://localhost:5001/api' for iOS simulator
// Use your computer's IP for real devices: 'http://192.168.x.x:5001/api'
const String kBaseUrl = 'http://localhost:5001/api';
const String kSocketUrl = 'http://localhost:5001';

// Status Labels (Arabic)
const Map<String, String> kStatusLabels = {
  'new': 'جديد',
  'contacted': 'تم الاتصال',
  'follow_up': 'متابعة',
  'interested': 'مهتم',
  'not_interested': 'غير مهتم',
  'negotiating': 'قيد التفاوض',
  'qualified': 'مرشح للتعاقد',
  'contracted': 'تم التعاقد',
  'rejected': 'مرفوض',
};

// Priority Labels (Arabic)
const Map<String, String> kPriorityLabels = {
  'low': 'منخفضة',
  'medium': 'متوسطة',
  'high': 'عالية',
};

// Activity Labels (Arabic)
const Map<String, String> kActivityLabels = {
  'call': 'مكالمة',
  'meeting': 'اجتماع',
  'note': 'ملاحظة',
  'status_change': 'تغيير حالة',
  'transfer': 'تحويل',
  'follow_up': 'متابعة',
};

// Call Result Labels
const Map<String, String> kCallResultLabels = {
  'answered': 'تم الرد',
  'no_answer': 'لا يوجد رد',
  'busy': 'مشغول',
  'callback_requested': 'طلب معاودة الاتصال',
};

// Role Labels
const Map<String, String> kRoleLabels = {
  'admin': 'مدير عام',
  'manager': 'مدير مباشر',
  'sales': 'مندوب مبيعات',
};

// Meeting Status Labels
const Map<String, String> kMeetingStatusLabels = {
  'scheduled': 'مجدول',
  'completed': 'مكتمل',
  'cancelled': 'ملغي',
  'postponed': 'مؤجل',
};

// Theme Colors
const kPrimaryBlue = 0xFF2563EB;
const kPrimaryPurple = 0xFF7C3AED;

