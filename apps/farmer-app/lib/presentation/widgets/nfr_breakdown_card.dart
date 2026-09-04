import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../core/utils/currency_formatter.dart';
import '../../models/recommendation.dart';
import 'app_card.dart';
import 'demo_badge.dart';

class NfrBreakdownCard extends StatelessWidget {
  final Recommendation recommendation;
  final bool isExpanded;
  final VoidCallback? onAccept;
  final VoidCallback? onTap;

  const NfrBreakdownCard({
    Key? key,
    required this.recommendation,
    this.isExpanded = true,
    this.onAccept,
    this.onTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final isRank1 = recommendation.isBestOption;

    return AppCard(
      onTap: onTap,
      backgroundColor: isRank1 ? AppColors.surface : AppColors.surfaceVariant.withOpacity(0.5),
      border: BorderSide(
        color: isRank1 ? AppColors.primary : AppColors.border,
        width: isRank1 ? 2.0 : 1.0,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header: Rank badge, Buyer Name, Verification Status, Demo Badge
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.s12,
                  vertical: AppSpacing.s6,
                ),
                decoration: BoxDecoration(
                  color: isRank1 ? AppColors.primary : AppColors.textTertiary,
                  borderRadius: BorderRadius.circular(AppSpacing.radiusSmall),
                ),
                child: Text(
                  isRank1 ? '★ BEST DECISION' : 'RANK #${recommendation.rank}',
                  style: AppTypography.labelSmall.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.5,
                  ),
                ),
              ),
              const Spacer(),
              if (recommendation.isDemo) const DemoBadge(),
            ],
          ),
          const SizedBox(height: AppSpacing.s12),

          // Buyer/Entity Name & Distance
          Text(
            recommendation.candidateName,
            style: AppTypography.headlineMedium.copyWith(
              color: AppColors.textPrimary,
              fontWeight: FontWeight.w700,
            ),
          ),
          if (recommendation.distanceKm != null) ...[
            const SizedBox(height: AppSpacing.s4),
            Row(
              children: [
                const Icon(Icons.location_on_outlined, size: 16, color: AppColors.textSecondary),
                const SizedBox(width: AppSpacing.s4),
                Text(
                  '${recommendation.distanceKm!.toStringAsFixed(0)} km away • ${recommendation.buyerVerificationStatus ?? "VERIFIED"}',
                  style: AppTypography.bodyMedium,
                ),
              ],
            ),
          ],
          const SizedBox(height: AppSpacing.s16),

          // Primary Net Farmer Realization (NFR) Box
          Container(
            padding: const EdgeInsets.all(AppSpacing.s16),
            decoration: BoxDecoration(
              color: isRank1 ? AppColors.nfrContainer : AppColors.surfaceVariant,
              borderRadius: BorderRadius.circular(AppSpacing.radiusMedium),
              border: Border.all(
                color: isRank1 ? AppColors.nfrHighlight.withOpacity(0.3) : AppColors.border,
                width: 1.5,
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Net Farmer Realization',
                      style: AppTypography.labelLarge.copyWith(
                        color: isRank1 ? AppColors.nfrHighlight : AppColors.textPrimary,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    Text(
                      '(In Your Hand)',
                      style: AppTypography.labelSmall.copyWith(
                        color: isRank1 ? AppColors.nfrHighlight : AppColors.textSecondary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.s4),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.baseline,
                  textBaseline: TextBaseline.alphabetic,
                  children: [
                    Text(
                      CurrencyFormatter.format(recommendation.estimatedNetFarmerRealization),
                      style: AppTypography.displayLarge.copyWith(
                        color: isRank1 ? AppColors.nfrHighlight : AppColors.textPrimary,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(width: AppSpacing.s8),
                    Text(
                      '(${CurrencyFormatter.formatRate(recommendation.netPerKg, showDecimals: true)} net)',
                      style: AppTypography.bodyLarge.copyWith(
                        color: isRank1 ? AppColors.nfrHighlight : AppColors.textSecondary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.s16),

          // Transparent Deductions Breakdown Table
          Text(
            'Transparent Financial Breakdown',
            style: AppTypography.labelLarge.copyWith(fontSize: 14, color: AppColors.textSecondary),
          ),
          const SizedBox(height: AppSpacing.s8),
          _buildFinancialRow(
            label: 'Offered Price (Gross)',
            rate: '${CurrencyFormatter.format(recommendation.estimatedUnitPricePerKg)}/kg × ${CurrencyFormatter.formatQuantity(recommendation.estimatedQuantityKg)}',
            amount: CurrencyFormatter.format(recommendation.estimatedGrossSellingValue),
            isPositive: true,
          ),
          const Divider(height: 12),
          _buildFinancialRow(
            label: '— Transportation (Logistics)',
            rate: recommendation.distanceKm != null ? '${recommendation.distanceKm!.toStringAsFixed(0)} km trip' : 'Direct transport',
            amount: '— ${CurrencyFormatter.format(recommendation.estimatedTransportationCost)}',
            isDeduction: true,
          ),
          _buildFinancialRow(
            label: '— Storage & Preservation',
            rate: 'Safe holding estimate',
            amount: '— ${CurrencyFormatter.format(recommendation.estimatedStorageCost)}',
            isDeduction: true,
          ),
          _buildFinancialRow(
            label: '— Loading & Handling',
            rate: 'Hamali & farmgate labor',
            amount: '— ${CurrencyFormatter.format(recommendation.estimatedHandlingCost)}',
            isDeduction: true,
          ),
          _buildFinancialRow(
            label: '— Market Cess & Other Deductions',
            rate: 'Platform & APMC cess',
            amount: '— ${CurrencyFormatter.format(recommendation.estimatedOtherApplicableCost)}',
            isDeduction: true,
          ),
          const Divider(height: 16, thickness: 1.5),
          _buildFinancialRow(
            label: 'Total Cost Deductions',
            rate: 'Total expenses',
            amount: '— ${CurrencyFormatter.format(recommendation.estimatedTotalApplicableCost)}',
            isBold: true,
            isDeduction: true,
          ),
          const SizedBox(height: AppSpacing.s16),

          // Why this recommendation reason note
          Container(
            padding: const EdgeInsets.all(AppSpacing.s12),
            decoration: BoxDecoration(
              color: AppColors.surfaceVariant,
              borderRadius: BorderRadius.circular(AppSpacing.radiusSmall),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(
                  isRank1 ? Icons.check_circle_outline : Icons.info_outline,
                  color: isRank1 ? AppColors.primary : AppColors.textSecondary,
                  size: 20,
                ),
                const SizedBox(width: AppSpacing.s8),
                Expanded(
                  child: Text(
                    recommendation.explanationText,
                    style: AppTypography.bodyMedium.copyWith(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFinancialRow({
    required String label,
    required String rate,
    required String amount,
    bool isPositive = false,
    bool isDeduction = false,
    bool isBold = false,
  }) {
    Color amountColor = AppColors.textPrimary;
    if (isPositive) amountColor = AppColors.primary;
    if (isDeduction) amountColor = AppColors.costDeduction;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.s4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: AppTypography.bodyMedium.copyWith(
                    fontWeight: isBold ? FontWeight.w700 : FontWeight.w500,
                    color: AppColors.textPrimary,
                  ),
                ),
                Text(
                  rate,
                  style: AppTypography.labelSmall.copyWith(
                    color: AppColors.textTertiary,
                  ),
                ),
              ],
            ),
          ),
          Text(
            amount,
            style: AppTypography.bodyLarge.copyWith(
              fontWeight: isBold ? FontWeight.w800 : FontWeight.w600,
              color: amountColor,
            ),
          ),
        ],
      ),
    );
  }
}
