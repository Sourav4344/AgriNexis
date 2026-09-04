import 'package:flutter/material.dart';
import '../models/order.dart';
import '../repositories/order_repository.dart';

class OrderProvider extends ChangeNotifier {
  final OrderRepository _repository;

  List<Order> _orders = [];
  Map<String, List<OrderStatusHistoryItem>> _orderHistories = {};
  bool _isLoading = false;
  String? _errorMessage;

  OrderProvider({required OrderRepository repository}) : _repository = repository {
    loadOrders();
  }

  List<Order> get orders => _orders;
  List<Order> get activeOrders => _orders.where((o) => o.isActive).toList();
  List<Order> get completedOrders => _orders.where((o) => o.isCompleted).toList();
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<void> loadOrders() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _orders = await _repository.getOrders();
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<List<OrderStatusHistoryItem>> loadHistoryForOrder(String orderId) async {
    try {
      final history = await _repository.getOrderHistory(orderId);
      _orderHistories[orderId] = history;
      notifyListeners();
      return history;
    } catch (_) {
      return _orderHistories[orderId] ?? [];
    }
  }

  List<OrderStatusHistoryItem> getHistory(String orderId) {
    return _orderHistories[orderId] ?? [];
  }
}
