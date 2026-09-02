import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api/order_api.dart';
import '../models/api_response.dart';
import '../models/order_model.dart';
import 'cart_provider.dart';
import 'core_providers.dart';

class OrdersState {
  final List<OrderModel> orders;
  final bool isLoading;
  final bool isLoadingMore;
  final bool isPlacingOrder;
  final bool hasMore;
  final int currentPage;
  final int totalPages;
  final int total;
  final String? statusFilter;
  final String? error;
  final OrderModel? lastPlacedOrder;

  const OrdersState({
    this.orders = const [],
    this.isLoading = false,
    this.isLoadingMore = false,
    this.isPlacingOrder = false,
    this.hasMore = true,
    this.currentPage = 1,
    this.totalPages = 1,
    this.total = 0,
    this.statusFilter,
    this.error,
    this.lastPlacedOrder,
  });

  OrdersState copyWith({
    List<OrderModel>? orders,
    bool? isLoading,
    bool? isLoadingMore,
    bool? isPlacingOrder,
    bool? hasMore,
    int? currentPage,
    int? totalPages,
    int? total,
    String? statusFilter,
    String? error,
    OrderModel? lastPlacedOrder,
    bool clearError = false,
    bool clearFilter = false,
    bool clearPlacedOrder = false,
  }) {
    return OrdersState(
      orders: orders ?? this.orders,
      isLoading: isLoading ?? this.isLoading,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      isPlacingOrder: isPlacingOrder ?? this.isPlacingOrder,
      hasMore: hasMore ?? this.hasMore,
      currentPage: currentPage ?? this.currentPage,
      totalPages: totalPages ?? this.totalPages,
      total: total ?? this.total,
      statusFilter: clearFilter ? null : (statusFilter ?? this.statusFilter),
      error: clearError ? null : (error ?? this.error),
      lastPlacedOrder: clearPlacedOrder ? null : (lastPlacedOrder ?? this.lastPlacedOrder),
    );
  }
}

class OrdersNotifier extends StateNotifier<OrdersState> {
  final OrderApi _orderApi;
  final Ref _ref;

  OrdersNotifier(this._orderApi, this._ref) : super(const OrdersState());

  Future<void> fetchOrders({bool isRefresh = false}) async {
    state = state.copyWith(
      isLoading: !isRefresh,
      clearError: true,
      currentPage: 1,
    );

    try {
      final result = await _orderApi.getMyOrders(
        page: 1,
        status: state.statusFilter,
      );

      state = state.copyWith(
        orders: result.orders,
        isLoading: false,
        hasMore: result.meta.hasNextPage,
        currentPage: result.meta.page,
        totalPages: result.meta.totalPages,
        total: result.meta.total,
      );
    } on ApiException catch (e) {
      state = state.copyWith(isLoading: false, error: e.message);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Failed to load orders');
    }
  }

  Future<void> loadMore() async {
    if (state.isLoadingMore || !state.hasMore || state.isLoading) return;

    state = state.copyWith(isLoadingMore: true);
    final nextPage = state.currentPage + 1;

    try {
      final result = await _orderApi.getMyOrders(
        page: nextPage,
        status: state.statusFilter,
      );

      state = state.copyWith(
        orders: [...state.orders, ...result.orders],
        isLoadingMore: false,
        hasMore: result.meta.hasNextPage,
        currentPage: result.meta.page,
        totalPages: result.meta.totalPages,
        total: result.meta.total,
      );
    } catch (_) {
      state = state.copyWith(isLoadingMore: false);
    }
  }

  void setStatusFilter(String? status) {
    if (status == state.statusFilter) return;
    state = state.copyWith(
      statusFilter: status,
      clearFilter: status == null || status.isEmpty,
    );
    fetchOrders();
  }

  Future<OrderModel?> createOrder({
    required DeliveryAddressModel address,
    required String paymentMethod,
    String? notes,
  }) async {
    state = state.copyWith(isPlacingOrder: true, clearError: true);
    try {
      final order = await _orderApi.createOrder(
        address: address,
        paymentMethod: paymentMethod,
        notes: notes,
      );

      // Refresh cart state since items are ordered
      _ref.read(cartProvider.notifier).fetchCart();

      state = state.copyWith(
        isPlacingOrder: false,
        lastPlacedOrder: order,
        orders: [order, ...state.orders],
      );
      return order;
    } on ApiException catch (e) {
      state = state.copyWith(isPlacingOrder: false, error: e.message);
      return null;
    } catch (e) {
      state = state.copyWith(
        isPlacingOrder: false,
        error: 'Failed to place order. Please try again.',
      );
      return null;
    }
  }

  Future<OrderModel?> getOrderById(String id) async {
    try {
      return await _orderApi.getOrderById(id);
    } catch (_) {
      return null;
    }
  }

  void clearLastPlacedOrder() {
    state = state.copyWith(clearPlacedOrder: true);
  }
}

final ordersProvider =
    StateNotifierProvider<OrdersNotifier, OrdersState>((ref) {
  final api = ref.watch(orderApiProvider);
  return OrdersNotifier(api, ref);
});

// Single order details provider family
final orderDetailsProvider =
    FutureProvider.autoDispose.family<OrderModel, String>((ref, id) async {
  final api = ref.watch(orderApiProvider);
  return await api.getOrderById(id);
});
