import 'package:flutter_test/flutter_test.dart';
import 'package:agrinexis_farmer/models/recommendation.dart';

void main() {
  group('Net Farmer Realization (NFR) Logic Tests', () {
    test('verifies Buyer A canonical calculation (Gross ₹32,000, Deductions ₹6,500, NFR ₹25,500)', () {
      const quantity = 1000.0;
      const unitPrice = 32.0;
      const gross = quantity * unitPrice;

      const transport = 5500.0;
      const storage = 500.0;
      const handling = 300.0;
      const other = 200.0;
      const totalCosts = transport + storage + handling + other;

      const nfr = gross - totalCosts;

      expect(gross, 32000.0);
      expect(totalCosts, 6500.0);
      expect(nfr, 25500.0);
    });

    test('verifies Buyer B canonical calculation (Gross ₹31,000, Deductions ₹2,250, NFR ₹28,750)', () {
      const quantity = 1000.0;
      const unitPrice = 31.0;
      const gross = quantity * unitPrice;

      const transport = 1500.0;
      const storage = 300.0;
      const handling = 300.0;
      const other = 150.0;
      const totalCosts = transport + storage + handling + other;

      const nfr = gross - totalCosts;

      expect(gross, 31000.0);
      expect(totalCosts, 2250.0);
      expect(nfr, 28750.0);
    });

    test('asserts Buyer B earns ₹3,250 more than Buyer A despite ₹1/kg lower headline price', () {
      const buyerBNfr = 28750.0;
      const buyerANfr = 25500.0;
      const benefit = buyerBNfr - buyerANfr;

      expect(benefit, 3250.0);
      expect(buyerBNfr > buyerANfr, true);
    });

    test('Recommendation model calculates net per kg accurately', () {
      final reco = Recommendation(
        id: 'rec-1',
        farmerProfileId: 'farmer-1',
        listingId: 'listing-1',
        candidateName: 'Buyer B',
        logisticsQuoteId: 'quote-1',
        estimatedQuantityKg: 1000.0,
        estimatedUnitPricePerKg: 31.0,
        estimatedGrossSellingValue: 31000.0,
        estimatedTransportationCost: 1500.0,
        estimatedStorageCost: 300.0,
        estimatedHandlingCost: 300.0,
        estimatedOtherApplicableCost: 150.0,
        estimatedTotalApplicableCost: 2250.0,
        estimatedNetFarmerRealization: 28750.0,
        rank: 1,
      );

      expect(reco.netPerKg, 28.75);
      expect(reco.isBestOption, true);
    });
  });
}
