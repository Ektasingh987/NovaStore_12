import 'package:dio/dio.dart';
import '../constants/app_constants.dart';
import '../models/api_response.dart';
import '../services/storage_service.dart';
import 'auth_interceptor.dart';

class ApiClient {
  late final Dio _dio;
  String _baseUrl;
  AuthInterceptor? _authInterceptor;

  ApiClient({
    String? baseUrl,
  }) : _baseUrl = baseUrl ?? AppConstants.defaultBaseUrl {
    _dio = Dio(
      BaseOptions(
        baseUrl: _baseUrl,
        connectTimeout: const Duration(seconds: 20),
        receiveTimeout: const Duration(seconds: 20),
        sendTimeout: const Duration(seconds: 20),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );
  }

  Dio get dio => _dio;
  String get baseUrl => _baseUrl;

  void updateBaseUrl(String url) {
    _baseUrl = url;
    _dio.options.baseUrl = url;
  }

  void setupAuthInterceptor({
    required StorageService storageService,
    required TokenGetter getAccessToken,
    required TokenUpdater onTokenUpdated,
    required AuthFailureCallback onAuthFailed,
  }) {
    if (_authInterceptor != null) {
      _dio.interceptors.remove(_authInterceptor);
    }
    _authInterceptor = AuthInterceptor(
      dio: _dio,
      storageService: storageService,
      getAccessToken: getAccessToken,
      onTokenUpdated: onTokenUpdated,
      onAuthFailed: onAuthFailed,
    );
    _dio.interceptors.add(_authInterceptor!);
  }

  Future<dynamic> get(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      final response = await _dio.get(
        path,
        queryParameters: queryParameters,
        options: options,
      );
      return response.data;
    } on DioException catch (e) {
      throw _handleDioError(e);
    } catch (e) {
      throw ApiException(message: e.toString());
    }
  }

  Future<dynamic> post(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      final response = await _dio.post(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
      return response.data;
    } on DioException catch (e) {
      throw _handleDioError(e);
    } catch (e) {
      throw ApiException(message: e.toString());
    }
  }

  Future<dynamic> patch(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      final response = await _dio.patch(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
      return response.data;
    } on DioException catch (e) {
      throw _handleDioError(e);
    } catch (e) {
      throw ApiException(message: e.toString());
    }
  }

  Future<dynamic> delete(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      final response = await _dio.delete(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
      return response.data;
    } on DioException catch (e) {
      throw _handleDioError(e);
    } catch (e) {
      throw ApiException(message: e.toString());
    }
  }

  ApiException _handleDioError(DioException error) {
    if (error.type == DioExceptionType.connectionTimeout ||
        error.type == DioExceptionType.sendTimeout ||
        error.type == DioExceptionType.receiveTimeout) {
      return ApiException(
        message: 'Connection timed out. Please check your internet connection.',
        statusCode: 408,
      );
    }

    if (error.type == DioExceptionType.connectionError) {
      return ApiException(
        message: 'Unable to reach the server. Please check your network.',
        statusCode: 503,
      );
    }

    final response = error.response;
    if (response != null) {
      final data = response.data;
      if (data is Map<String, dynamic>) {
        final message = data['message'] as String? ?? 'An unexpected error occurred';
        final errorCode = data['errorCode'] as String?;
        final details = data['details'];

        return ApiException(
          message: message,
          statusCode: response.statusCode,
          errorCode: errorCode,
          details: details,
        );
      }
      return ApiException(
        message: 'Server error: ${response.statusCode}',
        statusCode: response.statusCode,
      );
    }

    return ApiException(
      message: error.message ?? 'A network error occurred. Please try again.',
    );
  }
}
