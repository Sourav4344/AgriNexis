import '../core/constants/api_endpoints.dart';
import '../core/constants/app_config.dart';
import '../core/constants/app_constants.dart';
import '../core/network/api_client.dart';
import '../core/utils/id_generator.dart';
import '../models/offer.dart';
import '../models/order.dart';

abstract class OfferRepository {
  Future<List<Offer>> getOffersForFarmer();
  Future<Offer> getOfferById(String id);
  Future<Order> acceptOffer({
    required Offer offer,
    required int listingVersion,
    required String logisticsQuoteId,
    String? recommendationOptionId,
    required AcknowledgedAmounts acknowledgedAmounts,
  });
  Future<Offer> rejectOffer(String id);
}

class ApiOfferRepository implements OfferRepository {
  final ApiClient _apiClient;
  final List<Offer> _localOffers = [];

  ApiOfferRepository({required ApiClient apiClient}) : _apiClient = apiClient {
    _localOffers.addAll(_demoOffers);
  }

  @override
  Future<List<Offer>> getOffersForFarmer() async {
    try {
      final response = await _apiClient.get(
        ApiEndpoints.offers,
        fromJson: (data) => (data as List<dynamic>)
            .map((e) => Offer.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
      if (response.data.isNotEmpty) {
        return response.data;
      }
      if (AppConfig.isDemoMode) {
        return List.unmodifiable(_localOffers);
      }
      return [];
    } catch (_) {
      if (AppConfig.isDemoMode) {
        return List.unmodifiable(_localOffers);
      }
      rethrow;
    }
  }

  @override
  Future<Offer> getOfferById(String id) async {
    try {
      final response = await _apiClient.get(
        ApiEndpoints.offer(id),
        fromJson: (data) => Offer.fromJson(data as Map<String, dynamic>),
      );
      return response.data;
    } catch (_) {
      if (AppConfig.isDemoMode) {
        return _localOffers.firstWhere(
          (o) => o.id == id,
          orElse: () => _demoOffers.first,
        );
      }
      rethrow;
    }
  }

  @override
  Future<Order> acceptOffer({
    required Offer offer,
    required int listingVersion,
    required String logisticsQuoteId,
    String? recommendationOptionId,
    required AcknowledgedAmounts acknowledgedAmounts,
  }) async {
    final idempotencyKey = IdGenerator.generateIdempotencyKey(
      prefix: 'SIH-FARMER-ACCEPT',
    );

    final payload = offer.toAcceptJson(
      offerVersion: offer.version,
      listingVersion: listingVersion,
      logisticsQuoteId: logisticsQuoteId,
      recommendationOptionId: recommendationOptionId,
      amounts: acknowledgedAmounts,
    );

    try {
      final response = await _apiClient.post(
        ApiEndpoints.acceptOffer(offer.id),
        idempotencyKey: idempotencyKey,
        body: payload,
        fromJson: (data) => Order.fromJson(data as Map<String, dynamic>),
      );

      _markOfferAccepted(offer.id);
      return response.data;
    } catch (_) {
      if (AppConfig.isDemoMode) {
        // In demo/offline mode, simulate atomic order creation with identical snapshot
        _markOfferAccepted(offer.id);
        return Order(
          id: IdGenerator.generateUuid(),
          farmerProfileId: AppConstants.demoFarmerId,
          buyerProfileId: offer.buyerProfileId,
          buyerName: offer.buyerName,
          listingId: offer.listingId,
          acceptedOfferId: offer.id,
          status: 'CONFIRMED',
          paymentStatus: 'PAID',
          version: 1,
          acceptedAt: DateTime.now(),
          cropName: 'Tomato (टमाटर)',
          snapshot: OrderFinancialSnapshot(
            currency: acknowledgedAmounts.currency,
            quantityKg: offer.offeredQuantity,
            unitPricePerKg: offer.unitPrice,
            grossSellingValue: double.tryParse(acknowledgedAmounts.grossSellingValue) ?? 31000.0,
            transportationCost: 1500.0,
            storageCost: 300.0,
            handlingCost: 300.0,
            otherApplicableCost: 150.0,
            totalApplicableCost: double.tryParse(acknowledgedAmounts.totalApplicableCost) ?? 2250.0,
            netFarmerRealization: double.tryParse(acknowledgedAmounts.netFarmerRealization) ?? 28750.0,
            calculatedAt: DateTime.now(),
          ),
        );
      }
      rethrow;
    }
  }

  @override
  Future<Offer> rejectOffer(String id) async {
    try {
      final response = await _apiClient.post(
        ApiEndpoints.rejectOffer(id),
        fromJson: (data) => Offer.fromJson(data as Map<String, dynamic>),
      );
      _markOfferRejected(id);
      return response.data;
    } catch (_) {
      if (AppConfig.isDemoMode) {
        _markOfferRejected(id);
        return _localOffers.firstWhere((o) => o.id == id, orElse: () => _demoOffers.first);
      }
      rethrow;
    }
  }

  void _markOfferAccepted(String id) {
    final idx = _localOffers.indexWhere((o) => o.id == id);
    if (idx != -1) {
      final curr = _localOffers[idx];
      _localOffers[idx] = Offer(
        id: curr.id,
        listingId: curr.listingId,
        demandId: curr.demandId,
        buyerProfileId: curr.buyerProfileId,
        fpoId: curr.fpoId,
        buyerName: curr.buyerName,
        offeredQuantity: curr.offeredQuantity,
        unit: curr.unit,
        unitPrice: curr.unitPrice,
        currency: curr.currency,
        deliveryTerms: curr.deliveryTerms,
        expiresAt: curr.expiresAt,
        status: 'ACCEPTED',
        version: curr.version + 1,
        listingVersion: curr.listingVersion,
        logisticsQuoteId: curr.logisticsQuoteId,
        recommendationOptionId: curr.recommendationOptionId,
        rawGrossValueString: curr.rawGrossValueString,
        rawTotalCostString: curr.rawTotalCostString,
        rawNfrString: curr.rawNfrString,
        rawUnitPriceString: curr.rawUnitPriceString,
        rawQuantityString: curr.rawQuantityString,
        estimatedTotalCost: curr.estimatedTotalCost,
        estimatedNfr: curr.estimatedNfr,
      );
    }
  }

  void _markOfferRejected(String id) {
    final idx = _localOffers.indexWhere((o) => o.id == id);
    if (idx != -1) {
      final curr = _localOffers[idx];
      _localOffers[idx] = Offer(
        id: curr.id,
        listingId: curr.listingId,
        demandId: curr.demandId,
        buyerProfileId: curr.buyerProfileId,
        fpoId: curr.fpoId,
        buyerName: curr.buyerName,
        offeredQuantity: curr.offeredQuantity,
        unit: curr.unit,
        unitPrice: curr.unitPrice,
        currency: curr.currency,
        deliveryTerms: curr.deliveryTerms,
        expiresAt: curr.expiresAt,
        status: 'REJECTED',
        version: curr.version + 1,
        listingVersion: curr.listingVersion,
        logisticsQuoteId: curr.logisticsQuoteId,
        recommendationOptionId: curr.recommendationOptionId,
        rawGrossValueString: curr.rawGrossValueString,
        rawTotalCostString: curr.rawTotalCostString,
        rawNfrString: curr.rawNfrString,
        rawUnitPriceString: curr.rawUnitPriceString,
        rawQuantityString: curr.rawQuantityString,
        estimatedTotalCost: curr.estimatedTotalCost,
        estimatedNfr: curr.estimatedNfr,
      );
    }
  }

  static final List<Offer> _demoOffers = [
    // Offer B (Recommended based on NFR ₹28,750)
    Offer(
      id: '41500000-0000-4000-8000-000000000002',
      listingId: AppConstants.demoListingId,
      demandId: '41000000-0000-4000-8000-000000000002',
      buyerProfileId: AppConstants.demoBuyerBId,
      buyerName: 'DEMO Buyer B (Pune Food Processing Ltd)',
      offeredQuantity: 1000.0,
      unitPrice: 31.0,
      currency: 'INR',
      deliveryTerms: 'buyer_pickup (Direct Farmgate Pickup)',
      expiresAt: DateTime.parse('2026-09-05T12:00:00+05:30'),
      status: 'PENDING',
      version: 1,
      listingVersion: 1,
      logisticsQuoteId: '42000000-0000-4000-8000-000000000002',
      recommendationOptionId: '43000000-0000-4000-8000-000000000002',
      rawGrossValueString: '31000.00',
      rawTotalCostString: '2250.00',
      rawNfrString: '28750.00',
      rawUnitPriceString: '31.00',
      rawQuantityString: '1000.00',
      estimatedTotalCost: 2250.0,
      estimatedNfr: 28750.0,
      createdAt: DateTime.parse('2026-09-04T09:00:00+05:30'),
    ),
    // Offer A
    Offer(
      id: '41500000-0000-4000-8000-000000000001',
      listingId: AppConstants.demoListingId,
      demandId: '41000000-0000-4000-8000-000000000001',
      buyerProfileId: AppConstants.demoBuyerAId,
      buyerName: 'DEMO Buyer A (Mumbai Wholesale Export Hub)',
      offeredQuantity: 1000.0,
      unitPrice: 32.0,
      currency: 'INR',
      deliveryTerms: 'buyer_pickup (Long Distance Transport)',
      expiresAt: DateTime.parse('2026-09-05T12:00:00+05:30'),
      status: 'PENDING',
      version: 1,
      listingVersion: 1,
      logisticsQuoteId: '42000000-0000-4000-8000-000000000001',
      recommendationOptionId: '43000000-0000-4000-8000-000000000001',
      rawGrossValueString: '32000.00',
      rawTotalCostString: '6500.00',
      rawNfrString: '25500.00',
      rawUnitPriceString: '32.00',
      rawQuantityString: '1000.00',
      estimatedTotalCost: 6500.0,
      estimatedNfr: 25500.0,
      createdAt: DateTime.parse('2026-09-04T09:00:00+05:30'),
    ),
  ];
}
