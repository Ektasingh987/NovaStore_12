import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api/product_api.dart';
import '../models/api_response.dart';
import '../models/product_model.dart';
import 'core_providers.dart';

class ProductFilter {
  final String? search;
  final String? category;
  final double? minPrice;
  final double? maxPrice;
  final String? sort;
  final bool? inStock;

  const ProductFilter({
    this.search,
    this.category,
    this.minPrice,
    this.maxPrice,
    this.sort,
    this.inStock,
  });

  ProductFilter copyWith({
    String? search,
    String? category,
    double? minPrice,
    double? maxPrice,
    String? sort,
    bool? inStock,
    bool clearCategory = false,
    bool clearPrice = false,
    bool clearSort = false,
    bool clearSearch = false,
  }) {
    return ProductFilter(
      search: clearSearch ? null : (search ?? this.search),
      category: clearCategory ? null : (category ?? this.category),
      minPrice: clearPrice ? null : (minPrice ?? this.minPrice),
      maxPrice: clearPrice ? null : (maxPrice ?? this.maxPrice),
      sort: clearSort ? null : (sort ?? this.sort),
      inStock: inStock ?? this.inStock,
    );
  }

  bool get hasActiveFilters =>
      (search != null && search!.isNotEmpty) ||
      (category != null && category!.isNotEmpty) ||
      minPrice != null ||
      maxPrice != null ||
      sort != null;
}

class ProductsState {
  final List<ProductModel> products;
  final bool isLoading;
  final bool isLoadingMore;
  final bool hasMore;
  final int currentPage;
  final int totalPages;
  final int total;
  final String? error;
  final ProductFilter filter;

  const ProductsState({
    this.products = const [],
    this.isLoading = false,
    this.isLoadingMore = false,
    this.hasMore = true,
    this.currentPage = 1,
    this.totalPages = 1,
    this.total = 0,
    this.error,
    this.filter = const ProductFilter(),
  });

  ProductsState copyWith({
    List<ProductModel>? products,
    bool? isLoading,
    bool? isLoadingMore,
    bool? hasMore,
    int? currentPage,
    int? totalPages,
    int? total,
    String? error,
    ProductFilter? filter,
    bool clearError = false,
  }) {
    return ProductsState(
      products: products ?? this.products,
      isLoading: isLoading ?? this.isLoading,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      hasMore: hasMore ?? this.hasMore,
      currentPage: currentPage ?? this.currentPage,
      totalPages: totalPages ?? this.totalPages,
      total: total ?? this.total,
      error: clearError ? null : (error ?? this.error),
      filter: filter ?? this.filter,
    );
  }
}

class ProductsNotifier extends StateNotifier<ProductsState> {
  final ProductApi _productApi;

  ProductsNotifier(this._productApi) : super(const ProductsState()) {
    fetchProducts();
  }

  Future<void> fetchProducts({bool isRefresh = false}) async {
    state = state.copyWith(
      isLoading: !isRefresh,
      clearError: true,
      currentPage: 1,
    );

    try {
      final result = await _productApi.getProducts(
        page: 1,
        search: state.filter.search,
        category: state.filter.category,
        minPrice: state.filter.minPrice,
        maxPrice: state.filter.maxPrice,
        sort: state.filter.sort,
        inStock: state.filter.inStock,
      );

      state = state.copyWith(
        products: result.products,
        isLoading: false,
        hasMore: result.meta.hasNextPage,
        currentPage: result.meta.page,
        totalPages: result.meta.totalPages,
        total: result.meta.total,
      );
    } on ApiException catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.message,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Failed to load products. Please try again.',
      );
    }
  }

  Future<void> loadMore() async {
    if (state.isLoadingMore || !state.hasMore || state.isLoading) return;

    state = state.copyWith(isLoadingMore: true);
    final nextPage = state.currentPage + 1;

    try {
      final result = await _productApi.getProducts(
        page: nextPage,
        search: state.filter.search,
        category: state.filter.category,
        minPrice: state.filter.minPrice,
        maxPrice: state.filter.maxPrice,
        sort: state.filter.sort,
        inStock: state.filter.inStock,
      );

      state = state.copyWith(
        products: [...state.products, ...result.products],
        isLoadingMore: false,
        hasMore: result.meta.hasNextPage,
        currentPage: result.meta.page,
        totalPages: result.meta.totalPages,
        total: result.meta.total,
      );
    } catch (e) {
      state = state.copyWith(isLoadingMore: false);
    }
  }

  void updateFilter(ProductFilter newFilter) {
    state = state.copyWith(filter: newFilter);
    fetchProducts();
  }

  void setSearch(String? query) {
    state = state.copyWith(
      filter: state.filter.copyWith(
        search: query,
        clearSearch: query == null || query.trim().isEmpty,
      ),
    );
    fetchProducts();
  }

  void setCategory(String? categoryId) {
    state = state.copyWith(
      filter: state.filter.copyWith(
        category: categoryId,
        clearCategory: categoryId == null || categoryId.isEmpty,
      ),
    );
    fetchProducts();
  }

  void setPriceRange(double? min, double? max) {
    state = state.copyWith(
      filter: state.filter.copyWith(
        minPrice: min,
        maxPrice: max,
        clearPrice: min == null && max == null,
      ),
    );
    fetchProducts();
  }

  void setSort(String? sort) {
    state = state.copyWith(
      filter: state.filter.copyWith(
        sort: sort,
        clearSort: sort == null,
      ),
    );
    fetchProducts();
  }

  void resetFilters() {
    state = state.copyWith(filter: const ProductFilter());
    fetchProducts();
  }
}

final productsProvider =
    StateNotifierProvider<ProductsNotifier, ProductsState>((ref) {
  final api = ref.watch(productApiProvider);
  return ProductsNotifier(api);
});

// Featured Products Provider for Home Screen
final featuredProductsProvider =
    FutureProvider.autoDispose<List<ProductModel>>((ref) async {
  final api = ref.watch(productApiProvider);
  final result = await api.getProducts(page: 1, limit: 8, isFeatured: true);
  return result.products;
});

// Latest Products Provider for Home Screen
final latestProductsProvider =
    FutureProvider.autoDispose<List<ProductModel>>((ref) async {
  final api = ref.watch(productApiProvider);
  final result = await api.getProducts(page: 1, limit: 10, sort: 'newest');
  return result.products;
});

// Product Details Provider (family)
final productDetailsProvider =
    FutureProvider.autoDispose.family<ProductModel, String>((ref, id) async {
  final api = ref.watch(productApiProvider);
  return await api.getProductById(id);
});
