import '../constants/app_constants.dart';
import '../models/api_response.dart';
import '../models/order_model.dart';
import 'api_client.dart';

class OrderListResult {
  final List<OrderModel> orders;
  final PaginationMeta meta;

  OrderListResult({
    required this.orders,
    required this.meta,
  });
}

class OrderApi {
  final ApiClient _client;

  OrderApi(this._client);

  Future<OrderModel> createOrder({
    required DeliveryAddressModel address,
    required String paymentMethod,
    String? notes,
  }) async {
    final body = <String, dynamic>{
      'address': address.toJson(),
      'paymentMethod': paymentMethod,
    };
    if (notes != null && notes.trim().isNotEmpty) {
      body['notes'] = notes.trim();
    }

    final response = await _client.post(
      AppConstants.ordersEndpoint,
      data: body,
    );
    final data = response['data'] as Map<String, dynamic>;
    return OrderModel.fromJson(data['order'] as Map<String, dynamic>);
  }

  Future<OrderListResult> getMyOrders({
    int page = 1,
    int limit = 10,
    String? status,
    String? search,
  }) async {
    final query = <String, dynamic>{
      'page': page,
      'limit': limit,
    };
    if (status != null && status.isNotEmpty) {
      query['status'] = status;
    }
    if (search != null && search.isNotEmpty) {
      query['search'] = search;
    }

    final response = await _client.get(
      AppConstants.ordersEndpoint,
      queryParameters: query,
    );

    final data = response['data'] as Map<String, dynamic>?;
    final rawList = (data?['orders'] as List<dynamic>?) ?? [];
    final orders = rawList
        .map((item) => OrderModel.fromJson(item as Map<String, dynamic>))
        .toList();

    final meta = PaginationMeta.fromJson(response['meta'] as Map<String, dynamic>?);

    return OrderListResult(orders: orders, meta: meta);
  }

  Future<OrderModel> getOrderById(String id) async {
    final response = await _client.get('${AppConstants.ordersEndpoint}/$id');
    final data = response['data'] as Map<String, dynamic>;
    return OrderModel.fromJson(data['order'] as Map<String, dynamic>);
  }
}
