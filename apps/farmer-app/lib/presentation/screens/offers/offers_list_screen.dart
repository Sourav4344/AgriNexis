import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/utils/currency_formatter.dart';
import '../../../core/utils/date_formatter.dart';
import '../../../l10n/app_localizations.dart';
import '../../../models/offer.dart';
import '../../../state/offer_provider.dart';
import '../../widgets/app_card.dart';
import '../../widgets/demo_badge.dart';
import '../../widgets/network_state_views.dart';
import '../../widgets/status_chip.dart';
import 'offer_detail_screen.dart';

class OffersListScreen extends StatelessWidget {
  const OffersListScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final offerState = context.watch<OfferProvider>();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(
          l10n.pendingOffersTitle,
          style: AppTypography.headlineLarge.copyWith(fontWeight: FontWeight.w800),
        ),
        actions: const [
          Padding(
            padding: EdgeInsets.only(right: 16.0),
            child: DemoBadge(),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => offerState.loadOffers(),
        child: offerState.isLoading
            ? const LoadingStateView()
            : offerState.offers.isEmpty
                ? EmptyStateView(
                    title: 'No Offers Received',
                    description: 'You will be notified as soon as buyers place offers on your listed crops.',
                    onAction: () => offerState.loadOffers(),
                    actionLabel: l10n.retry,
                  )
                : ListView.separated(
                    padding: const EdgeInsets.all(AppSpacing.s16),
                    itemCount: offerState.offers.length,
                    separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.s12),
                    itemBuilder: (context, index) {
                      final offer = offerState.offers[index];
                      return _buildOfferCard(context, offer, l10n);
                    },
                  ),
      ),
    );
  }

  Widget _buildOfferCard(BuildContext context, Offer offer, AppLocalizations l10n) {
    final isRecommended = offer.id == '41500000-0000-4000-8000-000000000002';

    return AppCard(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => OfferDetailScreen(offer: offer)),
        );
      },
      border: BorderSide(
        color: isRecommended ? AppColors.primary : AppColors.border,
        width: isRecommended ? 1.5 : 1.0,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              if (isRecommended)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.s8, vertical: AppSpacing.s2),
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.circular(AppSpacing.radiusSmall),
                  ),
                  child: const Text(
                    '★ RECOMMENDED (HIGHER NFR)',
                    style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                  ),
                )
              else
                const Text('DIRECT OFFER', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.textTertiary)),
              StatusChip(status: offer.status),
            ],
          ),
          const SizedBox(height: AppSpacing.s8),

          Text(
            offer.buyerName,
            style: AppTypography.headlineMedium.copyWith(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: AppSpacing.s4),
          Text(
            'Offered: ${CurrencyFormatter.formatQuantity(offer.offeredQuantity)} @ ${CurrencyFormatter.formatRate(offer.unitPrice)}',
            style: AppTypography.bodyMedium,
          ),
          const SizedBox(height: AppSpacing.s12),

          Container(
            padding: const EdgeInsets.all(AppSpacing.s12),
            decoration: BoxDecoration(
              color: isRecommended ? AppColors.nfrContainer : AppColors.surfaceVariant,
              borderRadius: BorderRadius.circular(AppSpacing.radiusSmall),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Gross: ${CurrencyFormatter.format(offer.grossValue)}', style: AppTypography.labelSmall),
                    if (offer.estimatedTotalCost != null)
                      Text(
                        'Costs: — ${CurrencyFormatter.format(offer.estimatedTotalCost)}',
                        style: AppTypography.labelSmall.copyWith(color: AppColors.costDeduction),
                      ),
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text('Net In Hand (NFR)', style: AppTypography.labelSmall.copyWith(fontWeight: FontWeight.bold)),
                    Text(
                      CurrencyFormatter.format(offer.estimatedNfr ?? offer.grossValue),
                      style: AppTypography.headlineMedium.copyWith(
                        color: isRecommended ? AppColors.nfrHighlight : AppColors.textPrimary,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.s8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Terms: ${offer.deliveryTerms}',
                style: AppTypography.labelSmall.copyWith(color: AppColors.textSecondary),
              ),
              Text(
                'Expires: ${DateFormatter.formatDate(offer.expiresAt)}',
                style: AppTypography.labelSmall.copyWith(color: AppColors.error),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
