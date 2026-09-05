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
import '../../widgets/app_button.dart';
import '../../widgets/app_card.dart';
import '../../widgets/demo_badge.dart';
import '../../widgets/status_chip.dart';
import '../orders/order_detail_screen.dart';

class OfferDetailScreen extends StatelessWidget {
  final Offer offer;

  const OfferDetailScreen({Key? key, required this.offer}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final offerState = context.watch<OfferProvider>();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(
          l10n.offerDetailsTitle,
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
          // Offer Status Header
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      offer.buyerName,
                      style: AppTypography.headlineMedium.copyWith(fontWeight: FontWeight.w700),
                    ),
                    StatusChip(status: offer.status),
                  ],
                ),
                const SizedBox(height: AppSpacing.s8),
                Text(
                  'Offer Expiry: ${DateFormatter.formatDateTime(offer.expiresAt)}',
                  style: AppTypography.bodyMedium.copyWith(
                    color: offer.isExpired ? AppColors.error : AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.s16),

          // Economics Snapshot Card
          AppCard(
            backgroundColor: AppColors.primaryContainer,
            border: const BorderSide(color: AppColors.primaryLight, width: 1.5),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Net Farmer Realization',
                  style: AppTypography.labelLarge.copyWith(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: AppSpacing.s4),
                Text(
                  CurrencyFormatter.format(offer.estimatedNfr ?? offer.grossValue),
                  style: AppTypography.displayLarge.copyWith(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: AppSpacing.s12),
                const Divider(),
                const SizedBox(height: AppSpacing.s8),
                _buildRow('Offered Price (Gross)', '${CurrencyFormatter.formatRate(offer.unitPrice)} (${CurrencyFormatter.format(offer.grossValue)})'),
                if (offer.estimatedTotalCost != null)
                  _buildRow('Applicable Cost Deductions', '— ${CurrencyFormatter.format(offer.estimatedTotalCost!)}', isDeduction: true),
                _buildRow('Offered Quantity', CurrencyFormatter.formatQuantity(offer.offeredQuantity)),
                _buildRow('Delivery Terms', offer.deliveryTerms),
              ],
            ),
          ),
          // Economics Warning if authoritative snapshot is missing
          if (offer.isPending && !offer.hasAuthoritativeEconomics) ...[
            Container(
              padding: const EdgeInsets.all(AppSpacing.s12),
              decoration: BoxDecoration(
                color: AppColors.surfaceVariant,
                borderRadius: BorderRadius.circular(AppSpacing.radiusSmall),
                border: Border.all(color: AppColors.border),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.info_outline, color: AppColors.secondary, size: 20),
                  const SizedBox(width: AppSpacing.s8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'RECOMMENDATION_ECONOMICS_REQUIRED',
                          style: AppTypography.labelMedium.copyWith(
                            fontWeight: FontWeight.w800,
                            color: AppColors.secondary,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Authoritative logistics & NFR economics quote required from AgriNexis recommendation engine. On-device calculation is disabled for transaction safety.',
                          style: AppTypography.labelSmall.copyWith(color: AppColors.textSecondary),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.s16),
          ],

          // Accept / Reject Actions
          if (offer.isPending) ...[
            AppButton(
              label: l10n.acceptOfferButton,
              icon: Icons.check,
              isLoading: offerState.isActionProcessing,
              onPressed: !offer.hasAuthoritativeEconomics
                  ? () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text(
                            'RECOMMENDATION_ECONOMICS_REQUIRED: Please select this buyer via Decision Recommendations to bind authoritative logistics and NFR economics.',
                          ),
                          backgroundColor: AppColors.secondary,
                          duration: Duration(seconds: 4),
                        ),
                      );
                    }
                  : () async {
                      final acknowledgedAmounts = offer.authoritativeAcknowledgedAmounts!;

                      final order = await offerState.acceptOffer(
                        offer: offer,
                        listingVersion: offer.listingVersion,
                        logisticsQuoteId: offer.logisticsQuoteId!,
                        recommendationOptionId: offer.recommendationOptionId,
                        amounts: acknowledgedAmounts,
                      );

                      if (context.mounted && order != null) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            backgroundColor: AppColors.success,
                            content: Text('Offer accepted successfully! Order created.'),
                          ),
                        );
                        Navigator.pushReplacement(
                          context,
                          MaterialPageRoute(builder: (_) => OrderDetailScreen(order: order)),
                        );
                      }
                    },
            ),
            const SizedBox(height: AppSpacing.s12),
            AppButton(
              label: l10n.rejectOfferButton,
              variant: AppButtonVariant.destructive,
              isLoading: offerState.isActionProcessing,
              onPressed: () async {
                final success = await offerState.rejectOffer(offer.id);
                if (context.mounted && success) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Offer rejected.')),
                  );
                  Navigator.pop(context);
                }
              },
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildRow(String label, String value, {bool isDeduction = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.s4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: AppTypography.bodyMedium.copyWith(color: AppColors.textSecondary)),
          Text(
            value,
            style: AppTypography.bodyLarge.copyWith(
              fontWeight: FontWeight.w600,
              color: isDeduction ? AppColors.costDeduction : AppColors.textPrimary,
            ),
          ),
        ],
      ),
    );
  }
}
