import 'package:flutter/material.dart';

class AppColors {
  // Primary Agricultural Green Palette
  static const Color primary = Color(0xFF1B5E20); // Deep forest green
  static const Color primaryLight = Color(0xFF2E7D32);
  static const Color primaryDark = Color(0xFF003300);
  static const Color primaryContainer = Color(0xFFE8F5E9);
  static const Color onPrimary = Colors.white;
  static const Color onPrimaryContainer = Color(0xFF002105);

  // Secondary Accent Palette (Earth / Crop Gold)
  static const Color secondary = Color(0xFFF57F17); // Harvest gold / Amber
  static const Color secondaryContainer = Color(0xFFFFF8E1);
  static const Color onSecondary = Colors.black;

  // Net Farmer Realization (Signature Metric Colors)
  static const Color nfrHighlight = Color(0xFF0D5302); // Bold profit green
  static const Color nfrContainer = Color(0xFFD7F5D3);
  static const Color costDeduction = Color(0xFFB71C1C); // Deduction red
  static const Color costContainer = Color(0xFFFFEBEE);

  // Neutral Background & Surface Palette
  static const Color background = Color(0xFFF9FAF7);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color surfaceVariant = Color(0xFFF0F4EC);
  static const Color border = Color(0xFFDCE2D8);
  static const Color borderSubtle = Color(0xFFE8EDE5);

  // Text Colors (High Contrast WCAG 2.2 AA)
  static const Color textPrimary = Color(0xFF1C1D1A);
  static const Color textSecondary = Color(0xFF49454F);
  static const Color textTertiary = Color(0xFF79747E);

  // Semantic States
  static const Color success = Color(0xFF2E7D32);
  static const Color successContainer = Color(0xFFE8F5E9);
  static const Color warning = Color(0xFFE65100);
  static const Color warningContainer = Color(0xFFFFF3E0);
  static const Color error = Color(0xFFC62828);
  static const Color errorContainer = Color(0xFFFFEBEE);
  static const Color info = Color(0xFF0277BD);
  static const Color infoContainer = Color(0xFFE1F5FE);

  // Demo Badge Special Color
  static const Color demoBadgeBackground = Color(0xFFFFECE0);
  static const Color demoBadgeText = Color(0xFFBF360C);
  static const Color demoBadgeBorder = Color(0xFFFFAB91);

  // Live & Cached Badges
  static const Color liveBadgeBackground = Color(0xFFE8F5E9);
  static const Color liveBadgeText = Color(0xFF1B5E20);
  static const Color cachedBadgeBackground = Color(0xFFEDE7F6);
  static const Color cachedBadgeText = Color(0xFF4527A0);
}
