import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../utils/constants.dart';
import 'add_meeting_screen.dart';

class MeetingsScreen extends StatefulWidget {
  const MeetingsScreen({super.key});

  @override
  State<MeetingsScreen> createState() => _MeetingsScreenState();
}

class _MeetingsScreenState extends State<MeetingsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  Map<String, List<dynamic>> _meetingsByTab = {
    'scheduled': [],
    'completed': [],
    'cancelled': [],
  };
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadMeetings();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadMeetings() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final res = await ApiService.get('/meetings');
      final all = (res['meetings'] ?? res['data'] ?? []) as List;
      setState(() {
        _meetingsByTab = {
          'scheduled': all.where((m) => m['status'] == 'scheduled').toList(),
          'completed': all.where((m) => m['status'] == 'completed').toList(),
          'cancelled': all.where((m) => m['status'] == 'cancelled' || m['status'] == 'postponed').toList(),
        };
        _isLoading = false;
      });
    } catch (e) {
      setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Column(children: [
        Container(
          color: const Color(kPrimaryBlue),
          child: TabBar(
            controller: _tabController,
            indicatorColor: Colors.white,
            labelColor: Colors.white,
            unselectedLabelColor: Colors.white60,
            labelStyle: const TextStyle(fontFamily: 'Cairo', fontSize: 13),
            tabs: [
              Tab(text: 'مجدولة (${_meetingsByTab['scheduled']?.length ?? 0})'),
              Tab(text: 'مكتملة (${_meetingsByTab['completed']?.length ?? 0})'),
              Tab(text: 'ملغية (${_meetingsByTab['cancelled']?.length ?? 0})'),
            ],
          ),
        ),
        Expanded(
          child: _isLoading
              ? const Center(child: CircularProgressIndicator())
              : _error != null
                  ? Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                      const Icon(Icons.error_outline, color: Colors.red, size: 48),
                      const SizedBox(height: 12),
                      Text(_error!, style: const TextStyle(fontFamily: 'Cairo')),
                      ElevatedButton(onPressed: _loadMeetings, child: const Text('إعادة المحاولة', style: TextStyle(fontFamily: 'Cairo'))),
                    ]))
                  : Stack(children: [
                      TabBarView(
                        controller: _tabController,
                        children: [
                          _buildMeetingList(_meetingsByTab['scheduled'] ?? []),
                          _buildMeetingList(_meetingsByTab['completed'] ?? []),
                          _buildMeetingList(_meetingsByTab['cancelled'] ?? []),
                        ],
                      ),
                      Positioned(
                        bottom: 16,
                        left: 16,
                        child: FloatingActionButton.extended(
                          onPressed: () => Navigator.push(context,
                            MaterialPageRoute(builder: (_) => const AddMeetingScreen())).then((_) => _loadMeetings()),
                          backgroundColor: const Color(kPrimaryBlue),
                          icon: const Icon(Icons.add, color: Colors.white),
                          label: const Text('اجتماع جديد', style: TextStyle(color: Colors.white, fontFamily: 'Cairo')),
                        ),
                      ),
                    ]),
        ),
      ]),
    );
  }

  Widget _buildMeetingList(List<dynamic> meetings) {
    if (meetings.isEmpty) {
      return const Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        Icon(Icons.event_busy, size: 56, color: Colors.grey),
        SizedBox(height: 12),
        Text('لا توجد اجتماعات', style: TextStyle(fontFamily: 'Cairo', color: Colors.grey, fontSize: 16)),
      ]));
    }
    return RefreshIndicator(
      onRefresh: _loadMeetings,
      child: ListView.builder(
        padding: const EdgeInsets.fromLTRB(12, 12, 12, 80),
        itemCount: meetings.length,
        itemBuilder: (_, i) => _buildMeetingCard(meetings[i]),
      ),
    );
  }

  Widget _buildMeetingCard(Map<String, dynamic> m) {
    final date = m['meeting_date'] != null ? DateTime.tryParse(m['meeting_date']) : null;
    final status = m['status'] ?? 'scheduled';
    final statusColor = {
      'scheduled': Colors.blue,
      'completed': Colors.green,
      'cancelled': Colors.red,
      'postponed': Colors.orange,
    }[status] ?? Colors.grey;

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Expanded(child: Text(m['title'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold, fontFamily: 'Cairo', fontSize: 15))),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: statusColor.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: statusColor.withValues(alpha: 0.3)),
              ),
              child: Text(kMeetingStatusLabels[status] ?? status,
                style: TextStyle(fontSize: 11, color: statusColor, fontFamily: 'Cairo', fontWeight: FontWeight.w600)),
            ),
          ]),
          const SizedBox(height: 8),
          if (m['lead'] != null) Row(children: [
            const Icon(Icons.person_outline, size: 14, color: Colors.grey),
            const SizedBox(width: 4),
            Text(m['lead']['name'] ?? '', style: const TextStyle(fontFamily: 'Cairo', fontSize: 13, color: Colors.grey)),
          ]),
          if (date != null) Row(children: [
            const Icon(Icons.schedule, size: 14, color: Colors.grey),
            const SizedBox(width: 4),
            Text(
              '${date.day}/${date.month}/${date.year}  ${date.hour}:${date.minute.toString().padLeft(2, '0')}',
              style: const TextStyle(fontFamily: 'Cairo', fontSize: 13, color: Colors.grey),
            ),
          ]),
          if (m['location'] != null) Row(children: [
            const Icon(Icons.location_on_outlined, size: 14, color: Colors.grey),
            const SizedBox(width: 4),
            Text(m['location'], style: const TextStyle(fontFamily: 'Cairo', fontSize: 13, color: Colors.grey)),
          ]),
          if (m['description'] != null) ...[
            const SizedBox(height: 6),
            Text(m['description'], style: const TextStyle(fontFamily: 'Cairo', fontSize: 12, color: Colors.grey)),
          ],
          if (status == 'scheduled') ...[
            const SizedBox(height: 10),
            Row(children: [
              Expanded(child: OutlinedButton(
                onPressed: () => _updateStatus(m['id'], 'completed'),
                style: OutlinedButton.styleFrom(foregroundColor: Colors.green),
                child: const Text('مكتمل', style: TextStyle(fontFamily: 'Cairo', fontSize: 12)),
              )),
              const SizedBox(width: 8),
              Expanded(child: OutlinedButton(
                onPressed: () => _updateStatus(m['id'], 'cancelled'),
                style: OutlinedButton.styleFrom(foregroundColor: Colors.red),
                child: const Text('إلغاء', style: TextStyle(fontFamily: 'Cairo', fontSize: 12)),
              )),
            ]),
          ],
        ]),
      ),
    );
  }

  Future<void> _updateStatus(int id, String status) async {
    try {
      await ApiService.put('/meetings/$id', {'status': status});
      _loadMeetings();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    }
  }
}

