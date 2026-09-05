import '../core/constants/api_endpoints.dart';
import '../core/constants/app_config.dart';
import '../core/network/api_client.dart';
import '../models/crop.dart';

abstract class CropRepository {
  Future<List<Crop>> getCrops();
  Future<List<CropVariety>> getVarieties(String cropId);
}

class ApiCropRepository implements CropRepository {
  final ApiClient _apiClient;

  ApiCropRepository({required ApiClient apiClient}) : _apiClient = apiClient;

  @override
  Future<List<Crop>> getCrops() async {
    try {
      final response = await _apiClient.get(
        ApiEndpoints.crops,
        fromJson: (data) => (data as List<dynamic>)
            .map((e) => Crop.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
      if (response.data.isNotEmpty) {
        return response.data;
      }
      if (AppConfig.isDemoMode) {
        return _demoCrops;
      }
      return [];
    } catch (_) {
      if (AppConfig.isDemoMode) {
        return _demoCrops;
      }
      rethrow;
    }
  }

  @override
  Future<List<CropVariety>> getVarieties(String cropId) async {
    try {
      final response = await _apiClient.get(
        ApiEndpoints.cropVarieties(cropId),
        fromJson: (data) => (data as List<dynamic>)
            .map((e) => CropVariety.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
      if (response.data.isNotEmpty) {
        return response.data;
      }
      if (AppConfig.isDemoMode) {
        return _demoVarieties.where((v) => v.cropId == cropId).toList();
      }
      return [];
    } catch (_) {
      if (AppConfig.isDemoMode) {
        return _demoVarieties.where((v) => v.cropId == cropId).toList();
      }
      rethrow;
    }
  }

  static final List<Crop> _demoCrops = [
    Crop(
      id: '30000000-0000-4000-8000-000000000001',
      canonicalCode: 'TOMATO',
      nameEn: 'Tomato',
      nameHi: 'टमाटर',
      nameBn: 'টমেটো',
    ),
    Crop(
      id: '30000000-0000-4000-8000-000000000002',
      canonicalCode: 'ONION',
      nameEn: 'Onion',
      nameHi: 'प्याज',
      nameBn: 'পেঁয়াজ',
    ),
    Crop(
      id: '30000000-0000-4000-8000-000000000003',
      canonicalCode: 'POTATO',
      nameEn: 'Potato',
      nameHi: 'आलू',
      nameBn: 'আলু',
    ),
    Crop(
      id: '30000000-0000-4000-8000-000000000004',
      canonicalCode: 'SOYBEAN',
      nameEn: 'Soybean',
      nameHi: 'सोयाबीन',
      nameBn: 'সয়াবিন',
    ),
  ];

  static final List<CropVariety> _demoVarieties = [
    CropVariety(
      id: '31000000-0000-4000-8000-000000000001',
      cropId: '30000000-0000-4000-8000-000000000001',
      canonicalName: 'DEMO_STANDARD',
      nameEn: 'Desi / Standard Red',
      nameHi: 'देसी / मानक लाल',
    ),
    CropVariety(
      id: '31000000-0000-4000-8000-000000000002',
      cropId: '30000000-0000-4000-8000-000000000001',
      canonicalName: 'HYBRID_ABHINAV',
      nameEn: 'Hybrid Abhinav',
      nameHi: 'हाइब्रिड अभिनव',
    ),
    CropVariety(
      id: '31000000-0000-4000-8000-000000000003',
      cropId: '30000000-0000-4000-8000-000000000002',
      canonicalName: 'NASHIK_RED',
      nameEn: 'Nashik Red Onion',
      nameHi: 'नासिक लाल प्याज',
    ),
  ];
}
