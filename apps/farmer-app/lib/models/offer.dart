class AcknowledgedAmounts {
  final String grossSellingValue;
  final String totalApplicableCost;
  final String netFarmerRealization;
  final String currency;

  const AcknowledgedAmounts({
    required this.grossSellingValue,
    required this.totalApplicableCost,
    required this.netFarmerRealization,
    this.currency = 'INR',
  });

  Map<String, dynamic> toJson() {
    return {
      'gross_selling_value': grossSellingValue,
      'total_applicable_cost': totalApplicableCost,
      'net_farmer_realization': netFarmerRealization,
      'currency': currency,
    };
  }
}

class Offer {
  final String id;
  final String listingId;
  final String? demandId;
  final String? buyerProfileId;
  final String? fpoId;
  final String buyerName;
  final double offeredQuantity;
  final String unit;
  final double unitPrice;
  final String currency;
  final String deliveryTerms;
  final DateTime expiresAt;
  final String status; // 'PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN', 'EXPIRED'
  final int version;
  final int listingVersion;
  final String? logisticsQuoteId;
  final String? recommendationOptionId;

  // Authoritative decimal strings received from backend economics
  final String? rawGrossValueString;
  final String? rawTotalCostString;
  final String? rawNfrString;
  final String? rawUnitPriceString;
  final String? rawQuantityString;

  // Display doubles
  final double? estimatedTotalCost;
  final double? estimatedNfr;
  final DateTime? createdAt;

  Offer({
    required this.id,
    required this.listingId,
    this.demandId,
    this.buyerProfileId,
    this.fpoId,
    required this.buyerName,
    required this.offeredQuantity,
    this.unit = 'kg',
    required this.unitPrice,
    this.currency = 'INR',
    required this.deliveryTerms,
    required this.expiresAt,
    this.status = 'PENDING',
    this.version = 1,
    this.listingVersion = 1,
    this.logisticsQuoteId,
    this.recommendationOptionId,
    this.rawGrossValueString,
    this.rawTotalCostString,
    this.rawNfrString,
    this.rawUnitPriceString,
    this.rawQuantityString,
    this.estimatedTotalCost,
    this.estimatedNfr,
    this.createdAt,
  });

  factory Offer.fromJson(Map<String, dynamic> json) {
    final qtyStr = json['offered_quantity']?.toString() ?? '1000.00';
    final priceStr = json['unit_price']?.toString() ?? '0.00';
    final qty = double.tryParse(qtyStr) ?? 1000.0;
    final price = double.tryParse(priceStr) ?? 0.0;
    final gross = qty * price;

    final rawGross = json['estimated_gross_selling_value']?.toString() ?? json['gross_selling_value']?.toString();
    final rawTotalCost = json['estimated_total_applicable_cost']?.toString() ?? json['estimated_total_cost']?.toString();
    final rawNfr = json['estimated_net_farmer_realization']?.toString() ?? json['estimated_nfr']?.toString();

    final cost = rawTotalCost != null ? double.tryParse(rawTotalCost) : null;
    final nfr = rawNfr != null ? double.tryParse(rawNfr) : (cost != null ? gross - cost : null);

    return Offer(
      id: json['id'] as String,
      listingId: json['listing_id'] as String? ?? '',
      demandId: json['demand_id'] as String?,
      buyerProfileId: json['buyer_profile_id'] as String?,
      fpoId: json['fpo_id'] as String?,
      buyerName: json['buyer_name'] as String? ?? json['organization_name'] as String? ?? 'Verified Buyer',
      offeredQuantity: qty,
      unit: json['unit'] as String? ?? 'kg',
      unitPrice: price,
      currency: json['currency'] as String? ?? 'INR',
      deliveryTerms: json['delivery_terms'] as String? ?? 'buyer_pickup',
      expiresAt: json['expires_at'] != null
          ? DateTime.tryParse(json['expires_at'].toString()) ?? DateTime.now().add(const Duration(days: 1))
          : DateTime.now().add(const Duration(days: 1)),
      status: json['status'] as String? ?? 'PENDING',
      version: json['version'] as int? ?? 1,
      listingVersion: json['listing_version'] as int? ?? 1,
      logisticsQuoteId: json['logistics_quote_id'] as String?,
      recommendationOptionId: json['recommendation_option_id'] as String?,
      rawGrossValueString: rawGross,
      rawTotalCostString: rawTotalCost,
      rawNfrString: rawNfr,
      rawUnitPriceString: priceStr,
      rawQuantityString: qtyStr,
      estimatedTotalCost: cost,
      estimatedNfr: nfr,
      createdAt: json['created_at'] != null ? DateTime.tryParse(json['created_at'].toString()) : null,
    );
  }

  /// Whether authoritative backend economics are present to allow financial acceptance
  bool get hasAuthoritativeEconomics =>
      logisticsQuoteId != null &&
      logisticsQuoteId!.isNotEmpty &&
      recommendationOptionId != null &&
      recommendationOptionId!.isNotEmpty &&
      rawGrossValueString != null &&
      rawTotalCostString != null &&
      rawNfrString != null;

  /// Returns the exact authoritative AcknowledgedAmounts without on-device recalculation
  AcknowledgedAmounts? get authoritativeAcknowledgedAmounts {
    if (!hasAuthoritativeEconomics) return null;
    return AcknowledgedAmounts(
      grossSellingValue: rawGrossValueString!,
      totalApplicableCost: rawTotalCostString!,
      netFarmerRealization: rawNfrString!,
      currency: currency,
    );
  }

  /// Binds an authoritative Recommendation snapshot to this Offer for guaranteed transaction integrity
  Offer bindRecommendation(Recommendation reco) {
    return Offer(
      id: id,
      listingId: listingId,
      demandId: demandId,
      buyerProfileId: buyerProfileId,
      fpoId: fpoId,
      buyerName: buyerName,
      offeredQuantity: offeredQuantity,
      unit: unit,
      unitPrice: unitPrice,
      currency: reco.currency,
      deliveryTerms: deliveryTerms,
      expiresAt: expiresAt,
      status: status,
      version: version,
      listingVersion: listingVersion,
      logisticsQuoteId: reco.logisticsQuoteId,
      recommendationOptionId: reco.id,
      rawGrossValueString: reco.grossSellingValueString,
      rawTotalCostString: reco.totalApplicableCostString,
      rawNfrString: reco.netFarmerRealizationString,
      rawUnitPriceString: reco.unitPriceString,
      rawQuantityString: reco.quantityKgString,
      estimatedTotalCost: reco.estimatedTotalApplicableCost,
      estimatedNfr: reco.estimatedNetFarmerRealization,
      createdAt: createdAt,
    );
  }

  double get grossValue => offeredQuantity * unitPrice;

  bool get isPending => status == 'PENDING';
  bool get isAccepted => status == 'ACCEPTED';
  bool get isRejected => status == 'REJECTED';
  bool get isExpired => status == 'EXPIRED' || expiresAt.isBefore(DateTime.now());

  Map<String, dynamic> toAcceptJson({
    required int offerVersion,
    required int listingVersion,
    required String logisticsQuoteId,
    String? recommendationOptionId,
    required AcknowledgedAmounts amounts,
  }) {
    return {
      'offer_version': offerVersion,
      'listing_version': listingVersion,
      'logistics_quote_id': logisticsQuoteId,
      if (recommendationOptionId != null) 'recommendation_option_id': recommendationOptionId,
      'acknowledged_amounts': amounts.toJson(),
    };
  }
}
