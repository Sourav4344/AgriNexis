import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:agrinexis_farmer/presentation/widgets/demo_badge.dart';

void main() {
  group('DemoBadge Widget Tests', () {
    testWidgets('renders sticky demo data warning banner', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: DemoBadge(isBanner: true),
          ),
        ),
      );

      expect(find.text('DEMO DATA — NOT LIVE GOVERNMENT DATA'), findsOneWidget);
      expect(find.byIcon(Icons.science_outlined), findsOneWidget);
    });

    testWidgets('renders chip demo badge', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: DemoBadge(isBanner: false),
          ),
        ),
      );

      expect(find.text('DEMO'), findsOneWidget);
    });

    testWidgets('renders ModeBadge for LIVE, CACHED and DEMO modes', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: Column(
              children: [
                ModeBadge(dataMode: 'LIVE'),
                ModeBadge(dataMode: 'CACHED'),
                ModeBadge(dataMode: 'DEMO'),
              ],
            ),
          ),
        ),
      );

      expect(find.text('LIVE'), findsOneWidget);
      expect(find.text('CACHED'), findsOneWidget);
      expect(find.text('DEMO'), findsOneWidget);
    });
  });
}
