import 'package:flutter/material.dart';
import '../models/grievance.dart';
import '../repositories/grievance_repository.dart';

class GrievanceProvider extends ChangeNotifier {
  final GrievanceRepository _repository;

  List<Grievance> _grievances = [];
  bool _isLoading = false;
  bool _isSubmitting = false;
  String? _errorMessage;

  GrievanceProvider({required GrievanceRepository repository}) : _repository = repository {
    loadGrievances();
  }

  List<Grievance> get grievances => _grievances;
  bool get isLoading => _isLoading;
  bool get isSubmitting => _isSubmitting;
  String? get errorMessage => _errorMessage;

  Future<void> loadGrievances() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _grievances = await _repository.getGrievances();
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<Grievance?> submitGrievance({
    required String category,
    required String description,
    String? orderId,
  }) async {
    _isSubmitting = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final created = await _repository.createGrievance(
        category: category,
        description: description,
        orderId: orderId,
      );
      _grievances.insert(0, created);
      _isSubmitting = false;
      notifyListeners();
      return created;
    } catch (e) {
      _errorMessage = e.toString();
      _isSubmitting = false;
      notifyListeners();
      return null;
    }
  }

  Future<void> sendFollowUpMessage({
    required String grievanceId,
    required String message,
  }) async {
    try {
      final newMsg = await _repository.addMessage(
        grievanceId: grievanceId,
        message: message,
      );
      final idx = _grievances.indexWhere((g) => g.id == grievanceId);
      if (idx != -1) {
        final existing = _grievances[idx];
        final updatedMessages = List<GrievanceMessage>.from(existing.messages)..add(newMsg);
        _grievances[idx] = Grievance(
          id: existing.id,
          orderId: existing.orderId,
          complainantProfileId: existing.complainantProfileId,
          category: existing.category,
          description: existing.description,
          status: existing.status,
          resolution: existing.resolution,
          createdAt: existing.createdAt,
          resolvedAt: existing.resolvedAt,
          messages: updatedMessages,
        );
        notifyListeners();
      }
    } catch (_) {}
  }
}
