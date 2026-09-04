import 'app_localizations.dart';

class AppLocalizationsEn implements AppLocalizations {
  @override
  String get appName => 'AgriNexis';
  @override
  String get appTagline => 'Not Just the Best Price. The Best Decision.';
  @override
  String get navHome => 'Home';
  @override
  String get navMarkets => 'Markets';
  @override
  String get navSell => 'Sell';
  @override
  String get navOrders => 'Orders';
  @override
  String get navProfile => 'Profile';

  @override
  String get demoDataWarning => 'DEMO DATA — NOT LIVE GOVERNMENT DATA';
  @override
  String get liveBadge => 'LIVE';
  @override
  String get cachedBadge => 'CACHED';
  @override
  String get demoBadge => 'DEMO';

  @override
  String get greetingFarmer => 'Namaste, Rahul';
  @override
  String get greetingSubtext => 'What should you do with your crop today?';
  @override
  String get sellProduceCta => 'Sell Produce';
  @override
  String get activeListingTitle => 'Active Crop Listing';
  @override
  String get bestRecommendationTitle => 'Best Decision For You';
  @override
  String get bestRecommendationSub => 'Optimized for Net Cash in Hand';
  @override
  String get marketPulseTitle => 'Nearby Mandi Prices';
  @override
  String get recentOrdersTitle => 'Active Deliveries & Orders';
  @override
  String get viewAll => 'View All';

  @override
  String get createListingTitle => 'List Your Produce';
  @override
  String get stepCrop => 'Crop';
  @override
  String get stepDetails => 'Quantity & Dates';
  @override
  String get stepQuality => 'Quality';
  @override
  String get stepReview => 'Review';
  @override
  String get selectCropLabel => 'Select Crop';
  @override
  String get selectVarietyLabel => 'Select Variety';
  @override
  String get quantityLabel => 'Total Quantity (kg)';
  @override
  String get harvestDateLabel => 'Harvest Date';
  @override
  String get availableFromLabel => 'Available From';
  @override
  String get availableUntilLabel => 'Available Until';
  @override
  String get districtLabel => 'District';
  @override
  String get stateLabel => 'State';
  @override
  String get postalAreaLabel => 'Village / Postal Area';
  @override
  String get declaredGradeLabel => 'Declared Quality Grade';
  @override
  String get uploadPhotoPlaceholder => 'Tap to Add Crop Photo (Optional AI Quality Check)';
  @override
  String get reviewAndPublish => 'Review Listing Details';
  @override
  String get publishListingCta => 'Publish Listing';
  @override
  String get listingCreatedSuccess => 'Listing created successfully!';

  @override
  String get mandiPricesTitle => 'Market Prices';
  @override
  String get observedMarketPrice => 'Observed Market Price';
  @override
  String get predictedPrice => 'Predicted Future Price';
  @override
  String get modalPrice => 'Modal Price';
  @override
  String get minMaxPrice => 'Min - Max Range';
  @override
  String get arrivals => 'Arrivals';
  @override
  String get observedAt => 'Observed';
  @override
  String get priceTrend => 'Price Trend';

  @override
  String get pricePredictionTitle => 'Price Forecast';
  @override
  String get forecastHorizon => 'Forecast Horizon';
  @override
  String get confidenceLevel => 'Model Confidence';
  @override
  String get trendRising => 'Rising';
  @override
  String get trendFalling => 'Falling';
  @override
  String get trendStable => 'Stable';
  @override
  String get insufficientDataTitle => 'Forecast Unavailable';
  @override
  String get insufficientDataDesc => 'Insufficient market arrivals history to generate a reliable price forecast.';
  @override
  String get predictionDisclaimer => 'Price predictions are advisory and based on historical market trends.';

  @override
  String get netFarmerRealization => 'Net Farmer Realization (NFR)';
  @override
  String get grossSellingValue => 'Gross Selling Price';
  @override
  String get transportationCost => 'Transportation Cost';
  @override
  String get storageCost => 'Storage Cost';
  @override
  String get handlingCost => 'Loading & Handling';
  @override
  String get otherCosts => 'Market Cess / Other';
  @override
  String get totalDeductions => 'Total Cost Deductions';
  @override
  String youEarnMoreHeadline(String amount) => 'You earn $amount more';
  @override
  String get whyThisDecision => 'Why this recommendation?';
  @override
  String get acceptOfferCta => 'Accept Recommended Offer';
  @override
  String get acceptConfirmationTitle => 'Confirm Offer Acceptance';
  @override
  String get verifiedBuyerBadge => 'Verified Buyer';

  @override
  String get pendingOffersTitle => 'Buyer Offers';
  @override
  String get offerDetailsTitle => 'Offer Details';
  @override
  String get acceptOfferButton => 'Accept Offer';
  @override
  String get rejectOfferButton => 'Reject';
  @override
  String get offerExpiresIn => 'Expires';
  @override
  String get orderTimelineTitle => 'Delivery Timeline';
  @override
  String get orderFinancialSnapshot => 'Agreed Financial Snapshot';
  @override
  String get paymentStatusTitle => 'Payment Status';

  @override
  String get grievancesTitle => 'Support & Grievances';
  @override
  String get raiseGrievanceCta => 'Raise New Grievance';
  @override
  String get grievanceCategoryLabel => 'Issue Category';
  @override
  String get grievanceDescriptionLabel => 'Describe your issue in detail';
  @override
  String get submitGrievanceButton => 'Submit Grievance';
  @override
  String get grievanceSubmittedSuccess => 'Grievance submitted. Our support team is reviewing it.';

  @override
  String get farmerProfileTitle => 'Farmer Profile';
  @override
  String get languageSelectionTitle => 'Choose Language (भाषा)';
  @override
  String get locationDetailsTitle => 'Farm Location';
  @override
  String get farmSummaryTitle => 'Farm Overview';
  @override
  String get appVersion => 'AgriNexis Version 1.0 (SIH 2026)';

  @override
  String get loading => 'Loading...';
  @override
  String get retry => 'Retry';
  @override
  String get errorOccurred => 'An error occurred. Please try again.';
  @override
  String get offlineBanner => 'You are in Offline Mode. Showing cached data.';
  @override
  String get noDataFound => 'No records found.';
}
