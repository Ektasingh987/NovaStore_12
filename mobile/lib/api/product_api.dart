import 'package:flutter/foundation.dart';
import '../constants/app_constants.dart';
import '../models/api_response.dart';
import '../models/product_model.dart';
import 'api_client.dart';

class ProductListResult {
  final List<ProductModel> products;
  final PaginationMeta meta;

  ProductListResult({
    required this.products,
    required this.meta,
  });
}

// Top-level function executed in background isolate to keep main thread free
ProductListResult _parseProductList(Map<String, dynamic> response) {
  final data = response['data'] as Map<String, dynamic>?;
  final rawList = (data?['products'] as List<dynamic>?) ?? [];
  final products = rawList
      .map((item) => ProductModel.fromJson(item as Map<String, dynamic>))
      .toList();
  final meta = PaginationMeta.fromJson(response['meta'] as Map<String, dynamic>?);
  return ProductListResult(products: products, meta: meta);
}

class ProductApi {
  final ApiClient _client;

  ProductApi(this._client);

  Future<ProductListResult> getProducts({
    int page = 1,
    int limit = AppConstants.defaultPageSize,
    String? search,
    String? category,
    double? minPrice,
    double? maxPrice,
    String? sort,
    bool? inStock,
    bool? isFeatured,
  }) async {
    final query = <String, dynamic>{
      'page': page,
      'limit': limit,
    };

    if (search != null && search.trim().isNotEmpty) {
      query['search'] = search.trim();
    }
    if (category != null && category.isNotEmpty) {
      query['category'] = category;
    }
    if (minPrice != null) {
      query['minPrice'] = minPrice;
    }
    if (maxPrice != null) {
      query['maxPrice'] = maxPrice;
    }
    if (sort != null && sort.isNotEmpty) {
      query['sort'] = sort;
    }
    if (inStock != null) {
      query['inStock'] = inStock;
    }
    if (isFeatured != null) {
      query['isFeatured'] = isFeatured;
    }

    final response = await _client.get(
      AppConstants.productsEndpoint,
      queryParameters: query,
    );

    if (response is! Map<String, dynamic>) {
      return ProductListResult(
        products: [],
        meta: PaginationMeta.fromJson(null),
      );
    }

    // Offload parsing off the main UI thread to a background worker isolate
    return await compute(_parseProductList, response);
  }

  Future<ProductModel> getProductById(String id) async {
    final response = await _client.get('${AppConstants.productsEndpoint}/$id');
    final data = response['data'] as Map<String, dynamic>;
    return ProductModel.fromJson(data['product'] as Map<String, dynamic>);
  }
}
