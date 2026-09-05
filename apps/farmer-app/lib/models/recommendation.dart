import 'dart:convert';

class Recommendation {
  final String id;
  final String farmerProfileId;
  final String listingId;
  final String? candidateBuyerProfileId;
  final String? candidateFpoId;
  final String? candidateMandiId;
  final String candidateName;
  final String? demandId;
  final String logisticsQuoteId;
  final String quantityKgString;
  final String unitPriceString;
  final String grossSellingValueString;
  final String transportationCostString;
  final String storageCostString;
  final String handlingCostString;
  final String otherApplicableCostString;
  final String totalApplicableCostString;
  final String netFarmerRealizationString;
  final String currency;

  // Display doubles
  final double estimatedQuantityKg;
  final double estimatedUnitPricePerKg;
  final double estimatedGrossSellingValue;
  final double estimatedTransportationCost;
  final double estimatedStorageCost;
  final double estimatedHandlingCost;
  final double estimatedOtherApplicableCost;
  final double estimatedTotalApplicableCost;
  final double estimatedNetFarmerRealization; // NFR
  final double differenceFromBest;
  final int rank;
  final String sellWait; // 'SELL_NOW', 'WAIT'
  final List<String> explanationFacts;
  final double confidence;
  final String dataMode;
  final String? dataWarning;
  final double? distanceKm;
  final DateTime? calculatedAt;
  final DateTime? expiresAt;
  final String? buyerVerificationStatus; // 'VERIFIED', 'ACTIVE'

  Recommendation({
    required this.id,
    required this.farmerProfileId,
    required this.listingId,
    this.candidateBuyerProfileId,
    this.candidateFpoId,
    this.candidateMandiId,
    required this.candidateName,
    this.demandId,
    required this.logisticsQuoteId,
    required this.quantityKgString,
    required this.unitPriceString,
    required this.grossSellingValueString,
    required this.transportationCostString,
    required this.storageCostString,
    required this.handlingCostString,
    required this.otherApplicableCostString,
    required this.totalApplicableCostString,
    required this.netFarmerRealizationString,
    this.currency = 'INR',
    required this.estimatedQuantityKg,
    required this.estimatedUnitPricePerKg,
    required this.estimatedGrossSellingValue,
    required this.estimatedTransportationCost,
    required this.estimatedStorageCost,
    required this.estimatedHandlingCost,
    required this.estimatedOtherApplicableCost,
    required this.estimatedTotalApplicableCost,
    required this.estimatedNetFarmerRealization,
    this.differenceFromBest = 0.0,
    required this.rank,
    this.sellWait = 'SELL_NOW',
    this.explanationFacts = const [],
    this.confidence = 1.0,
    this.dataMode = 'DEMO',
    this.dataWarning,
    this.distanceKm,
    this.calculatedAt,
    this.expiresAt,
    this.buyerVerificationStatus = 'VERIFIED',
  });

