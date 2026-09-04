import 'package:flutter/material.dart';
import '../../core/constants/app_constants.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';

enum DataMode { live, cached, demo }

class DemoBadge extends StatelessWidget {
  final String? text;
  final bool isBanner;

  const DemoBadge({
    Key? key,
    this.text,
    this.isBanner = false,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final displayText = text ?? AppConstants.demoWarningText;

    if (isBanner) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.s12,
          vertical: AppSpacing.s8,
        ),
        decoration: BoxDecoration(
          color: AppColors.demoBadgeBackground,
          border: const Border(
            bottom: BorderSide(color: AppColors.demoBadgeBorder, width: 1.0),
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.science_outlined,
              size: 16,
              color: AppColors.demoBadgeText,
            ),
            const SizedBox(width: AppSpacing.s8),
            Flexible(
              child: Text(
                displayText,
                style: AppTypography.labelMedium.copyWith(
                  color: AppColors.demoBadgeText,
                  fontWeight: FontWeight.w700,
                  fontSize: 12,
                ),
                textAlign: TextAlign.center,
              ),
            ),
          ],
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.s8,
        vertical: AppSpacing.s4,
      ),
      decoration: BoxDecoration(
        color: AppColors.demoBadgeBackground,
        borderRadius: BorderRadius.circular(AppSpacing.radiusSmall),
        border: Border.all(color: AppColors.demoBadgeBorder, width: 1.0),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(
            Icons.info_outline,
            size: 12,
            color: AppColors.demoBadgeText,
          ),
          const SizedBox(width: AppSpacing.s4),
          Text(
            'DEMO',
            style: AppTypography.labelSmall.copyWith(
              color: AppColors.demoBadgeText,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }
}

class ModeBadge extends StatelessWidget {
  final String dataMode; // 'LIVE', 'CACHED', 'DEMO'

  const ModeBadge({
    Key? key,
    required this.dataMode,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    Color bg;
    Color fg;
    String label;
    IconData icon;

    switch (dataMode.toUpperCase()) {
      case 'LIVE':
        bg = AppColors.liveBadgeBackground;
        fg = AppColors.liveBadgeText;
        label = 'LIVE';
        icon = Icons.sensors;
        break;
      case 'CACHED':
        bg = AppColors.cachedBadgeBackground;
        fg = AppColors.cachedBadgeText;
        label = 'CACHED';
        icon = Icons.history;
        break;
      case 'DEMO':
      default:
        bg = AppColors.demoBadgeBackground;
        fg = AppColors.demoBadgeText;
        label = 'DEMO';
        icon = Icons.science_outlined;
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.s8,
        vertical: AppSpacing.s4,
      ),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(AppSpacing.radiusSmall),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: fg),
          const SizedBox(width: AppSpacing.s4),
          Text(
            label,
            style: AppTypography.labelSmall.copyWith(
              color: fg,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}
