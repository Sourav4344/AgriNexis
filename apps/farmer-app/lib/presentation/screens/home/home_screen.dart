import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/utils/currency_formatter.dart';
import '../../../l10n/app_localizations.dart';
import '../../../state/app_state_provider.dart';
import '../../../state/auth_provider.dart';
import '../../../state/listing_provider.dart';
import '../../../state/market_provider.dart';
import '../../../state/offer_provider.dart';
import '../../../state/order_provider.dart';
import '../../../state/recommendation_provider.dart';
import '../../widgets/app_button.dart';
import '../../widgets/app_card.dart';
import '../../widgets/comparison_callout.dart';
import '../../widgets/demo_badge.dart';
import '../../widgets/nfr_breakdown_card.dart';
import '../../widgets/status_chip.dart';
import '../grievances/grievances_list_screen.dart';
import '../offers/offers_list_screen.dart';
import '../recommendations/recommendations_screen.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final auth = context.watch<AuthProvider>();
    final listingState = context.watch<ListingProvider>();
    final recoState = context.watch<RecommendationProvider>();
    final marketState = context.watch<MarketProvider>();
    final offerState = context.watch<OfferProvider>();
    final orderState = context.watch<OrderProvider>();
    final appState = context.read<AppStateProvider>();

    final farmerName = auth.profile?.displayName ?? 'Rahul';
    final activeListing = listingState.activeListing;
    final bestReco = recoState.bestRecommendation;
    final secondaryReco = recoState.secondaryRecommendation;
    final pendingOffers = offerState.pendingOffers;
    final activeOrders = orderState.activeOrders;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              l10n.greetingFarmer.replaceAll('Rahul', farmerName),
              style: AppTypography.headlineMedium.copyWith(fontWeight: FontWeight.w800),
            ),
            Text(
              l10n.greetingSubtext,
              style: AppTypography.labelSmall.copyWith(
                color: AppColors.textSecondary,
                fontSize: 12,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.help_outline, color: AppColors.primary),
            tooltip: 'Support & Grievances',
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const GrievancesListScreen()),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.notifications_outlined, color: AppColors.primary),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const OffersListScreen()),
              );
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await Future.wait([
            auth.loadProfile(),
            listingState.loadInitialData(),
            if (activeListing != null) recoState.loadRecommendations(activeListing.id),
            marketState.loadMarkets(),
            offerState.loadOffers(),
            orderState.loadOrders(),
          ]);
        },
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.s16, vertical: AppSpacing.s12),
          children: [
            // Prominent "Sell Produce" Action Header
            AppCard(
              backgroundColor: AppColors.primary,
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Have Harvest Ready to Sell?',
                          style: AppTypography.headlineMedium.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: AppSpacing.s4),
                        Text(
                          'Find verified buyers & discover your Net Realization in 2 minutes.',
                          style: AppTypography.bodyMedium.copyWith(
                            color: Colors.white.withOpacity(0.9),
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: AppSpacing.s12),
                  ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: AppColors.primary,
                      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.s16, vertical: AppSpacing.s12),
                    ),
                    icon: const Icon(Icons.add, size: 18),
                    label: Text(l10n.sellProduceCta, style: const TextStyle(fontWeight: FontWeight.w800)),
                    onPressed: () => appState.setNavIndex(2), // Switch to Sell tab
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.s16),

            // Active Listing Overview
            if (activeListing != null) ...[
              _buildSectionHeader(
                title: l10n.activeListingTitle,
                subtitle: 'Active in marketplace for buyer matching',
              ),
              const SizedBox(height: AppSpacing.s8),
              AppCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: AppColors.primaryContainer,
                            borderRadius: BorderRadius.circular(AppSpacing.radiusSmall),
                          ),
                          child: const Icon(Icons.eco, color: AppColors.primary, size: 28),
                        ),
                        const SizedBox(width: AppSpacing.s12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                activeListing.cropName ?? 'Tomato (टमाटर)',
                                style: AppTypography.headlineMedium.copyWith(fontWeight: FontWeight.w700),
                              ),
                              Text(
                                '${CurrencyFormatter.formatQuantity(activeListing.quantity)} • Grade ${activeListing.qualitySummary.declaredGrade}',
                                style: AppTypography.bodyMedium,
                              ),
                            ],
                          ),
                        ),
                        StatusChip(status: activeListing.status),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.s12),
                    const Divider(),
                    const SizedBox(height: AppSpacing.s8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        _buildStatColumn('Location', '${activeListing.district}, ${activeListing.state}'),
                        _buildStatColumn('Harvested', '01 Sep 2026'),
                        _buildStatColumn('Available', 'Immediate'),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.s20),
            ],

            // Signature NFR Best Decision Section
            if (bestReco != null) ...[
              _buildSectionHeader(
                title: l10n.bestRecommendationTitle,
                subtitle: l10n.bestRecommendationSub,
                trailing: TextButton(
                  onPressed: () {
                    if (activeListing != null) {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => RecommendationsScreen(listingId: activeListing.id),
                        ),
                      );
                    }
                  },
                  child: Text(l10n.viewAll),
                ),
              ),
              const SizedBox(height: AppSpacing.s8),

              // Signature Buyer A vs Buyer B Comparison Callout
              if (secondaryReco != null) ...[
                ComparisonCallout(rank1: bestReco, rank2: secondaryReco),
                const SizedBox(height: AppSpacing.s12),
              ],

              // Full NFR Breakdown Card
              NfrBreakdownCard(
                recommendation: bestReco,
                onTap: () {
                  if (activeListing != null) {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => RecommendationsScreen(listingId: activeListing.id),
                      ),
                    );
                  }
                },
              ),
              const SizedBox(height: AppSpacing.s20),
            ],

            // Active Offers / Orders Quick Status
            if (pendingOffers.isNotEmpty || activeOrders.isNotEmpty) ...[
              _buildSectionHeader(
                title: 'Pending Offers & Orders',
                subtitle: 'Transactions awaiting your review or in transit',
              ),
              const SizedBox(height: AppSpacing.s8),
              if (pendingOffers.isNotEmpty)
                AppCard(
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const OffersListScreen()),
                    );
                  },
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: AppColors.warningContainer,
                          borderRadius: BorderRadius.circular(AppSpacing.radiusSmall),
                        ),
                        child: const Icon(Icons.local_offer_outlined, color: AppColors.warning, size: 24),
                      ),
                      const SizedBox(width: AppSpacing.s12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '${pendingOffers.length} Buyer Offers Received',
                              style: AppTypography.labelLarge.copyWith(fontWeight: FontWeight.w700),
                            ),
                            Text(
                              'Best NFR: ${CurrencyFormatter.format(pendingOffers.first.estimatedNfr ?? 28750)} from ${pendingOffers.first.buyerName.split('(').first.trim()}',
                              style: AppTypography.bodyMedium,
                            ),
                          ],
                        ),
                      ),
                      const Icon(Icons.arrow_forward_ios, size: 16, color: AppColors.textTertiary),
                    ],
                  ),
                ),
              const SizedBox(height: AppSpacing.s20),
            ],

            // Market Pulse Summary
            _buildSectionHeader(
              title: l10n.marketPulseTitle,
              subtitle: 'Latest arrivals and modal rates',
              trailing: TextButton(
                onPressed: () => appState.setNavIndex(1), // Switch to Markets tab
                child: Text(l10n.viewAll),
              ),
            ),
            const SizedBox(height: AppSpacing.s8),
            ...marketState.marketPrices.take(2).map((price) {
              return Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.s8),
                child: AppCard(
                  onTap: () => appState.setNavIndex(1),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            price.mandiName ?? 'Pune APMC',
                            style: AppTypography.labelLarge.copyWith(fontWeight: FontWeight.w700),
                          ),
                          const SizedBox(height: AppSpacing.s2),
                          Row(
                            children: [
                              Text(
                                '${price.cropName ?? "Tomato"} • Range: ${CurrencyFormatter.format(price.minPrice)} - ${CurrencyFormatter.format(price.maxPrice)}',
                                style: AppTypography.bodyMedium.copyWith(fontSize: 13),
                              ),
                              const SizedBox(width: AppSpacing.s8),
                              if (price.isDemo) const DemoBadge(),
                            ],
                          ),
                        ],
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            CurrencyFormatter.formatRate(price.modalPrice),
                            style: AppTypography.headlineMedium.copyWith(
                              color: AppColors.primary,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          Text('Modal Price', style: AppTypography.labelSmall),
                        ],
                      ),
                    ],
                  ),
                ),
              );
            }),
            const SizedBox(height: AppSpacing.s32),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader({
    required String title,
    required String subtitle,
    Widget? trailing,
    Widget? badge,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Text(
                    title,
                    style: AppTypography.headlineMedium.copyWith(fontWeight: FontWeight.w800),
                  ),
                  if (badge != null) ...[
                    const SizedBox(width: AppSpacing.s8),
                    badge,
                  ],
                ],
              ),
              Text(
                subtitle,
                style: AppTypography.bodyMedium.copyWith(
                  color: AppColors.textSecondary,
                  fontSize: 13,
                ),
              ),
            ],
          ),
        ),
        if (trailing != null) trailing,
      ],
    );
  }

  Widget _buildStatColumn(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: AppTypography.labelSmall.copyWith(color: AppColors.textTertiary)),
        const SizedBox(height: AppSpacing.s2),
        Text(value, style: AppTypography.bodyMedium.copyWith(fontWeight: FontWeight.w600)),
      ],
    );
  }
}
