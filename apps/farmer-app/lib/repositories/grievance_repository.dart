import '../core/constants/api_endpoints.dart';
import '../core/constants/app_config.dart';
import '../core/constants/app_constants.dart';
import '../core/network/api_client.dart';
import '../core/utils/id_generator.dart';
import '../models/grievance.dart';

abstract class GrievanceRepository {
  Future<List<Grievance>> getGrievances();
  Future<Grievance> getGrievanceById(String id);
  Future<Grievance> createGrievance({
    required String category,
    required String description,
    String? orderId,
  });
  Future<GrievanceMessage> addMessage({
    required String grievanceId,
    required String message,
  });
}

class ApiGrievanceRepository implements GrievanceRepository {
  final ApiClient _apiClient;
  final List<Grievance> _localGrievances = [];

  ApiGrievanceRepository({required ApiClient apiClient}) : _apiClient = apiClient {
    _localGrievances.add(_demoGrievance);
  }

  @override
  Future<List<Grievance>> getGrievances() async {
    if (!AppConfig.isDemoMode) {
      throw const ApiException(
        statusCode: 501,
        errorCode: 'BACKEND_NOT_AVAILABLE',
        message: 'Grievance management service is not available in the current backend release.',
      );
    }
    return List.unmodifiable(_localGrievances);
  }

  @override
  Future<Grievance> getGrievanceById(String id) async {
    if (!AppConfig.isDemoMode) {
      throw const ApiException(
        statusCode: 501,
        errorCode: 'BACKEND_NOT_AVAILABLE',
        message: 'Grievance management service is not available in the current backend release.',
      );
    }
    return _localGrievances.firstWhere(
      (g) => g.id == id,
      orElse: () => _demoGrievance,
    );
  }

  @override
  Future<Grievance> createGrievance({
    required String category,
    required String description,
    String? orderId,
  }) async {
    if (!AppConfig.isDemoMode) {
      throw const ApiException(
        statusCode: 501,
        errorCode: 'BACKEND_NOT_AVAILABLE',
        message: 'Grievance filing is not available in the live backend release.',
      );
    }
    final newGrievance = Grievance(
      id: IdGenerator.generateUuid(),
      orderId: orderId,
      complainantProfileId: AppConstants.demoFarmerId,
      category: category,
      description: description,
      status: 'OPEN',
      createdAt: DateTime.now(),
      messages: [
        GrievanceMessage(
          id: IdGenerator.generateUuid(),
          grievanceId: '',
          body: description,
          isFarmer: true,
          createdAt: DateTime.now(),
        ),
      ],
    );
    _localGrievances.insert(0, newGrievance);
    return newGrievance;
  }

  @override
  Future<GrievanceMessage> addMessage({
    required String grievanceId,
    required String message,
  }) async {
    if (!AppConfig.isDemoMode) {
      throw const ApiException(
        statusCode: 501,
        errorCode: 'BACKEND_NOT_AVAILABLE',
        message: 'Grievance messaging is not available in the live backend release.',
      );
    }
    final newMsg = GrievanceMessage(
      id: IdGenerator.generateUuid(),
      grievanceId: grievanceId,
      body: message,
      isFarmer: true,
      createdAt: DateTime.now(),
    );
    return newMsg;
  }

  static final Grievance _demoGrievance = Grievance(
    id: '60000000-0000-4000-8000-000000000001',
    orderId: '50000000-0000-4000-8000-000000000001',
    complainantProfileId: AppConstants.demoFarmerId,
    category: 'LOGISTICS_ISSUE',
    description: 'Driver arrival was delayed by 45 minutes from scheduled window. Produce was kept safely covered.',
    status: 'UNDER_REVIEW',
    resolution: 'Support team coordinated with transporter; trip tracking expedited.',
    createdAt: DateTime.parse('2026-09-04T10:30:00+05:30'),
    messages: [
      GrievanceMessage(
        id: 'msg-1',
        grievanceId: '60000000-0000-4000-8000-000000000001',
        body: 'Driver arrival was delayed by 45 minutes from scheduled window.',
        isFarmer: true,
        createdAt: DateTime.parse('2026-09-04T10:30:00+05:30'),
      ),
      GrievanceMessage(
        id: 'msg-2',
        grievanceId: '60000000-0000-4000-8000-000000000001',
        body: 'AgriNexis Support: Transporter driver experienced toll clearance delay. Vehicle is now on route.',
        isFarmer: false,
        createdAt: DateTime.parse('2026-09-04T11:00:00+05:30'),
      ),
    ],
  );
}
