import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/utils/currency_formatter.dart';
import '../../../core/utils/date_formatter.dart';
import '../../../l10n/app_localizations.dart';
import '../../../models/price_prediction.dart';
import '../../../state/recommendation_provider.dart';
import '../../widgets/app_card.dart';
import '../../widgets/demo_badge.dart';
import '../../widgets/network_state_views.dart';

class PricePredictionScreen extends StatelessWidget {
  const PricePredictionScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final recoState = context.watch<RecommendationProvider>();
    final prediction = recoState.prediction;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(
          l10n.pricePredictionTitle,
          style: AppTypography.headlineLarge.copyWith(fontWeight: FontWeight.w800),
        ),
        actions: [
          if (prediction?.dataMode == 'DEMO') const Padding(
            padding: EdgeInsets.only(right: 16.0),
            child: DemoBadge(),
          ),
        ],
      ),
      body: recoState.isLoading
          ? const LoadingStateView()
          : prediction == null || !prediction.hasValidPrediction
              ? _buildInsufficientDataState(prediction, l10n)
              : _buildPredictionContent(prediction, l10n),
    );
  }

  Widget _buildPredictionContent(PricePrediction prediction, AppLocalizations l10n) {
    return ListView(
      padding: const EdgeInsets.all(AppSpacing.s16),
      children: [
        // Headline Recommendation (Sell Now / Wait)
        Container(
          padding: const EdgeInsets.all(AppSpacing.s16),
          decoration: BoxDecoration(
            color: prediction.isSellNow ? AppColors.primaryContainer : AppColors.secondaryContainer,
            borderRadius: BorderRadius.circular(AppSpacing.radiusMedium),
            border: Border.all(
              color: prediction.isSellNow ? AppColors.primaryLight : AppColors.secondary,
              width: 1.5,
            ),
          ),
          child: Row(
            children: [
              Icon(
                prediction.isSellNow ? Icons.flash_on : Icons.hourglass_top,
                size: 32,
                color: prediction.isSellNow ? AppColors.primary : AppColors.secondary,
              ),
              const SizedBox(width: AppSpacing.s12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      prediction.isSellNow ? 'Signal: SELL NOW (तुरंत बेचें)' : 'Signal: WAIT FOR PEAK (प्रतीक्षा करें)',
                      style: AppTypography.headlineMedium.copyWith(
                        color: prediction.isSellNow ? AppColors.primary : Colors.black87,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    Text(
                      'Best net farmer realization is attainable today via direct buyer matching.',
                      style: AppTypography.bodyMedium.copyWith(fontSize: 13),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.s16),

        // Forecast Box Card
        AppCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '3-Day Price Forecast (टमाटर भाव)',
                    style: AppTypography.headlineMedium.copyWith(fontWeight: FontWeight.w700),
                  ),
                  _buildTrendBadge(prediction.trend),
                ],
              ),
              const SizedBox(height: AppSpacing.s16),

              // Predicted Modal Price & Range
              Row(
                crossAxisAlignment: CrossAxisAlignment.baseline,
                textBaseline: TextBaseline.alphabetic,
                children: [
                  Text(
                    prediction.predictedPrice != null
                        ? CurrencyFormatter.formatRate(prediction.predictedPrice!, showDecimals: true)
                        : 'N/A',
                    style: AppTypography.displayLarge.copyWith(
                      color: AppColors.primary,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(width: AppSpacing.s12),
                  Text(
                    prediction.minPriceRange != null && prediction.maxPriceRange != null
                        ? 'Range: ${CurrencyFormatter.format(prediction.minPriceRange!)} — ${CurrencyFormatter.format(prediction.maxPriceRange!)}'
                        : 'Range: N/A',
                    style: AppTypography.bodyLarge.copyWith(fontWeight: FontWeight.w600),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.s12),
              const Divider(),
              const SizedBox(height: AppSpacing.s8),

              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _buildStatRow('Horizon', '${prediction.horizonDays} Days'),
                  _buildStatRow(
                    'Confidence',
                    prediction.confidence != null ? '${(prediction.confidence! * 100).toInt()}%' : 'N/A',
                  ),
                  _buildStatRow('Calculated', DateFormatter.formatTime(prediction.calculatedAt)),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.s16),

        // Key Market Drivers & Explanations
        if (prediction.explanationReasons.isNotEmpty) ...[
          Text('Key Forecast Drivers', style: AppTypography.headlineMedium),
          const SizedBox(height: AppSpacing.s8),
          ...prediction.explanationReasons.map((reason) {
            return Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.s8),
              child: AppCard(
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.analytics_outlined, color: AppColors.primary, size: 20),
                    const SizedBox(width: AppSpacing.s12),
                    Expanded(
                      child: Text(
                        reason,
                        style: AppTypography.bodyMedium.copyWith(fontWeight: FontWeight.w500),
                      ),
                    ),
                  ],
                ),
              ),
            );
          }),
          const SizedBox(height: AppSpacing.s12),
        ],

        // Transparency Disclaimer
        Container(
          padding: const EdgeInsets.all(AppSpacing.s12),
          decoration: BoxDecoration(
            color: AppColors.surfaceVariant,
            borderRadius: BorderRadius.circular(AppSpacing.radiusSmall),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(Icons.shield_outlined, size: 18, color: AppColors.textSecondary),
              const SizedBox(width: AppSpacing.s8),
              Expanded(
                child: Text(
                  'Predictions are advisory estimates derived from historical APMC arrivals and seasonal price models. They do not constitute guaranteed trading contracts.',
                  style: AppTypography.labelSmall.copyWith(color: AppColors.textSecondary),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildInsufficientDataState(PricePrediction? prediction, AppLocalizations l10n) {
    return Padding(
      padding: const EdgeInsets.all(AppSpacing.s24),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.insights_outlined, size: 64, color: AppColors.textTertiary),
            const SizedBox(height: AppSpacing.s16),
            Text(
              l10n.insufficientDataTitle,
              style: AppTypography.headlineLarge.copyWith(fontWeight: FontWeight.w700),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: AppSpacing.s8),
            Text(
              prediction?.warnings.firstOrNull ?? l10n.insufficientDataDesc,
              style: AppTypography.bodyMedium.copyWith(color: AppColors.textSecondary),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTrendBadge(PredictionTrend trend) {
    Color bg;
    Color fg;
    IconData icon;
    String text;

    switch (trend) {
      case PredictionTrend.rising:
        bg = AppColors.successContainer;
        fg = AppColors.success;
        icon = Icons.trending_up;
        text = 'RISING';
        break;
      case PredictionTrend.falling:
        bg = AppColors.errorContainer;
        fg = AppColors.error;
        icon = Icons.trending_down;
        text = 'FALLING';
        break;
      case PredictionTrend.stable:
      default:
        bg = AppColors.primaryContainer;
        fg = AppColors.primary;
        icon = Icons.trending_flat;
        text = 'STABLE';
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.s8, vertical: AppSpacing.s4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(AppSpacing.radiusSmall),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: fg),
          const SizedBox(width: AppSpacing.s4),
          Text(
            text,
            style: AppTypography.labelSmall.copyWith(
              color: fg,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatRow(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: AppTypography.labelSmall.copyWith(color: AppColors.textTertiary)),
        const SizedBox(height: AppSpacing.s2),
        Text(value, style: AppTypography.bodyMedium.copyWith(fontWeight: FontWeight.w700)),
      ],
    );
  }
}
