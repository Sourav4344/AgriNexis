class GrievanceMessage {
  final String id;
  final String grievanceId;
  final String? authorProfileId;
  final String body;
  final bool isFarmer;
  final DateTime createdAt;

  GrievanceMessage({
    required this.id,
    required this.grievanceId,
    this.authorProfileId,
    required this.body,
    this.isFarmer = true,
    required this.createdAt,
  });

  factory GrievanceMessage.fromJson(Map<String, dynamic> json) {
    return GrievanceMessage(
      id: json['id'] as String,
      grievanceId: json['grievance_id'] as String? ?? '',
      authorProfileId: json['author_profile_id'] as String?,
      body: json['body'] as String? ?? '',
      isFarmer: json['is_farmer'] as bool? ?? true,
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}

class Grievance {
  final String id;
  final String? orderId;
  final String complainantProfileId;
  final String category; // 'PAYMENT_DELAY', 'QUALITY_DISPUTE', 'LOGISTICS_ISSUE', 'WEIGHMENT_MISMATCH', 'OTHER'
  final String description;
  final String status; // 'OPEN', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED'
  final String? resolution;
  final DateTime createdAt;
  final DateTime? resolvedAt;
  final List<GrievanceMessage> messages;

  Grievance({
    required this.id,
    this.orderId,
    required this.complainantProfileId,
    required this.category,
    required this.description,
    this.status = 'OPEN',
    this.resolution,
    required this.createdAt,
    this.resolvedAt,
    this.messages = const [],
  });

  factory Grievance.fromJson(Map<String, dynamic> json) {
    return Grievance(
      id: json['id'] as String,
      orderId: json['order_id'] as String?,
      complainantProfileId: json['complainant_profile_id'] as String? ?? '',
      category: json['category'] as String? ?? 'OTHER',
      description: json['description'] as String? ?? '',
      status: json['status'] as String? ?? 'OPEN',
      resolution: json['resolution'] as String?,
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'].toString()) ?? DateTime.now()
          : DateTime.now(),
      resolvedAt: json['resolved_at'] != null ? DateTime.tryParse(json['resolved_at'].toString()) : null,
      messages: (json['messages'] as List<dynamic>?)
              ?.map((m) => GrievanceMessage.fromJson(m as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }

  bool get isOpen => status == 'OPEN';
  bool get isUnderReview => status == 'UNDER_REVIEW';
  bool get isResolved => status == 'RESOLVED' || status == 'CLOSED';

  String get categoryDisplayName {
    switch (category) {
      case 'PAYMENT_DELAY':
        return 'Payment Delay (भुगतान में देरी)';
      case 'QUALITY_DISPUTE':
        return 'Quality Dispute (गुणवत्ता विवाद)';
      case 'LOGISTICS_ISSUE':
        return 'Logistics / Pickup Delay (परिवहन समस्या)';
      case 'WEIGHMENT_MISMATCH':
        return 'Weight Discrepancy (वजन में अंतर)';
      default:
        return 'General Query (सामान्य प्रश्न)';
    }
  }
}
