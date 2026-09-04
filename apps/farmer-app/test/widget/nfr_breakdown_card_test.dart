import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:agrinexis_farmer/models/recommendation.dart';
import 'package:agrinexis_farmer/presentation/widgets/nfr_breakdown_card.dart';

void main() {
  group('NfrBreakdownCard Widget Tests', () {
    testWidgets('renders full transparent NFR breakdown for Buyer B', (WidgetTester tester) async {
      final reco = Recommendation(
        id: 'rec-buyer-b',
        farmerProfileId: 'farmer-1',
        listingId: 'listing-1',
        candidateName: 'DEMO Buyer B',
        logisticsQuoteId: 'quote-b',
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
        distanceKm: 35.0,
        dataMode: 'DEMO',
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SingleChildScrollView(
              child: NfrBreakdownCard(recommendation: reco),
            ),
          ),
        ),
      );

      expect(find.text('DEMO Buyer B'), findsOneWidget);
      expect(find.text('★ BEST DECISION'), findsOneWidget);
      expect(find.text('₹28,750'), findsOneWidget);
      expect(find.text('₹31,000'), findsOneWidget); // Gross
      expect(find.text('— ₹2,250'), findsOneWidget); // Total deductions
      expect(find.text('— ₹1,500'), findsOneWidget); // Transport
    });
  });
}
