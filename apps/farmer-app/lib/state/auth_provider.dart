import 'package:flutter/material.dart';
import '../models/user_profile.dart';
import '../repositories/auth_repository.dart';

class AuthProvider extends ChangeNotifier {
  final AuthRepository _repository;
  UserProfile? _profile;
  bool _isLoading = false;
  String? _errorMessage;

  AuthProvider({required AuthRepository repository}) : _repository = repository {
    loadProfile();
  }

  UserProfile? get profile => _profile;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<void> loadProfile() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _profile = await _repository.getCurrentProfile();
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> updateProfile(UserProfile updated) async {
    _isLoading = true;
    notifyListeners();

    try {
      _profile = await _repository.updateProfile(updated);
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }
}
