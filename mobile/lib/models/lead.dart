class LeadActivity {
  final int id;
  final String type;
  final String description;
  final String? callResult;
  final String? userName;
  final DateTime createdAt;

  LeadActivity({
    required this.id,
    required this.type,
    required this.description,
    this.callResult,
    this.userName,
    required this.createdAt,
  });

  factory LeadActivity.fromJson(Map<String, dynamic> json) => LeadActivity(
        id: json['id'],
        type: json['type'],
        description: json['description'],
        callResult: json['call_result'],
        userName: json['user']?['name'],
        createdAt: DateTime.parse(json['created_at']),
      );
}

class Lead {
  final int id;
  final String phone;
  final String name;
  final String? companyName;
  final String? email;
  final String status;
  final String priority;
  final String? notes;
  final String? source;
  final DateTime? followUpDate;
  final String? assigneeName;
  final String? managerName;
  final List<LeadActivity> activities;
  final int currentLevel;

  Lead({
    required this.id,
    required this.phone,
    required this.name,
    this.companyName,
    this.email,
    required this.status,
    required this.priority,
    this.notes,
    this.source,
    this.followUpDate,
    this.assigneeName,
    this.managerName,
    this.activities = const [],
    this.currentLevel = 1,
  });

  factory Lead.fromJson(Map<String, dynamic> json) => Lead(
        id: json['id'],
        phone: json['phone'],
        name: json['name'],
        companyName: json['company_name'],
        email: json['email'],
        status: json['status'] ?? 'new',
        priority: json['priority'] ?? 'medium',
        notes: json['notes'],
        source: json['source'],
        followUpDate: json['follow_up_date'] != null
            ? DateTime.tryParse(json['follow_up_date'])
            : null,
        assigneeName: json['assignee']?['name'],
        managerName: json['manager']?['name'],
        currentLevel: json['current_level'] ?? 1,
        activities: (json['activities'] as List<dynamic>? ?? [])
            .map((a) => LeadActivity.fromJson(a))
            .toList(),
      );
}

