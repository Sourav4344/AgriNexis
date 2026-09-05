class AppConfig {
  /// Toggle for explicit DEMO mode vs Live API mode.
  /// When true, repository interfaces load deterministic, contract-aligned SIH demo fixtures.
  /// When false, repository interfaces strictly communicate with FastAPI `/api/v1` and do not swallow errors.
  /// Default is false to prevent live/production builds from accidentally defaulting to DEMO fixtures.
  /// Set to true during SIH Hackathon demo presentations or offline test rehearsals.
  static bool isDemoMode = false;

  /// Whether bearer token is attached for authenticated requests
  static String? bearerToken;
}
