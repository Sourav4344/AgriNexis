import 'package:intl/intl.dart';

class DateFormatter {
  static final DateFormat _displayDate = DateFormat('dd MMM yyyy');
  static final DateFormat _displayDateTime = DateFormat('dd MMM yyyy, hh:mm a');
  static final DateFormat _timeOnly = DateFormat('hh:mm a');
  static final DateFormat _isoDate = DateFormat('yyyy-MM-dd');

  /// Parses date string and returns formatted user-readable date (e.g., 04 Sep 2026)
  static String formatDate(dynamic date) {
    if (date == null) return '--';
    DateTime? dt;
    if (date is DateTime) {
      dt = date;
    } else if (date is String) {
      dt = DateTime.tryParse(date);
    }
    if (dt == null) return date.toString();
    return _displayDate.format(dt.toLocal());
  }

  /// Parses datetime and returns formatted date and time (e.g., 04 Sep 2026, 09:30 AM)
  static String formatDateTime(dynamic dateTime) {
    if (dateTime == null) return '--';
    DateTime? dt;
    if (dateTime is DateTime) {
      dt = dateTime;
    } else if (dateTime is String) {
      dt = DateTime.tryParse(dateTime);
    }
    if (dt == null) return dateTime.toString();
    return _displayDateTime.format(dt.toLocal());
  }

  /// Parses datetime and returns time only (e.g., 09:30 AM)
  static String formatTime(dynamic dateTime) {
    if (dateTime == null) return '--';
    DateTime? dt;
    if (dateTime is DateTime) {
      dt = dateTime;
    } else if (dateTime is String) {
      dt = DateTime.tryParse(dateTime);
    }
    if (dt == null) return dateTime.toString();
    return _timeOnly.format(dt.toLocal());
  }

  /// Returns standard ISO date string for API requests (e.g. 2026-09-04)
  static String toIsoDate(DateTime dt) {
    return _isoDate.format(dt);
  }

  /// Computes relative time for price freshness (e.g., "2 hours ago" or "Yesterday")
  static String formatRelative(dynamic dateTime) {
    if (dateTime == null) return '--';
    DateTime? dt;
    if (dateTime is DateTime) {
      dt = dateTime;
    } else if (dateTime is String) {
      dt = DateTime.tryParse(dateTime);
    }
    if (dt == null) return dateTime.toString();

    final now = DateTime.now();
    final difference = now.difference(dt.toLocal());

    if (difference.inSeconds < 60) {
      return 'Just now';
    } else if (difference.inMinutes < 60) {
      final mins = difference.inMinutes;
      return '$mins ${mins == 1 ? 'min' : 'mins'} ago';
    } else if (difference.inHours < 24) {
      final hours = difference.inHours;
      return '$hours ${hours == 1 ? 'hour' : 'hours'} ago';
    } else if (difference.inDays == 1) {
      return 'Yesterday';
    } else if (difference.inDays < 7) {
      return '${difference.inDays} days ago';
    } else {
      return _displayDate.format(dt.toLocal());
    }
  }
}
