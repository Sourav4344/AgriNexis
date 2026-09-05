import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/utils/currency_formatter.dart';
import '../../../core/utils/date_formatter.dart';
import '../../../models/produce_listing.dart';
import '../../../state/recommendation_provider.dart';
import '../../widgets/app_button.dart';
import '../../widgets/app_card.dart';
import '../../widgets/demo_badge.dart';
import '../../widgets/status_chip.dart';
import '../recommendations/recommendations_screen.dart';

class ListingDetailScreen extends StatelessWidget {
  final ProduceListing listing;

  const ListingDetailScreen({Key? key, required this.listing}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final recoState = context.watch<RecommendationProvider>();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(
          listing.cropName ?? 'Listing Details',
          style: AppTypography.headlineLarge.copyWith(fontWeight: FontWeight.w800),
        ),
        actions: const [
          Padding(
            padding: EdgeInsets.only(right: 16.0),
            child: DemoBadge(),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.s16),
        children: [
          // Main Listing Card
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Crop Listing Overview',
                      style: AppTypography.headlineMedium.copyWith(fontWeight: FontWeight.w700),
                    ),
                    StatusChip(status: listing.status),
                  ],
                ),
                const SizedBox(height: AppSpacing.s16),
                _buildInfoRow('Crop', listing.cropName ?? 'Tomato (टमाटर)'),
                _buildInfoRow('Variety', listing.varietyName ?? 'Desi / Standard Red'),
                _buildInfoRow('Available Quantity', CurrencyFormatter.formatQuantity(listing.availableQuantity)),
                _buildInfoRow('Total Listed Quantity', CurrencyFormatter.formatQuantity(listing.quantity)),
                _buildInfoRow('Declared Grade', 'Grade ${listing.qualitySummary.declaredGrade}'),
                _buildInfoRow('Harvest Date', DateFormatter.formatDate(listing.harvestDate)),
                _buildInfoRow('Availability Window', '${DateFormatter.formatDate(listing.availableFrom)} to ${DateFormatter.formatDate(listing.availableUntil)}'),
                _buildInfoRow('Location', '${listing.district}, ${listing.state} (${listing.postalArea ?? "DEMO-AREA"})'),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.s20),

          // Action Button to View Matched Buyer Recommendations
          AppCard(
            backgroundColor: AppColors.primaryContainer,
            border: const BorderSide(color: AppColors.primaryLight, width: 1.5),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.auto_graph, color: AppColors.primary, size: 28),
                    const SizedBox(width: AppSpacing.s12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Matched Buyer Recommendations',
                            style: AppTypography.headlineMedium.copyWith(
                              color: AppColors.primary,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          Text(
                            'Ranked strictly by Net Farmer Realization (NFR)',
                            style: AppTypography.bodyMedium,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.s16),
                AppButton(
                  label: 'View Best Decision & Offers (${recoState.recommendations.length} available)',
                  icon: Icons.trending_up,
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => RecommendationsScreen(listingId: listing.id),
                      ),
                    );
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.s6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: AppTypography.bodyMedium.copyWith(color: AppColors.textSecondary)),
          Flexible(
            child: Text(
              value,
              style: AppTypography.bodyLarge.copyWith(fontWeight: FontWeight.w600),
              textAlign: TextAlign.end,
            ),
          ),
        ],
      ),
    );
  }
}
