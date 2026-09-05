import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/utils/currency_formatter.dart';
import '../../../core/utils/date_formatter.dart';
import '../../../l10n/app_localizations.dart';
import '../../../models/offer.dart';
import '../../../models/recommendation.dart';
import '../../../state/offer_provider.dart';
import '../../widgets/app_button.dart';
import '../../widgets/app_card.dart';
import '../../widgets/demo_badge.dart';
import '../orders/order_detail_screen.dart';

class RecommendationDetailScreen extends StatelessWidget {
  final Recommendation recommendation;

  const RecommendationDetailScreen({Key? key, required this.recommendation}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final offerState = context.watch<OfferProvider>();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(
          'Decision Details',
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
          // Highlight NFR Container
          Container(
            padding: const EdgeInsets.all(AppSpacing.s20),
            decoration: BoxDecoration(
              color: recommendation.isBestOption ? AppColors.nfrContainer : AppColors.surfaceVariant,
              borderRadius: BorderRadius.circular(AppSpacing.radiusMedium),
              border: Border.all(
                color: recommendation.isBestOption ? AppColors.nfrHighlight : AppColors.border,
                width: 2.0,
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Expected Net Farmer Realization (NFR)',
                  style: AppTypography.labelLarge.copyWith(
                    color: recommendation.isBestOption ? AppColors.nfrHighlight : AppColors.textPrimary,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: AppSpacing.s4),
                Text(
                  CurrencyFormatter.format(recommendation.estimatedNetFarmerRealization),
                  style: AppTypography.displayLarge.copyWith(
                    color: recommendation.isBestOption ? AppColors.nfrHighlight : AppColors.textPrimary,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                Text(
                  '${CurrencyFormatter.formatRate(recommendation.netPerKg, showDecimals: true)} in-hand for ${CurrencyFormatter.formatQuantity(recommendation.estimatedQuantityKg)}',
                  style: AppTypography.bodyMedium.copyWith(fontWeight: FontWeight.w600),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.s16),

          // Buyer Profile Card
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Buyer & Procurement Details', style: AppTypography.headlineMedium),
                const SizedBox(height: AppSpacing.s12),
                _buildRow('Candidate Buyer', recommendation.candidateName),
                _buildRow('Verification Status', recommendation.buyerVerificationStatus ?? 'VERIFIED'),
                if (recommendation.distanceKm != null)
                  _buildRow('Farmgate Distance', '${recommendation.distanceKm!.toStringAsFixed(0)} km'),
                _buildRow('Calculation Validity', 'Valid until ${DateFormatter.formatDateTime(recommendation.expiresAt)}'),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.s16),

          // Itemized Deductions & Quotes
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Itemized Cost Breakdown', style: AppTypography.headlineMedium),
                const SizedBox(height: AppSpacing.s12),
                _buildRow(
                  'Offered Unit Price (Gross)',
                  '${CurrencyFormatter.formatRate(recommendation.estimatedUnitPricePerKg)} (${CurrencyFormatter.format(recommendation.estimatedGrossSellingValue)})',
                  isBold: true,
                ),
                const Divider(),
                _buildRow(
                  '— Transportation Cost',
                  '— ${CurrencyFormatter.format(recommendation.estimatedTransportationCost)}',
                  isDeduction: true,
                ),
                _buildRow(
                  '— Storage Cost',
                  '— ${CurrencyFormatter.format(recommendation.estimatedStorageCost)}',
                  isDeduction: true,
                ),
                _buildRow(
                  '— Handling / Labor Cost',
                  '— ${CurrencyFormatter.format(recommendation.estimatedHandlingCost)}',
                  isDeduction: true,
                ),
                _buildRow(
                  '— Other Applicable Cost',
                  '— ${CurrencyFormatter.format(recommendation.estimatedOtherApplicableCost)}',
                  isDeduction: true,
                ),
                const Divider(),
                _buildRow(
                  'Total Cost Deductions',
                  '— ${CurrencyFormatter.format(recommendation.estimatedTotalApplicableCost)}',
                  isBold: true,
                  isDeduction: true,
                ),
                const Divider(),
                _buildRow(
                  'Net Farmer Realization (NFR)',
                  CurrencyFormatter.format(recommendation.estimatedNetFarmerRealization),
                  isBold: true,
                  isPrimary: true,
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.s24),

          // Accept Offer Action Button
          AppButton(
            label: l10n.acceptOfferCta,
            icon: Icons.check_circle_outline,
            isLoading: offerState.isActionProcessing,
            onPressed: () => _confirmAcceptOffer(context, offerState),
          ),
        ],
      ),
    );
  }

  Widget _buildRow(String label, String value, {bool isBold = false, bool isDeduction = false, bool isPrimary = false}) {
    Color valColor = AppColors.textPrimary;
    if (isDeduction) valColor = AppColors.costDeduction;
    if (isPrimary) valColor = AppColors.primary;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.s6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: AppTypography.bodyMedium.copyWith(
              color: AppColors.textSecondary,
              fontWeight: isBold ? FontWeight.w700 : FontWeight.w400,
            ),
          ),
          Flexible(
            child: Text(
              value,
              style: AppTypography.bodyLarge.copyWith(
                fontWeight: isBold ? FontWeight.w800 : FontWeight.w600,
                color: valColor,
              ),
              textAlign: TextAlign.end,
            ),
          ),
        ],
      ),
    );
  }

  void _confirmAcceptOffer(BuildContext context, OfferProvider offerState) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (bottomSheetContext) {
        return Container(
          padding: const EdgeInsets.all(AppSpacing.s24),
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(AppSpacing.radiusLarge)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Confirm Offer Acceptance',
                style: AppTypography.headlineLarge.copyWith(fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: AppSpacing.s8),
              Text(
                'By accepting this offer, an immutable financial snapshot will be created in the database.',
                style: AppTypography.bodyMedium.copyWith(color: AppColors.textSecondary),
              ),
              const SizedBox(height: AppSpacing.s16),

              Container(
                padding: const EdgeInsets.all(AppSpacing.s16),
                decoration: BoxDecoration(
                  color: AppColors.primaryContainer,
                  borderRadius: BorderRadius.circular(AppSpacing.radiusMedium),
                ),
                child: Column(
                  children: [
                    _buildRow('Agreed Gross', CurrencyFormatter.format(recommendation.estimatedGrossSellingValue)),
                    _buildRow('Total Deductions', '— ${CurrencyFormatter.format(recommendation.estimatedTotalApplicableCost)}', isDeduction: true),
                    const Divider(),
                    _buildRow('Agreed Net Cash (NFR)', CurrencyFormatter.format(recommendation.estimatedNetFarmerRealization), isBold: true, isPrimary: true),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.s24),

              AppButton(
                label: 'Confirm & Create Order',
                icon: Icons.check,
                onPressed: () async {
                  Navigator.pop(bottomSheetContext);

                  // Create offer bound to authoritative recommendation snapshot
                  final offer = Offer(
                    id: '41500000-0000-4000-8000-000000000002',
                    listingId: recommendation.listingId,
                    buyerProfileId: recommendation.candidateBuyerProfileId,
                    buyerName: recommendation.candidateName,
                    offeredQuantity: recommendation.estimatedQuantityKg,
                    unitPrice: recommendation.estimatedUnitPricePerKg,
                    currency: recommendation.currency,
                    deliveryTerms: 'buyer_pickup',
                    expiresAt: recommendation.expiresAt ?? DateTime.now().add(const Duration(days: 1)),
                    logisticsQuoteId: recommendation.logisticsQuoteId,
                    recommendationOptionId: recommendation.id,
                    rawGrossValueString: recommendation.grossSellingValueString,
                    rawTotalCostString: recommendation.totalApplicableCostString,
                    rawNfrString: recommendation.netFarmerRealizationString,
                    rawUnitPriceString: recommendation.unitPriceString,
                    rawQuantityString: recommendation.quantityKgString,
                    estimatedTotalCost: recommendation.estimatedTotalApplicableCost,
                    estimatedNfr: recommendation.estimatedNetFarmerRealization,
                  );

                  final acknowledgedAmounts = recommendation.toAcknowledgedAmounts();

                  final createdOrder = await offerState.acceptOffer(
                    offer: offer,
                    listingVersion: 1,
                    logisticsQuoteId: recommendation.logisticsQuoteId,
                    recommendationOptionId: recommendation.id,
                    amounts: acknowledgedAmounts,
                  );

                  if (context.mounted && createdOrder != null) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        backgroundColor: AppColors.success,
                        content: Text('Offer accepted! Order created with immutable financial snapshot.'),
                      ),
                    );
                    Navigator.pushReplacement(
                      context,
                      MaterialPageRoute(builder: (_) => OrderDetailScreen(order: createdOrder)),
                    );
                  }
                },
              ),
              const SizedBox(height: AppSpacing.s12),
              AppButton(
                label: 'Cancel',
                variant: AppButtonVariant.outlined,
                onPressed: () => Navigator.pop(bottomSheetContext),
              ),
            ],
          ),
        );
      },
    );
  }
}
