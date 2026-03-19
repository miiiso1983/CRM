import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../services/api_service.dart';
import '../../utils/constants.dart';
import '../../widgets/app_widgets.dart';

class LeadDetailScreen extends StatefulWidget {
  final int leadId;
  const LeadDetailScreen({super.key, required this.leadId});

  @override
  State<LeadDetailScreen> createState() => _LeadDetailScreenState();
}

class _LeadDetailScreenState extends State<LeadDetailScreen> {
  Map<String, dynamic>? _lead;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadLead();
  }

  Future<void> _loadLead() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final res = await ApiService.get('/leads/${widget.leadId}');
      setState(() { _lead = res['lead'] ?? res; _isLoading = false; });
    } catch (e) {
      setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  Future<void> _callLead() async {
    final phone = _lead?['phone'];
    if (phone == null) return;
    final uri = Uri.parse('tel:$phone');
    if (await canLaunchUrl(uri)) await launchUrl(uri);
  }

  Future<void> _logActivity(String type) async {
    final controller = TextEditingController();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => Directionality(
        textDirection: TextDirection.rtl,
        child: AlertDialog(
          title: Text('إضافة ${kActivityLabels[type] ?? type}', style: const TextStyle(fontFamily: 'Cairo')),
          content: TextField(
            controller: controller,
            textDirection: TextDirection.rtl,
            maxLines: 3,
            decoration: const InputDecoration(
              hintText: 'الملاحظات...',
              hintStyle: TextStyle(fontFamily: 'Cairo'),
              border: OutlineInputBorder(),
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('إلغاء', style: TextStyle(fontFamily: 'Cairo'))),
            ElevatedButton(onPressed: () => Navigator.pop(context, true), child: const Text('حفظ', style: TextStyle(fontFamily: 'Cairo'))),
          ],
        ),
      ),
    );
    if (confirmed == true) {
      try {
        await ApiService.post('/leads/${widget.leadId}/activities', {
          'type': type,
          'description': controller.text,
        });
        _loadLead();
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('تم الحفظ', style: TextStyle(fontFamily: 'Cairo'))));
      } catch (e) {
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        appBar: AppBar(
          title: Text(_lead?['name'] ?? 'تفاصيل العميل', style: const TextStyle(fontFamily: 'Cairo')),
          flexibleSpace: Container(decoration: const BoxDecoration(
            gradient: LinearGradient(colors: [Color(kPrimaryBlue), Color(kPrimaryPurple)]),
          )),
          actions: [
            IconButton(icon: const Icon(Icons.phone, color: Colors.white), onPressed: _callLead),
          ],
        ),
        body: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : _error != null
                ? Center(child: Text(_error!, style: const TextStyle(fontFamily: 'Cairo')))
                : _buildBody(),
      ),
    );
  }

  Widget _buildBody() {
    final lead = _lead!;
    final activities = (lead['activities'] as List<dynamic>? ?? []);
    return ListView(padding: const EdgeInsets.all(16), children: [
      // Info Card
      Card(child: Padding(padding: const EdgeInsets.all(16), child: Column(children: [
        Row(children: [
          CircleAvatar(
            radius: 32,
            backgroundColor: const Color(kPrimaryBlue).withValues(alpha: 0.1),
            child: Text((lead['name'] ?? '?').toString().substring(0, 1),
              style: const TextStyle(fontSize: 24, fontFamily: 'Cairo', color: Color(kPrimaryBlue), fontWeight: FontWeight.bold)),
          ),
          const SizedBox(width: 16),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(lead['name'] ?? '', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, fontFamily: 'Cairo')),
            StatusBadge(status: lead['status'] ?? 'new'),
          ])),
        ]),
        const Divider(height: 24),
        InfoRow(label: 'الهاتف:', value: lead['phone'] ?? ''),
        if (lead['email'] != null) InfoRow(label: 'البريد:', value: lead['email']),
        if (lead['company_name'] != null) InfoRow(label: 'الشركة:', value: lead['company_name']),
        if (lead['position'] != null) InfoRow(label: 'المنصب:', value: lead['position']),
        InfoRow(label: 'الأولوية:', value: kPriorityLabels[lead['priority']] ?? lead['priority'] ?? ''),
        if (lead['source'] != null) InfoRow(label: 'المصدر:', value: lead['source']),
        if (lead['assignee'] != null) InfoRow(label: 'المندوب:', value: lead['assignee']['name'] ?? ''),
        if (lead['notes'] != null) InfoRow(label: 'الملاحظات:', value: lead['notes']),
      ]))),

      const SizedBox(height: 12),

      // Action Buttons
      Row(children: [
        Expanded(child: ElevatedButton.icon(
          onPressed: _callLead,
          icon: const Icon(Icons.phone),
          label: const Text('اتصال', style: TextStyle(fontFamily: 'Cairo')),
          style: ElevatedButton.styleFrom(backgroundColor: Colors.green, foregroundColor: Colors.white),
        )),
        const SizedBox(width: 8),
        Expanded(child: ElevatedButton.icon(
          onPressed: () => _logActivity('note'),
          icon: const Icon(Icons.note_add),
          label: const Text('ملاحظة', style: TextStyle(fontFamily: 'Cairo')),
        )),
        const SizedBox(width: 8),
        Expanded(child: ElevatedButton.icon(
          onPressed: () => _logActivity('follow_up'),
          icon: const Icon(Icons.schedule),
          label: const Text('متابعة', style: TextStyle(fontFamily: 'Cairo')),
          style: ElevatedButton.styleFrom(backgroundColor: Colors.orange, foregroundColor: Colors.white),
        )),
      ]),

      const SizedBox(height: 16),
      const Text('سجل النشاطات', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, fontFamily: 'Cairo')),
      const SizedBox(height: 8),

      if (activities.isEmpty)
        const Text('لا توجد نشاطات', style: TextStyle(fontFamily: 'Cairo', color: Colors.grey))
      else
        ...activities.map((a) => _buildActivityTile(a)),
    ]);
  }

  Widget _buildActivityTile(Map<String, dynamic> a) {
    final type = a['type'] ?? '';
    final date = a['created_at'] != null ? DateTime.tryParse(a['created_at']) : null;
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: Colors.blue.withValues(alpha: 0.1),
          child: Icon(_activityIcon(type), color: const Color(kPrimaryBlue), size: 18),
        ),
        title: Text(kActivityLabels[type] ?? type, style: const TextStyle(fontWeight: FontWeight.bold, fontFamily: 'Cairo', fontSize: 13)),
        subtitle: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          if (a['description'] != null) Text(a['description'], style: const TextStyle(fontFamily: 'Cairo', fontSize: 12)),
          if (a['user'] != null) Text(a['user']['name'] ?? '', style: TextStyle(fontFamily: 'Cairo', fontSize: 11, color: Colors.grey[500])),
        ]),
        trailing: date != null ? Text('${date.day}/${date.month}', style: const TextStyle(fontFamily: 'Cairo', fontSize: 11, color: Colors.grey)) : null,
      ),
    );
  }

  IconData _activityIcon(String type) {
    switch (type) {
      case 'call': return Icons.phone;
      case 'meeting': return Icons.event;
      case 'note': return Icons.note;
      case 'follow_up': return Icons.schedule;
      case 'transfer': return Icons.swap_horiz;
      default: return Icons.circle;
    }
  }
}

