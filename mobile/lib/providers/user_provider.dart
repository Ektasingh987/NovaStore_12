import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api/user_api.dart';
import '../models/api_response.dart';
import '../models/user_model.dart';
import 'auth_provider.dart';
import 'core_providers.dart';

class UserState {
  final UserModel? profile;
  final bool isLoading;
  final bool isUpdating;
  final String? error;
  final String? successMessage;

  const UserState({
    this.profile,
    this.isLoading = false,
    this.isUpdating = false,
    this.error,
    this.successMessage,
  });

  UserState copyWith({
    UserModel? profile,
    bool? isLoading,
    bool? isUpdating,
    String? error,
    String? successMessage,
    bool clearError = false,
    bool clearSuccess = false,
  }) {
    return UserState(
      profile: profile ?? this.profile,
      isLoading: isLoading ?? this.isLoading,
      isUpdating: isUpdating ?? this.isUpdating,
      error: clearError ? null : (error ?? this.error),
      successMessage: clearSuccess ? null : (successMessage ?? this.successMessage),
    );
  }
}

class UserNotifier extends StateNotifier<UserState> {
  final UserApi _userApi;
  final Ref _ref;

  UserNotifier(this._userApi, this._ref) : super(const UserState()) {
    _ref.listen(authProvider, (previous, next) {
      if (next.isAuthenticated && (previous == null || !previous.isAuthenticated)) {
        fetchProfile();
      } else if (!next.isAuthenticated) {
        state = const UserState();
      }
    });

    if (_ref.read(authProvider).isAuthenticated) {
      fetchProfile();
    }
  }

  Future<void> fetchProfile() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final profile = await _userApi.getProfile();
      state = state.copyWith(profile: profile, isLoading: false);
      _ref.read(authProvider.notifier).updateUser(profile);
    } on ApiException catch (e) {
      state = state.copyWith(isLoading: false, error: e.message);
    } catch (_) {
      state = state.copyWith(isLoading: false, error: 'Failed to load profile');
    }
  }

  Future<bool> updateProfile({
    String? name,
    String? phone,
  }) async {
    state = state.copyWith(isUpdating: true, clearError: true, clearSuccess: true);
    try {
      final updated = await _userApi.updateProfile(
        name: name,
        phone: phone,
      );
      state = state.copyWith(
        profile: updated,
        isUpdating: false,
        successMessage: 'Profile updated successfully!',
      );
      _ref.read(authProvider.notifier).updateUser(updated);
      return true;
    } on ApiException catch (e) {
      state = state.copyWith(isUpdating: false, error: e.message);
      return false;
    } catch (_) {
      state = state.copyWith(isUpdating: false, error: 'Failed to update profile');
      return false;
    }
  }

  void clearMessages() {
    state = state.copyWith(clearError: true, clearSuccess: true);
  }
}

final userProvider = StateNotifierProvider<UserNotifier, UserState>((ref) {
  final api = ref.watch(userApiProvider);
  return UserNotifier(api, ref);
});
