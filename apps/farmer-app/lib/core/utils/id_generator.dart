import 'dart:math';

class IdGenerator {
  static final Random _random = Random();

  /// Generates a v4-like pseudo UUID string for client idempotency keys and local entities
  static String generateUuid() {
    final bytes = List<int>.generate(16, (i) => _random.nextInt(256));
    // Set version to 4
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    // Set variant to RFC 4122
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    final hex = bytes.map((b) => b.toRadixString(16).padLeft(2, '0')).join();
    return '${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20, 32)}';
  }

  /// Generates an Idempotency-Key for offer acceptance
  static String generateIdempotencyKey({String prefix = 'FARMER-OFFER-ACCEPT'}) {
    return '$prefix-${DateTime.now().millisecondsSinceEpoch}-${generateUuid().substring(0, 8)}';
  }
}
