class ApiException implements Exception {
  final String code;
  final String message;
  final int statusCode;
  final String? requestId;
  final List<dynamic>? details;

  ApiException({
    required this.code,
    required this.message,
    required this.statusCode,
    this.requestId,
    this.details,
  });

  @override
  String toString() => 'ApiException [$code] ($statusCode): $message';

  bool get isFinancialsChanged => code == 'FINANCIALS_CHANGED';
  bool get isOfferExpired => code == 'OFFER_EXPIRED';
  bool get isOfferNotPending => code == 'OFFER_NOT_PENDING';
  bool get isInsufficientQuantity => code == 'INSUFFICIENT_QUANTITY';
  bool get isVersionConflict => code == 'VERSION_MISMATCH' || code.contains('CONFLICT');
  bool get isUnauthorized => statusCode == 401;
  bool get isForbidden => statusCode == 403;
  bool get isNotFound => statusCode == 404;
  bool get isPredictionUnavailable =>
      code == 'PREDICTION_ENGINE_NOT_CONFIGURED' ||
      code == 'INSUFFICIENT_DATA' ||
      statusCode == 503;
}

class NetworkOfflineException extends ApiException {
  NetworkOfflineException([String message = 'Device is offline or server unreachable'])
      : super(
          code: 'NETWORK_OFFLINE',
          message: message,
          statusCode: 0,
        );
}
