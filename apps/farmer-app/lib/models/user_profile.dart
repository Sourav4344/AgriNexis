class UserProfile {
  final String id;
  final String userId;
  final String role;
  final String displayName;
  final String preferredLocale;
  final String status;
  final String? phone;
  final String? farmSummary;
  final String? district;
  final String? state;
  final String? postalArea;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  UserProfile({
    required this.id,
    required this.userId,
    required this.role,
    required this.displayName,
    this.preferredLocale = 'hi',
    this.status = 'ACTIVE',
    this.phone,
    this.farmSummary,
    this.district,
    this.state,
    this.postalArea,
    this.createdAt,
    this.updatedAt,
  });

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      id: json['id'] as String,
      userId: json['user_id'] as String? ?? '',
      role: json['role'] as String? ?? 'FARMER',
      displayName: json['display_name'] as String? ?? 'Farmer',
      preferredLocale: json['preferred_locale'] as String? ?? 'hi',
      status: json['status'] as String? ?? 'ACTIVE',
      phone: json['phone'] as String?,
      farmSummary: json['farm_summary'] as String?,
      district: json['farmer_district'] as String? ?? json['district'] as String?,
      state: json['farmer_state'] as String? ?? json['state'] as String?,
      postalArea: json['postal_area'] as String?,
      createdAt: json['created_at'] != null ? DateTime.tryParse(json['created_at'] as String) : null,
      updatedAt: json['updated_at'] != null ? DateTime.tryParse(json['updated_at'] as String) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'role': role,
      'display_name': displayName,
      'preferred_locale': preferredLocale,
      'phone': phone,
      'farm_summary': farmSummary,
      'district': district,
      'state': state,
      'postal_area': postalArea,
    };
  }

  UserProfile copyWith({
    String? displayName,
    String? preferredLocale,
    String? phone,
    String? farmSummary,
    String? district,
    String? state,
    String? postalArea,
  }) {
    return UserProfile(
      id: id,
      userId: userId,
      role: role,
      displayName: displayName ?? this.displayName,
      preferredLocale: preferredLocale ?? this.preferredLocale,
      status: status,
      phone: phone ?? this.phone,
      farmSummary: farmSummary ?? this.farmSummary,
      district: district ?? this.district,
      state: state ?? this.state,
      postalArea: postalArea ?? this.postalArea,
      createdAt: createdAt,
      updatedAt: updatedAt,
    );
  }
}
