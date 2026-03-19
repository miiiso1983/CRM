import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../services/api_service.dart';
import '../../utils/constants.dart';
import '../../widgets/app_widgets.dart';
import 'lead_detail_screen.dart';
import 'add_lead_screen.dart';

class LeadsScreen extends StatefulWidget {
  const LeadsScreen({super.key});

  @override
  State<LeadsScreen> createState() => _LeadsScreenState();
}

class _LeadsScreenState extends State<LeadsScreen> {
  List<dynamic> _leads = [];
  bool _isLoading = true;
  String? _error;
  String _searchQuery = '';
  String _statusFilter = '';
  int _page = 1;
  bool _hasMore = true;
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _loadLeads();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent - 200) {
      if (_hasMore && !_isLoading) _loadLeads(append: true);
    }
  }

  Future<void> _loadLeads({bool append = false}) async {
    if (!append) setState(() { _isLoading = true; _error = null; _page = 1; });
    try {
      final params = <String, String>{
        'page': '${append ? _page + 1 : 1}',
        'limit': '20',
        if (_searchQuery.isNotEmpty) 'search': _searchQuery,
        if (_statusFilter.isNotEmpty) 'status': _statusFilter,
      };
      final res = await ApiService.get('/leads', params: params);
      final newLeads = (res['leads'] ?? res['data'] ?? []) as List;
      setState(() {
        if (append) {
          _leads.addAll(newLeads);
          _page++;
        } else {
          _leads = newLeads;
          _page = 1;
        }
        _hasMore = newLeads.length == 20;
        _isLoading = false;
      });
    } catch (e) {
      setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  Future<void> _callLead(String phone) async {
    final uri = Uri.parse('tel:$phone');
    if (await canLaunchUrl(uri)) await launchUrl(uri);
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Column(children: [
        _buildSearchAndFilter(),
        Expanded(
          child: Stack(children: [
            _isLoading && _leads.isEmpty
              ? const Center(child: CircularProgressIndicator())
              : _error != null && _leads.isEmpty
                  ? _buildError()
                  : RefreshIndicator(
                      onRefresh: _loadLeads,
                      child: _leads.isEmpty
                          ? _buildEmpty()
                          : ListView.builder(
                              controller: _scrollController,
                              padding: const EdgeInsets.all(12),
                              itemCount: _leads.length + (_hasMore ? 1 : 0),
                              itemBuilder: (_, i) {
                                if (i == _leads.length) {
                                  return const Center(child: Padding(padding: EdgeInsets.all(16), child: CircularProgressIndicator()));
                                }
                                return _buildLeadCard(_leads[i]);
                              },
                            ),
                    ),
            Positioned(
              bottom: 16,
              left: 16,
              child: FloatingActionButton.extended(
                onPressed: () => Navigator.push(context,
                  MaterialPageRoute(builder: (_) => const AddLeadScreen())).then((_) => _loadLeads()),
                backgroundColor: const Color(kPrimaryBlue),
                icon: const Icon(Icons.add, color: Colors.white),
                label: const Text('إضافة عميل', style: TextStyle(color: Colors.white, fontFamily: 'Cairo')),
              ),
            ),
          ]),
        ),
      ]),
    );
  }

  Widget _buildSearchAndFilter() {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.all(12),
      child: Column(children: [
        TextField(
          textDirection: TextDirection.rtl,
          decoration: InputDecoration(
            hintText: 'بحث بالاسم أو الهاتف...',
            hintStyle: const TextStyle(fontFamily: 'Cairo'),
            prefixIcon: const Icon(Icons.search),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            suffixIcon: _searchQuery.isNotEmpty
                ? IconButton(icon: const Icon(Icons.clear), onPressed: () {
                    setState(() => _searchQuery = '');
                    _loadLeads();
                  })
                : null,
          ),
          onChanged: (v) {
            _searchQuery = v;
            Future.delayed(const Duration(milliseconds: 400), () {
              if (_searchQuery == v) _loadLeads();
            });
          },
        ),
        const SizedBox(height: 8),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(children: [
            _filterChip('الكل', ''),
            _filterChip('جديد', 'new'),
            _filterChip('متابعة', 'follow_up'),
            _filterChip('مهتم', 'interested'),
            _filterChip('تفاوض', 'negotiating'),
            _filterChip('تعاقد', 'contracted'),
          ]),
        ),
      ]),
    );
  }

  Widget _filterChip(String label, String value) => Padding(
    padding: const EdgeInsets.only(left: 6),
    child: FilterChip(
      label: Text(label, style: const TextStyle(fontFamily: 'Cairo', fontSize: 12)),
      selected: _statusFilter == value,
      onSelected: (_) {
        setState(() => _statusFilter = value);
        _loadLeads();
      },
      selectedColor: const Color(kPrimaryBlue).withOpacity(0.15),
      checkmarkColor: const Color(kPrimaryBlue),
    ),
  );

  Widget _buildLeadCard(Map<String, dynamic> lead) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => Navigator.push(context,
          MaterialPageRoute(builder: (_) => LeadDetailScreen(leadId: lead['id']))),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(children: [
            CircleAvatar(
              radius: 24,
              backgroundColor: const Color(kPrimaryBlue).withOpacity(0.1),
              child: Text(
                (lead['name'] ?? '?').toString().substring(0, 1),
                style: const TextStyle(color: Color(kPrimaryBlue), fontWeight: FontWeight.bold, fontFamily: 'Cairo', fontSize: 18),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(lead['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold, fontFamily: 'Cairo')),
              const SizedBox(height: 2),
              Text(lead['phone'] ?? '', style: const TextStyle(color: Colors.grey, fontFamily: 'Cairo', fontSize: 13)),
              const SizedBox(height: 4),
              Row(children: [
                StatusBadge(status: lead['status'] ?? 'new'),
                const SizedBox(width: 6),
                if (lead['company_name'] != null)
                  Flexible(child: Text(lead['company_name'], style: const TextStyle(fontSize: 11, color: Colors.grey, fontFamily: 'Cairo'), overflow: TextOverflow.ellipsis)),
              ]),
            ])),
            Column(children: [
              IconButton(
                icon: const Icon(Icons.phone, color: Colors.green),
                onPressed: () => _callLead(lead['phone'] ?? ''),
                tooltip: 'اتصال',
              ),
            ]),
          ]),
        ),
      ),
    );
  }

  Widget _buildEmpty() => Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
    Icon(Icons.people_outline, size: 64, color: Colors.grey[400]),
    const SizedBox(height: 12),
    const Text('لا يوجد عملاء', style: TextStyle(fontFamily: 'Cairo', color: Colors.grey, fontSize: 16)),
  ]));

  Widget _buildError() => Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
    const Icon(Icons.error_outline, size: 48, color: Colors.red),
    const SizedBox(height: 12),
    Text(_error!, style: const TextStyle(fontFamily: 'Cairo'), textAlign: TextAlign.center),
    ElevatedButton(onPressed: _loadLeads, child: const Text('إعادة المحاولة', style: TextStyle(fontFamily: 'Cairo'))),
  ]));
}

