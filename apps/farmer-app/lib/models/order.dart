class OrderFinancialSnapshot {
  final String currency;
  final double quantityKg;
  final double unitPricePerKg;
  final double grossSellingValue;
  final double transportationCost;
  final double storageCost;
  final double handlingCost;
  final double otherApplicableCost;
  final double totalApplicableCost;
  final double netFarmerRealization;
  final DateTime? calculatedAt;

  OrderFinancialSnapshot({
    this.currency = 'INR',
    required this.quantityKg,
    required this.unitPricePerKg,
    required this.grossSellingValue,
    required this.transportationCost,
    required this.storageCost,
    required this.handlingCost,
    required this.otherApplicableCost,
    required this.totalApplicableCost,
    required this.netFarmerRealization,
    this.calculatedAt,
  });

  factory OrderFinancialSnapshot.fromJson(Map<String, dynamic> json) {
    return OrderFinancialSnapshot(
      currency: json['snapshot_currency'] as String? ?? 'INR',
      quantityKg: double.tryParse(json['snapshot_quantity_kg']?.toString() ?? '1000') ?? 1000.0,
      unitPricePerKg: double.tryParse(json['snapshot_unit_price_per_kg']?.toString() ?? '0') ?? 0.0,
      grossSellingValue: double.tryParse(json['snapshot_gross_selling_value']?.toString() ?? '0') ?? 0.0,
      transportationCost: double.tryParse(json['snapshot_transportation_cost']?.toString() ?? '0') ?? 0.0,
      storageCost: double.tryParse(json['snapshot_storage_cost']?.toString() ?? '0') ?? 0.0,
      handlingCost: double.tryParse(json['snapshot_handling_cost']?.toString() ?? '0') ?? 0.0,
      otherApplicableCost: double.tryParse(json['snapshot_other_applicable_cost']?.toString() ?? '0') ?? 0.0,
      totalApplicableCost: double.tryParse(json['snapshot_total_applicable_cost']?.toString() ?? '0') ?? 0.0,
      netFarmerRealization: double.tryParse(json['snapshot_net_farmer_realization']?.toString() ?? '0') ?? 0.0,
      calculatedAt: json['snapshot_calculated_at'] != null
          ? DateTime.tryParse(json['snapshot_calculated_at'].toString())
          : null,
    );
  }
}

class OrderStatusHistoryItem {
  final String id;
  final String orderId;
  final String fromStatus;
  final String toStatus;
  final String? actor;
  final String? reason;
  final DateTime changedAt;

  OrderStatusHistoryItem({
    required this.id,
    required this.orderId,
    required this.fromStatus,
    required this.toStatus,
    this.actor,
    this.reason,
    required this.changedAt,
  });

  factory OrderStatusHistoryItem.fromJson(Map<String, dynamic> json) {
    return OrderStatusHistoryItem(
      id: json['id'] as String,
      orderId: json['order_id'] as String? ?? '',
      fromStatus: json['from_status'] as String? ?? '',
      toStatus: json['to_status'] as String? ?? '',
      actor: json['actor'] as String?,
      reason: json['reason'] as String?,
      changedAt: json['changed_at'] != null
          ? DateTime.tryParse(json['changed_at'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}

class Order {
  final String id;
  final String farmerProfileId;
  final String? buyerProfileId;
  final String? fpoId;
  final String? buyerName;
  final String listingId;
  final String acceptedOfferId;
  final String status; // 'CONFIRMED', 'PICKUP_SCHEDULED', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'DISPUTED'
  final String paymentStatus; // 'PENDING', 'PROCESSING', 'PAID', 'FAILED'
  final int version;
  final OrderFinancialSnapshot snapshot;
  final DateTime acceptedAt;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final String? cropName;

  Order({
    required this.id,
    required this.farmerProfileId,
    this.buyerProfileId,
    this.fpoId,
    this.buyerName,
    required this.listingId,
    required this.acceptedOfferId,
    this.status = 'CONFIRMED',
    this.paymentStatus = 'PENDING',
    this.version = 1,
    required this.snapshot,
    required this.acceptedAt,
    this.createdAt,
    this.updatedAt,
    this.cropName,
  });

  factory Order.fromJson(Map<String, dynamic> json) {
    return Order(
      id: json['id'] as String,
      farmerProfileId: json['farmer_profile_id'] as String? ?? '',
      buyerProfileId: json['buyer_profile_id'] as String?,
      fpoId: json['fpo_id'] as String?,
      buyerName: json['buyer_name'] as String? ?? json['organization_name'] as String? ?? 'DEMO Buyer B',
      listingId: json['listing_id'] as String? ?? '',
      acceptedOfferId: json['accepted_offer_id'] as String? ?? '',
      status: json['status'] as String? ?? 'CONFIRMED',
      paymentStatus: json['payment_status'] as String? ?? 'PAID',
      version: json['version'] as int? ?? 1,
      snapshot: OrderFinancialSnapshot.fromJson(json),
      acceptedAt: json['accepted_at'] != null
          ? DateTime.tryParse(json['accepted_at'].toString()) ?? DateTime.now()
          : DateTime.now(),
      createdAt: json['created_at'] != null ? DateTime.tryParse(json['created_at'].toString()) : null,
      updatedAt: json['updated_at'] != null ? DateTime.tryParse(json['updated_at'].toString()) : null,
      cropName: json['crop_name'] as String?,
    );
  }

  bool get isCompleted => status == 'COMPLETED';
  bool get isActive => status != 'COMPLETED' && status != 'CANCELLED';
  bool get isPaid => paymentStatus == 'PAID';
}
