class QualitySummary {
  final String declaredGrade;
  final String? color;
  final String? size;
  final String? moisturePercent;
  final String? demoLabel;

  QualitySummary({
    this.declaredGrade = 'A',
    this.color,
    this.size,
    this.moisturePercent,
    this.demoLabel,
  });

  factory QualitySummary.fromJson(Map<String, dynamic> json) {
    return QualitySummary(
      declaredGrade: json['declared_grade'] as String? ?? 'A',
      color: json['color'] as String?,
      size: json['size'] as String?,
      moisturePercent: json['moisture_percent']?.toString(),
      demoLabel: json['demo_label'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'declared_grade': declaredGrade,
      if (color != null) 'color': color,
      if (size != null) 'size': size,
      if (moisturePercent != null) 'moisture_percent': moisturePercent,
      if (demoLabel != null) 'demo_label': demoLabel,
    };
  }
}

class ProduceListing {
  final String id;
  final String farmerProfileId;
  final String cropId;
  final String? varietyId;
  final double quantity;
  final double availableQuantity;
  final String unit;
  final DateTime? harvestDate;
  final DateTime availableFrom;
  final DateTime? availableUntil;
  final String district;
  final String state;
  final String? postalArea;
  final QualitySummary qualitySummary;
  final String status;
  final int version;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  // Transient populated names for rich display
  final String? cropName;
  final String? varietyName;

  ProduceListing({
    required this.id,
    required this.farmerProfileId,
    required this.cropId,
    this.varietyId,
    required this.quantity,
    required this.availableQuantity,
    this.unit = 'kg',
    this.harvestDate,
    required this.availableFrom,
    this.availableUntil,
    required this.district,
    required this.state,
    this.postalArea,
    required this.qualitySummary,
    this.status = 'DRAFT',
    this.version = 1,
    this.createdAt,
    this.updatedAt,
    this.cropName,
    this.varietyName,
  });

  factory ProduceListing.fromJson(Map<String, dynamic> json) {
    return ProduceListing(
      id: json['id'] as String,
      farmerProfileId: json['farmer_profile_id'] as String? ?? '',
      cropId: json['crop_id'] as String,
      varietyId: json['variety_id'] as String?,
      quantity: double.tryParse(json['quantity'].toString()) ?? 0.0,
      availableQuantity: double.tryParse(json['available_quantity']?.toString() ?? json['quantity'].toString()) ?? 0.0,
      unit: json['unit'] as String? ?? 'kg',
      harvestDate: json['harvest_date'] != null ? DateTime.tryParse(json['harvest_date'].toString()) : null,
      availableFrom: json['available_from'] != null
          ? DateTime.tryParse(json['available_from'].toString()) ?? DateTime.now()
          : DateTime.now(),
      availableUntil: json['available_until'] != null ? DateTime.tryParse(json['available_until'].toString()) : null,
      district: json['district'] as String? ?? '',
      state: json['state'] as String? ?? '',
      postalArea: json['postal_area'] as String?,
      qualitySummary: QualitySummary.fromJson(json['quality_summary'] as Map<String, dynamic>? ?? {}),
      status: json['status'] as String? ?? 'DRAFT',
      version: json['version'] as int? ?? 1,
      createdAt: json['created_at'] != null ? DateTime.tryParse(json['created_at'].toString()) : null,
      updatedAt: json['updated_at'] != null ? DateTime.tryParse(json['updated_at'].toString()) : null,
      cropName: json['crop_name'] as String?,
      varietyName: json['variety_name'] as String?,
    );
  }

  Map<String, dynamic> toCreateJson() {
    return {
      'crop_id': cropId,
      if (varietyId != null) 'variety_id': varietyId,
      'quantity': quantity.toStringAsFixed(3),
      'unit': unit,
      if (harvestDate != null) 'harvest_date': harvestDate!.toIso8601String().split('T')[0],
      'available_from': availableFrom.toIso8601String().split('T')[0],
      if (availableUntil != null) 'available_until': availableUntil!.toIso8601String().split('T')[0],
      'district': district,
      'state': state,
      if (postalArea != null) 'postal_area': postalArea,
      'quality_summary': qualitySummary.toJson(),
    };
  }

  bool get isDraft => status == 'DRAFT';
  bool get isActive => status == 'ACTIVE';
  bool get isSold => status == 'SOLD';
  bool get isCancelled => status == 'CANCELLED';
  bool get isReserved => status == 'RESERVED';
}
