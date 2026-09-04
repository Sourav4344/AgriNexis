class NotificationItem {
  final String id;
  final String type; // 'OFFER_RECEIVED', 'ORDER_TRANSITION', 'PRICE_ALERT', 'GRIEVANCE_UPDATE'
  final String title;
  final String body;
  final Map<String, dynamic> payload;
  final String status;
  final DateTime createdAt;
  final bool isRead;

  NotificationItem({
    required this.id,
    required this.type,
    required this.title,
    required this.body,
    this.payload = const {},
    this.status = 'SENT',
    required this.createdAt,
    this.isRead = false,
  });

  factory NotificationItem.fromJson(Map<String, dynamic> json) {
    return NotificationItem(
      id: json['id'] as String,
      type: json['type'] as String? ?? 'SYSTEM',
      title: json['title'] as String? ?? 'Notification',
      body: json['body'] as String? ?? '',
      payload: json['payload'] as Map<String, dynamic>? ?? {},
      status: json['status'] as String? ?? 'SENT',
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'].toString()) ?? DateTime.now()
          : DateTime.now(),
      isRead: json['read_at'] != null || (json['is_read'] as bool? ?? false),
    );
  }
}
