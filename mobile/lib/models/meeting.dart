class Meeting {
  final int id;
  final String title;
  final String? description;
  final DateTime meetingDate;
  final String? location;
  final String meetingType;
  final String status;
  final String? leadName;
  final String? leadPhone;
  final String? outcome;

  Meeting({
    required this.id,
    required this.title,
    this.description,
    required this.meetingDate,
    this.location,
    required this.meetingType,
    required this.status,
    this.leadName,
    this.leadPhone,
    this.outcome,
  });

  factory Meeting.fromJson(Map<String, dynamic> json) => Meeting(
        id: json['id'],
        title: json['title'],
        description: json['description'],
        meetingDate: DateTime.parse(json['meeting_date']),
        location: json['location'],
        meetingType: json['meeting_type'] ?? 'in_person',
        status: json['status'] ?? 'scheduled',
        leadName: json['lead']?['name'],
        leadPhone: json['lead']?['phone'],
        outcome: json['outcome'],
      );
}

class AppNotification {
  final int id;
  final String title;
  final String? titleAr;
  final String body;
  final String? bodyAr;
  final String type;
  final bool isRead;
  final DateTime createdAt;

  AppNotification({
    required this.id,
    required this.title,
    this.titleAr,
    required this.body,
    this.bodyAr,
    required this.type,
    required this.isRead,
    required this.createdAt,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) => AppNotification(
        id: json['id'],
        title: json['title'],
        titleAr: json['title_ar'],
        body: json['body'],
        bodyAr: json['body_ar'],
        type: json['type'],
        isRead: json['is_read'] ?? false,
        createdAt: DateTime.parse(json['created_at']),
      );
}

