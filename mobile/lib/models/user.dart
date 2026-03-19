class Role {
  final int id;
  final String name;
  final String nameAr;
  final int level;

  Role({required this.id, required this.name, required this.nameAr, required this.level});

  factory Role.fromJson(Map<String, dynamic> json) => Role(
        id: json['id'],
        name: json['name'],
        nameAr: json['name_ar'] ?? json['name'],
        level: json['level'] ?? 1,
      );
}

class User {
  final int id;
  final String name;
  final String email;
  final String? phone;
  final String? avatar;
  final Role? role;
  final bool isActive;

  User({
    required this.id,
    required this.name,
    required this.email,
    this.phone,
    this.avatar,
    this.role,
    this.isActive = true,
  });

  factory User.fromJson(Map<String, dynamic> json) => User(
        id: json['id'],
        name: json['name'],
        email: json['email'],
        phone: json['phone'],
        avatar: json['avatar'],
        role: json['role'] != null ? Role.fromJson(json['role']) : null,
        isActive: json['is_active'] ?? true,
      );

  bool get isAdmin => role?.name == 'admin';
  bool get isManager => role?.name == 'manager';
  bool get isSales => role?.name == 'sales';
}

