import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:smooth_page_indicator/smooth_page_indicator.dart';
import '../../constants/app_colors.dart';
import '../../constants/app_constants.dart';
import '../../models/product_model.dart';
import '../../navigation/routes.dart';
import '../../providers/auth_provider.dart';
import '../../providers/cart_provider.dart';
import '../../providers/products_provider.dart';
import '../../utils/currency_formatter.dart';
import '../../utils/snackbar_utils.dart';
import '../../widgets/cart_badge.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/error_view.dart';
import '../../widgets/quantity_selector.dart';
import '../../widgets/rating_stars.dart';

class ProductDetailsScreen extends ConsumerStatefulWidget {
  final String productId;

  const ProductDetailsScreen({super.key, required this.productId});

  @override
  ConsumerState<ProductDetailsScreen> createState() => _ProductDetailsScreenState();
}

class _ProductDetailsScreenState extends ConsumerState<ProductDetailsScreen> {
  final _pageController = PageController();
  int _selectedQuantity = 1;
  bool _isAdding = false;
  bool _isBuyingNow = false;

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  String _resolveImageUrl(String url) {
    if (url.isEmpty) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    final base = AppConstants.defaultBaseUrl;
    if (url.startsWith('/')) return '$base$url';
    return '$base/$url';
  }

  Future<void> _handleAddToCart(ProductModel product) async {
    final authState = ref.read(authProvider);
    if (!authState.isAuthenticated) {
      SnackbarUtils.showInfo(context, 'Please login to add items to your cart');
      context.push('${AppRoutes.login}?redirect=${AppRoutes.productDetailsPath(product.id)}');
      return;
    }

    setState(() => _isAdding = true);
    final success = await ref
        .read(cartProvider.notifier)
        .addItem(product.id, _selectedQuantity);
    setState(() => _isAdding = false);

    if (mounted && success) {
      SnackbarUtils.showSuccess(
        context,
        'Added $_selectedQuantity x ${product.name} to cart',
      );
    }
  }

  Future<void> _handleBuyNow(ProductModel product) async {
    final authState = ref.read(authProvider);
    if (!authState.isAuthenticated) {
      SnackbarUtils.showInfo(context, 'Please login to checkout');
      context.push('${AppRoutes.login}?redirect=${AppRoutes.productDetailsPath(product.id)}');
      return;
    }

    setState(() => _isBuyingNow = true);
    final success = await ref
        .read(cartProvider.notifier)
        .addItem(product.id, _selectedQuantity);
    setState(() => _isBuyingNow = false);

    if (mounted && success) {
      context.push(AppRoutes.checkout);
    }
  }

