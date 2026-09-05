import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../core/utils/currency_formatter.dart';
import '../../models/recommendation.dart';
import '../../l10n/app_localizations.dart';

class ComparisonCallout extends StatelessWidget {
  final Recommendation rank1;
  final Recommendation rank2;

  const ComparisonCallout({
    Key? key,
    required this.rank1,
    required this.rank2,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final benefit = rank1.estimatedNetFarmerRealization - rank2.estimatedNetFarmerRealization;
    final l10n = AppLocalizations.of(context);

    return Container(
      padding: const EdgeInsets.all(AppSpacing.s16),
      decoration: BoxDecoration(
        color: AppColors.primaryContainer,
        borderRadius: BorderRadius.circular(AppSpacing.radiusMedium),
        border: Border.all(color: AppColors.primaryLight.withOpacity(0.5), width: 1.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(
                Icons.savings_outlined,
                color: AppColors.primary,
                size: 28,
              ),
              const SizedBox(width: AppSpacing.s12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      l10n.youEarnMoreHeadline(CurrencyFormatter.format(benefit)),
                      style: AppTypography.headlineLarge.copyWith(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w800,
                        fontSize: 20,
                      ),
                    ),
                    Text(
                      'with ${rank1.candidateName.split('(').first.trim()} vs ${rank2.candidateName.split('(').first.trim()}',
                      style: AppTypography.labelSmall.copyWith(
                        color: AppColors.textSecondary,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.s12),
          const Divider(height: 1, color: AppColors.border),
          const SizedBox(height: AppSpacing.s12),

          // Side-by-side quick comparison table
          LayoutBuilder(builder: (context, constraints) {
            final width = constraints.maxWidth < 440 ? constraints.maxWidth : (constraints.maxWidth - AppSpacing.s12) / 2;
            return Wrap(spacing: AppSpacing.s12, runSpacing: AppSpacing.s12, children: [
              SizedBox(width: width,
                child: _buildEntityMiniBox(
                  l10n: l10n,
                  entityName: rank1.candidateName,
                  headlinePrice: CurrencyFormatter.format(rank1.estimatedUnitPricePerKg),
                  grossValue: CurrencyFormatter.format(rank1.estimatedGrossSellingValue),
                  deductions: '— ${CurrencyFormatter.format(rank1.estimatedTotalApplicableCost)}',
                  nfrValue: CurrencyFormatter.format(rank1.estimatedNetFarmerRealization),
                  isRecommended: true,
                ),
              ),
              SizedBox(width: width,
                child: _buildEntityMiniBox(
                  l10n: l10n,
                  entityName: rank2.candidateName,
                  headlinePrice: CurrencyFormatter.format(rank2.estimatedUnitPricePerKg),
                  grossValue: CurrencyFormatter.format(rank2.estimatedGrossSellingValue),
                  deductions: '— ${CurrencyFormatter.format(rank2.estimatedTotalApplicableCost)}',
                  nfrValue: CurrencyFormatter.format(rank2.estimatedNetFarmerRealization),
                  isRecommended: false,
                ),
              ),
            ]);
          }),

          const SizedBox(height: AppSpacing.s12),
          Text(
            rank1.explanationText,
            style: AppTypography.bodyMedium.copyWith(
              color: AppColors.textPrimary,
              fontWeight: FontWeight.w500,
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEntityMiniBox({
    required AppLocalizations l10n,
    required String entityName,
    required String headlinePrice,
    required String grossValue,
    required String deductions,
    required String nfrValue,
    required bool isRecommended,
  }) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.s12),
      decoration: BoxDecoration(
        color: isRecommended ? Colors.white : AppColors.surfaceVariant,
        borderRadius: BorderRadius.circular(AppSpacing.radiusSmall),
        border: Border.all(
          color: isRecommended ? AppColors.primary : AppColors.border,
          width: isRecommended ? 1.5 : 1.0,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            entityName,
            style: AppTypography.labelLarge.copyWith(
              fontSize: 14,
              color: isRecommended ? AppColors.primary : AppColors.textPrimary,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: AppSpacing.s4),
          Text('$headlinePrice/kg', style: AppTypography.labelSmall),
          Text('${l10n.grossSellingValue}: $grossValue', style: AppTypography.labelSmall),
          Text('${l10n.totalDeductions}: $deductions',
              style: AppTypography.labelSmall.copyWith(color: AppColors.costDeduction)),
          const SizedBox(height: AppSpacing.s6),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: AppSpacing.s4, horizontal: AppSpacing.s6),
            decoration: BoxDecoration(
              color: isRecommended ? AppColors.nfrContainer : AppColors.borderSubtle,
              borderRadius: BorderRadius.circular(AppSpacing.radiusSmall),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(l10n.netFarmerRealization, style: AppTypography.labelSmall.copyWith(fontSize: 10)),
                Text(
                  nfrValue,
                  style: AppTypography.labelLarge.copyWith(
                    fontWeight: FontWeight.w800,
                    color: isRecommended ? AppColors.nfrHighlight : AppColors.textPrimary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
