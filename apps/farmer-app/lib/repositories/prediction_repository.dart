import '../core/constants/api_endpoints.dart';
import '../core/constants/app_config.dart';
import '../core/network/api_client.dart';
import '../core/network/api_exceptions.dart';
import '../models/price_prediction.dart';

abstract class PredictionRepository {
  Future<PricePrediction> getPredictionForListing(String listingId, {String? cropId});
}

class ApiPredictionRepository implements PredictionRepository {
  final ApiClient _apiClient;

  ApiPredictionRepository({required ApiClient apiClient}) : _apiClient = apiClient;

  @override
  Future<PricePrediction> getPredictionForListing(String listingId, {String? cropId}) async {
    try {
      final response = await _apiClient.get(
        ApiEndpoints.listingPrediction(listingId),
        fromJson: (data) => PricePrediction.fromJson(data as Map<String, dynamic>),
      );
      return response.data;
    } on ApiException catch (e) {
      if (e.isPredictionUnavailable) {
        // Honest empty / insufficient data state
        return PricePrediction.insufficientData(
          cropId: cropId ?? '30000000-0000-4000-8000-000000000001',
          reason: 'Engine is assessing market supply. Historical data is currently insufficient for an automated AI forecast.',
        );
      }
      if (AppConfig.isDemoMode) {
        return _demoPrediction;
      }
      rethrow;
    } catch (_) {
      if (AppConfig.isDemoMode) {
        return _demoPrediction;
      }
      rethrow;
    }
  }

  static final PricePrediction _demoPrediction = PricePrediction(
    id: 'pred-tomato-sih-2026',
    cropId: '30000000-0000-4000-8000-000000000001',
    predictedPrice: 31.50,
    minPriceRange: 29.00,
    maxPriceRange: 34.00,
    trend: PredictionTrend.stable,
    horizonDays: 3,
    confidence: 0.85,
    sellWait: 'SELL_NOW',
    explanationReasons: [
      'Current arrivals in major mandis are high and expected to peak within 48 hours.',
      'Nearby buyer demand offers immediate premium over projected mandi net return.',
      'Holding crop for 3 days incurs additional storage & weight loss risk.'
    ],
    warnings: [
      'Perishable commodity: price sensitivity to regional weather fluctuations is high.'
    ],
    dataMode: 'DEMO',
    calculatedAt: DateTime.parse('2026-09-04T09:00:00+05:30'),
    modelVersion: 'AgriNexis-PriceNet-v1.2 (SIH Baseline)',
    isConfigured: true,
  );
}
