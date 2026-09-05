import 'package:flutter/material.dart';
import '../models/offer.dart';
import '../models/order.dart';
import '../repositories/offer_repository.dart';

class OfferProvider extends ChangeNotifier {
  final OfferRepository _repository;

  List<Offer> _offers = [];
  bool _isLoading = false;
  bool _isActionProcessing = false;
  String? _errorMessage;

  OfferProvider({required OfferRepository repository}) : _repository = repository {
    loadOffers();
  }

  List<Offer> get offers => _offers;
  List<Offer> get pendingOffers => _offers.where((o) => o.isPending).toList();
  bool get isLoading => _isLoading;
  bool get isActionProcessing => _isActionProcessing;
  String? get errorMessage => _errorMessage;

  Future<void> loadOffers() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _offers = await _repository.getOffersForFarmer();
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<Order?> acceptOffer({
    required Offer offer,
    required int listingVersion,
    required String logisticsQuoteId,
    String? recommendationOptionId,
    required AcknowledgedAmounts amounts,
  }) async {
    _isActionProcessing = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final order = await _repository.acceptOffer(
        offer: offer,
        listingVersion: listingVersion,
        logisticsQuoteId: logisticsQuoteId,
        recommendationOptionId: recommendationOptionId,
        acknowledgedAmounts: amounts,
      );
      await loadOffers();
      _isActionProcessing = false;
      notifyListeners();
      return order;
    } catch (e) {
      _errorMessage = e.toString();
      _isActionProcessing = false;
      notifyListeners();
      return null;
    }
  }

  Future<bool> rejectOffer(String offerId) async {
    _isActionProcessing = true;
    notifyListeners();

    try {
      await _repository.rejectOffer(offerId);
      await loadOffers();
      _isActionProcessing = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      _isActionProcessing = false;
      notifyListeners();
      return false;
    }
  }
}
