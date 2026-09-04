import 'package:intl/intl.dart';

class CurrencyFormatter {
  static final NumberFormat _indianFormat = NumberFormat.currency(
    locale: 'en_IN',
    symbol: '₹',
    decimalDigits: 0,
  );

  static final NumberFormat _indianDecimalFormat = NumberFormat.currency(
    locale: 'en_IN',
    symbol: '₹',
    decimalDigits: 2,
  );

  /// Formats a numeric or string value to Indian currency format (e.g., ₹28,750 or ₹31.00)
  static String format(dynamic value, {bool showDecimals = false}) {
    if (value == null) return '₹0';

    double numVal;
    if (value is num) {
      numVal = value.toDouble();
    } else if (value is String) {
      numVal = double.tryParse(value) ?? 0.0;
    } else {
      return '₹0';
    }

    if (showDecimals || (numVal % 1 != 0)) {
      return _indianDecimalFormat.format(numVal);
    }
    return _indianFormat.format(numVal);
  }

  /// Formats rate per kg (e.g., ₹31.00/kg or ₹31/kg)
  static String formatRate(dynamic value, {String unit = 'kg', bool showDecimals = true}) {
    return '${format(value, showDecimals: showDecimals)}/$unit';
  }

  /// Formats pure number with Indian numbering system
  static String formatQuantity(dynamic value, {String unit = 'kg'}) {
    if (value == null) return '0 $unit';
    double numVal;
    if (value is num) {
      numVal = value.toDouble();
    } else if (value is String) {
      numVal = double.tryParse(value) ?? 0.0;
    } else {
      return '0 $unit';
    }

    final format = NumberFormat.decimalPattern('en_IN');
    if (numVal % 1 != 0) {
      return '${numVal.toStringAsFixed(2)} $unit';
    }
    return '${format.format(numVal.toInt())} $unit';
  }

  /// Formats a difference with +/- sign (e.g., +₹3,250)
  static String formatDifference(dynamic value) {
    if (value == null) return '+₹0';
    double numVal;
    if (value is num) {
      numVal = value.toDouble();
    } else if (value is String) {
      numVal = double.tryParse(value) ?? 0.0;
    } else {
      return '+₹0';
    }

    final formatted = format(numVal.abs());
    if (numVal > 0) {
      return '+$formatted';
    } else if (numVal < 0) {
      return '-$formatted';
    }
    return formatted;
  }
}
