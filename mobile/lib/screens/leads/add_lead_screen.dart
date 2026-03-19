import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../utils/constants.dart';
import '../../widgets/app_widgets.dart';

class AddLeadScreen extends StatefulWidget {
  final Map<String, dynamic>? existingLead;
  const AddLeadScreen({super.key, this.existingLead});

  @override
  State<AddLeadScreen> createState() => _AddLeadScreenState();
}

class _AddLeadScreenState extends State<AddLeadScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _companyCtrl = TextEditingController();
  final _positionCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();
  String _status = 'new';
  String _priority = 'medium';
  bool _isLoading = false;

  bool get _isEdit => widget.existingLead != null;

  @override
  void initState() {
    super.initState();
    if (_isEdit) {
      final l = widget.existingLead!;
      _nameCtrl.text = l['name'] ?? '';
      _phoneCtrl.text = l['phone'] ?? '';
      _emailCtrl.text = l['email'] ?? '';
      _companyCtrl.text = l['company_name'] ?? '';
      _positionCtrl.text = l['position'] ?? '';
      _notesCtrl.text = l['notes'] ?? '';
      _status = l['status'] ?? 'new';
      _priority = l['priority'] ?? 'medium';
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose(); _phoneCtrl.dispose(); _emailCtrl.dispose();
    _companyCtrl.dispose(); _positionCtrl.dispose(); _notesCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);
    try {
      final body = {
        'name': _nameCtrl.text.trim(),
        'phone': _phoneCtrl.text.trim(),
        'email': _emailCtrl.text.trim(),
        'company_name': _companyCtrl.text.trim(),
        'position': _positionCtrl.text.trim(),
        'notes': _notesCtrl.text.trim(),
        'status': _status,
        'priority': _priority,
      };
      if (_isEdit) {
        await ApiService.put('/leads/${widget.existingLead!['id']}', body);
      } else {
        await ApiService.post('/leads', body);
      }
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(_isEdit ? 'تم تحديث العميل' : 'تم إضافة العميل', style: const TextStyle(fontFamily: 'Cairo')),
          backgroundColor: Colors.green,
        ));
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(e.toString(), style: const TextStyle(fontFamily: 'Cairo')),
          backgroundColor: Colors.red,
        ));
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
          title: Text(_isEdit ? 'تعديل العميل' : 'إضافة عميل جديد', style: const TextStyle(fontFamily: 'Cairo')),
          flexibleSpace: Container(decoration: const BoxDecoration(
            gradient: LinearGradient(colors: [Color(kPrimaryBlue), Color(kPrimaryPurple)]),
          )),
        ),
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Form(
            key: _formKey,
            child: Column(children: [
              _buildField(_nameCtrl, 'اسم العميل *', Icons.person, required: true),
              const SizedBox(height: 14),
              _buildField(_phoneCtrl, 'رقم الهاتف *', Icons.phone, required: true, keyboardType: TextInputType.phone),
              const SizedBox(height: 14),
              _buildField(_emailCtrl, 'البريد الإلكتروني', Icons.email, keyboardType: TextInputType.emailAddress),
              const SizedBox(height: 14),
              _buildField(_companyCtrl, 'اسم الشركة', Icons.business),
              const SizedBox(height: 14),
              _buildField(_positionCtrl, 'المنصب / الوظيفة', Icons.work),
              const SizedBox(height: 14),

              // Status dropdown
              DropdownButtonFormField<String>(
                value: _status,
                decoration: _decoration('الحالة', Icons.flag),
                items: kStatusLabels.entries.map((e) =>
                  DropdownMenuItem(value: e.key, child: Text(e.value, style: const TextStyle(fontFamily: 'Cairo')))).toList(),
                onChanged: (v) => setState(() => _status = v!),
              ),
              const SizedBox(height: 14),

              // Priority dropdown
              DropdownButtonFormField<String>(
                value: _priority,
                decoration: _decoration('الأولوية', Icons.priority_high),
                items: kPriorityLabels.entries.map((e) =>
                  DropdownMenuItem(value: e.key, child: Text(e.value, style: const TextStyle(fontFamily: 'Cairo')))).toList(),
                onChanged: (v) => setState(() => _priority = v!),
              ),
              const SizedBox(height: 14),

              TextFormField(
                controller: _notesCtrl,
                textDirection: TextDirection.rtl,
                maxLines: 3,
                decoration: _decoration('الملاحظات', Icons.notes),
                style: const TextStyle(fontFamily: 'Cairo'),
              ),
              const SizedBox(height: 24),

              GradientButton(
                label: _isEdit ? 'تحديث العميل' : 'إضافة العميل',
                icon: _isEdit ? Icons.edit : Icons.add,
                isLoading: _isLoading,
                onPressed: _save,
              ),
            ]),
          ),
        ),
      ),
    );
  }

  Widget _buildField(TextEditingController ctrl, String label, IconData icon,
      {bool required = false, TextInputType? keyboardType}) {
    return TextFormField(
      controller: ctrl,
      textDirection: TextDirection.rtl,
      keyboardType: keyboardType,
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

