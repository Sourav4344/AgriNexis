import '../core/constants/api_endpoints.dart';
import '../core/constants/app_config.dart';
import '../core/constants/app_constants.dart';
import '../core/network/api_client.dart';
import '../models/order.dart';

abstract class OrderRepository {
  Future<List<Order>> getOrders();
  Future<Order> getOrderById(String id);
  Future<List<OrderStatusHistoryItem>> getOrderHistory(String orderId);
  Future<Order> transitionOrder({
    required String orderId,
    required String toStatus,
    required int version,
    String? note,
  });
}

class ApiOrderRepository implements OrderRepository {
  final ApiClient _apiClient;
  final List<Order> _localOrders = [];

  ApiOrderRepository({required ApiClient apiClient}) : _apiClient = apiClient {
    _localOrders.add(_demoOrder);
  }

  @override
  Future<List<Order>> getOrders() async {
    try {
      final response = await _apiClient.get(
        ApiEndpoints.orders,
        fromJson: (data) => (data as List<dynamic>)
            .map((e) => Order.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
      if (response.data.isNotEmpty) {
        return response.data;
      }
      if (AppConfig.isDemoMode) {
        return List.unmodifiable(_localOrders);
      }
      return [];
    } catch (_) {
      if (AppConfig.isDemoMode) {
        return List.unmodifiable(_localOrders);
      }
      rethrow;
    }
  }

  @override
  Future<Order> getOrderById(String id) async {
    try {
      final response = await _apiClient.get(
        ApiEndpoints.order(id),
        fromJson: (data) => Order.fromJson(data as Map<String, dynamic>),
      );
      return response.data;
    } catch (_) {
      if (AppConfig.isDemoMode) {
        return _localOrders.firstWhere(
          (o) => o.id == id,
          orElse: () => _demoOrder,
        );
      }
      rethrow;
    }
  }

  @override
  Future<List<OrderStatusHistoryItem>> getOrderHistory(String orderId) async {
    try {
      final response = await _apiClient.get(
        ApiEndpoints.orderHistory(orderId),
        fromJson: (data) => (data as List<dynamic>)
            .map((e) => OrderStatusHistoryItem.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
      if (response.data.isNotEmpty) {
        return response.data;
      }
      if (AppConfig.isDemoMode) {
        return _demoHistory;
      }
      return [];
    } catch (_) {
      if (AppConfig.isDemoMode) {
        return _demoHistory;
      }
      rethrow;
    }
  }

  @override
  Future<Order> transitionOrder({
    required String orderId,
    required String toStatus,
    required int version,
    String? note,
  }) async {
    try {
      final response = await _apiClient.post(
        ApiEndpoints.orderTransitions(orderId),
        body: {
          'to_status': toStatus,
          'version': version,
          'occurred_at': DateTime.now().toUtc().toIso8601String(),
          if (note != null) 'note': note,
        },
        fromJson: (data) => Order.fromJson(data as Map<String, dynamic>),
      );
      _updateLocalOrder(response.data);
      return response.data;
    } catch (_) {
      if (AppConfig.isDemoMode) {
        final idx = _localOrders.indexWhere((o) => o.id == orderId);
        if (idx != -1) {
          final current = _localOrders[idx];
          final updated = Order(
            id: current.id,
            farmerProfileId: current.farmerProfileId,
            buyerProfileId: current.buyerProfileId,
            buyerName: current.buyerName,
            listingId: current.listingId,
            acceptedOfferId: current.acceptedOfferId,
            status: toStatus,
            paymentStatus: current.paymentStatus,
            version: current.version + 1,
            snapshot: current.snapshot,
            acceptedAt: current.acceptedAt,
            createdAt: current.createdAt,
            updatedAt: DateTime.now(),
            cropName: current.cropName,
          );
          _localOrders[idx] = updated;
          return updated;
        }
        return _demoOrder;
      }
      rethrow;
    }
  }

  void _updateLocalOrder(Order order) {
    final idx = _localOrders.indexWhere((o) => o.id == order.id);
    if (idx != -1) {
      _localOrders[idx] = order;
    } else {
      _localOrders.insert(0, order);
    }
  }

  static final Order _demoOrder = Order(
    id: '50000000-0000-4000-8000-000000000001',
    farmerProfileId: AppConstants.demoFarmerId,
    buyerProfileId: AppConstants.demoBuyerBId,
    buyerName: 'DEMO Buyer B (Pune Food Processing Ltd)',
    listingId: AppConstants.demoListingId,
    acceptedOfferId: '41500000-0000-4000-8000-000000000002',
    status: 'IN_TRANSIT',
    paymentStatus: 'PAID',
    version: 3,
    acceptedAt: DateTime.parse('2026-09-04T09:30:00+05:30'),
    createdAt: DateTime.parse('2026-09-04T09:30:00+05:30'),
    cropName: 'Tomato (टमाटर) - Grade A',
    snapshot: OrderFinancialSnapshot(
      currency: 'INR',
      quantityKg: 1000.0,
      unitPricePerKg: 31.0,
      grossSellingValue: 31000.0,
      transportationCost: 1500.0,
      storageCost: 300.0,
      handlingCost: 300.0,
      otherApplicableCost: 150.0,
      totalApplicableCost: 2250.0,
      netFarmerRealization: 28750.0,
      calculatedAt: DateTime.parse('2026-09-04T09:30:00+05:30'),
    ),
  );

  static final List<OrderStatusHistoryItem> _demoHistory = [
    OrderStatusHistoryItem(
      id: 'hist-1',
      orderId: '50000000-0000-4000-8000-000000000001',
      fromStatus: 'NONE',
      toStatus: 'CONFIRMED',
      actor: 'Rahul (Farmer)',
      reason: 'Offer accepted with acknowledged NFR ₹28,750',
      changedAt: DateTime.parse('2026-09-04T09:30:00+05:30'),
    ),
    OrderStatusHistoryItem(
      id: 'hist-2',
      orderId: '50000000-0000-4000-8000-000000000001',
      fromStatus: 'CONFIRMED',
      toStatus: 'PICKUP_SCHEDULED',
      actor: 'Logistics Partner',
      reason: 'Vehicle assigned: MH-12-AQ-4450',
      changedAt: DateTime.parse('2026-09-04T10:15:00+05:30'),
    ),
    OrderStatusHistoryItem(
      id: 'hist-3',
      orderId: '50000000-0000-4000-8000-000000000001',
      fromStatus: 'PICKUP_SCHEDULED',
      toStatus: 'IN_TRANSIT',
      actor: 'Driver',
      reason: 'Produce loaded and verified at farmgate',
      changedAt: DateTime.parse('2026-09-04T11:45:00+05:30'),
    ),
  ];
}
