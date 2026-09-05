import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../l10n/app_localizations.dart';
import '../../../models/recommendation.dart';
import '../../../state/recommendation_provider.dart';
import '../../widgets/comparison_callout.dart';
import '../../widgets/demo_badge.dart';
import '../../widgets/network_state_views.dart';
import '../../widgets/nfr_breakdown_card.dart';
import 'recommendation_detail_screen.dart';

class RecommendationsScreen extends StatelessWidget {
  final String listingId;

  const RecommendationsScreen({Key? key, required this.listingId}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final recoState = context.watch<RecommendationProvider>();
    final recommendations = recoState.recommendations;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(
          l10n.bestRecommendationTitle,
          style: AppTypography.headlineLarge.copyWith(fontWeight: FontWeight.w800),
        ),
        actions: [
          if (recommendations.any((recommendation) => recommendation.isDemo))
          const Padding(
            padding: EdgeInsets.only(right: 16.0),
            child: DemoBadge(),
          ),
        ],
      ),
      body: recoState.isLoading
          ? const LoadingStateView()
          : recoState.errorMessage != null
              ? ErrorStateView(message: l10n.errorOccurred, onRetry: () => recoState.loadRecommendations(listingId))
          : recommendations.isEmpty
              ? EmptyStateView(
                  title: 'No matched buyers yet',
                  description: 'Buyers and FPOs are reviewing your listing. Check back shortly.',
                  onAction: () => recoState.loadRecommendations(listingId),
                  actionLabel: l10n.retry,
                )
              : ListView(
                  padding: const EdgeInsets.all(AppSpacing.s16),
                  children: [
                    // Comparison Callout if at least 2 recommendations exist
                    if (recommendations.length >= 2) ...[
                      ComparisonCallout(
                        rank1: recommendations[0],
                        rank2: recommendations[1],
                      ),
                      const SizedBox(height: AppSpacing.s16),
                    ],

                    Text(
                      'All Matched Options (Ranked by NFR)',
                      style: AppTypography.headlineMedium.copyWith(fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: AppSpacing.s12),

                    ...recommendations.map((reco) {
                      return Padding(
                        padding: const EdgeInsets.only(bottom: AppSpacing.s16),
                        child: NfrBreakdownCard(
                          recommendation: reco,
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => RecommendationDetailScreen(recommendation: reco),
                              ),
                            );
                          },
                        ),
                      );
                    }),
                  ],
                ),
    );
  }
}