  factory Recommendation.fromJson(Map<String, dynamic> json) {
    List<String> parseFacts(dynamic facts) {
      if (facts == null) return [];
      if (facts is List) return facts.map((e) => e.toString()).toList();
      if (facts is String) {
        try {
          final decoded = jsonDecode(facts);
          if (decoded is List) return decoded.map((e) => e.toString()).toList();
        } catch (_) {
          return [facts];
        }
      }
      return [];
    }

    final mode = json['data_mode'] as String? ?? 'DEMO';
    final qtyStr = json['estimated_quantity_kg']?.toString() ?? '1000.00';
    final priceStr = json['estimated_unit_price_per_kg']?.toString() ?? '0.00';
    final grossStr = json['estimated_gross_selling_value']?.toString() ?? '0.00';
    final transStr = json['estimated_transportation_cost']?.toString() ?? '0.00';
    final storStr = json['estimated_storage_cost']?.toString() ?? '0.00';
    final handStr = json['estimated_handling_cost']?.toString() ?? '0.00';
    final otherStr = json['estimated_other_applicable_cost']?.toString() ?? '0.00';
    final totalCostStr = json['estimated_total_applicable_cost']?.toString() ?? '0.00';
    final nfrStr = json['estimated_net_farmer_realization']?.toString() ?? '0.00';
    final curr = json['currency']?.toString() ?? 'INR';

    return Recommendation(
      id: json['id'] as String,
      farmerProfileId: json['farmer_profile_id'] as String? ?? '',
      listingId: json['listing_id'] as String? ?? '',
      candidateBuyerProfileId: json['candidate_buyer_profile_id'] as String?,
      candidateFpoId: json['candidate_fpo_id'] as String?,
      candidateMandiId: json['candidate_mandi_id'] as String?,
      candidateName: json['candidate_name'] as String? ?? 'Buyer',
      demandId: json['demand_id'] as String?,
      logisticsQuoteId: json['logistics_quote_id'] as String? ?? '',
      quantityKgString: qtyStr,
      unitPriceString: priceStr,
      grossSellingValueString: grossStr,
      transportationCostString: transStr,
      storageCostString: storStr,
      handlingCostString: handStr,
      otherApplicableCostString: otherStr,
      totalApplicableCostString: totalCostStr,
      netFarmerRealizationString: nfrStr,
      currency: curr,
      estimatedQuantityKg: double.tryParse(qtyStr) ?? 1000.0,
      estimatedUnitPricePerKg: double.tryParse(priceStr) ?? 0.0,
      estimatedGrossSellingValue: double.tryParse(grossStr) ?? 0.0,
      estimatedTransportationCost: double.tryParse(transStr) ?? 0.0,
      estimatedStorageCost: double.tryParse(storStr) ?? 0.0,
      estimatedHandlingCost: double.tryParse(handStr) ?? 0.0,
      estimatedOtherApplicableCost: double.tryParse(otherStr) ?? 0.0,
      estimatedTotalApplicableCost: double.tryParse(totalCostStr) ?? 0.0,
      estimatedNetFarmerRealization: double.tryParse(nfrStr) ?? 0.0,
      differenceFromBest: json['difference_from_best'] != null ? double.tryParse(json['difference_from_best'].toString()) ?? 0.0 : 0.0,
      rank: json['rank'] as int? ?? 1,
      sellWait: json['sell_wait'] as String? ?? 'SELL_NOW',
      explanationFacts: parseFacts(json['explanation_facts']),
      confidence: double.tryParse(json['confidence']?.toString() ?? '1.0') ?? 1.0,
      dataMode: mode,
      dataWarning: json['data_warning'] as String? ?? (mode == 'DEMO' ? 'DEMO DATA — NOT LIVE GOVERNMENT DATA' : null),
      distanceKm: json['distance_km'] != null ? double.tryParse(json['distance_km'].toString()) : null,
      calculatedAt: json['calculated_at'] != null ? DateTime.tryParse(json['calculated_at'].toString()) : null,
      expiresAt: json['expires_at'] != null ? DateTime.tryParse(json['expires_at'].toString()) : null,
      buyerVerificationStatus: json['verification_status'] as String? ?? 'VERIFIED',
    );
  }

  /// Exports exact authoritative decimal strings for Offer acceptance without floating point roundtrips
  AcknowledgedAmounts toAcknowledgedAmounts() {
    return AcknowledgedAmounts(
      grossSellingValue: grossSellingValueString,
      totalApplicableCost: totalApplicableCostString,
      netFarmerRealization: netFarmerRealizationString,
      currency: currency,
    );
  }

  /// Net Realization per kg (e.g. ₹28.75/kg)
  double get netPerKg => estimatedQuantityKg > 0
      ? estimatedNetFarmerRealization / estimatedQuantityKg
      : 0.0;

  bool get isBestOption => rank == 1;
  bool get isDemo => dataMode == 'DEMO';

  /// Human-readable explanation text for Indian farmers
  String get explanationText {
    if (explanationFacts.contains('HIGHER_NET_REALIZATION') || isBestOption) {
      if (distanceKm != null && distanceKm! < 50) {
        return 'Closer distance reduces transport costs and leaves maximum net earnings in your hand.';
      }
      return 'Lower logistics and handling deductions give you the highest actual cash in hand.';
    }
    return 'Higher headline price is offset by higher transportation and storage deductions.';
  }
}
