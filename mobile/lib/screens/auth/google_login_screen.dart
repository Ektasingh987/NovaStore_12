import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_sign_in/google_sign_in.dart';
import '../../constants/app_colors.dart';
import '../../constants/app_constants.dart';
import '../../navigation/routes.dart';
import '../../providers/auth_provider.dart';
import '../../utils/snackbar_utils.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/custom_text_field.dart';

class GoogleLoginScreen extends ConsumerStatefulWidget {
  const GoogleLoginScreen({super.key});

  @override
  ConsumerState<GoogleLoginScreen> createState() => _GoogleLoginScreenState();
}

class _GoogleLoginScreenState extends ConsumerState<GoogleLoginScreen> {
  final _tokenController = TextEditingController(text: 'mock_google_id_token_test');
  bool _isNativeSigningIn = false;

  final GoogleSignIn _googleSignIn = GoogleSignIn(
    scopes: ['email', 'profile'],
    clientId: kIsWeb ? AppConstants.googleWebClientId : null,
    serverClientId: AppConstants.googleServerClientId,
  );

  @override
  void dispose() {
    _tokenController.dispose();
    super.dispose();
  }

  Future<void> _handleNativeGoogleSignIn() async {
    setState(() => _isNativeSigningIn = true);
    try {
      final googleAccount = await _googleSignIn.signIn();
      if (googleAccount == null) {
        // User cancelled sign in
        setState(() => _isNativeSigningIn = false);
        return;
      }

      final googleAuth = await googleAccount.authentication;
      final idToken = googleAuth.idToken ?? googleAuth.accessToken;

      if (idToken != null && idToken.isNotEmpty) {
        final success = await ref.read(authProvider.notifier).googleLogin(idToken);
        if (mounted) {
          if (success) {
            SnackbarUtils.showSuccess(context, 'Welcome ${googleAccount.displayName ?? 'back'}!');
            context.go(AppRoutes.home);
          } else {
            final error = ref.read(authProvider).error ?? 'Google authentication failed';
            SnackbarUtils.showError(context, error);
          }
        }
      } else {
        if (mounted) {
          SnackbarUtils.showError(context, 'Could not obtain Google ID Token');
        }
      }
    } catch (e) {
      if (mounted) {
        SnackbarUtils.showError(context, 'Google Sign-In note: $e');
      }
    } finally {
      if (mounted) setState(() => _isNativeSigningIn = false);
    }
  }

  Future<void> _handleTokenSubmit() async {
    final token = _tokenController.text.trim();
    if (token.isEmpty) {
      SnackbarUtils.showError(context, 'Please enter a Google ID token');
      return;
    }

    final success = await ref.read(authProvider.notifier).googleLogin(token);

    if (mounted) {
      if (success) {
        SnackbarUtils.showSuccess(context, 'Google authentication successful!');
        context.go(AppRoutes.home);
      } else {
        final error = ref.read(authProvider).error ?? 'Google authentication failed';
        SnackbarUtils.showError(context, error);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Google Sign-In'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 10),
              Center(
                child: Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: isDark ? AppColors.surfaceDark : Colors.white,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.08),
                        blurRadius: 16,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.g_mobiledata_rounded,
                    size: 56,
                    color: AppColors.primary,
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Text(
                'Continue with Google',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                  color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                'Authenticate your account securely using Google OAuth 2.0',
                style: TextStyle(
                  fontSize: 13.5,
                  color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 28),

              // One-Tap Native Google Button
              CustomButton(
                text: 'Sign In with Google Account',
                onPressed: _handleNativeGoogleSignIn,
                isLoading: _isNativeSigningIn,
                icon: const Icon(Icons.login_rounded, size: 20, color: Colors.white),
              ),
              const SizedBox(height: 24),

              // Divider
              Row(
                children: [
                  Expanded(child: Divider(color: isDark ? AppColors.borderDark : AppColors.borderLight)),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 14),
                    child: Text(
                      'OR TEST WITH TOKEN',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: isDark ? AppColors.textTertiaryDark : AppColors.textTertiaryLight,
                      ),
                    ),
                  ),
                  Expanded(child: Divider(color: isDark ? AppColors.borderDark : AppColors.borderLight)),
                ],
              ),
              const SizedBox(height: 20),

              CustomTextField(
                controller: _tokenController,
                label: 'Google ID Token',
                hintText: 'Enter ID Token or use test token',
                maxLines: 2,
                prefixIcon: const Icon(Icons.vpn_key_outlined, size: 20),
              ),
              const SizedBox(height: 16),
              CustomButton(
                text: 'Submit ID Token',
                isOutlined: true,
                onPressed: _handleTokenSubmit,
                isLoading: authState.isLoading && !_isNativeSigningIn,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
