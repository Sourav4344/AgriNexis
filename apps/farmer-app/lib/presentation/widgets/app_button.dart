import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';

enum AppButtonVariant { primary, secondary, outlined, destructive }

class AppButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final bool isLoading;
  final IconData? icon;
  final AppButtonVariant variant;
  final double? width;

  const AppButton({
    Key? key,
    required this.label,
    required this.onPressed,
    this.isLoading = false,
    this.icon,
    this.variant = AppButtonVariant.primary,
    this.width,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    Color bg;
    Color fg;
    BorderSide? border;

    switch (variant) {
      case AppButtonVariant.secondary:
        bg = AppColors.secondaryContainer;
        fg = AppColors.onSecondary;
        border = null;
        break;
      case AppButtonVariant.outlined:
        bg = Colors.transparent;
        fg = AppColors.primary;
        border = const BorderSide(color: AppColors.primary, width: 1.5);
        break;
      case AppButtonVariant.destructive:
        bg = AppColors.error;
        fg = Colors.white;
        border = null;
        break;
      case AppButtonVariant.primary:
      default:
        bg = AppColors.primary;
        fg = AppColors.onPrimary;
        border = null;
        break;
    }

    final isEnabled = onPressed != null && !isLoading;

    return SizedBox(
      width: width ?? double.infinity,
      height: AppSpacing.minTouchTarget, // Minimum 48px touch target
      child: ElevatedButton(
        style: ElevatedButton.styleFrom(
          backgroundColor: isEnabled ? bg : AppColors.border,
          foregroundColor: isEnabled ? fg : AppColors.textTertiary,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.s16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppSpacing.radiusMedium),
            side: border ?? BorderSide.none,
          ),
        ),
        onPressed: isEnabled ? onPressed : null,
        child: isLoading
            ? SizedBox(
                width: 22,
                height: 22,
                child: CircularProgressIndicator(
                  strokeWidth: 2.5,
                  valueColor: AlwaysStoppedAnimation<Color>(fg),
                ),
              )
            : Row(
                mainAxisSize: MainAxisSize.min,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  if (icon != null) ...[
                    Icon(icon, size: 20, color: isEnabled ? fg : AppColors.textTertiary),
                    const SizedBox(width: AppSpacing.s8),
                  ],
                  Flexible(
                    child: Text(
                      label,
                      style: AppTypography.labelLarge.copyWith(
                        color: isEnabled ? fg : AppColors.textTertiary,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}
