import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../utils/constants.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  Map<String, dynamic>? _stats;
  List<dynamic> _recentLeads = [];
  List<dynamic> _upcomingMeetings = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final results = await Future.wait([
        ApiService.get('/dashboard/stats'),
        ApiService.get('/leads', params: {'limit': '5', 'page': '1'}),
        ApiService.get('/meetings', params: {'status': 'scheduled', 'limit': '5'}),
      ]);
      setState(() {
        _stats = results[0]['stats'] ?? results[0];
        _recentLeads = results[1]['leads'] ?? results[1]['data'] ?? [];
        _upcomingMeetings = results[2]['meetings'] ?? results[2]['data'] ?? [];
        _isLoading = false;
      });
    } catch (e) {
      setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    return Directionality(
      textDirection: TextDirection.rtl,
      child: RefreshIndicator(
        onRefresh: _loadData,
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : _error != null
                ? _buildError()
                : _buildContent(auth),
      ),
    );
  }

  Widget _buildError() => Center(
    child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
      const Icon(Icons.error_outline, size: 48, color: Colors.red),
      const SizedBox(height: 12),
      Text(_error!, style: const TextStyle(fontFamily: 'Cairo'), textAlign: TextAlign.center),
      const SizedBox(height: 12),
      ElevatedButton(onPressed: _loadData, child: const Text('إعادة المحاولة', style: TextStyle(fontFamily: 'Cairo'))),
    ]),
  );

  Widget _buildContent(AuthProvider auth) => ListView(
    padding: const EdgeInsets.all(16),
    children: [
      // Welcome card
      Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          gradient: const LinearGradient(colors: [Color(kPrimaryBlue), Color(kPrimaryPurple)]),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(children: [
          CircleAvatar(
            backgroundColor: Colors.white.withOpacity(0.3),
            radius: 28,
            child: Text(
              auth.user?.name.substring(0, 1) ?? '?',
              style: const TextStyle(fontSize: 22, color: Colors.white, fontFamily: 'Cairo'),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('مرحباً، ${auth.user?.name ?? ''}',
                style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold, fontFamily: 'Cairo')),
            Text(auth.user?.role?.nameAr ?? '',
                style: const TextStyle(color: Colors.white70, fontFamily: 'Cairo', fontSize: 13)),
          ])),
        ]),
      ),
      const SizedBox(height: 20),

      // Stats grid
      if (_stats != null) ...[
        const Text('الإحصائيات', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, fontFamily: 'Cairo')),
        const SizedBox(height: 12),
        _buildStatsGrid(),
        const SizedBox(height: 20),
      ],

      // Recent Leads
      const Text('آخر العملاء', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, fontFamily: 'Cairo')),
      const SizedBox(height: 8),
      if (_recentLeads.isEmpty)
        const Padding(padding: EdgeInsets.all(16), child: Text('لا يوجد عملاء', style: TextStyle(fontFamily: 'Cairo', color: Colors.grey)))
      else
        ..._recentLeads.map((lead) => _buildLeadTile(lead)),

      const SizedBox(height: 20),

      // Upcoming Meetings
      const Text('الاجتماعات القادمة', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, fontFamily: 'Cairo')),
      const SizedBox(height: 8),
      if (_upcomingMeetings.isEmpty)
        const Padding(padding: EdgeInsets.all(16), child: Text('لا توجد اجتماعات', style: TextStyle(fontFamily: 'Cairo', color: Colors.grey)))
      else
        ..._upcomingMeetings.map((m) => _buildMeetingTile(m)),
    ],
  );

  Widget _buildStatsGrid() {
    final items = [
      {'label': 'إجمالي العملاء', 'key': 'total_leads', 'icon': Icons.people, 'color': Colors.blue},
      {'label': 'عملاء جدد', 'key': 'new_leads', 'icon': Icons.person_add, 'color': Colors.green},
      {'label': 'قيد المتابعة', 'key': 'follow_up_leads', 'icon': Icons.schedule, 'color': Colors.orange},
      {'label': 'تم التعاقد', 'key': 'contracted_leads', 'icon': Icons.check_circle, 'color': Colors.teal},
    ];
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2, crossAxisSpacing: 12, mainAxisSpacing: 12, childAspectRatio: 1.4,
      ),
      itemCount: items.length,
      itemBuilder: (_, i) {
        final item = items[i];
        final color = item['color'] as Color;
        final value = _stats?[item['key']] ?? 0;
        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: color.withOpacity(0.08),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: color.withOpacity(0.2)),
          ),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Icon(item['icon'] as IconData, color: color, size: 28),
            const Spacer(),
            Text('$value', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: color, fontFamily: 'Cairo')),
            Text(item['label'] as String, style: TextStyle(fontSize: 12, color: Colors.grey[600], fontFamily: 'Cairo')),
          ]),
        );
      },
    );
  }

  Widget _buildLeadTile(Map<String, dynamic> lead) {
    final status = lead['status'] ?? 'new';
    final label = kStatusLabels[status] ?? status;
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: const Color(kPrimaryBlue).withOpacity(0.1),
          child: Text(
            (lead['name'] ?? '?').toString().substring(0, 1),
            style: const TextStyle(color: Color(kPrimaryBlue), fontFamily: 'Cairo'),
          ),
        ),
        title: Text(lead['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold, fontFamily: 'Cairo', fontSize: 14)),
        subtitle: Text(lead['phone'] ?? '', style: const TextStyle(fontFamily: 'Cairo', fontSize: 12)),
        trailing: Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(color: Colors.blue.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
          child: Text(label, style: const TextStyle(fontSize: 11, color: Colors.blue, fontFamily: 'Cairo')),
        ),
      ),
    );
  }

  Widget _buildMeetingTile(Map<String, dynamic> m) {
    final date = m['meeting_date'] != null ? DateTime.tryParse(m['meeting_date']) : null;
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: const CircleAvatar(
          backgroundColor: Color(0xFFEDE9FE),
          child: Icon(Icons.event, color: Color(kPrimaryPurple)),
        ),
        title: Text(m['title'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold, fontFamily: 'Cairo', fontSize: 14)),
        subtitle: Text(
          date != null ? '${date.day}/${date.month}/${date.year}  ${date.hour}:${date.minute.toString().padLeft(2, '0')}' : '',
          style: const TextStyle(fontFamily: 'Cairo', fontSize: 12),
        ),
        trailing: const Icon(Icons.chevron_left, color: Colors.grey),
      ),
    );
  }
}

