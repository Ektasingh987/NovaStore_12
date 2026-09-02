import '../constants/app_constants.dart';
import '../models/cart_model.dart';
import 'api_client.dart';

class CartApi {
  final ApiClient _client;

  CartApi(this._client);

  Future<CartModel> getCart() async {
    final response = await _client.get(AppConstants.cartEndpoint);
    if (response == null) return CartModel.empty();
    final data = response['data'] as Map<String, dynamic>?;
    if (data?['cart'] != null) {
      return CartModel.fromJson(data!['cart'] as Map<String, dynamic>);
    }
    return CartModel.empty();
  }

  Future<CartModel> addItem({
    required String productId,
    required int quantity,
  }) async {
    final response = await _client.post(
      AppConstants.cartItemsEndpoint,
      data: {
        'productId': productId,
        'quantity': quantity,
      },
    );
    final data = response['data'] as Map<String, dynamic>;
    return CartModel.fromJson(data['cart'] as Map<String, dynamic>);
  }

  Future<CartModel> updateItemQuantity({
    required String productId,
    required int quantity,
  }) async {
    final response = await _client.patch(
      '${AppConstants.cartItemsEndpoint}/$productId',
      data: {'quantity': quantity},
    );
    final data = response['data'] as Map<String, dynamic>;
    return CartModel.fromJson(data['cart'] as Map<String, dynamic>);
  }

  Future<CartModel> removeItem(String productId) async {
    final response = await _client.delete(
      '${AppConstants.cartItemsEndpoint}/$productId',
    );
    final data = response['data'] as Map<String, dynamic>;
    return CartModel.fromJson(data['cart'] as Map<String, dynamic>);
  }

  Future<void> clearCart() async {
    await _client.delete(AppConstants.cartEndpoint);
  }
}
