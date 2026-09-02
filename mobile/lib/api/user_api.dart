import '../constants/app_constants.dart';
import '../models/user_model.dart';
import 'api_client.dart';

class UserApi {
  final ApiClient _client;

  UserApi(this._client);

  Future<UserModel> getProfile() async {
    final response = await _client.get(AppConstants.userProfileEndpoint);
    final data = response['data'] as Map<String, dynamic>;
    return UserModel.fromJson(data['user'] as Map<String, dynamic>);
  }

  Future<UserModel> updateProfile({
    String? name,
    String? phone,
  }) async {
    final body = <String, dynamic>{};
    if (name != null) body['name'] = name.trim();
    if (phone != null) body['phone'] = phone.trim();

    final response = await _client.patch(
      AppConstants.userProfileEndpoint,
      data: body,
    );
    final data = response['data'] as Map<String, dynamic>;
    return UserModel.fromJson(data['user'] as Map<String, dynamic>);
  }
}
