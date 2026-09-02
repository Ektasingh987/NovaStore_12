import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../constants/app_colors.dart';
import '../../constants/app_constants.dart';
import '../../navigation/routes.dart';
import '../../providers/auth_provider.dart';
import '../../providers/cart_provider.dart';
import '../../providers/orders_provider.dart';
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
            padding: const EdgeInsets.fromLTRB(24, 20, 24, 28),
            decoration: BoxDecoration(
              color: isDark ? AppColors.surfaceDark : Colors.white,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
            ),
            child: Form(
              key: formKey,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      margin: const EdgeInsets.only(bottom: 20),
                      decoration: BoxDecoration(
                        color: isDark ? Colors.grey.shade700 : Colors.grey.shade300,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Edit Profile',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w700,
                          color: isDark
                              ? AppColors.textPrimaryDark
                              : AppColors.textPrimaryLight,
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close_rounded),
                        onPressed: () => Navigator.pop(modalContext),
                      ),
                    ],
                  ),
                  const SizedBox(height: 18),
                  CustomTextField(
                    controller: nameController,
                    label: 'Full Name',
                    hintText: 'Enter your name',
                    validator: Validators.name,
                  ),
                  const SizedBox(height: 14),
                  CustomTextField(
                    controller: phoneController,
                    label: 'Phone Number (10 digits)',
                    hintText: '9876543210',
                    keyboardType: TextInputType.phone,
                    maxLength: 10,
                    inputFormatters: [
                      FilteringTextInputFormatter.digitsOnly,
                      LengthLimitingTextInputFormatter(10),
                    ],
                    validator: (val) => Validators.phone(val, isOptional: true),
                  ),
                  const SizedBox(height: 24),
                  CustomButton(
                    text: 'Save Changes',
                    onPressed: () async {
                      if (!formKey.currentState!.validate()) return;
                      final success =
                          await ref.read(userProvider.notifier).updateProfile(
                                name: nameController.text.trim(),
                                phone: phoneController.text.trim(),
                              );
                      if (context.mounted && success) {
                        Navigator.pop(modalContext);
                        SnackbarUtils.showSuccess(
                            context, 'Profile updated successfully!');
                      }
                    },
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  void _confirmLogout(BuildContext context, WidgetRef ref,
      {bool isAllDevices = false}) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text(isAllDevices ? 'Logout All Devices' : 'Sign Out'),
        content: Text(
          isAllDevices
              ? 'Are you sure you want to log out from all devices? All active sessions will be terminated.'
              : 'Are you sure you want to sign out from your account?',
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
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.error,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
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
    final ordersState = ref.watch(ordersProvider);
    final cartState = ref.watch(cartProvider);
    final cartCount = cartState.cart.totalItems;

    final isDark = Theme.of(context).brightness == Brightness.dark;

    if (!authState.isAuthenticated) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('My Profile'),
          centerTitle: true,
        ),
        body: EmptyView(
          title: 'Sign In to Your Account',
          message:
              'Sign in to access your profile, order history, and preferences.',
          icon: Icons.person_outline_rounded,
          buttonText: 'Sign In',
          onButtonPressed: () => context.push(AppRoutes.login),
        ),
      );
    }

    final user = userState.profile ?? authState.user;

    return Scaffold(
      backgroundColor:
          isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
      appBar: AppBar(
        title: const Text(
          'My Profile',
          style: TextStyle(fontWeight: FontWeight.w700),
        ),
        centerTitle: true,
        elevation: 0,
        scrolledUnderElevation: 1,
        // Theme toggle is removed from AppBar actions so it appears in ONLY ONE place
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 40),
        child: Column(
          children: [
            // ─── Hero Profile Card ──────────────────────────────────────
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(22),
              decoration: BoxDecoration(
                color: isDark ? AppColors.cardDark : Colors.white,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(
                  color: isDark ? AppColors.borderDark : AppColors.borderLight,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: isDark ? 0.3 : 0.05),
                    blurRadius: 16,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                children: [
                  // Avatar with Edit Badge
                  Stack(
                    alignment: Alignment.bottomRight,
                    children: [
                      Container(
                        width: 86,
                        height: 86,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: const LinearGradient(
                            colors: [AppColors.primary, AppColors.secondary],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.primary.withValues(alpha: 0.3),
                              blurRadius: 12,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Center(
                          child: Text(
                            user != null && user.name.isNotEmpty
                                ? user.name[0].toUpperCase()
                                : 'U',
                            style: const TextStyle(
                              fontSize: 34,
                              fontWeight: FontWeight.w800,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ),
                      GestureDetector(
                        onTap: () => _showEditProfileDialog(context, ref),
                        child: Container(
                          padding: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            color: AppColors.primary,
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: isDark ? AppColors.cardDark : Colors.white,
                              width: 2.5,
                            ),
                          ),
                          child: const Icon(
                            Icons.edit_rounded,
                            size: 14,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),

                  // Name & Role Badge
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Flexible(
                        child: Text(
                          user?.name ?? 'Valued Customer',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w800,
                            letterSpacing: -0.3,
                            color: isDark
                                ? AppColors.textPrimaryDark
                                : AppColors.textPrimaryLight,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          (user?.role ?? 'customer').toUpperCase(),
                          style: const TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: AppColors.primary,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),

                  // Email
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.email_outlined,
                        size: 14,
                        color: isDark
                            ? AppColors.textSecondaryDark
                            : AppColors.textSecondaryLight,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        user?.email ?? '',
                        style: TextStyle(
                          fontSize: 13,
                          color: isDark
                              ? AppColors.textSecondaryDark
                              : AppColors.textSecondaryLight,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),

                  // Phone (if provided)
                  if (user?.phone != null && user!.phone!.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.phone_outlined,
                          size: 14,
                          color: isDark
                              ? AppColors.textTertiaryDark
                              : AppColors.textTertiaryLight,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          user.phone!,
                          style: TextStyle(
                            fontSize: 12,
                            color: isDark
                                ? AppColors.textTertiaryDark
                                : AppColors.textTertiaryLight,
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 18),

            // ─── Quick Stats Summary ──────────────────────────────────
            Row(
              children: [
                Expanded(
                  child: _buildStatTile(
                    icon: Icons.receipt_long_rounded,
                    value: '${ordersState.orders.length}',
                    label: 'Orders',
                    color: AppColors.primary,
                    isDark: isDark,
                    onTap: () => context.push(AppRoutes.orders),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildStatTile(
                    icon: Icons.shopping_bag_rounded,
                    value: '$cartCount',
                    label: 'In Cart',
                    color: AppColors.accent,
                    isDark: isDark,
                    onTap: () => context.push(AppRoutes.cart),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildStatTile(
                    icon: Icons.verified_user_rounded,
                    value: 'Active',
                    label: 'Status',
                    color: AppColors.success,
                    isDark: isDark,
                    onTap: () {},
                  ),
                ),
              ],
            ),
            const SizedBox(height: 22),

            // ─── Account & Orders Section ──────────────────────────────
            _buildSectionCard(
              title: 'ACCOUNT & ORDERS',
              isDark: isDark,
              children: [
                _buildActionTile(
                  icon: Icons.receipt_long_outlined,
                  iconColor: AppColors.primary,
                  title: 'My Orders',
                  subtitle: 'View history & live shipment status',
                  onTap: () => context.push(AppRoutes.orders),
                  isDark: isDark,
                ),
                _buildDivider(isDark),
                _buildActionTile(
                  icon: Icons.shopping_cart_outlined,
                  iconColor: AppColors.accent,
                  title: 'Shopping Cart',
                  subtitle: '$cartCount items waiting for checkout',
                  onTap: () => context.push(AppRoutes.cart),
                  isDark: isDark,
                ),
                _buildDivider(isDark),
                _buildActionTile(
                  icon: Icons.edit_outlined,
                  iconColor: AppColors.secondary,
                  title: 'Edit Profile Information',
                  subtitle: 'Update your name and phone number',
                  onTap: () => _showEditProfileDialog(context, ref),
                  isDark: isDark,
                ),
              ],
            ),
            const SizedBox(height: 18),

            // ─── Preferences (ONLY PLACE with Theme Toggle) ───────────
            _buildSectionCard(
              title: 'PREFERENCES & APPEARANCE',
              isDark: isDark,
              children: [
                // Exclusive Single Theme Switch
                ListTile(
                  contentPadding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                  leading: Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: (themeMode == ThemeMode.dark
                              ? AppColors.primary
                              : Colors.amber)
                          .withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      themeMode == ThemeMode.dark
                          ? Icons.dark_mode_rounded
                          : Icons.light_mode_rounded,
                      color: themeMode == ThemeMode.dark
                          ? AppColors.primary
                          : Colors.amber.shade800,
                      size: 22,
                    ),
                  ),
                  title: const Text(
                    'Dark Theme',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  subtitle: Text(
                    themeMode == ThemeMode.dark
                        ? 'Dark mode is currently active'
                        : 'Light mode is currently active',
                    style: TextStyle(
                      fontSize: 12,
                      color: isDark
                          ? AppColors.textTertiaryDark
                          : AppColors.textTertiaryLight,
                    ),
                  ),
                  trailing: Switch.adaptive(
                    value: themeMode == ThemeMode.dark,
                    activeThumbColor: Colors.white,
                    activeTrackColor: AppColors.primary,
                    inactiveThumbColor: Colors.white,
                    inactiveTrackColor:
                        isDark ? Colors.grey.shade700 : Colors.grey.shade400,
                    onChanged: (_) =>
                        ref.read(themeProvider.notifier).toggleTheme(),
                  ),
                  onTap: () => ref.read(themeProvider.notifier).toggleTheme(),
                ),
                _buildDivider(isDark),
                _buildActionTile(
                  icon: Icons.info_outline_rounded,
                  iconColor: Colors.blueGrey,
                  title: 'About ${AppConstants.appName}',
                  subtitle: 'Version 1.0.0 • Production Build',
                  onTap: () {},
                  isDark: isDark,
                  showChevron: false,
                ),
              ],
            ),
            const SizedBox(height: 18),

            // ─── Security & Logout ─────────────────────────────────────
            _buildSectionCard(
              title: 'SECURITY & SESSIONS',
              isDark: isDark,
              children: [
                _buildActionTile(
                  icon: Icons.logout_rounded,
                  iconColor: AppColors.error,
                  title: 'Sign Out',
                  subtitle: 'Log out from this device',
                  titleColor: AppColors.error,
                  onTap: () =>
                      _confirmLogout(context, ref, isAllDevices: false),
                  isDark: isDark,
                ),
                _buildDivider(isDark),
                _buildActionTile(
                  icon: Icons.devices_other_rounded,
                  iconColor: AppColors.error,
                  title: 'Sign Out All Devices',
                  subtitle: 'Revoke active sessions across all devices',
                  titleColor: AppColors.error,
                  onTap: () => _confirmLogout(context, ref, isAllDevices: true),
                  isDark: isDark,
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Footer Brand
            Text(
              'NovaStore • Crafted for Speed & Security',
              style: TextStyle(
                fontSize: 12,
                color: isDark
                    ? AppColors.textTertiaryDark
                    : AppColors.textTertiaryLight,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatTile({
    required IconData icon,
    required String value,
    required String label,
    required Color color,
    required bool isDark,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 10),
        decoration: BoxDecoration(
          color: isDark ? AppColors.cardDark : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isDark ? AppColors.borderDark : AppColors.borderLight,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.03),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, size: 18, color: color),
            ),
            const SizedBox(height: 8),
            Text(
              value,
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: isDark
                    ? AppColors.textPrimaryDark
                    : AppColors.textPrimaryLight,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w500,
                color: isDark
                    ? AppColors.textTertiaryDark
                    : AppColors.textTertiaryLight,
              ),
            ),
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
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark ? AppColors.borderDark : AppColors.borderLight,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.03),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(18, 14, 18, 8),
            child: Text(
              title,
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w800,
                color: AppColors.primary,
                letterSpacing: 0.8,
              ),
            ),
          ),
          ...children,
        ],
      ),
    );
  }

  Widget _buildActionTile({
    required IconData icon,
    required Color iconColor,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
    required bool isDark,
    Color? titleColor,
    bool showChevron = true,
  }) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
      leading: Container(
        width: 38,
        height: 38,
        decoration: BoxDecoration(
          color: iconColor.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: iconColor, size: 20),
      ),
      title: Text(
        title,
        style: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: titleColor ??
              (isDark
                  ? AppColors.textPrimaryDark
                  : AppColors.textPrimaryLight),
        ),
      ),
      subtitle: Text(
        subtitle,
        style: TextStyle(
          fontSize: 12,
          color: isDark
              ? AppColors.textTertiaryDark
              : AppColors.textTertiaryLight,
        ),
      ),
      trailing: showChevron
          ? Icon(
              Icons.chevron_right_rounded,
              size: 20,
              color: isDark
                  ? AppColors.textTertiaryDark
                  : AppColors.textTertiaryLight,
            )
          : null,
      onTap: onTap,
    );
  }

  Widget _buildDivider(bool isDark) {
    return Divider(
      height: 1,
      thickness: 0.8,
      indent: 68,
      endIndent: 16,
      color: isDark ? AppColors.borderDark : AppColors.borderLight,
    );
  }
}
