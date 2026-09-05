import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/utils/currency_formatter.dart';
import '../../../core/utils/date_formatter.dart';
import '../../../l10n/app_localizations.dart';
import '../../../models/market_price.dart';
import '../../../state/market_provider.dart';
import '../../widgets/app_card.dart';
import '../../widgets/demo_badge.dart';
import '../../widgets/network_state_views.dart';
import 'price_prediction_screen.dart';

class MarketDiscoveryScreen extends StatelessWidget {
  const MarketDiscoveryScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final marketState = context.watch<MarketProvider>();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(
          l10n.mandiPricesTitle,
          style: AppTypography.headlineLarge.copyWith(fontWeight: FontWeight.w800),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.psychology_outlined, color: AppColors.primary),
            tooltip: 'Price Prediction AI',
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const PricePredictionScreen()),
              );
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => marketState.loadMarkets(),
        child: Column(
          children: [
            // Prominent Distinction Banner between Observed vs Predicted
            Container(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.s16, vertical: AppSpacing.s10),
              color: AppColors.surfaceVariant,
              child: Row(
                children: [
                  const Icon(Icons.info_outline, size: 18, color: AppColors.textSecondary),
                  const SizedBox(width: AppSpacing.s8),
                  Expanded(
                    child: Text(
                      'Showing Observed Mandi Prices (वास्तविक मंडी भाव). Predicted future trends are clearly labelled separately.',
                      style: AppTypography.labelSmall.copyWith(color: AppColors.textPrimary),
                    ),
                  ),
                ],
              ),
            ),

            // Mandi Prices List
            Expanded(
              child: marketState.isLoading
                  ? const LoadingStateView()
                  : marketState.marketPrices.isEmpty
                      ? EmptyStateView(
                          title: l10n.noDataFound,
                          description: 'No market price observations available for selected filters.',
                          onAction: () => marketState.loadMarkets(),
                          actionLabel: l10n.retry,
                        )
                      : ListView.separated(
                          padding: const EdgeInsets.all(AppSpacing.s16),
                          itemCount: marketState.marketPrices.length,
                          separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.s12),
                          itemBuilder: (context, index) {
                            final price = marketState.marketPrices[index];
                            return _buildMandiPriceCard(price, l10n);
                          },
                        ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMandiPriceCard(MandiPrice price, AppLocalizations l10n) {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header: Mandi Name & Badges
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      price.mandiName ?? 'APMC Mandi',
                      style: AppTypography.headlineMedium.copyWith(
                        fontWeight: FontWeight.w700,
                        fontSize: 18,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.s2),
                    Text(
                      'Crop: ${price.cropName ?? "Tomato"} (Grade A)',
                      style: AppTypography.bodyMedium.copyWith(color: AppColors.textSecondary),
                    ),
                  ],
                ),
              ),
              ModeBadge(dataMode: price.dataMode),
            ],
          ),
          const SizedBox(height: AppSpacing.s12),

          // Modal & Min/Max Price Display
          Container(
            padding: const EdgeInsets.all(AppSpacing.s12),
            decoration: BoxDecoration(
              color: AppColors.surfaceVariant,
              borderRadius: BorderRadius.circular(AppSpacing.radiusSmall),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(l10n.modalPrice, style: AppTypography.labelSmall),
                    const SizedBox(height: AppSpacing.s2),
                    Text(
                      CurrencyFormatter.formatRate(price.modalPrice, showDecimals: true),
                      style: AppTypography.headlineLarge.copyWith(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(l10n.minMaxPrice, style: AppTypography.labelSmall),
                    const SizedBox(height: AppSpacing.s2),
                    Text(
                      '${CurrencyFormatter.format(price.minPrice)} — ${CurrencyFormatter.format(price.maxPrice)}',
                      style: AppTypography.bodyLarge.copyWith(fontWeight: FontWeight.w700),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.s12),

          // Arrivals & Observation Timestamp
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              if (price.arrivalQuantityKg != null)
                Row(
                  children: [
                    const Icon(Icons.local_shipping_outlined, size: 16, color: AppColors.textSecondary),
                    const SizedBox(width: AppSpacing.s4),
                    Text(
                      'Arrivals: ${(price.arrivalQuantityKg! / 100).toStringAsFixed(0)} qtl (${price.arrivalQuantityKg!.toInt()} kg)',
                      style: AppTypography.bodyMedium.copyWith(fontSize: 13),
                    ),
                  ],
                ),
              Row(
                children: [
                  const Icon(Icons.access_time, size: 16, color: AppColors.textSecondary),
                  const SizedBox(width: AppSpacing.s4),
                  Text(
                    'Observed: ${DateFormatter.formatRelative(price.observedAt)}',
                    style: AppTypography.bodyMedium.copyWith(fontSize: 13),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}
