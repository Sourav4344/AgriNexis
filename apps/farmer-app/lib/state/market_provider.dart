import 'package:flutter/material.dart';
import '../models/market_price.dart';
import '../repositories/market_repository.dart';

class MarketProvider extends ChangeNotifier {
  final MarketRepository _repository;

  List<Mandi> _mandis = [];
  List<MandiPrice> _marketPrices = [];
  String? _selectedCropId;
  String? _selectedMandiId;
  bool _isLoading = false;
  String? _errorMessage;

  MarketProvider({required MarketRepository repository}) : _repository = repository {
    loadMarkets();
  }

  List<Mandi> get mandis => _mandis;
  List<MandiPrice> get marketPrices => _marketPrices;
  String? get selectedCropId => _selectedCropId;
  String? get selectedMandiId => _selectedMandiId;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<void> loadMarkets() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final results = await Future.wait([
        _repository.getMandis(),
        _repository.getMarketPrices(
          cropId: _selectedCropId,
          mandiId: _selectedMandiId,
        ),
      ]);
      _mandis = results[0] as List<Mandi>;
      _marketPrices = results[1] as List<MandiPrice>;
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void filterByCrop(String? cropId) {
    _selectedCropId = cropId;
    loadMarketPricesOnly();
  }

  void filterByMandi(String? mandiId) {
    _selectedMandiId = mandiId;
    loadMarketPricesOnly();
  }

  Future<void> loadMarketPricesOnly() async {
    _isLoading = true;
    notifyListeners();

    try {
      _marketPrices = await _repository.getMarketPrices(
        cropId: _selectedCropId,
        mandiId: _selectedMandiId,
      );
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
