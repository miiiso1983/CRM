import 'package:flutter/material.dart';
import 'package:intl/intl.dart' hide TextDirection;
import '../../services/api_service.dart';
import '../../utils/constants.dart';
import '../../widgets/app_widgets.dart';

class AddMeetingScreen extends StatefulWidget {
  final Map<String, dynamic>? existingMeeting;
  const AddMeetingScreen({super.key, this.existingMeeting});

  @override
  State<AddMeetingScreen> createState() => _AddMeetingScreenState();
}

class _AddMeetingScreenState extends State<AddMeetingScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  final _locationCtrl = TextEditingController();
  String _meetingType = 'in_person';
  DateTime _meetingDate = DateTime.now().add(const Duration(hours: 1));
  int? _selectedLeadId;
  List<dynamic> _leads = [];
  bool _isLoading = false;

  bool get _isEdit => widget.existingMeeting != null;

  @override
  void initState() {
    super.initState();
    _loadLeads();
    if (_isEdit) {
      final m = widget.existingMeeting!;
      _titleCtrl.text = m['title'] ?? '';
      _descCtrl.text = m['description'] ?? '';
      _locationCtrl.text = m['location'] ?? '';
      _meetingType = m['meeting_type'] ?? 'in_person';
      if (m['meeting_date'] != null) _meetingDate = DateTime.parse(m['meeting_date']);
      _selectedLeadId = m['lead_id'];
    }
  }

  @override
  void dispose() {
    _titleCtrl.dispose(); _descCtrl.dispose(); _locationCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadLeads() async {
    try {
      final res = await ApiService.get('/leads', params: {'limit': '100'});
      setState(() => _leads = res['leads'] ?? res['data'] ?? []);
    } catch (_) {}
  }

  Future<void> _pickDateTime() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _meetingDate,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (date == null || !mounted) return;
    final time = await showTimePicker(context: context, initialTime: TimeOfDay.fromDateTime(_meetingDate));
    if (time == null) return;
    setState(() => _meetingDate = DateTime(date.year, date.month, date.day, time.hour, time.minute));
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);
    try {
      final body = {
        'title': _titleCtrl.text.trim(),
        'description': _descCtrl.text.trim(),
        'location': _locationCtrl.text.trim(),
        'meeting_type': _meetingType,
        'meeting_date': _meetingDate.toIso8601String(),
        if (_selectedLeadId != null) 'lead_id': _selectedLeadId,
      };
      if (_isEdit) {
        await ApiService.put('/meetings/${widget.existingMeeting!['id']}', body);
      } else {
        await ApiService.post('/meetings', body);
      }
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(_isEdit ? 'تم تحديث الاجتماع' : 'تم إنشاء الاجتماع', style: const TextStyle(fontFamily: 'Cairo')),
          backgroundColor: Colors.green,
        ));
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString()), backgroundColor: Colors.red));
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        appBar: AppBar(
          title: Text(_isEdit ? 'تعديل الاجتماع' : 'اجتماع جديد', style: const TextStyle(fontFamily: 'Cairo')),
          flexibleSpace: Container(decoration: const BoxDecoration(
            gradient: LinearGradient(colors: [Color(kPrimaryBlue), Color(kPrimaryPurple)]),
          )),
        ),
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Form(
            key: _formKey,
            child: Column(children: [
              _buildField(_titleCtrl, 'عنوان الاجتماع *', Icons.title, required: true),
              const SizedBox(height: 14),

              // Lead selector
              DropdownButtonFormField<int?>(
                initialValue: _selectedLeadId,
                decoration: _decoration('العميل المرتبط', Icons.person),
                items: [
                  const DropdownMenuItem(value: null, child: Text('بدون عميل', style: TextStyle(fontFamily: 'Cairo'))),
                  ..._leads.map((l) => DropdownMenuItem(value: l['id'] as int, child: Text(l['name'] ?? '', style: const TextStyle(fontFamily: 'Cairo')))),
                ],
                onChanged: (v) => setState(() => _selectedLeadId = v),
              ),
              const SizedBox(height: 14),

              // Date & Time picker
              InkWell(
                onTap: _pickDateTime,
                child: InputDecorator(
                  decoration: _decoration('التاريخ والوقت *', Icons.schedule),
                  child: Text(
                    DateFormat('dd/MM/yyyy  HH:mm').format(_meetingDate),
                    style: const TextStyle(fontFamily: 'Cairo'),
                  ),
                ),
              ),
              const SizedBox(height: 14),

              // Meeting type
              DropdownButtonFormField<String>(
                initialValue: _meetingType,
                decoration: _decoration('نوع الاجتماع', Icons.meeting_room),
                items: const [
                  DropdownMenuItem(value: 'in_person', child: Text('حضوري', style: TextStyle(fontFamily: 'Cairo'))),
                  DropdownMenuItem(value: 'online', child: Text('عبر الإنترنت', style: TextStyle(fontFamily: 'Cairo'))),
                  DropdownMenuItem(value: 'phone', child: Text('هاتفي', style: TextStyle(fontFamily: 'Cairo'))),
                ],
                onChanged: (v) => setState(() => _meetingType = v!),
              ),
              const SizedBox(height: 14),

              _buildField(_locationCtrl, 'الموقع / الرابط', Icons.location_on),
              const SizedBox(height: 14),

              TextFormField(
                controller: _descCtrl,
                textDirection: TextDirection.rtl,
                maxLines: 3,
                decoration: _decoration('الوصف', Icons.description),
                style: const TextStyle(fontFamily: 'Cairo'),
              ),
              const SizedBox(height: 24),

              GradientButton(
                label: _isEdit ? 'تحديث الاجتماع' : 'إنشاء الاجتماع',
                icon: Icons.event,
                isLoading: _isLoading,
                onPressed: _save,
              ),
            ]),
          ),
        ),
      ),
    );
  }

  Widget _buildField(TextEditingController ctrl, String label, IconData icon, {bool required = false}) {
    return TextFormField(
      controller: ctrl,
      textDirection: TextDirection.rtl,
      decoration: _decoration(label, icon),
      style: const TextStyle(fontFamily: 'Cairo'),
      validator: required ? (v) => v!.isEmpty ? '$label مطلوب' : null : null,
    );
  }

  InputDecoration _decoration(String label, IconData icon) => InputDecoration(
    labelText: label,
    labelStyle: const TextStyle(fontFamily: 'Cairo'),
    prefixIcon: Icon(icon, color: const Color(kPrimaryBlue)),
    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: Color(kPrimaryBlue), width: 2),
    ),
  );
}

