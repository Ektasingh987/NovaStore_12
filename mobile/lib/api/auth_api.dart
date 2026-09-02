import '../constants/app_constants.dart';
import '../models/user_model.dart';
import 'api_client.dart';

class AuthResult {
  final UserModel user;
  final String accessToken;
  final String? refreshToken;

  AuthResult({
    required this.user,
    required this.accessToken,
    this.refreshToken,
  });

  factory AuthResult.fromJson(Map<String, dynamic> json) {
    return AuthResult(
      user: UserModel.fromJson(json['user'] as Map<String, dynamic>),
      accessToken: (json['accessToken'] ?? '') as String,
      refreshToken: json['refreshToken'] as String?,
    );
  }
}

class AuthApi {
  final ApiClient _client;

  AuthApi(this._client);

  Future<AuthResult> login({
    required String email,
    required String password,
  }) async {
    final response = await _client.post(
      AppConstants.loginEndpoint,
      data: {'email': email.trim().toLowerCase(), 'password': password},
    );
    final data = response['data'] as Map<String, dynamic>;
    return AuthResult.fromJson(data);
  }

  Future<AuthResult> register({
    required String name,
    required String email,
    required String password,
    String? phone,
  }) async {
    final body = <String, dynamic>{
      'name': name.trim(),
      'email': email.trim().toLowerCase(),
      'password': password,
    };
    if (phone != null && phone.trim().isNotEmpty) {
      body['phone'] = phone.trim();
    }

    final response = await _client.post(
      AppConstants.registerEndpoint,
      data: body,
    );
    final data = response['data'] as Map<String, dynamic>;
    return AuthResult.fromJson(data);
  }

  Future<AuthResult> googleLogin({
    required String idToken,
  }) async {
    final response = await _client.post(
      AppConstants.googleAuthEndpoint,
      data: {'idToken': idToken},
    );
    final data = response['data'] as Map<String, dynamic>;
    return AuthResult.fromJson(data);
  }

  Future<AuthResult> refreshToken(String refreshToken) async {
    final response = await _client.post(
      AppConstants.refreshEndpoint,
      data: {'refreshToken': refreshToken},
    );
    final data = response['data'] as Map<String, dynamic>;
    return AuthResult.fromJson(data);
  }

  Future<void> logout({String? refreshToken}) async {
    await _client.post(
      AppConstants.logoutEndpoint,
      data: refreshToken != null ? {'refreshToken': refreshToken} : null,
    );
  }

  Future<void> logoutAll() async {
    await _client.post(AppConstants.logoutAllEndpoint);
  }

  Future<UserModel> getMe() async {
    final response = await _client.get(AppConstants.meEndpoint);
    final data = response['data'] as Map<String, dynamic>;
    return UserModel.fromJson(data['user'] as Map<String, dynamic>);
  }
}
