import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';

class StatusChip extends StatelessWidget {
  final String status;
  final String? customLabel;

  const StatusChip({
    Key? key,
    required this.status,
    this.customLabel,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    Color bg;
    Color fg;
    String label = customLabel ?? status;

    switch (status.toUpperCase()) {
      case 'ACTIVE':
      case 'CONFIRMED':
      case 'PAID':
      case 'COMPLETED':
      case 'RESOLVED':
        bg = AppColors.successContainer;
        fg = AppColors.success;
        break;
      case 'PENDING':
      case 'UNDER_REVIEW':
      case 'PICKUP_SCHEDULED':
      case 'PROCESSING':
        bg = AppColors.warningContainer;
        fg = AppColors.warning;
        break;
      case 'IN_TRANSIT':
        bg = AppColors.infoContainer;
        fg = AppColors.info;
        break;
      case 'CANCELLED':
      case 'REJECTED':
      case 'DISPUTED':
      case 'FAILED':
      case 'EXPIRED':
        bg = AppColors.errorContainer;
        fg = AppColors.error;
        break;
      case 'DRAFT':
      default:
        bg = AppColors.surfaceVariant;
        fg = AppColors.textSecondary;
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
      child: Text(
        label,
        style: AppTypography.labelSmall.copyWith(
          color: fg,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}
