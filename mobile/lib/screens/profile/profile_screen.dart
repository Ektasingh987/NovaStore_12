import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../constants/app_colors.dart';
import '../../constants/app_constants.dart';
import '../../navigation/routes.dart';
import '../../providers/auth_provider.dart';
import '../../providers/theme_provider.dart';
import '../../providers/user_provider.dart';
import '../../utils/snackbar_utils.dart';
import '../../utils/validators.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/custom_text_field.dart';
import '../../widgets/empty_view.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  void _showEditProfileDialog(BuildContext context, WidgetRef ref) {
    final user = ref.read(authProvider).user;
    final nameController = TextEditingController(text: user?.name ?? '');
    final phoneController = TextEditingController(text: user?.phone ?? '');
    final formKey = GlobalKey<FormState>();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (modalContext) {
        final isDark = Theme.of(context).brightness == Brightness.dark;

        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(modalContext).viewInsets.bottom,
          ),
          child: Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: isDark ? AppColors.surfaceDark : Colors.white,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
            ),
            child: Form(
              key: formKey,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Edit Profile',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: () => Navigator.pop(modalContext),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  CustomTextField(
                    controller: nameController,
                    label: 'Full Name',
                    hintText: 'Enter your name',
                    validator: Validators.name,
                  ),
                  const SizedBox(height: 14),
                  CustomTextField(
                    controller: phoneController,
                    label: 'Phone Number',
                    hintText: '+91 9876543210',
                    keyboardType: TextInputType.phone,
                    validator: (val) => Validators.phone(val, isOptional: true),
                  ),
                  const SizedBox(height: 24),
                  CustomButton(
                    text: 'Save Changes',
                    onPressed: () async {
                      if (!formKey.currentState!.validate()) return;
                      final success = await ref.read(userProvider.notifier).updateProfile(
                            name: nameController.text.trim(),
                            phone: phoneController.text.trim(),
                          );
                      if (context.mounted && success) {
                        Navigator.pop(modalContext);
                        SnackbarUtils.showSuccess(context, 'Profile updated successfully!');
                      }
                    },
                  ),
                  const SizedBox(height: 12),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  void _confirmLogout(BuildContext context, WidgetRef ref, {bool isAllDevices = false}) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(isAllDevices ? 'Logout All Devices' : 'Sign Out'),
        content: Text(
          isAllDevices
              ? 'Are you sure you want to log out from all devices? All active sessions will be terminated.'
              : 'Are you sure you want to sign out?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
              if (isAllDevices) {
                await ref.read(authProvider.notifier).logoutAll();
              } else {
                await ref.read(authProvider.notifier).logout();
              }
              if (context.mounted) {
                SnackbarUtils.showSuccess(context, 'Logged out successfully');
                context.go(AppRoutes.home);
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
            child: Text(isAllDevices ? 'Logout All' : 'Sign Out'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final userState = ref.watch(userProvider);
    final themeMode = ref.watch(themeProvider);
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    if (!authState.isAuthenticated) {
      return Scaffold(
        appBar: AppBar(title: const Text('Profile')),
        body: EmptyView(
          title: 'Sign In to Your Account',
          message: 'Sign in to access your profile, order history, and preferences.',
          icon: Icons.person_outline_rounded,
          buttonText: 'Sign In',
          onButtonPressed: () => context.push(AppRoutes.login),
        ),
      );
    }

    final user = userState.profile ?? authState.user;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile'),
        actions: [
          IconButton(
            icon: Icon(
              themeMode == ThemeMode.dark ? Icons.light_mode_outlined : Icons.dark_mode_outlined,
            ),
            tooltip: 'Toggle Theme',
            onPressed: () => ref.read(themeProvider.notifier).toggleTheme(),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            // User Avatar & Name Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: isDark ? AppColors.cardDark : Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: isDark ? AppColors.borderDark : AppColors.borderLight,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(isDark ? 0.2 : 0.03),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                children: [
                  CircleAvatar(
                    radius: 40,
                    backgroundColor: AppColors.primary.withOpacity(0.12),
                    child: Text(
                      user != null && user.name.isNotEmpty
                          ? user.name[0].toUpperCase()
                          : 'U',
                      style: const TextStyle(
                        fontSize: 32,
                        fontWeight: FontWeight.w800,
                        color: AppColors.primary,
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),
                  Text(
                    user?.name ?? 'Customer',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    user?.email ?? '',
                    style: TextStyle(
                      fontSize: 13,
                      color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                    ),
                  ),
                  if (user?.phone != null && user!.phone!.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(
                      user.phone!,
                      style: TextStyle(
                        fontSize: 13,
                        color: isDark ? AppColors.textTertiaryDark : AppColors.textTertiaryLight,
                      ),
                    ),
                  ],
                  const SizedBox(height: 14),
                  OutlinedButton.icon(
                    onPressed: () => _showEditProfileDialog(context, ref),
                    icon: const Icon(Icons.edit_outlined, size: 16),
                    label: const Text('Edit Profile'),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Account & Settings Options
            _buildSectionCard(
              title: 'Account & Orders',
              isDark: isDark,
              children: [
                _buildListTile(
                  icon: Icons.receipt_long_outlined,
                  title: 'My Orders',
                  subtitle: 'Track, view, and manage your orders',
                  onTap: () => context.push(AppRoutes.orders),
                  isDark: isDark,
                ),
                _buildListTile(
                  icon: Icons.shopping_bag_outlined,
                  title: 'My Cart',
                  subtitle: 'View items saved in your cart',
                  onTap: () => context.push(AppRoutes.cart),
                  isDark: isDark,
                ),
              ],
            ),
            const SizedBox(height: 16),

            // App Settings
            _buildSectionCard(
              title: 'Preferences',
              isDark: isDark,
              children: [
                _buildListTile(
                  icon: Icons.brightness_6_outlined,
                  title: 'Dark Mode',
                  subtitle: themeMode == ThemeMode.dark ? 'Enabled' : 'Disabled',
                  trailing: Switch(
                    value: themeMode == ThemeMode.dark,
                    activeColor: AppColors.primary,
                    onChanged: (_) => ref.read(themeProvider.notifier).toggleTheme(),
                  ),
                  onTap: () => ref.read(themeProvider.notifier).toggleTheme(),
                  isDark: isDark,
                ),
                _buildListTile(
                  icon: Icons.info_outline_rounded,
                  title: 'About ${AppConstants.appName}',
                  subtitle: 'Version 1.0.0',
                  isDark: isDark,
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Security & Sign Out
            _buildSectionCard(
              title: 'Security & Sessions',
              isDark: isDark,
              children: [
                _buildListTile(
                  icon: Icons.logout_rounded,
                  title: 'Sign Out',
                  subtitle: 'Sign out from this device',
                  textColor: AppColors.error,
                  iconColor: AppColors.error,
                  onTap: () => _confirmLogout(context, ref, isAllDevices: false),
                  isDark: isDark,
                ),
                _buildListTile(
                  icon: Icons.devices_other_rounded,
                  title: 'Logout All Devices',
                  subtitle: 'Revoke sessions across all browsers and apps',
                  textColor: AppColors.error,
                  iconColor: AppColors.error,
                  onTap: () => _confirmLogout(context, ref, isAllDevices: true),
                  isDark: isDark,
                ),
              ],
            ),
            const SizedBox(height: 30),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionCard({
    required String title,
    required List<Widget> children,
    required bool isDark,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppColors.cardDark : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? AppColors.borderDark : AppColors.borderLight,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 6),
            child: Text(
              title,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: AppColors.primary,
                letterSpacing: 0.3,
              ),
            ),
          ),
          ...children,
        ],
      ),
    );
  }

  Widget _buildListTile({
    required IconData icon,
    required String title,
    required String subtitle,
    VoidCallback? onTap,
    Widget? trailing,
    Color? textColor,
    Color? iconColor,
    required bool isDark,
  }) {
    return ListTile(
      leading: Icon(icon, color: iconColor ?? (isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight), size: 22),
      title: Text(
        title,
        style: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: textColor ?? (isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight),
        ),
      ),
      subtitle: Text(
        subtitle,
        style: TextStyle(
          fontSize: 12,
          color: isDark ? AppColors.textTertiaryDark : AppColors.textTertiaryLight,
        ),
      ),
      trailing: trailing ?? (onTap != null ? const Icon(Icons.chevron_right, size: 20) : null),
      onTap: onTap,
    );
  }
}
