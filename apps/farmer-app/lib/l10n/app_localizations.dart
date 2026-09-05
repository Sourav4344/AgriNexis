import 'package:flutter/material.dart';
import 'app_localizations_en.dart';
import 'app_localizations_hi.dart';
import 'app_localizations_mr.dart';

abstract class AppLocalizations {
  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations) ??
        AppLocalizationsEn();
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  static const List<Locale> supportedLocales = [
    Locale('en'),
    Locale('hi'),
    Locale('mr'),
  ];

  // Core & Navigation
  String get appName;
  String get appTagline;
  String get navHome;
  String get navMarkets;
  String get navSell;
  String get navOrders;
  String get navProfile;

  // Demo & Badges
  String get demoDataWarning;
  String get liveBadge;
  String get cachedBadge;
  String get demoBadge;

  // Home Dashboard
  String get greetingFarmer;
  String get greetingSubtext;
  String get sellProduceCta;
  String get activeListingTitle;
  String get bestRecommendationTitle;
  String get bestRecommendationSub;
  String get marketPulseTitle;
  String get recentOrdersTitle;
  String get viewAll;

  // Sell Flow
  String get createListingTitle;
  String get stepCrop;
  String get stepDetails;
  String get stepQuality;
  String get stepReview;
  String get selectCropLabel;
  String get selectVarietyLabel;
  String get quantityLabel;
  String get harvestDateLabel;
  String get availableFromLabel;
  String get availableUntilLabel;
  String get districtLabel;
  String get stateLabel;
  String get postalAreaLabel;
  String get declaredGradeLabel;
  String get uploadPhotoPlaceholder;
  String get reviewAndPublish;
  String get publishListingCta;
  String get listingCreatedSuccess;

  // Markets & Discovery
  String get mandiPricesTitle;
  String get observedMarketPrice;
  String get predictedPrice;
  String get modalPrice;
  String get minMaxPrice;
  String get arrivals;
  String get observedAt;
  String get priceTrend;

  // Prediction UI
  String get pricePredictionTitle;
  String get forecastHorizon;
  String get confidenceLevel;
  String get trendRising;
  String get trendFalling;
  String get trendStable;
  String get insufficientDataTitle;
  String get insufficientDataDesc;
  String get predictionDisclaimer;

  // NFR & Best Decision (Signature)
  String get netFarmerRealization;
  String get grossSellingValue;
  String get transportationCost;
  String get storageCost;
  String get handlingCost;
  String get otherCosts;
  String get totalDeductions;
  String youEarnMoreHeadline(String amount);
  String get whyThisDecision;
  String get acceptOfferCta;
  String get acceptConfirmationTitle;
  String get verifiedBuyerBadge;

  // Offers & Orders
  String get pendingOffersTitle;
  String get offerDetailsTitle;
  String get acceptOfferButton;
  String get rejectOfferButton;
  String get offerExpiresIn;
  String get orderTimelineTitle;
  String get orderFinancialSnapshot;
  String get paymentStatusTitle;

  // Grievances
  String get grievancesTitle;
  String get raiseGrievanceCta;
  String get grievanceCategoryLabel;
  String get grievanceDescriptionLabel;
  String get submitGrievanceButton;
  String get grievanceSubmittedSuccess;

  // Profile & Settings
  String get farmerProfileTitle;
  String get languageSelectionTitle;
  String get locationDetailsTitle;
  String get farmSummaryTitle;
  String get appVersion;

  // Common Network States
  String get loading;
  String get retry;
  String get errorOccurred;
  String get offlineBanner;
  String get noDataFound;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  bool isSupported(Locale locale) =>
      ['en', 'hi', 'mr'].contains(locale.languageCode);

  @override
  Future<AppLocalizations> load(Locale locale) async {
    switch (locale.languageCode) {
      case 'hi':
        return AppLocalizationsHi();
      case 'mr':
        return AppLocalizationsMr();
      case 'en':
      default:
        return AppLocalizationsEn();
    }
  }

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}
