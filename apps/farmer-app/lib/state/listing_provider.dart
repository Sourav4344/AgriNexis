import 'package:flutter/material.dart';
import '../models/crop.dart';
import '../models/produce_listing.dart';
import '../repositories/crop_repository.dart';
import '../repositories/listing_repository.dart';

class ListingProvider extends ChangeNotifier {
  final ListingRepository _listingRepository;
  final CropRepository _cropRepository;

  List<ProduceListing> _listings = [];
  List<Crop> _crops = [];
  List<CropVariety> _varieties = [];
  bool _isLoading = false;
  String? _errorMessage;

  ListingProvider({
    required ListingRepository listingRepository,
    required CropRepository cropRepository,
  })  : _listingRepository = listingRepository,
        _cropRepository = cropRepository {
    loadInitialData();
  }

  List<ProduceListing> get listings => _listings;
  List<Crop> get crops => _crops;
  List<CropVariety> get varieties => _varieties;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  ProduceListing? get activeListing {
    try {
      return _listings.firstWhere((l) => l.isActive);
    } catch (_) {
      return _listings.isNotEmpty ? _listings.first : null;
    }
  }

  Future<void> loadInitialData() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final results = await Future.wait([
        _listingRepository.getFarmerListings(),
        _cropRepository.getCrops(),
      ]);
      _listings = results[0] as List<ProduceListing>;
      _crops = results[1] as List<Crop>;

      if (_crops.isNotEmpty) {
        _varieties = await _cropRepository.getVarieties(_crops.first.id);
      }
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadVarietiesForCrop(String cropId) async {
    try {
      _varieties = await _cropRepository.getVarieties(cropId);
      notifyListeners();
    } catch (_) {
      _varieties = [];
      notifyListeners();
    }
  }

  Future<ProduceListing?> createListing(ProduceListing newListing) async {
    _isLoading = true;
    notifyListeners();

    try {
      final created = await _listingRepository.createListing(newListing);
      // Auto-publish to make it active for matching
      final published = await _listingRepository.publishListing(created.id);
      _listings.insert(0, published);
      _isLoading = false;
      notifyListeners();
      return published;
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return null;
    }
  }
}
