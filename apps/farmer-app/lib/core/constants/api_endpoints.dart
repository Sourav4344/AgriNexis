class ApiEndpoints {
  static const String defaultBaseUrl = 'http://10.0.2.2:8000/api/v1'; // Android Emulator default
  static const String localhostBaseUrl = 'http://127.0.0.1:8000/api/v1';

  // Profile
  static const String me = '/me';
  static const String farmerProfile = '/farmers';

  // Catalog
  static const String crops = '/crops';
  static String cropVarieties(String cropId) => '/crops/$cropId/varieties';

  // Produce Listings
  static const String listings = '/listings';
  static String listing(String id) => '/listings/$id';
  static String publishListing(String id) => '/listings/$id/publish';
  static String cancelListing(String id) => '/listings/$id/cancel';
  static String listingPrivateLocation(String id) => '/listings/$id/private-location';
  static String listingRecommendations(String id) => '/listings/$id/recommendations';
  static String listingPrediction(String id) => '/listings/$id/prediction';

  // Demands
  static const String demands = '/demands';
  static String demand(String id) => '/demands/$id';

  // Offers
  static const String offers = '/offers';
  static String offer(String id) => '/offers/$id';
  static String acceptOffer(String id) => '/offers/$id/accept';
  static String rejectOffer(String id) => '/offers/$id/reject';
  static String withdrawOffer(String id) => '/offers/$id/withdraw';

  // Orders
  static const String orders = '/orders';
  static String order(String id) => '/orders/$id';
  static String orderHistory(String id) => '/orders/$id/history';
  static String orderTransitions(String id) => '/orders/$id/transitions';
  static String orderPayments(String id) => '/orders/$id/payments';

  // Markets
  static const String markets = '/markets';
  static String market(String id) => '/markets/$id';
  static String marketPrices(String id) => '/markets/$id/prices';
  static const String allMarketPrices = '/market-prices';

  // Recommendations
  static String recommendation(String id) => '/recommendations/$id';

  // Grievances
  static const String grievances = '/grievances';
  static String grievance(String id) => '/grievances/$id';
  static String grievanceMessages(String id) => '/grievances/$id/messages';
}
