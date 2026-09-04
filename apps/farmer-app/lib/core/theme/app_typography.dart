import 'package:flutter/material.dart';
import 'app_colors.dart';

class AppTypography {
  // Display Large - Primary Highlight Metrics (e.g. ₹28,750 NFR)
  static const TextStyle displayLarge = TextStyle(
    fontSize: 32,
    fontWeight: FontWeight.w700,
    letterSpacing: -0.5,
    height: 1.25,
    color: AppColors.textPrimary,
  );

  // Display Medium - Secondary Screen Headlines
  static const TextStyle displayMedium = TextStyle(
    fontSize: 26,
    fontWeight: FontWeight.w700,
    letterSpacing: -0.25,
    height: 1.3,
    color: AppColors.textPrimary,
  );

  // Headline Large - Card Titles, Section Headers
  static const TextStyle headlineLarge = TextStyle(
    fontSize: 22,
    fontWeight: FontWeight.w600,
    letterSpacing: 0,
    height: 1.35,
    color: AppColors.textPrimary,
  );

  // Headline Medium - Sub-card titles, Dialog titles
  static const TextStyle headlineMedium = TextStyle(
    fontSize: 18,
    fontWeight: FontWeight.w600,
    letterSpacing: 0.15,
    height: 1.4,
    color: AppColors.textPrimary,
  );

  // Body Large - Base Farmer Reading Text (At least 16px per design system)
  static const TextStyle bodyLarge = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.w400,
    letterSpacing: 0.15,
    height: 1.5,
    color: AppColors.textPrimary,
  );

  // Body Medium - Regular details, instructions
  static const TextStyle bodyMedium = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.w400,
    letterSpacing: 0.25,
    height: 1.45,
    color: AppColors.textSecondary,
  );

  // Label Large - Button text, primary interactive labels
  static const TextStyle labelLarge = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.w600,
    letterSpacing: 0.5,
    height: 1.25,
    color: AppColors.textPrimary,
  );

  // Label Medium - Chips, Badges, Tab headers
  static const TextStyle labelMedium = TextStyle(
    fontSize: 13,
    fontWeight: FontWeight.w600,
    letterSpacing: 0.4,
    height: 1.25,
    color: AppColors.textPrimary,
  );

  // Label Small - Provenance timestamps, disclaimers
  static const TextStyle labelSmall = TextStyle(
    fontSize: 11,
    fontWeight: FontWeight.w500,
    letterSpacing: 0.5,
    height: 1.3,
    color: AppColors.textTertiary,
  );
}
