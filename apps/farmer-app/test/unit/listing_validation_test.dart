import 'package:flutter_test/flutter_test.dart';
import 'package:agrinexis_farmer/models/produce_listing.dart';

void main() {
  group('Listing Model & Validation Tests', () {
    test('creates valid listing create JSON payload', () {
      final listing = ProduceListing(
        id: 'list-1',
        farmerProfileId: 'farmer-1',
        cropId: '30000000-0000-4000-8000-000000000001',
        varietyId: '31000000-0000-4000-8000-000000000001',
        quantity: 1000.0,
        availableQuantity: 1000.0,
        harvestDate: DateTime.parse('2026-09-01'),
        availableFrom: DateTime.parse('2026-09-03'),
        availableUntil: DateTime.parse('2026-09-06'),
        district: 'Pune',
        state: 'Maharashtra',
        postalArea: 'DEMO-AREA',
        qualitySummary: QualitySummary(declaredGrade: 'A'),
      );

      final json = listing.toCreateJson();
      expect(json['crop_id'], '30000000-0000-4000-8000-000000000001');
      expect(json['quantity'], '1000.000');
      expect(json['unit'], 'kg');
      expect(json['district'], 'Pune');
      expect(json['state'], 'Maharashtra');
      expect(json['quality_summary']['declared_grade'], 'A');
    });

    test('verifies availability dates ordering', () {
      final availableFrom = DateTime.parse('2026-09-03');
      final availableUntil = DateTime.parse('2026-09-06');

      expect(availableUntil.isAfter(availableFrom), true);
    });
  });
}
