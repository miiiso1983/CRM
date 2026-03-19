import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../utils/constants.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List<dynamic> _notifications = [];
  bool _isLoading = true;
  String? _error;
  int _unreadCount = 0;

  @override
  void initState() {
    super.initState();
    _loadNotifications();
  }

  Future<void> _loadNotifications() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final res = await ApiService.get('/notifications');
      final all = (res['notifications'] ?? res['data'] ?? []) as List;
      setState(() {
        _notifications = all;
        _unreadCount = all.where((n) => n['is_read'] == false).length;
        _isLoading = false;
      });
    } catch (e) {
      setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  Future<void> _markAsRead(int id) async {
    try {
      await ApiService.put('/notifications/$id/read', {});
      setState(() {
        final idx = _notifications.indexWhere((n) => n['id'] == id);
        if (idx != -1 && _notifications[idx]['is_read'] == false) {
          _notifications[idx] = Map.from(_notifications[idx])..['is_read'] = true;
          _unreadCount = (_unreadCount - 1).clamp(0, 9999);
        }
      });
    } catch (_) {}
  }

  Future<void> _markAllAsRead() async {
    try {
      await ApiService.put('/notifications/read-all', {});
      setState(() {
        _notifications = _notifications.map((n) => Map.from(n)..['is_read'] = true).toList();
        _unreadCount = 0;
      });
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Column(children: [
        // Header bar
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          color: Colors.white,
          child: Row(children: [
            Expanded(child: Text(
              _unreadCount > 0 ? '$_unreadCount إشعار غير مقروء' : 'الإشعارات',
              style: const TextStyle(fontWeight: FontWeight.bold, fontFamily: 'Cairo', fontSize: 15),
            )),
            if (_unreadCount > 0)
              TextButton.icon(
                onPressed: _markAllAsRead,
                icon: const Icon(Icons.done_all, size: 16),
                label: const Text('قراءة الكل', style: TextStyle(fontFamily: 'Cairo', fontSize: 12)),
              ),
          ]),
        ),
        const Divider(height: 1),

        Expanded(
          child: _isLoading
              ? const Center(child: CircularProgressIndicator())
              : _error != null
                  ? Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                      const Icon(Icons.error_outline, size: 48, color: Colors.red),
                      const SizedBox(height: 12),
                      Text(_error!, style: const TextStyle(fontFamily: 'Cairo')),
                      ElevatedButton(onPressed: _loadNotifications, child: const Text('إعادة المحاولة', style: TextStyle(fontFamily: 'Cairo'))),
                    ]))
                  : _notifications.isEmpty
                      ? Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                          Icon(Icons.notifications_none, size: 64, color: Colors.grey[400]),
                          const SizedBox(height: 12),
                          const Text('لا توجد إشعارات', style: TextStyle(fontFamily: 'Cairo', color: Colors.grey, fontSize: 16)),
                        ]))
                      : RefreshIndicator(
                          onRefresh: _loadNotifications,
                          child: ListView.separated(
                            itemCount: _notifications.length,
                            separatorBuilder: (_, __) => const Divider(height: 1),
                            itemBuilder: (_, i) => _buildNotifTile(_notifications[i]),
                          ),
                        ),
        ),
      ]),
    );
  }

  Widget _buildNotifTile(Map<String, dynamic> n) {
    final isRead = n['is_read'] == true;
    final type = n['type'] ?? 'info';
    final date = n['created_at'] != null ? DateTime.tryParse(n['created_at']) : null;

    IconData icon;
    Color iconColor;
    switch (type) {
      case 'new_lead': icon = Icons.person_add; iconColor = Colors.green; break;
      case 'lead_assigned': icon = Icons.assignment; iconColor = Colors.blue; break;
      case 'meeting_reminder': icon = Icons.event; iconColor = const Color(kPrimaryPurple); break;
      case 'lead_transferred': icon = Icons.swap_horiz; iconColor = Colors.orange; break;
      case 'status_changed': icon = Icons.update; iconColor = Colors.teal; break;
      default: icon = Icons.notifications; iconColor = Colors.grey;
    }

    return InkWell(
      onTap: () {
        if (!isRead) _markAsRead(n['id']);
      },
      child: Container(
        color: isRead ? null : const Color(kPrimaryBlue).withValues(alpha: 0.04),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: iconColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: iconColor, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(
              n['title_ar'] ?? n['title'] ?? '',
              style: TextStyle(
                fontWeight: isRead ? FontWeight.normal : FontWeight.bold,
                fontFamily: 'Cairo',
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              n['body_ar'] ?? n['body'] ?? '',
              style: TextStyle(fontFamily: 'Cairo', fontSize: 12, color: Colors.grey[600]),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            if (date != null) ...[
              const SizedBox(height: 4),
              Text(
                _formatDate(date),
                style: TextStyle(fontFamily: 'Cairo', fontSize: 11, color: Colors.grey[400]),
              ),
            ],
          ])),
          if (!isRead)
            Container(
              width: 8,
              height: 8,
              margin: const EdgeInsets.only(top: 4),
              decoration: const BoxDecoration(
                color: Color(kPrimaryBlue),
                shape: BoxShape.circle,
              ),
            ),
        ]),
      ),
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final diff = now.difference(date);
    if (diff.inMinutes < 1) return 'الآن';
    if (diff.inMinutes < 60) return 'منذ ${diff.inMinutes} دقيقة';
    if (diff.inHours < 24) return 'منذ ${diff.inHours} ساعة';
    return 'منذ ${diff.inDays} يوم';
  }
}

