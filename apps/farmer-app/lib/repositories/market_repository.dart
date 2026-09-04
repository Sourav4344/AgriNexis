import '../core/constants/api_endpoints.dart';
import '../core/constants/app_config.dart';
import '../core/network/api_client.dart';
import '../models/market_price.dart';

abstract class MarketRepository {
  Future<List<Mandi>> getMandis();
  Future<List<MandiPrice>> getMarketPrices({String? cropId, String? mandiId});
}

class ApiMarketRepository implements MarketRepository {
  final ApiClient _apiClient;

  ApiMarketRepository({required ApiClient apiClient}) : _apiClient = apiClient;

  @override
  Future<List<Mandi>> getMandis() async {
    try {
      final response = await _apiClient.get(
        ApiEndpoints.markets,
        fromJson: (data) => (data as List<dynamic>)
            .map((e) => Mandi.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
      if (response.data.isNotEmpty) {
        return response.data;
      }
      if (AppConfig.isDemoMode) {
        return _demoMandis;
      }
      return [];
    } catch (_) {
      if (AppConfig.isDemoMode) {
        return _demoMandis;
      }
      rethrow;
    }
  }

  @override
  Future<List<MandiPrice>> getMarketPrices({String? cropId, String? mandiId}) async {
    try {
      final path = mandiId != null
          ? ApiEndpoints.marketPrices(mandiId)
          : ApiEndpoints.allMarketPrices;
      final query = cropId != null ? {'crop_id': cropId} : null;

      final response = await _apiClient.get(
        path,
        queryParams: query,
        fromJson: (data) => (data as List<dynamic>)
            .map((e) => MandiPrice.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
      if (response.data.isNotEmpty) {
        return response.data;
      }
      if (AppConfig.isDemoMode) {
        return _demoPrices;
      }
      return [];
    } catch (_) {
      if (AppConfig.isDemoMode) {
        return _demoPrices;
      }
      rethrow;
    }
  }

  static final List<Mandi> _demoMandis = [
    Mandi(
      id: '32000000-0000-4000-8000-000000000001',
      name: 'DEMO Pune Mandi (गुलटेकडी)',
      district: 'Pune',
      state: 'Maharashtra',
      providerName: 'AGRINEXIS_DEMO',
      externalId: 'PUNE_DEMO',
    ),
    Mandi(
      id: '32000000-0000-4000-8000-000000000002',
      name: 'DEMO Narayangaon APMC',
      district: 'Pune',
      state: 'Maharashtra',
      providerName: 'AGRINEXIS_DEMO',
      externalId: 'NARAYANGAON_DEMO',
    ),
    Mandi(
      id: '32000000-0000-4000-8000-000000000003',
      name: 'DEMO Vashi APMC (Navi Mumbai)',
      district: 'Thane',
      state: 'Maharashtra',
      providerName: 'AGRINEXIS_DEMO',
      externalId: 'VASHI_DEMO',
    ),
  ];

  static final List<MandiPrice> _demoPrices = [
    MandiPrice(
      id: '33000000-0000-4000-8000-000000000001',
      mandiId: '32000000-0000-4000-8000-000000000001',
      cropId: '30000000-0000-4000-8000-000000000001',
      varietyId: '31000000-0000-4000-8000-000000000001',
      minPrice: 28.0,
      modalPrice: 30.0,
      maxPrice: 33.0,
      observedAt: DateTime.parse('2026-09-04T09:00:00+05:30'),
      sourceName: 'AGRINEXIS_DEMO',
      dataMode: 'DEMO',
      dataWarning: 'DEMO DATA — NOT LIVE GOVERNMENT DATA',
      arrivalQuantityKg: 45000.0,
      mandiName: 'Pune APMC (Gultekdi)',
      cropName: 'Tomato (टमाटर)',
    ),
    MandiPrice(
      id: '33000000-0000-4000-8000-000000000002',
      mandiId: '32000000-0000-4000-8000-000000000002',
      cropId: '30000000-0000-4000-8000-000000000001',
      varietyId: '31000000-0000-4000-8000-000000000001',
      minPrice: 27.0,
      modalPrice: 29.5,
      maxPrice: 32.0,
      observedAt: DateTime.parse('2026-09-04T08:30:00+05:30'),
      sourceName: 'AGRINEXIS_DEMO',
      dataMode: 'DEMO',
      dataWarning: 'DEMO DATA — NOT LIVE GOVERNMENT DATA',
      arrivalQuantityKg: 82000.0,
      mandiName: 'Narayangaon Tomato Market',
      cropName: 'Tomato (टमाटर)',
    ),
    MandiPrice(
      id: '33000000-0000-4000-8000-000000000003',
      mandiId: '32000000-0000-4000-8000-000000000003',
      cropId: '30000000-0000-4000-8000-000000000001',
      varietyId: '31000000-0000-4000-8000-000000000001',
      minPrice: 31.0,
      modalPrice: 33.5,
      maxPrice: 36.0,
      observedAt: DateTime.parse('2026-09-04T07:45:00+05:30'),
      sourceName: 'AGRINEXIS_DEMO',
      dataMode: 'DEMO',
      dataWarning: 'DEMO DATA — NOT LIVE GOVERNMENT DATA',
      arrivalQuantityKg: 120000.0,
      mandiName: 'Vashi APMC (Navi Mumbai)',
      cropName: 'Tomato (टमाटर)',
    ),
  ];
}
