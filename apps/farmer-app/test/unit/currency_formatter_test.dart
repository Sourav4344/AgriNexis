import 'package:flutter_test/flutter_test.dart';
import 'package:agrinexis_farmer/core/utils/currency_formatter.dart';

void main() {
  group('CurrencyFormatter Unit Tests', () {
    test('formats whole numbers to INR format', () {
      expect(CurrencyFormatter.format(28750), '₹28,750');
      expect(CurrencyFormatter.format(32000), '₹32,000');
      expect(CurrencyFormatter.format(6500), '₹6,500');
      expect(CurrencyFormatter.format(2250), '₹2,250');
    });

    test('formats decimal numbers with two decimals when requested', () {
      expect(CurrencyFormatter.format(31.50, showDecimals: true), '₹31.50');
      expect(CurrencyFormatter.format('28.75', showDecimals: true), '₹28.75');
    });

    test('formats rate per kg correctly', () {
      expect(CurrencyFormatter.formatRate(31.0), '₹31.00/kg');
      expect(CurrencyFormatter.formatRate(32.0, showDecimals: false), '₹32/kg');
    });

    test('formats difference with positive/negative signs', () {
      expect(CurrencyFormatter.formatDifference(3250), '+₹3,250');
      expect(CurrencyFormatter.formatDifference(-1500), '-₹1,500');
      expect(CurrencyFormatter.formatDifference(0), '₹0');
    });

    test('formats quantities in kg', () {
      expect(CurrencyFormatter.formatQuantity(1000), '1,000 kg');
      expect(CurrencyFormatter.formatQuantity(500.5), '500.50 kg');
    });
  });
}
