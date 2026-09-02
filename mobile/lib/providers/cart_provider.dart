import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api/cart_api.dart';
import '../models/api_response.dart';
import '../models/cart_model.dart';
import 'auth_provider.dart';
import 'core_providers.dart';

class CartState {
  final CartModel cart;
  final bool isLoading;
  final bool isMutating;
  final String? error;
  final String? successMessage;

  const CartState({
    required this.cart,
    this.isLoading = false,
    this.isMutating = false,
    this.error,
    this.successMessage,
  });

  int get totalItemCount => cart.totalItems;
  bool get isEmpty => cart.items.isEmpty;

  CartState copyWith({
    CartModel? cart,
    bool? isLoading,
    bool? isMutating,
    String? error,
    String? successMessage,
    bool clearError = false,
    bool clearSuccess = false,
  }) {
    return CartState(
      cart: cart ?? this.cart,
      isLoading: isLoading ?? this.isLoading,
      isMutating: isMutating ?? this.isMutating,
      error: clearError ? null : (error ?? this.error),
      successMessage: clearSuccess ? null : (successMessage ?? this.successMessage),
    );
  }
}

class CartNotifier extends StateNotifier<CartState> {
  final CartApi _cartApi;
  final Ref _ref;

  CartNotifier(this._cartApi, this._ref)
      : super(CartState(cart: CartModel.empty())) {
    // Listen to auth changes: fetch cart when logged in, clear when logged out
    _ref.listen(authProvider, (previous, next) {
      if (next.isAuthenticated && (previous == null || !previous.isAuthenticated)) {
        fetchCart();
      } else if (!next.isAuthenticated && previous?.isAuthenticated == true) {
        state = CartState(cart: CartModel.empty());
      }
    });

    if (_ref.read(authProvider).isAuthenticated) {
      fetchCart();
    }
  }

  Future<void> fetchCart() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final cart = await _cartApi.getCart();
      state = state.copyWith(cart: cart, isLoading: false);
    } on ApiException catch (e) {
      state = state.copyWith(isLoading: false, error: e.message);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Failed to load cart');
    }
  }

  Future<bool> addItem(String productId, int quantity) async {
    state = state.copyWith(isMutating: true, clearError: true, clearSuccess: true);
    try {
      final cart = await _cartApi.addItem(productId: productId, quantity: quantity);
      state = state.copyWith(
        cart: cart,
        isMutating: false,
        successMessage: 'Item added to cart!',
      );
      return true;
    } on ApiException catch (e) {
      state = state.copyWith(isMutating: false, error: e.message);
      return false;
    } catch (e) {
      state = state.copyWith(isMutating: false, error: 'Failed to add item to cart');
      return false;
    }
  }

  Future<bool> updateQuantity(String productId, int quantity) async {
    state = state.copyWith(isMutating: true, clearError: true, clearSuccess: true);
    try {
      final cart = await _cartApi.updateItemQuantity(
        productId: productId,
        quantity: quantity,
      );
      state = state.copyWith(cart: cart, isMutating: false);
      return true;
    } on ApiException catch (e) {
      state = state.copyWith(isMutating: false, error: e.message);
      return false;
    } catch (e) {
      state = state.copyWith(isMutating: false, error: 'Failed to update quantity');
      return false;
    }
  }

  Future<bool> removeItem(String productId) async {
    state = state.copyWith(isMutating: true, clearError: true, clearSuccess: true);
    try {
      final cart = await _cartApi.removeItem(productId);
      state = state.copyWith(
        cart: cart,
        isMutating: false,
        successMessage: 'Item removed from cart',
      );
      return true;
    } on ApiException catch (e) {
      state = state.copyWith(isMutating: false, error: e.message);
      return false;
    } catch (e) {
      state = state.copyWith(isMutating: false, error: 'Failed to remove item');
      return false;
    }
  }

  Future<bool> clearCart() async {
    state = state.copyWith(isMutating: true, clearError: true, clearSuccess: true);
    try {
      await _cartApi.clearCart();
      state = state.copyWith(
        cart: CartModel.empty(),
        isMutating: false,
        successMessage: 'Cart cleared',
      );
      return true;
    } on ApiException catch (e) {
      state = state.copyWith(isMutating: false, error: e.message);
      return false;
    } catch (e) {
      state = state.copyWith(isMutating: false, error: 'Failed to clear cart');
      return false;
    }
  }

  void clearMessages() {
    state = state.copyWith(clearError: true, clearSuccess: true);
  }
}

final cartProvider = StateNotifierProvider<CartNotifier, CartState>((ref) {
  final api = ref.watch(cartApiProvider);
  return CartNotifier(api, ref);
});
