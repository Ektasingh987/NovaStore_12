import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api/api_client.dart';
import '../api/auth_api.dart';
import '../api/cart_api.dart';
import '../api/category_api.dart';
import '../api/order_api.dart';
import '../api/product_api.dart';
import '../api/user_api.dart';
import '../services/storage_service.dart';

// Storage service provider (overridden in main.dart after init)
final storageServiceProvider = Provider<StorageService>((ref) {
  throw UnimplementedError('StorageService must be initialized before use');
});

// Centralized API Client Provider
final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient();
});

// Domain API Providers
final authApiProvider = Provider<AuthApi>((ref) {
  final client = ref.watch(apiClientProvider);
  return AuthApi(client);
});

final productApiProvider = Provider<ProductApi>((ref) {
  final client = ref.watch(apiClientProvider);
  return ProductApi(client);
});

final categoryApiProvider = Provider<CategoryApi>((ref) {
  final client = ref.watch(apiClientProvider);
  return CategoryApi(client);
});

final cartApiProvider = Provider<CartApi>((ref) {
  final client = ref.watch(apiClientProvider);
  return CartApi(client);
});

final orderApiProvider = Provider<OrderApi>((ref) {
  final client = ref.watch(apiClientProvider);
  return OrderApi(client);
});

final userApiProvider = Provider<UserApi>((ref) {
  final client = ref.watch(apiClientProvider);
  return UserApi(client);
});
