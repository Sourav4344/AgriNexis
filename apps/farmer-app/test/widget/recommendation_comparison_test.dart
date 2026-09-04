import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:agrinexis_farmer/models/recommendation.dart';
import 'package:agrinexis_farmer/presentation/widgets/comparison_callout.dart';

void main() {
  group('ComparisonCallout Widget Tests', () {
    testWidgets('renders headline "You earn ₹3,250 more" for Buyer B vs Buyer A', (WidgetTester tester) async {
      final rank1 = Recommendation(
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
      );

      final rank2 = Recommendation(
        id: 'rec-buyer-a',
        farmerProfileId: 'farmer-1',
        listingId: 'listing-1',
        candidateName: 'DEMO Buyer A',
        logisticsQuoteId: 'quote-a',
        estimatedQuantityKg: 1000.0,
        estimatedUnitPricePerKg: 32.0,
        estimatedGrossSellingValue: 32000.0,
        estimatedTransportationCost: 5500.0,
        estimatedStorageCost: 500.0,
        estimatedHandlingCost: 300.0,
        estimatedOtherApplicableCost: 200.0,
        estimatedTotalApplicableCost: 6500.0,
        estimatedNetFarmerRealization: 25500.0,
        rank: 2,
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SingleChildScrollView(
              child: ComparisonCallout(rank1: rank1, rank2: rank2),
            ),
          ),
        ),
      );

      expect(find.text('You earn ₹3,250 more'), findsOneWidget);
      expect(find.text('Buyer B (Best)'), findsOneWidget);
      expect(find.text('Buyer A'), findsOneWidget);
    });
  });
}
