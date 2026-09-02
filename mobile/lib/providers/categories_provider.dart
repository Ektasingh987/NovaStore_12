import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api/category_api.dart';
import '../models/api_response.dart';
import '../models/category_model.dart';
import 'core_providers.dart';

class CategoriesState {
  final List<CategoryModel> categories;
  final bool isLoading;
  final String? error;

  const CategoriesState({
    this.categories = const [],
    this.isLoading = false,
    this.error,
  });

  CategoriesState copyWith({
    List<CategoryModel>? categories,
    bool? isLoading,
    String? error,
    bool clearError = false,
  }) {
    return CategoriesState(
      categories: categories ?? this.categories,
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

class CategoriesNotifier extends StateNotifier<CategoriesState> {
  final CategoryApi _categoryApi;

  CategoriesNotifier(this._categoryApi) : super(const CategoriesState()) {
    fetchCategories();
  }

  Future<void> fetchCategories() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final list = await _categoryApi.getCategories();
      state = state.copyWith(
        categories: list,
        isLoading: false,
      );
    } on ApiException catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.message,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Failed to load categories',
      );
    }
  }
}

final categoriesProvider =
    StateNotifierProvider<CategoriesNotifier, CategoriesState>((ref) {
  final api = ref.watch(categoryApiProvider);
  return CategoriesNotifier(api);
});
