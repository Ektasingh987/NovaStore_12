import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api/auth_api.dart';
import '../models/api_response.dart';
import '../models/user_model.dart';
import '../services/storage_service.dart';
import 'core_providers.dart';

class AuthState {
  final UserModel? user;
  final String? accessToken;
  final bool isLoading;
  final bool isInitialized;
  final String? error;
  final String? successMessage;

  const AuthState({
    this.user,
    this.accessToken,
    this.isLoading = false,
    this.isInitialized = false,
    this.error,
    this.successMessage,
  });

  bool get isAuthenticated => accessToken != null && accessToken!.isNotEmpty && user != null;
  bool get isAdmin => user?.isAdmin ?? false;

  AuthState copyWith({
    UserModel? user,
    String? accessToken,
    bool? isLoading,
    bool? isInitialized,
    String? error,
    String? successMessage,
    bool clearTokens = false,
    bool clearError = false,
  }) {
    return AuthState(
      user: clearTokens ? null : (user ?? this.user),
      accessToken: clearTokens ? null : (accessToken ?? this.accessToken),
      isLoading: isLoading ?? this.isLoading,
      isInitialized: isInitialized ?? this.isInitialized,
      error: clearError ? null : (error ?? this.error),
      successMessage: successMessage ?? this.successMessage,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final AuthApi _authApi;
  final StorageService _storageService;
  final Ref _ref;

  AuthNotifier({
    required AuthApi authApi,
    required StorageService storageService,
    required Ref ref,
  })  : _authApi = authApi,
        _storageService = storageService,
        _ref = ref,
        super(const AuthState()) {
    _setupInterceptor();
    initAuth();
  }

  void _setupInterceptor() {
    final client = _ref.read(apiClientProvider);
    client.setupAuthInterceptor(
      storageService: _storageService,
      getAccessToken: () => state.accessToken,
      onTokenUpdated: (newAccess, newRefresh) {
        state = state.copyWith(accessToken: newAccess);
      },
      onAuthFailed: () {
        handleAuthFailure();
      },
    );
  }

  // Check persistent token on startup
  Future<void> initAuth() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final refreshToken = await _storageService.getRefreshToken();
      if (refreshToken == null || refreshToken.isEmpty) {
        state = state.copyWith(isLoading: false, isInitialized: true);
        return;
      }

      final result = await _authApi.refreshToken(refreshToken);
      if (result.refreshToken != null && result.refreshToken!.isNotEmpty) {
        await _storageService.saveRefreshToken(result.refreshToken!);
      }

      state = state.copyWith(
        user: result.user,
        accessToken: result.accessToken,
        isLoading: false,
        isInitialized: true,
      );
    } catch (e) {
      await _storageService.clearAuthData();
      state = state.copyWith(
        clearTokens: true,
        isLoading: false,
        isInitialized: true,
      );
    }
  }

  Future<bool> login({
    required String email,
    required String password,
  }) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final result = await _authApi.login(email: email, password: password);
      if (result.refreshToken != null && result.refreshToken!.isNotEmpty) {
        await _storageService.saveRefreshToken(result.refreshToken!);
      }

      state = state.copyWith(
        user: result.user,
        accessToken: result.accessToken,
        isLoading: false,
        successMessage: 'Welcome back, ${result.user.name}!',
      );
      return true;
    } on ApiException catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.message,
      );
      return false;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Login failed. Please check your credentials.',
      );
      return false;
    }
  }

  Future<bool> register({
    required String name,
    required String email,
    required String password,
    String? phone,
  }) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final result = await _authApi.register(
        name: name,
        email: email,
        password: password,
        phone: phone,
      );
      if (result.refreshToken != null && result.refreshToken!.isNotEmpty) {
        await _storageService.saveRefreshToken(result.refreshToken!);
      }

      state = state.copyWith(
        user: result.user,
        accessToken: result.accessToken,
        isLoading: false,
        successMessage: 'Account created successfully!',
      );
      return true;
    } on ApiException catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.message,
      );
      return false;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Registration failed. Please try again.',
      );
      return false;
    }
  }

  Future<bool> googleLogin(String idToken) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final result = await _authApi.googleLogin(idToken: idToken);
      if (result.refreshToken != null && result.refreshToken!.isNotEmpty) {
        await _storageService.saveRefreshToken(result.refreshToken!);
      }

      state = state.copyWith(
        user: result.user,
        accessToken: result.accessToken,
        isLoading: false,
        successMessage: 'Signed in with Google!',
      );
      return true;
    } on ApiException catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.message,
      );
      return false;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Google Sign-in failed. Please try again.',
      );
      return false;
    }
  }

  Future<void> logout() async {
    state = state.copyWith(isLoading: true);
    try {
      final refreshToken = await _storageService.getRefreshToken();
      await _authApi.logout(refreshToken: refreshToken);
    } catch (_) {
      // Proceed with local logout regardless
    } finally {
      await _storageService.clearAuthData();
      state = const AuthState(isInitialized: true);
    }
  }

  Future<void> logoutAll() async {
    state = state.copyWith(isLoading: true);
    try {
      await _authApi.logoutAll();
    } catch (_) {
      // Proceed with local logout regardless
    } finally {
      await _storageService.clearAuthData();
      state = const AuthState(isInitialized: true);
    }
  }

  void handleAuthFailure() {
    state = const AuthState(isInitialized: true);
  }

  void updateUser(UserModel user) {
    state = state.copyWith(user: user);
  }

  void clearError() {
    state = state.copyWith(clearError: true);
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final authApi = ref.watch(authApiProvider);
  final storageService = ref.watch(storageServiceProvider);
  return AuthNotifier(
    authApi: authApi,
    storageService: storageService,
    ref: ref,
  );
});
