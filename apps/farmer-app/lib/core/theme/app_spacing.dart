import 'package:flutter/material.dart';

class AppSpacing {
  // 4px Base Spacing Scale
  static const double s2 = 2.0;
  static const double s4 = 4.0;
  static const double s8 = 8.0;
  static const double s12 = 12.0;
  static const double s16 = 16.0;
  static const double s20 = 20.0;
  static const double s24 = 24.0;
  static const double s32 = 32.0;
  static const double s40 = 40.0;
  static const double s48 = 48.0;

  // Corner Radii
  static const double radiusSmall = 8.0;
  static const double radiusMedium = 12.0;
  static const double radiusLarge = 16.0;
  static const double radiusExtraLarge = 24.0;

  // Touch Targets
  static const double minTouchTarget = 48.0;

  // Common Insets
  static const EdgeInsets screenPadding = EdgeInsets.all(s16);
  static const EdgeInsets cardPadding = EdgeInsets.all(s16);
  static const EdgeInsets dialogPadding = EdgeInsets.all(s20);
  static const EdgeInsets buttonPadding = EdgeInsets.symmetric(horizontal: s24, vertical: s14);
  static const double s14 = 14.0;
}
