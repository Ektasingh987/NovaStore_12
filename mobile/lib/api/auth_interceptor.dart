import 'dart:async';
import 'package:dio/dio.dart';
import '../constants/app_constants.dart';
import '../services/storage_service.dart';

typedef TokenGetter = String? Function();
typedef TokenUpdater = void Function(String accessToken, String? refreshToken);
typedef AuthFailureCallback = void Function();

class AuthInterceptor extends QueuedInterceptor {
  final Dio _dio;
  final StorageService _storageService;
  final TokenGetter _getAccessToken;
  final TokenUpdater _onTokenUpdated;
  final AuthFailureCallback _onAuthFailed;

  bool _isRefreshing = false;
  final List<_PendingRequest> _pendingRequests = [];

  AuthInterceptor({
    required Dio dio,
    required StorageService storageService,
    required TokenGetter getAccessToken,
    required TokenUpdater onTokenUpdated,
    required AuthFailureCallback onAuthFailed,
  })  : _dio = dio,
        _storageService = storageService,
        _getAccessToken = getAccessToken,
        _onTokenUpdated = onTokenUpdated,
        _onAuthFailed = onAuthFailed;

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    // Attach in-memory access token if available and not already set
    final token = _getAccessToken();
    if (token != null && token.isNotEmpty && !options.headers.containsKey('Authorization')) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  Future<void> onError(DioException err, ErrorInterceptorHandler handler) async {
    final response = err.response;
    final path = err.requestOptions.path;

    // Check if error is 401 Unauthorized
    final is401 = response?.statusCode == 401;
    final isAuthEndpoint = path.contains(AppConstants.loginEndpoint) ||
        path.contains(AppConstants.registerEndpoint) ||
        path.contains(AppConstants.refreshEndpoint) ||
        path.contains(AppConstants.googleAuthEndpoint);
    final isAlreadyRetried = err.requestOptions.extra['isRetry'] == true;

    // Only handle 401 for non-auth endpoints that haven't been retried
    if (!is401 || isAuthEndpoint || isAlreadyRetried) {
      return handler.next(err);
    }

    // If already refreshing, queue this request
    if (_isRefreshing) {
      final completer = Completer<Response>();
      _pendingRequests.add(_PendingRequest(
        options: err.requestOptions,
        completer: completer,
        handler: handler,
      ));
      return;
    }

    _isRefreshing = true;

    try {
      final refreshToken = await _storageService.getRefreshToken();
      if (refreshToken == null || refreshToken.isEmpty) {
        _handleRefreshFailure(handler, err);
        return;
      }

      // Create an independent Dio instance without interceptors for refresh call
      final refreshDio = Dio(
        BaseOptions(
          baseUrl: _dio.options.baseUrl,
          connectTimeout: const Duration(seconds: 15),
          receiveTimeout: const Duration(seconds: 15),
          headers: {'Content-Type': 'application/json'},
        ),
      );

      final refreshResponse = await refreshDio.post(
        AppConstants.refreshEndpoint,
        data: {'refreshToken': refreshToken},
      );

      if (refreshResponse.statusCode == 200 && refreshResponse.data != null) {
        final data = refreshResponse.data['data'] as Map<String, dynamic>?;
        final newAccessToken = data?['accessToken'] as String?;
        final newRefreshToken = data?['refreshToken'] as String?;

        if (newAccessToken != null && newAccessToken.isNotEmpty) {
          // Update in-memory state & persist new refresh token
          if (newRefreshToken != null && newRefreshToken.isNotEmpty) {
            await _storageService.saveRefreshToken(newRefreshToken);
          }
          _onTokenUpdated(newAccessToken, newRefreshToken);

          // Retry the original request
          final originalOptions = err.requestOptions;
          originalOptions.extra['isRetry'] = true;
          originalOptions.headers['Authorization'] = 'Bearer $newAccessToken';

          final retryResponse = await _dio.fetch(originalOptions);
          handler.resolve(retryResponse);

          // Process queued pending requests
          await _processPendingQueue(newAccessToken);
          return;
        }
      }

      // If response was not 200 or missing token
      _handleRefreshFailure(handler, err);
    } catch (e) {
      _handleRefreshFailure(handler, err);
    } finally {
      _isRefreshing = false;
    }
  }

  Future<void> _processPendingQueue(String newAccessToken) async {
    final list = List<_PendingRequest>.from(_pendingRequests);
    _pendingRequests.clear();

    for (final pending in list) {
      try {
        final opts = pending.options;
        opts.extra['isRetry'] = true;
        opts.headers['Authorization'] = 'Bearer $newAccessToken';
        final response = await _dio.fetch(opts);
        pending.handler.resolve(response);
      } catch (retryErr) {
        if (retryErr is DioException) {
          pending.handler.next(retryErr);
        } else {
          pending.handler.reject(
            DioException(requestOptions: pending.options, error: retryErr),
          );
        }
      }
    }
  }

  void _handleRefreshFailure(
    ErrorInterceptorHandler handler,
    DioException originalErr,
  ) {
    // Clear tokens
    _storageService.clearAuthData();
    _onAuthFailed();

    // Reject all pending requests
    final list = List<_PendingRequest>.from(_pendingRequests);
    _pendingRequests.clear();

    for (final pending in list) {
      pending.handler.next(originalErr);
    }

    handler.next(originalErr);
  }
}

class _PendingRequest {
  final RequestOptions options;
  final Completer<Response> completer;
  final ErrorInterceptorHandler handler;

  _PendingRequest({
    required this.options,
    required this.completer,
    required this.handler,
  });
}
