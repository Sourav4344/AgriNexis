class Mandi {
  final String id;
  final String? providerName;
  final String? externalId;
  final String name;
  final String district;
  final String state;
  final bool active;

  Mandi({
    required this.id,
    this.providerName,
    this.externalId,
    required this.name,
    required this.district,
    required this.state,
    this.active = true,
  });

  factory Mandi.fromJson(Map<String, dynamic> json) {
    return Mandi(
      id: json['id'] as String,
      providerName: json['provider_name'] as String?,
      externalId: json['external_id'] as String?,
      name: json['name'] as String? ?? 'Mandi',
      district: json['district'] as String? ?? '',
      state: json['state'] as String? ?? '',
      active: json['active'] as bool? ?? true,
    );
  }
}

class MandiPrice {
  final String id;
  final String mandiId;
  final String cropId;
  final String? varietyId;
  final double minPrice;
  final double modalPrice;
  final double maxPrice;
  final String currency;
  final String normalizedUnit;
  final DateTime observedAt;
  final DateTime? fetchedAt;
  final String sourceName;
  final String dataMode; // 'LIVE', 'CACHED', 'DEMO'
  final String? dataWarning;
  final double? arrivalQuantityKg;
  final Map<String, dynamic>? provenance;

  // Transient display names
  final String? mandiName;
  final String? cropName;

  MandiPrice({
    required this.id,
    required this.mandiId,
    required this.cropId,
    this.varietyId,
    required this.minPrice,
    required this.modalPrice,
    required this.maxPrice,
    this.currency = 'INR',
    this.normalizedUnit = 'kg',
    required this.observedAt,
    this.fetchedAt,
    this.sourceName = 'AGMARKNET',
    this.dataMode = 'LIVE',
    this.dataWarning,
    this.arrivalQuantityKg,
    this.provenance,
    this.mandiName,
    this.cropName,
  });

  factory MandiPrice.fromJson(Map<String, dynamic> json) {
    final mode = json['data_mode'] as String? ?? 'LIVE';
    return MandiPrice(
      id: json['id'] as String,
      mandiId: json['mandi_id'] as String,
      cropId: json['crop_id'] as String,
      varietyId: json['variety_id'] as String?,
      minPrice: double.tryParse(json['min_price'].toString()) ?? 0.0,
      modalPrice: double.tryParse(json['modal_price'].toString()) ?? 0.0,
      maxPrice: double.tryParse(json['max_price'].toString()) ?? 0.0,
      currency: json['currency'] as String? ?? 'INR',
      normalizedUnit: json['normalized_unit'] as String? ?? 'kg',
      observedAt: json['observed_at'] != null
          ? DateTime.tryParse(json['observed_at'].toString()) ?? DateTime.now()
          : DateTime.now(),
      fetchedAt: json['fetched_at'] != null ? DateTime.tryParse(json['fetched_at'].toString()) : null,
      sourceName: json['source_name'] as String? ?? 'AGMARKNET',
      dataMode: mode,
      dataWarning: json['data_warning'] as String? ??
          (mode == 'DEMO' ? 'DEMO DATA — NOT LIVE GOVERNMENT DATA' : null),
      arrivalQuantityKg: json['arrival_quantity'] != null
          ? double.tryParse(json['arrival_quantity'].toString())
          : null,
      provenance: json['provenance'] as Map<String, dynamic>?,
      mandiName: json['mandi_name'] as String?,
      cropName: json['crop_name'] as String?,
    );
  }

  bool get isDemo => dataMode == 'DEMO';
  bool get isCached => dataMode == 'CACHED';
  bool get isLive => dataMode == 'LIVE';
}
