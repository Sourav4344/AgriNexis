enum PredictionTrend {
  rising,
  stable,
  falling,
  insufficientData;

  static PredictionTrend fromString(String? value) {
    switch (value?.toUpperCase()) {
      case 'RISING':
        return PredictionTrend.rising;
      case 'FALLING':
        return PredictionTrend.falling;
      case 'STABLE':
        return PredictionTrend.stable;
      default:
        return PredictionTrend.insufficientData;
    }
  }

  String get displayName {
    switch (this) {
      case PredictionTrend.rising:
        return 'Rising (बढ़त)';
      case PredictionTrend.falling:
        return 'Falling (गिरावट)';
      case PredictionTrend.stable:
        return 'Stable (स्थिर)';
      case PredictionTrend.insufficientData:
        return 'Insufficient Data (सीमित डेटा)';
    }
  }
}

class PricePrediction {
  final String? id;
  final String cropId;
  final String? varietyId;
  final double? predictedPrice;
  final double? minPriceRange;
  final double? maxPriceRange;
  final PredictionTrend trend;
  final int horizonDays;
  final double? confidence; // 0.0 to 1.0, only when actually available
  final String sellWait; // 'SELL_NOW', 'WAIT', 'INSUFFICIENT_DATA'
  final List<String> explanationReasons;
  final List<String> warnings;
  final String dataMode; // 'LIVE', 'CACHED', 'DEMO'
  final DateTime calculatedAt;
  final String? modelVersion;
  final bool isConfigured;

  PricePrediction({
    this.id,
    required this.cropId,
    this.varietyId,
    this.predictedPrice,
    this.minPriceRange,
    this.maxPriceRange,
    this.trend = PredictionTrend.insufficientData,
    this.horizonDays = 3,
    this.confidence,
    this.sellWait = 'INSUFFICIENT_DATA',
    this.explanationReasons = const [],
    this.warnings = const [],
    this.dataMode = 'DEMO',
    required this.calculatedAt,
    this.modelVersion,
    this.isConfigured = true,
  });

  factory PricePrediction.insufficientData({required String cropId, String? reason}) {
    return PricePrediction(
      cropId: cropId,
      trend: PredictionTrend.insufficientData,
      sellWait: 'INSUFFICIENT_DATA',
      warnings: [reason ?? 'Insufficient market historical arrivals to generate high-confidence price forecast.'],
      calculatedAt: DateTime.now(),
      isConfigured: false,
    );
  }

  factory PricePrediction.fromJson(Map<String, dynamic> json) {
    return PricePrediction(
      id: json['id'] as String?,
      cropId: json['crop_id'] as String? ?? '',
      varietyId: json['variety_id'] as String?,
      predictedPrice: json['predicted_price'] != null ? double.tryParse(json['predicted_price'].toString()) : null,
      minPriceRange: json['min_price_range'] != null ? double.tryParse(json['min_price_range'].toString()) : null,
      maxPriceRange: json['max_price_range'] != null ? double.tryParse(json['max_price_range'].toString()) : null,
      trend: PredictionTrend.fromString(json['trend'] as String?),
      horizonDays: json['horizon_days'] as int? ?? 3,
      confidence: json['confidence'] != null ? double.tryParse(json['confidence'].toString()) : null,
      sellWait: json['sell_wait'] as String? ?? 'INSUFFICIENT_DATA',
      explanationReasons: (json['explanation_reasons'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
      warnings: (json['warnings'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
      dataMode: json['data_mode'] as String? ?? 'DEMO',
      calculatedAt: json['calculated_at'] != null
          ? DateTime.tryParse(json['calculated_at'].toString()) ?? DateTime.now()
          : DateTime.now(),
      modelVersion: json['model_version'] as String?,
      isConfigured: json['is_configured'] as bool? ?? true,
    );
  }

  bool get hasValidPrediction =>
      predictedPrice != null && trend != PredictionTrend.insufficientData;

  bool get isSellNow => sellWait == 'SELL_NOW';
  bool get isWait => sellWait == 'WAIT';
}
