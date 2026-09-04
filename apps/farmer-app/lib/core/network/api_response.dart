class ApiResponse<T> {
  final T data;
  final ApiMeta meta;

  ApiResponse({
    required this.data,
    required this.meta,
  });

  factory ApiResponse.fromJson(
    Map<String, dynamic> json,
    T Function(dynamic rawData) fromJsonT,
  ) {
    return ApiResponse<T>(
      data: fromJsonT(json['data']),
      meta: ApiMeta.fromJson(json['meta'] as Map<String, dynamic>? ?? {}),
    );
  }
}

class ApiMeta {
  final String? requestId;
  final String? nextCursor;
  final int? limit;

  ApiMeta({
    this.requestId,
    this.nextCursor,
    this.limit,
  });

  factory ApiMeta.fromJson(Map<String, dynamic> json) {
    return ApiMeta(
      requestId: json['request_id'] as String?,
      nextCursor: json['next_cursor'] as String?,
      limit: json['limit'] as int?,
    );
  }
}