  @override
  Widget build(BuildContext context) {
    final productAsync = ref.watch(productDetailsProvider(widget.productId));
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Product Details'),
        actions: [
          CartBadgeIcon(
            onTap: () => context.push(AppRoutes.cart),
            color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: productAsync.when(
        data: (product) => _buildContent(context, product, isDark),
        loading: () => const Center(
          child: CircularProgressIndicator(color: AppColors.primary),
        ),
        error: (err, _) => ErrorView(
          message: 'Failed to load product details.',
          onRetry: () => ref.invalidate(productDetailsProvider(widget.productId)),
        ),
      ),
      bottomNavigationBar: productAsync.whenOrNull(
        data: (product) => _buildBottomBar(context, product, isDark),
      ),
    );
  }

  Widget _buildContent(BuildContext context, ProductModel product, bool isDark) {
    final images = product.images.isNotEmpty
        ? product.images
        : [ProductImage(url: product.primaryImageUrl)];

    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
                // Image Carousel
                Stack(
                  children: [
                    Container(
                      height: 320,
                      width: double.infinity,
                      color: isDark ? AppColors.surfaceDark : Colors.white,
                      child: PageView.builder(
                        controller: _pageController,
                        itemCount: images.length,
                        itemBuilder: (context, index) {
                          final imgUrl = _resolveImageUrl(images[index].url);
                          return imgUrl.isNotEmpty
                              ? CachedNetworkImage(
                                  imageUrl: imgUrl,
                                  fit: BoxFit.contain,
                                  placeholder: (context, url) => const Center(
                                    child: CircularProgressIndicator(strokeWidth: 2),
                                  ),
                                  errorWidget: (context, url, error) => Icon(
                                    Icons.image_not_supported_outlined,
                                    size: 64,
                                    color: Colors.grey.shade400,
                                  ),
                                )
                              : Icon(
                                  Icons.shopping_bag_outlined,
                                  size: 64,
                                  color: Colors.grey.shade400,
                                );
                        },
                      ),
                    ),

                    // Discount Tag
                    if (product.discount > 0)
                      Positioned(
                        top: 16,
                        left: 16,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            gradient: AppColors.accentGradient,
                            borderRadius: BorderRadius.circular(10),
                            boxShadow: [
                              BoxShadow(
                                color: AppColors.secondary.withValues(alpha: 0.4),
                                blurRadius: 8,
                                offset: const Offset(0, 3),
                              ),
                            ],
                          ),
                          child: Text(
                            '${product.discount.toInt()}% OFF',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                      ),

                    // Smooth indicator
                    if (images.length > 1)
                      Positioned(
                        bottom: 12,
                        left: 0,
                        right: 0,
                        child: Center(
                          child: SmoothPageIndicator(
                            controller: _pageController,
                            count: images.length,
                            effect: ExpandingDotsEffect(
                              activeDotColor: AppColors.primary,
                              dotColor: isDark ? Colors.grey.shade700 : Colors.grey.shade300,
                              dotHeight: 8,
                              dotWidth: 8,
                              spacing: 6,
                            ),
                          ),
                        ),
                      ),
                  ],
                ),

                // Details Content
                Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Category & Stock Status Row
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          if (product.category?.name != null)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: AppColors.primary.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                product.category!.name.toUpperCase(),
                                style: const TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.primary,
                                  letterSpacing: 0.5,
                                ),
                              ),
                            ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: product.stock > 0
                                  ? AppColors.success.withValues(alpha: 0.1)
                                  : AppColors.error.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  product.stock > 0 ? Icons.check_circle : Icons.cancel,
                                  size: 12,
                                  color: product.stock > 0 ? AppColors.success : AppColors.error,
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  product.stock > 0
                                      ? (product.stock <= 5
                                          ? 'Only ${product.stock} left in stock!'
                                          : 'In Stock (${product.stock})')
                                      : 'Out of Stock',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                    color: product.stock > 0 ? AppColors.success : AppColors.error,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),

                      // Product Title
                      Text(
                        product.name,
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w800,
                          color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                        ),
                      ),
                      const SizedBox(height: 10),

                      // Rating Row
                      Row(
                        children: [
                          RatingStars(
                            rating: product.rating.average,
                            starSize: 18,
                            reviewCount: product.rating.count,
                          ),
                          const Spacer(),
                          if (product.sku != null)
                            Text(
                              'SKU: ${product.sku}',
                              style: TextStyle(
                                fontSize: 12,
                                color: isDark ? AppColors.textTertiaryDark : AppColors.textTertiaryLight,
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 18),

                      // Price Section
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: isDark ? AppColors.surfaceDark : Colors.grey.shade50,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: isDark ? AppColors.borderDark : AppColors.borderLight,
                          ),
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Price',
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Wrap(
                                    crossAxisAlignment: WrapCrossAlignment.center,
                                    spacing: 8,
                                    runSpacing: 2,
                                    children: [
                                      Text(
                                        CurrencyFormatter.format(product.effectivePrice),
                                        style: TextStyle(
                                          fontSize: 22,
                                          fontWeight: FontWeight.w800,
                                          color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                                        ),
                                      ),
                                      if (product.discount > 0)
                                        Text(
                                          CurrencyFormatter.format(product.price),
                                          style: TextStyle(
                                            fontSize: 13,
                                            color: isDark ? AppColors.textTertiaryDark : AppColors.textTertiaryLight,
                                            decoration: TextDecoration.lineThrough,
                                          ),
                                        ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 8),

                            // Quantity Selector
                            if (product.stock > 0)
                              QuantitySelector(
                                quantity: _selectedQuantity,
                                maxStock: product.stock,
                                onChanged: (qty) => setState(() => _selectedQuantity = qty),
                              ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Description
                      Text(
                        'Description',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        product.description.isNotEmpty
                            ? product.description
                            : 'No product description available for this item.',
                        style: TextStyle(
                          fontSize: 14,
                          height: 1.5,
                          color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                        ),
                      ),

                      // Tags
                      if (product.tags.isNotEmpty) ...[
                        const SizedBox(height: 20),
                        Text(
                          'Tags',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: product.tags.map((tag) {
                            return Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: isDark ? AppColors.surfaceDark : Colors.grey.shade100,
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(
                                  color: isDark ? AppColors.borderDark : AppColors.borderLight,
                                ),
                              ),
                              child: Text(
                                '#$tag',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                                ),
                              ),
                            );
                          }).toList(),
                        ),
                      ],

                const SizedBox(height: 24),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ─── Bottom Action Bar ──────────────────────────────────────────────────
  Widget _buildBottomBar(
      BuildContext context, ProductModel product, bool isDark) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : Colors.white,
        border: Border(
          top: BorderSide(
            color: isDark ? AppColors.borderDark : AppColors.borderLight,
          ),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        child: Row(
          children: [
            // Add to Cart button
            Expanded(
              child: CustomButton(
                text: 'Add to Cart',
                isOutlined: true,
                isLoading: _isAdding,
                icon: const Icon(Icons.shopping_cart_outlined, size: 20),
                onPressed: product.stock > 0
                    ? () => _handleAddToCart(product)
                    : null,
              ),
            ),
            const SizedBox(width: 12),

            // Buy Now button
            Expanded(
              child: CustomButton(
                text: 'Buy Now',
                isLoading: _isBuyingNow,
                icon: const Icon(Icons.flash_on_rounded,
                    size: 20, color: Colors.white),
                onPressed:
                    product.stock > 0 ? () => _handleBuyNow(product) : null,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
