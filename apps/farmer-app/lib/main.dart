import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'app.dart';
import 'core/network/api_client.dart';
import 'repositories/auth_repository.dart';
import 'repositories/crop_repository.dart';
import 'repositories/grievance_repository.dart';
import 'repositories/listing_repository.dart';
import 'repositories/market_repository.dart';
import 'repositories/offer_repository.dart';
import 'repositories/order_repository.dart';
import 'repositories/prediction_repository.dart';
import 'repositories/recommendation_repository.dart';
import 'state/app_state_provider.dart';
import 'state/auth_provider.dart';
import 'state/grievance_provider.dart';
import 'state/listing_provider.dart';
import 'state/market_provider.dart';
import 'state/offer_provider.dart';
import 'state/order_provider.dart';
import 'state/recommendation_provider.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();

  // Core API client
  final apiClient = ApiClient();

  // Repositories
  final authRepository = ApiAuthRepository(apiClient: apiClient);
  final cropRepository = ApiCropRepository(apiClient: apiClient);
  final listingRepository = ApiListingRepository(apiClient: apiClient);
  final marketRepository = ApiMarketRepository(apiClient: apiClient);
  final predictionRepository = ApiPredictionRepository(apiClient: apiClient);
  final recommendationRepository = ApiRecommendationRepository(apiClient: apiClient);
  final offerRepository = ApiOfferRepository(apiClient: apiClient);
  final orderRepository = ApiOrderRepository(apiClient: apiClient);
  final grievanceRepository = ApiGrievanceRepository(apiClient: apiClient);

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AppStateProvider()),
        ChangeNotifierProvider(create: (_) => AuthProvider(repository: authRepository)),
        ChangeNotifierProvider(
          create: (_) => ListingProvider(
            listingRepository: listingRepository,
            cropRepository: cropRepository,
          ),
        ),
        ChangeNotifierProvider(create: (_) => MarketProvider(repository: marketRepository)),
        ChangeNotifierProvider(
          create: (_) => RecommendationProvider(
            recommendationRepository: recommendationRepository,
            predictionRepository: predictionRepository,
          ),
        ),
        ChangeNotifierProvider(create: (_) => OfferProvider(repository: offerRepository)),
        ChangeNotifierProvider(create: (_) => OrderProvider(repository: orderRepository)),
        ChangeNotifierProvider(create: (_) => GrievanceProvider(repository: grievanceRepository)),
      ],
      child: const AgriNexisFarmerApp(),
    ),
  );
}
