import '../core/constants/api_endpoints.dart';
import '../core/constants/app_config.dart';
import '../core/constants/app_constants.dart';
import '../core/network/api_client.dart';
import '../models/recommendation.dart';

abstract class RecommendationRepository {
  Future<List<Recommendation>> getRecommendationsForListing(String listingId);
  Future<Recommendation> getRecommendationById(String id);
}

class ApiRecommendationRepository implements RecommendationRepository {
  final ApiClient _apiClient;

  ApiRecommendationRepository({required ApiClient apiClient}) : _apiClient = apiClient;

  @override
  Future<List<Recommendation>> getRecommendationsForListing(String listingId) async {
    try {
      final response = await _apiClient.get(
        ApiEndpoints.listingRecommendations(listingId),
        fromJson: (data) => (data as List<dynamic>)
            .map((e) => Recommendation.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
      if (response.data.isNotEmpty) {
        return _sortAndEnrich(response.data);
      }
      if (AppConfig.isDemoMode) {
        return _demoRecommendations;
      }
      return [];
    } catch (_) {
      if (AppConfig.isDemoMode) {
        return _demoRecommendations;
      }
      rethrow;
    }
  }

  @override
  Future<Recommendation> getRecommendationById(String id) async {
    try {
      final response = await _apiClient.get(
        ApiEndpoints.recommendation(id),
        fromJson: (data) => Recommendation.fromJson(data as Map<String, dynamic>),
      );
      return response.data;
    } catch (_) {
      if (AppConfig.isDemoMode) {
        return _demoRecommendations.firstWhere(
          (r) => r.id == id,
          orElse: () => _demoRecommendations.first,
        );
      }
      rethrow;
    }
  }

  List<Recommendation> _sortAndEnrich(List<Recommendation> list) {
    if (list.isEmpty) return list;
    // Sort by rank ascending or NFR descending
    list.sort((a, b) => a.rank.compareTo(b.rank));
    final bestNfr = list.first.estimatedNetFarmerRealization;
    return list.map((r) {
      final diff = bestNfr - r.estimatedNetFarmerRealization;
      return Recommendation(
        id: r.id,
        farmerProfileId: r.farmerProfileId,
        listingId: r.listingId,
        candidateBuyerProfileId: r.candidateBuyerProfileId,
        candidateFpoId: r.candidateFpoId,
        candidateMandiId: r.candidateMandiId,
        candidateName: r.candidateName,
        demandId: r.demandId,
        logisticsQuoteId: r.logisticsQuoteId,
        estimatedQuantityKg: r.estimatedQuantityKg,
        estimatedUnitPricePerKg: r.estimatedUnitPricePerKg,
        estimatedGrossSellingValue: r.estimatedGrossSellingValue,
        estimatedTransportationCost: r.estimatedTransportationCost,
        estimatedStorageCost: r.estimatedStorageCost,
        estimatedHandlingCost: r.estimatedHandlingCost,
        estimatedOtherApplicableCost: r.estimatedOtherApplicableCost,
        estimatedTotalApplicableCost: r.estimatedTotalApplicableCost,
        estimatedNetFarmerRealization: r.estimatedNetFarmerRealization,
        differenceFromBest: diff,
        rank: r.rank,
        sellWait: r.sellWait,
        explanationFacts: r.explanationFacts,
        confidence: r.confidence,
        dataMode: r.dataMode,
        dataWarning: r.dataWarning,
        distanceKm: r.distanceKm,
        calculatedAt: r.calculatedAt,
        expiresAt: r.expiresAt,
        buyerVerificationStatus: r.buyerVerificationStatus,
      );
    }).toList();
  }

  static final List<Recommendation> _demoRecommendations = [
    // Rank 1: Buyer B (Gross ₹31,000, Costs ₹2,250, NFR ₹28,750)
    Recommendation(
      id: '43000000-0000-4000-8000-000000000002',
      farmerProfileId: AppConstants.demoFarmerId,
      listingId: AppConstants.demoListingId,
      candidateBuyerProfileId: AppConstants.demoBuyerBId,
      candidateName: 'DEMO Buyer B (Local Pune Food Processing Ltd)',
      demandId: '41000000-0000-4000-8000-000000000002',
      logisticsQuoteId: '42000000-0000-4000-8000-000000000002',
      estimatedQuantityKg: 1000.0,
      estimatedUnitPricePerKg: 31.0,
      estimatedGrossSellingValue: 31000.0,
      estimatedTransportationCost: 1500.0,
      estimatedStorageCost: 300.0,
      estimatedHandlingCost: 300.0,
      estimatedOtherApplicableCost: 150.0,
      estimatedTotalApplicableCost: 2250.0,
      estimatedNetFarmerRealization: 28750.0,
      differenceFromBest: 0.0,
      rank: 1,
      sellWait: 'SELL_NOW',
      explanationFacts: [
        'DEMO_DATA',
        'LOWER_TOTAL_COST',
        'HIGHER_NET_REALIZATION',
        'CLOSER_BUYER',
      ],
      confidence: 1.0,
      dataMode: 'DEMO',
      dataWarning: 'DEMO DATA — NOT LIVE GOVERNMENT DATA',
      distanceKm: 35.0,
      calculatedAt: DateTime.parse('2026-09-04T09:00:00+05:30'),
      expiresAt: DateTime.parse('2026-09-05T12:00:00+05:30'),
      buyerVerificationStatus: 'VERIFIED',
    ),
    // Rank 2: Buyer A (Gross ₹32,000, Costs ₹6,500, NFR ₹25,500)
    Recommendation(
      id: '43000000-0000-4000-8000-000000000001',
      farmerProfileId: AppConstants.demoFarmerId,
      listingId: AppConstants.demoListingId,
      candidateBuyerProfileId: AppConstants.demoBuyerAId,
      candidateName: 'DEMO Buyer A (Mumbai Wholesale Export Hub)',
      demandId: '41000000-0000-4000-8000-000000000001',
      logisticsQuoteId: '42000000-0000-4000-8000-000000000001',
      estimatedQuantityKg: 1000.0,
      estimatedUnitPricePerKg: 32.0,
      estimatedGrossSellingValue: 32000.0,
      estimatedTransportationCost: 5500.0,
      estimatedStorageCost: 500.0,
      estimatedHandlingCost: 300.0,
      estimatedOtherApplicableCost: 200.0,
      estimatedTotalApplicableCost: 6500.0,
      estimatedNetFarmerRealization: 25500.0,
      differenceFromBest: 3250.0, // ₹28,750 - ₹25,500 = ₹3,250
      rank: 2,
      sellWait: 'SELL_NOW',
      explanationFacts: [
        'DEMO_DATA',
        'HIGHER_HEADLINE_PRICE',
        'HIGHER_LOGISTICS_COST',
      ],
      confidence: 1.0,
      dataMode: 'DEMO',
      dataWarning: 'DEMO DATA — NOT LIVE GOVERNMENT DATA',
      distanceKm: 160.0,
      calculatedAt: DateTime.parse('2026-09-04T09:00:00+05:30'),
      expiresAt: DateTime.parse('2026-09-05T12:00:00+05:30'),
      buyerVerificationStatus: 'VERIFIED',
    ),
  ];
}
