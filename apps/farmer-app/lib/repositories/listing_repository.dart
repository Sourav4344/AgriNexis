import '../core/constants/api_endpoints.dart';
import '../core/constants/app_config.dart';
import '../core/constants/app_constants.dart';
import '../core/network/api_client.dart';
import '../models/produce_listing.dart';

abstract class ListingRepository {
  Future<List<ProduceListing>> getFarmerListings();
  Future<ProduceListing> getListingById(String id);
  Future<ProduceListing> createListing(ProduceListing listing);
  Future<ProduceListing> publishListing(String id);
  Future<ProduceListing> cancelListing(String id);
}

class ApiListingRepository implements ListingRepository {
  final ApiClient _apiClient;
  final List<ProduceListing> _localListings = [];

  ApiListingRepository({required ApiClient apiClient}) : _apiClient = apiClient {
    _localListings.add(_demoListing);
  }

  @override
  Future<List<ProduceListing>> getFarmerListings() async {
    try {
      final response = await _apiClient.get(
        ApiEndpoints.listings,
        fromJson: (data) => (data as List<dynamic>)
            .map((e) => ProduceListing.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
      if (response.data.isNotEmpty) {
        return response.data;
      }
      if (AppConfig.isDemoMode) {
        return List.unmodifiable(_localListings);
      }
      return [];
    } catch (_) {
      if (AppConfig.isDemoMode) {
        return List.unmodifiable(_localListings);
      }
      rethrow;
    }
  }

  @override
  Future<ProduceListing> getListingById(String id) async {
    try {
      final response = await _apiClient.get(
        ApiEndpoints.listing(id),
        fromJson: (data) => ProduceListing.fromJson(data as Map<String, dynamic>),
      );
      return response.data;
    } catch (_) {
      if (AppConfig.isDemoMode) {
        final match = _localListings.firstWhere(
          (l) => l.id == id,
          orElse: () => _demoListing,
        );
        return match;
      }
      rethrow;
    }
  }

  @override
  Future<ProduceListing> createListing(ProduceListing listing) async {
    try {
      final response = await _apiClient.post(
        ApiEndpoints.listings,
        body: listing.toCreateJson(),
        fromJson: (data) => ProduceListing.fromJson(data as Map<String, dynamic>),
      );
      _localListings.insert(0, response.data);
      return response.data;
    } catch (_) {
      if (AppConfig.isDemoMode) {
        _localListings.insert(0, listing);
        return listing;
      }
      rethrow;
    }
  }

  @override
  Future<ProduceListing> publishListing(String id) async {
    try {
      final response = await _apiClient.post(
        ApiEndpoints.publishListing(id),
        fromJson: (data) => ProduceListing.fromJson(data as Map<String, dynamic>),
      );
      return response.data;
    } catch (_) {
      if (AppConfig.isDemoMode) {
        final idx = _localListings.indexWhere((l) => l.id == id);
        if (idx != -1) {
          final updated = ProduceListing(
            id: _localListings[idx].id,
            farmerProfileId: _localListings[idx].farmerProfileId,
            cropId: _localListings[idx].cropId,
            varietyId: _localListings[idx].varietyId,
            quantity: _localListings[idx].quantity,
            availableQuantity: _localListings[idx].availableQuantity,
            unit: _localListings[idx].unit,
            harvestDate: _localListings[idx].harvestDate,
            availableFrom: _localListings[idx].availableFrom,
            availableUntil: _localListings[idx].availableUntil,
            district: _localListings[idx].district,
            state: _localListings[idx].state,
            postalArea: _localListings[idx].postalArea,
            qualitySummary: _localListings[idx].qualitySummary,
            status: 'ACTIVE',
            version: _localListings[idx].version + 1,
            createdAt: _localListings[idx].createdAt,
            updatedAt: DateTime.now(),
            cropName: _localListings[idx].cropName,
            varietyName: _localListings[idx].varietyName,
          );
          _localListings[idx] = updated;
          return updated;
        }
        return _demoListing;
      }
      rethrow;
    }
  }

  @override
  Future<ProduceListing> cancelListing(String id) async {
    try {
      final response = await _apiClient.post(
        ApiEndpoints.cancelListing(id),
        fromJson: (data) => ProduceListing.fromJson(data as Map<String, dynamic>),
      );
      return response.data;
    } catch (_) {
      if (AppConfig.isDemoMode) {
        final idx = _localListings.indexWhere((l) => l.id == id);
        if (idx != -1) {
          final updated = ProduceListing(
            id: _localListings[idx].id,
            farmerProfileId: _localListings[idx].farmerProfileId,
            cropId: _localListings[idx].cropId,
            varietyId: _localListings[idx].varietyId,
            quantity: _localListings[idx].quantity,
            availableQuantity: 0.0,
            unit: _localListings[idx].unit,
            harvestDate: _localListings[idx].harvestDate,
            availableFrom: _localListings[idx].availableFrom,
            availableUntil: _localListings[idx].availableUntil,
            district: _localListings[idx].district,
            state: _localListings[idx].state,
            postalArea: _localListings[idx].postalArea,
            qualitySummary: _localListings[idx].qualitySummary,
            status: 'CANCELLED',
            version: _localListings[idx].version + 1,
            cropName: _localListings[idx].cropName,
            varietyName: _localListings[idx].varietyName,
          );
          _localListings[idx] = updated;
          return updated;
        }
        return _demoListing;
      }
      rethrow;
    }
  }

  static final ProduceListing _demoListing = ProduceListing(
    id: AppConstants.demoListingId,
    farmerProfileId: AppConstants.demoFarmerId,
    cropId: '30000000-0000-4000-8000-000000000001',
    varietyId: '31000000-0000-4000-8000-000000000001',
    quantity: 1000.0,
    availableQuantity: 1000.0,
    unit: 'kg',
    harvestDate: DateTime.parse('2026-09-01'),
    availableFrom: DateTime.parse('2026-09-03'),
    availableUntil: DateTime.parse('2026-09-06'),
    district: 'Pune',
    state: 'Maharashtra',
    postalArea: 'DEMO-AREA',
    qualitySummary: QualitySummary(
      declaredGrade: 'A',
      color: 'Bright Red',
      size: 'Medium-Large (50-60mm)',
      moisturePercent: '88%',
      demoLabel: 'DEMO DATA',
    ),
    status: 'ACTIVE',
    version: 1,
    createdAt: DateTime.parse('2026-09-01T09:00:00Z'),
    cropName: 'Tomato (टमाटर)',
    varietyName: 'Desi / Standard Red',
  );
}
