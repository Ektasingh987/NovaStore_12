import '../constants/app_constants.dart';
import '../models/category_model.dart';
import 'api_client.dart';

class CategoryApi {
  final ApiClient _client;

  CategoryApi(this._client);

  Future<List<CategoryModel>> getCategories() async {
    final response = await _client.get(AppConstants.categoriesEndpoint);
    final data = response['data'] as Map<String, dynamic>?;
    final rawList = (data?['categories'] as List<dynamic>?) ?? [];
    return rawList
        .map((item) => CategoryModel.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<CategoryModel> getCategoryById(String id) async {
    final response = await _client.get('${AppConstants.categoriesEndpoint}/$id');
    final data = response['data'] as Map<String, dynamic>;
    return CategoryModel.fromJson(data['category'] as Map<String, dynamic>);
  }
}
