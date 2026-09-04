import 'package:flutter/material.dart';
import '../core/constants/app_constants.dart';
import '../models/price_prediction.dart';
import '../models/recommendation.dart';
import '../repositories/prediction_repository.dart';
import '../repositories/recommendation_repository.dart';

class RecommendationProvider extends ChangeNotifier {
  final RecommendationRepository _recommendationRepository;
  final PredictionRepository _predictionRepository;

  List<Recommendation> _recommendations = [];
  PricePrediction? _prediction;
  bool _isLoading = false;
  String? _errorMessage;

  RecommendationProvider({
    required RecommendationRepository recommendationRepository,
    required PredictionRepository predictionRepository,
  })  : _recommendationRepository = recommendationRepository,
        _predictionRepository = predictionRepository {
    loadRecommendations(AppConstants.demoListingId);
  }

  List<Recommendation> get recommendations => _recommendations;
  PricePrediction? get prediction => _prediction;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Recommendation? get bestRecommendation {
    if (_recommendations.isEmpty) return null;
    try {
      return _recommendations.firstWhere((r) => r.isBestOption);
    } catch (_) {
      return _recommendations.first;
    }
  }

  Recommendation? get secondaryRecommendation {
    if (_recommendations.length > 1) {
      return _recommendations[1];
    }
    return null;
  }

  /// Canonical comparison difference between Rank 1 (Buyer B) and Rank 2 (Buyer A)
  double get comparisonBenefit {
    if (_recommendations.length >= 2) {
      return _recommendations[0].estimatedNetFarmerRealization -
          _recommendations[1].estimatedNetFarmerRealization;
    }
    return 0.0;
  }

  Future<void> loadRecommendations(String listingId) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final results = await Future.wait([
        _recommendationRepository.getRecommendationsForListing(listingId),
        _predictionRepository.getPredictionForListing(listingId),
      ]);
      _recommendations = results[0] as List<Recommendation>;
      _prediction = results[1] as PricePrediction;
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
