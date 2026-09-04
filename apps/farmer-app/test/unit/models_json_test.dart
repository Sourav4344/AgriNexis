import 'package:flutter_test/flutter_test.dart';
import 'package:agrinexis_farmer/models/crop.dart';
import 'package:agrinexis_farmer/models/market_price.dart';
import 'package:agrinexis_farmer/models/offer.dart';
import 'package:agrinexis_farmer/models/order.dart';
import 'package:agrinexis_farmer/models/price_prediction.dart';
import 'package:agrinexis_farmer/models/recommendation.dart';
import 'package:agrinexis_farmer/models/user_profile.dart';

void main() {
  group('JSON Deserialization Contract Tests', () {
    test('UserProfile parses FastAPI profile envelope', () {
      final json = {
        'id': '20000000-0000-4000-8000-000000000001',
        'user_id': '10000000-0000-4000-8000-000000000001',
        'role': 'FARMER',
        'display_name': 'Rahul',
        'preferred_locale': 'hi',
        'status': 'ACTIVE',
        'farmer_district': 'Pune',
        'farmer_state': 'Maharashtra',
      };

      final profile = UserProfile.fromJson(json);
      expect(profile.displayName, 'Rahul');
      expect(profile.role, 'FARMER');
      expect(profile.district, 'Pune');
    });

    test('Crop parses active crop with multilingual names', () {
      final json = {
        'id': '30000000-0000-4000-8000-000000000001',
        'canonical_code': 'TOMATO',
        'name_en': 'Tomato',
        'name_hi': 'टमाटर',
        'name_bn': 'টমেটো',
        'default_unit': 'kg',
      };

      final crop = Crop.fromJson(json);
      expect(crop.nameEn, 'Tomato');
      expect(crop.localizedName('hi'), 'टमाटर');
    });

    test('MandiPrice parses DEMO data warning badge correctly', () {
      final json = {
        'id': '33000000-0000-4000-8000-000000000001',
        'mandi_id': '32000000-0000-4000-8000-000000000001',
        'crop_id': '30000000-0000-4000-8000-000000000001',
        'min_price': '28.00',
        'modal_price': '30.00',
        'max_price': '33.00',
        'data_mode': 'DEMO',
        'observed_at': '2026-09-04T09:00:00Z',
      };

      final price = MandiPrice.fromJson(json);
      expect(price.modalPrice, 30.0);
      expect(price.isDemo, true);
      expect(price.dataWarning, 'DEMO DATA — NOT LIVE GOVERNMENT DATA');
    });

    test('PricePrediction parses prediction features and sell/wait signal', () {
      final json = {
        'crop_id': '30000000-0000-4000-8000-000000000001',
        'predicted_price': '31.50',
        'min_price_range': '29.00',
        'max_price_range': '34.00',
        'trend': 'STABLE',
        'horizon_days': 3,
        'confidence': '0.85',
        'sell_wait': 'SELL_NOW',
        'data_mode': 'DEMO',
      };

      final pred = PricePrediction.fromJson(json);
      expect(pred.predictedPrice, 31.5);
      expect(pred.trend, PredictionTrend.stable);
      expect(pred.isSellNow, true);
      expect(pred.confidence, 0.85);
    });

    test('Recommendation parses ranked NFR economics and explanations', () {
      final json = {
        'id': '43000000-0000-4000-8000-000000000002',
        'listing_id': '40000000-0000-4000-8000-000000000001',
        'candidate_name': 'DEMO Buyer B',
        'logistics_quote_id': '42000000-0000-4000-8000-000000000002',
        'estimated_quantity_kg': '1000.000',
        'estimated_unit_price_per_kg': '31.00',
        'estimated_gross_selling_value': '31000.00',
        'estimated_transportation_cost': '1500.00',
        'estimated_storage_cost': '300.00',
        'estimated_handling_cost': '300.00',
        'estimated_other_applicable_cost': '150.00',
        'estimated_total_applicable_cost': '2250.00',
        'estimated_net_farmer_realization': '28750.00',
        'rank': 1,
        'sell_wait': 'SELL_NOW',
        'explanation_facts': ['DEMO_DATA', 'HIGHER_NET_REALIZATION'],
        'data_mode': 'DEMO',
      };

      final reco = Recommendation.fromJson(json);
      expect(reco.estimatedNetFarmerRealization, 28750.0);
      expect(reco.rank, 1);
      expect(reco.isBestOption, true);
    });

    test('Order parses accepted immutable financial snapshot', () {
      final json = {
        'id': '50000000-0000-4000-8000-000000000001',
        'status': 'IN_TRANSIT',
        'payment_status': 'PAID',
        'snapshot_currency': 'INR',
        'snapshot_quantity_kg': '1000.000',
        'snapshot_unit_price_per_kg': '31.00',
        'snapshot_gross_selling_value': '31000.00',
        'snapshot_transportation_cost': '1500.00',
        'snapshot_storage_cost': '300.00',
        'snapshot_handling_cost': '300.00',
        'snapshot_other_applicable_cost': '150.00',
        'snapshot_total_applicable_cost': '2250.00',
        'snapshot_net_farmer_realization': '28750.00',
        'accepted_at': '2026-09-04T09:30:00Z',
      };

      final order = Order.fromJson(json);
      expect(order.status, 'IN_TRANSIT');
      expect(order.snapshot.netFarmerRealization, 28750.0);
      expect(order.snapshot.totalApplicableCost, 2250.0);
      expect(order.snapshot.grossSellingValue, 31000.0);
    });

    test('Recommendation exports exact authoritative decimal strings without double conversion', () {
      final json = {
        'id': '43000000-0000-4000-8000-000000000002',
        'farmer_profile_id': '20000000-0000-4000-8000-000000000001',
        'listing_id': '40000000-0000-4000-8000-000000000001',
        'candidate_name': 'DEMO Buyer B',
        'logistics_quote_id': '42000000-0000-4000-8000-000000000002',
        'estimated_quantity_kg': '1000.00',
        'estimated_unit_price_per_kg': '31.00',
        'estimated_gross_selling_value': '31000.00',
        'estimated_transportation_cost': '1500.00',
        'estimated_storage_cost': '300.00',
        'estimated_handling_cost': '300.00',
        'estimated_other_applicable_cost': '150.00',
        'estimated_total_applicable_cost': '2250.00',
        'estimated_net_farmer_realization': '28750.00',
        'currency': 'INR',
        'rank': 1,
        'sell_wait': 'SELL_NOW',
        'data_mode': 'DEMO',
      };

      final reco = Recommendation.fromJson(json);
      final acknowledged = reco.toAcknowledgedAmounts();

      // 1. "31000.00" remains exactly "31000.00"
      expect(acknowledged.grossSellingValue, '31000.00');
      // 2. "2250.00" remains exactly "2250.00"
      expect(acknowledged.totalApplicableCost, '2250.00');
      // 3. "28750.00" remains exactly "28750.00"
      expect(acknowledged.netFarmerRealization, '28750.00');
      expect(acknowledged.currency, 'INR');

      // 4. No double conversion roundtrip used in toJson() payload
      final acceptPayload = acknowledged.toJson();
      expect(acceptPayload['gross_selling_value'], '31000.00');
      expect(acceptPayload['total_applicable_cost'], '2250.00');
      expect(acceptPayload['net_farmer_realization'], '28750.00');
    });

    test('Offer acceptance is unavailable without authoritative recommendation economics', () {
      // Unbound offer with only raw unit price and quantity
      final rawOffer = Offer(
        id: '41500000-0000-4000-8000-000000000001',
        listingId: '40000000-0000-4000-8000-000000000001',
        buyerName: 'Buyer Without Quote',
        offeredQuantity: 1000.0,
        unitPrice: 32.0,
        deliveryTerms: 'buyer_pickup',
        expiresAt: DateTime.now().add(const Duration(days: 1)),
      );

      // 5. Acceptance is unavailable without authoritative recommendation economics
      expect(rawOffer.hasAuthoritativeEconomics, false);
      expect(rawOffer.authoritativeAcknowledgedAmounts, isNull);

      // Now bind to authoritative recommendation
      final recoJson = {
        'id': '43000000-0000-4000-8000-000000000001',
        'farmer_profile_id': '20000000-0000-4000-8000-000000000001',
        'listing_id': '40000000-0000-4000-8000-000000000001',
        'candidate_name': 'Buyer With Quote',
        'logistics_quote_id': '42000000-0000-4000-8000-000000000001',
        'estimated_quantity_kg': '1000.00',
        'estimated_unit_price_per_kg': '32.00',
        'estimated_gross_selling_value': '32000.00',
        'estimated_transportation_cost': '5500.00',
        'estimated_storage_cost': '500.00',
        'estimated_handling_cost': '300.00',
        'estimated_other_applicable_cost': '200.00',
        'estimated_total_applicable_cost': '6500.00',
        'estimated_net_farmer_realization': '25500.00',
        'currency': 'INR',
        'rank': 2,
        'sell_wait': 'SELL_NOW',
        'data_mode': 'DEMO',
      };
      final reco = Recommendation.fromJson(recoJson);
      final boundOffer = rawOffer.bindRecommendation(reco);

      expect(boundOffer.hasAuthoritativeEconomics, true);
      expect(boundOffer.authoritativeAcknowledgedAmounts, isNotNull);
      expect(boundOffer.authoritativeAcknowledgedAmounts!.grossSellingValue, '32000.00');
      expect(boundOffer.authoritativeAcknowledgedAmounts!.totalApplicableCost, '6500.00');
      expect(boundOffer.authoritativeAcknowledgedAmounts!.netFarmerRealization, '25500.00');
    });
  });
}
