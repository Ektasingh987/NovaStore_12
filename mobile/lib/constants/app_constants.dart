import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

class AppConstants {
  static String? _getEnv(String key) {
    try {
      if (!dotenv.isInitialized) return null;
      return dotenv.env[key];
    } catch (_) {
      return null;
    }
  }

  static String get appName => _getEnv('APP_NAME') ?? 'NovaStore';
  static const String appTagline = 'Elevate Your Shopping Experience';

  // API Base URL - default adapts to platform (Android emulator vs Web/Desktop/iOS)
  static String get defaultBaseUrl {
    const definedUrl = String.fromEnvironment('API_BASE_URL');
    if (definedUrl.isNotEmpty) return definedUrl;

    if (kIsWeb) {
      return _getEnv('API_BASE_URL_WEB') ?? 'http://localhost:5000';
    }
    if (defaultTargetPlatform == TargetPlatform.android) {
      return _getEnv('API_BASE_URL_ANDROID') ?? 'http://10.0.2.2:5000';
    }
    return _getEnv('API_BASE_URL_DEFAULT') ?? 'http://localhost:5000';
  }

  // Google OAuth 2.0
  static String get googleWebClientId =>
      _getEnv('GOOGLE_WEB_CLIENT_ID') ??
      '955328491128-p2isan5kjtgkhb3pk97a128uvjea8pt6.apps.googleusercontent.com';

  static String get googleServerClientId =>
      _getEnv('GOOGLE_SERVER_CLIENT_ID') ??
      '955328491128-p2isan5kjtgkhb3pk97a128uvjea8pt6.apps.googleusercontent.com';

  // Endpoints (mounted under /api or /api/v1)
  static const String apiVersion = '/api/v1';

  // Auth endpoints
  static const String loginEndpoint = '$apiVersion/auth/login';
  static const String registerEndpoint = '$apiVersion/auth/register';
  static const String refreshEndpoint = '$apiVersion/auth/refresh';
  static const String googleAuthEndpoint = '$apiVersion/auth/google';
  static const String logoutEndpoint = '$apiVersion/auth/logout';
  static const String logoutAllEndpoint = '$apiVersion/auth/logout-all';
  static const String meEndpoint = '$apiVersion/auth/me';

  // Products endpoints
  static const String productsEndpoint = '$apiVersion/products';

  // Categories endpoints
  static const String categoriesEndpoint = '$apiVersion/categories';

  // Cart endpoints
  static const String cartEndpoint = '$apiVersion/cart';
  static const String cartItemsEndpoint = '$apiVersion/cart/items';

  // Orders endpoints
  static const String ordersEndpoint = '$apiVersion/orders';

  // User endpoints
  static const String userProfileEndpoint = '$apiVersion/users/me';

  // Storage Keys
  static const String keyRefreshToken = 'auth_refresh_token';
  static const String keyThemeMode = 'app_theme_mode';
  static const String keyRecentSearches = 'recent_searches';

  // Pagination defaults
  static const int defaultPageSize = 10;

  // Currency & Shipping
  static String get currencySymbol => _getEnv('CURRENCY_SYMBOL') ?? '₹';
  static double get freeDeliveryThreshold =>
      double.tryParse(_getEnv('FREE_DELIVERY_THRESHOLD') ?? '500') ?? 500.0;
  static double get defaultDeliveryFee =>
      double.tryParse(_getEnv('DEFAULT_DELIVERY_FEE') ?? '50') ?? 50.0;
}
