import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../constants/app_colors.dart';
import '../../constants/app_constants.dart';
import '../../models/cart_model.dart';
import '../../navigation/routes.dart';
import '../../providers/auth_provider.dart';
import '../../providers/cart_provider.dart';
import '../../utils/currency_formatter.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/empty_view.dart';
import '../../widgets/error_view.dart';
import '../../widgets/quantity_selector.dart';

class CartScreen extends ConsumerWidget {
  const CartScreen({super.key});

  String _resolveImageUrl(String? url) {
    if (url == null || url.isEmpty) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    final base = AppConstants.defaultBaseUrl;
    if (url.startsWith('/')) return '$base$url';
    return '$base/$url';
  }

  void _showClearConfirmation(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Clear Cart'),
        content: const Text('Are you sure you want to remove all items from your cart?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              ref.read(cartProvider.notifier).clearCart();
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
            child: const Text('Clear All'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final cartState = ref.watch(cartProvider);
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    if (!authState.isAuthenticated) {
      return Scaffold(
        appBar: AppBar(
          leading: IconButton(
            icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
            onPressed: () {
              if (Navigator.of(context).canPop()) {
                Navigator.of(context).pop();
              } else {
                context.go(AppRoutes.home);
              }
            },
          ),
          title: const Text('My Cart'),
        ),
        body: EmptyView(
          title: 'Sign In to View Your Cart',
          message: 'Please log in to your account to view and manage your shopping cart.',
          icon: Icons.lock_outline_rounded,
          buttonText: 'Sign In',
          onButtonPressed: () => context.push(AppRoutes.login),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
          onPressed: () {
            if (Navigator.of(context).canPop()) {
              Navigator.of(context).pop();
            } else {
              context.go(AppRoutes.home);
            }
          },
        ),
        title: Text('My Cart (${cartState.totalItemCount})'),
        actions: [
          if (!cartState.isEmpty)
            IconButton(
              icon: const Icon(Icons.delete_sweep_outlined, color: AppColors.error),
              tooltip: 'Clear Cart',
              onPressed: () => _showClearConfirmation(context, ref),
            ),
          const SizedBox(width: 8),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.read(cartProvider.notifier).fetchCart(),
        color: AppColors.primary,
        child: cartState.isLoading && cartState.cart.items.isEmpty
            ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
            : cartState.error != null && cartState.cart.items.isEmpty
                ? ErrorView(
                    message: cartState.error,
                    onRetry: () => ref.read(cartProvider.notifier).fetchCart(),
                  )
                : cartState.isEmpty
                    ? EmptyView(
                        title: 'Your cart is empty',
                        message: 'Explore our catalog and find something you love!',
                        icon: Icons.remove_shopping_cart_outlined,
                        buttonText: 'Start Shopping',
                        onButtonPressed: () => context.go(AppRoutes.products),
                      )
                    : Column(
                        children: [
                          Expanded(
                            child: ListView.separated(
                              padding: const EdgeInsets.all(16),
                              itemCount: cartState.cart.items.length,
                              separatorBuilder: (context, index) => const SizedBox(height: 12),
                              itemBuilder: (context, index) {
                                final item = cartState.cart.items[index];
                                return _buildCartItemTile(context, ref, item, isDark);
                              },
                            ),
                          ),

                          // Price Breakdown & Checkout Button
                          _buildCheckoutSummary(context, ref, cartState.cart, isDark),
                        ],
                      ),
      ),
    );
  }

  Widget _buildCartItemTile(
    BuildContext context,
    WidgetRef ref,
    CartItemModel item,
    bool isDark,
  ) {
    final product = item.product;
    final imageUrl = _resolveImageUrl(product?.primaryImageUrl);
    final title = product?.name ?? 'Product (${item.productId})';
    final price = item.unitPrice;
    final originalPrice = item.originalUnitPrice;
    final stock = product?.stock ?? 99;

    return Dismissible(
      key: Key(item.productId),
      direction: DismissDirection.endToStart,
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        decoration: BoxDecoration(
          color: AppColors.error,
          borderRadius: BorderRadius.circular(16),
        ),
        child: const Icon(Icons.delete_outline, color: Colors.white, size: 28),
      ),
      onDismissed: (_) {
        ref.read(cartProvider.notifier).removeItem(item.productId);
      },
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isDark ? AppColors.cardDark : AppColors.cardLight,
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
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: SizedBox(
                width: 80,
                height: 80,
                child: imageUrl.isNotEmpty
                    ? CachedNetworkImage(
                        imageUrl: imageUrl,
                        fit: BoxFit.cover,
                        errorWidget: (context, url, error) => Container(
                          color: isDark ? AppColors.surfaceDark : Colors.grey.shade100,
                          child: const Icon(Icons.image_not_supported_outlined, size: 28),
                        ),
                      )
                    : Container(
                        color: isDark ? AppColors.surfaceDark : Colors.grey.shade100,
                        child: const Icon(Icons.shopping_bag_outlined, size: 28),
                      ),
              ),
            ),
            const SizedBox(width: 14),

            // Info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Text(
                        CurrencyFormatter.format(price),
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                        ),
                      ),
                      if (originalPrice > price) ...[
                        const SizedBox(width: 6),
                        Text(
                          CurrencyFormatter.format(originalPrice),
                          style: TextStyle(
                            fontSize: 12,
                            color: isDark ? AppColors.textTertiaryDark : AppColors.textTertiaryLight,
                            decoration: TextDecoration.lineThrough,
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 10),

                  // Actions Row: Quantity Selector & Delete
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      QuantitySelector(
                        quantity: item.quantity,
                        maxStock: stock,
                        isCompact: true,
                        onChanged: (newQty) {
                          if (newQty <= 0) {
                            ref.read(cartProvider.notifier).removeItem(item.productId);
                          } else {
                            ref.read(cartProvider.notifier).updateQuantity(item.productId, newQty);
                          }
                        },
                      ),
                      IconButton(
                        icon: const Icon(Icons.delete_outline, size: 20, color: AppColors.error),
                        onPressed: () {
                          ref.read(cartProvider.notifier).removeItem(item.productId);
                        },
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCheckoutSummary(
    BuildContext context,
    WidgetRef ref,
    CartModel cart,
    bool isDark,
  ) {
    final subtotal = cart.calculatedSubtotal;
    final discount = cart.calculatedDiscount;
    final delivery = cart.calculatedDeliveryCharge;
    final total = cart.calculatedTotal;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        border: Border(
          top: BorderSide(
            color: isDark ? AppColors.borderDark : AppColors.borderLight,
          ),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.08),
            blurRadius: 16,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Subtotal
            _buildSummaryRow(
              'Subtotal',
              CurrencyFormatter.format(subtotal),
              isDark: isDark,
            ),
            const SizedBox(height: 8),

            // Discount
            if (discount > 0) ...[
              _buildSummaryRow(
                'Discount',
                '- ${CurrencyFormatter.format(discount)}',
                valueColor: AppColors.success,
                isDark: isDark,
              ),
              const SizedBox(height: 8),
            ],

            // Delivery Charge
            _buildSummaryRow(
              'Delivery Charge',
              delivery == 0 ? 'FREE' : CurrencyFormatter.format(delivery),
              valueColor: delivery == 0 ? AppColors.success : null,
              isDark: isDark,
            ),
            const SizedBox(height: 12),
            Divider(color: isDark ? AppColors.borderDark : AppColors.borderLight),
            const SizedBox(height: 12),

            // Total
            _buildSummaryRow(
              'Total Amount',
              CurrencyFormatter.format(total),
              isTotal: true,
              isDark: isDark,
            ),
            const SizedBox(height: 18),

            // Checkout Button
            CustomButton(
              text: 'Proceed to Checkout',
              onPressed: () {
                context.push(AppRoutes.checkout);
              },
              icon: const Icon(Icons.arrow_forward_rounded, size: 20, color: Colors.white),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSummaryRow(
    String label,
    String value, {
    bool isTotal = false,
    Color? valueColor,
    required bool isDark,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: isTotal ? 16 : 14,
            fontWeight: isTotal ? FontWeight.w700 : FontWeight.w500,
            color: isTotal
                ? (isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight)
                : (isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight),
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: isTotal ? 20 : 14,
            fontWeight: isTotal ? FontWeight.w800 : FontWeight.w600,
            color: valueColor ??
                (isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight),
          ),
        ),
      ],
    );
  }
}
