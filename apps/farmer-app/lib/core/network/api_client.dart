import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import '../constants/api_endpoints.dart';
import 'api_exceptions.dart';
import 'api_response.dart';

class ApiClient {
  final String baseUrl;
  final http.Client _client;
  String? _authToken;

  ApiClient({
    String? baseUrl,
    http.Client? client,
  })  : baseUrl = baseUrl ?? ApiEndpoints.defaultBaseUrl,
        _client = client ?? http.Client();

  void setAuthToken(String? token) {
    _authToken = token;
  }

  Map<String, String> _buildHeaders({
    String? idempotencyKey,
    int? version,
  }) {
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (_authToken != null) {
      headers['Authorization'] = 'Bearer $_authToken';
    }
    if (idempotencyKey != null) {
      headers['Idempotency-Key'] = idempotencyKey;
    }
    if (version != null) {
      headers['If-Match'] = version.toString();
    }
    return headers;
  }

  Uri _buildUri(String path, [Map<String, dynamic>? queryParams]) {
    final cleanPath = path.startsWith('/') ? path : '/$path';
    final fullUrl = '$baseUrl$cleanPath';
    final uri = Uri.parse(fullUrl);
    if (queryParams != null && queryParams.isNotEmpty) {
      final stringParams = queryParams.map(
        (key, value) => MapEntry(key, value?.toString() ?? ''),
      )..removeWhere((k, v) => v.isEmpty);
      return uri.replace(queryParameters: stringParams);
    }
    return uri;
  }

  Future<ApiResponse<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParams,
    required T Function(dynamic json) fromJson,
  }) async {
    try {
      final uri = _buildUri(path, queryParams);
      final response = await _client
          .get(uri, headers: _buildHeaders())
          .timeout(const Duration(seconds: 15));
      return _handleResponse(response, fromJson);
    } on SocketException {
      throw NetworkOfflineException();
    } on TimeoutException {
      throw NetworkOfflineException('Request timed out. Please check your internet connection.');
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException(
        code: 'CLIENT_ERROR',
        message: e.toString(),
        statusCode: 0,
      );
    }
  }

  Future<ApiResponse<T>> post<T>(
    String path, {
    dynamic body,
    String? idempotencyKey,
    required T Function(dynamic json) fromJson,
  }) async {
    try {
      final uri = _buildUri(path);
      final response = await _client
          .post(
            uri,
            headers: _buildHeaders(idempotencyKey: idempotencyKey),
            body: body != null ? jsonEncode(body) : null,
          )
          .timeout(const Duration(seconds: 15));
      return _handleResponse(response, fromJson);
    } on SocketException {
      throw NetworkOfflineException();
    } on TimeoutException {
      throw NetworkOfflineException('Request timed out. Please check your internet connection.');
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException(
        code: 'CLIENT_ERROR',
        message: e.toString(),
        statusCode: 0,
      );
    }
  }

  Future<ApiResponse<T>> patch<T>(
    String path, {
    dynamic body,
    int? version,
    required T Function(dynamic json) fromJson,
  }) async {
    try {
      final uri = _buildUri(path);
      final response = await _client
          .patch(
            uri,
            headers: _buildHeaders(version: version),
            body: body != null ? jsonEncode(body) : null,
          )
          .timeout(const Duration(seconds: 15));
      return _handleResponse(response, fromJson);
    } on SocketException {
      throw NetworkOfflineException();
    } on TimeoutException {
      throw NetworkOfflineException('Request timed out. Please check your internet connection.');
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException(
        code: 'CLIENT_ERROR',
        message: e.toString(),
        statusCode: 0,
      );
    }
  }

  ApiResponse<T> _handleResponse<T>(
    http.Response response,
    T Function(dynamic json) fromJson,
  ) {
    dynamic decoded;
    try {
      decoded = jsonDecode(response.body);
    } catch (_) {
      decoded = {'error': {'message': response.body}};
    }

    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (decoded is Map<String, dynamic> && decoded.containsKey('data')) {
        return ApiResponse.fromJson(decoded, fromJson);
      } else {
        return ApiResponse(
          data: fromJson(decoded),
          meta: ApiMeta(),
        );
      }
    }

    // Handle structured error envelope
    if (decoded is Map<String, dynamic> && decoded.containsKey('error')) {
      final err = decoded['error'] as Map<String, dynamic>;
      throw ApiException(
        code: err['code'] as String? ?? 'API_ERROR',
        message: err['message'] as String? ?? 'An unexpected error occurred',
        statusCode: response.statusCode,
        requestId: err['request_id'] as String?,
        details: err['details'] as List<dynamic>?,
      );
    }

    throw ApiException(
      code: 'HTTP_${response.statusCode}',
      message: 'Server error occurred (${response.statusCode})',
      statusCode: response.statusCode,
    );
  }
}
