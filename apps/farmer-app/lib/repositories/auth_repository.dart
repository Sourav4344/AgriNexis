import '../core/constants/app_config.dart';
import '../core/constants/app_constants.dart';
import '../core/network/api_client.dart';
import '../core/constants/api_endpoints.dart';
import '../models/user_profile.dart';

abstract class AuthRepository {
  Future<UserProfile> getCurrentProfile();
  Future<UserProfile> updateProfile(UserProfile profile);
  Future<void> switchLanguage(String localeCode);
}

class ApiAuthRepository implements AuthRepository {
  final ApiClient _apiClient;

  ApiAuthRepository({required ApiClient apiClient}) : _apiClient = apiClient;

  @override
  Future<UserProfile> getCurrentProfile() async {
    try {
      final response = await _apiClient.get(
        ApiEndpoints.me,
        fromJson: (data) => UserProfile.fromJson(data as Map<String, dynamic>),
      );
      return response.data;
    } catch (_) {
      if (AppConfig.isDemoMode) {
        return _demoProfile;
      }
      rethrow;
    }
  }

  @override
  Future<UserProfile> updateProfile(UserProfile profile) async {
    try {
      final response = await _apiClient.patch(
        ApiEndpoints.me,
        body: profile.toJson(),
        fromJson: (data) => UserProfile.fromJson(data as Map<String, dynamic>),
      );
      return response.data;
    } catch (_) {
      if (AppConfig.isDemoMode) {
        return profile;
      }
      rethrow;
    }
  }

  @override
  Future<void> switchLanguage(String localeCode) async {
    try {
      await _apiClient.patch(
        ApiEndpoints.me,
        body: {'preferred_locale': localeCode},
        fromJson: (_) => null,
      );
    } catch (_) {
      if (AppConfig.isDemoMode) {
        return;
      }
      rethrow;
    }
  }

  static final UserProfile _demoProfile = UserProfile(
    id: AppConstants.demoFarmerId,
    userId: '10000000-0000-4000-8000-000000000001',
    role: 'FARMER',
    displayName: 'Rahul',
    preferredLocale: 'hi',
    district: 'Pune',
    state: 'Maharashtra',
    postalArea: 'DEMO-AREA',
    farmSummary: 'DEMO farmer profile (Tomato & Onion cultivation, 3.5 acres)',
    createdAt: DateTime.parse('2026-09-01T09:00:00Z'),
  );
}
