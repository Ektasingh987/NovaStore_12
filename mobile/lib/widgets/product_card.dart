import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../constants/app_colors.dart';
import '../models/product_model.dart';
import '../providers/cart_provider.dart';
import '../utils/currency_formatter.dart';
import '../utils/image_utils.dart';
import '../utils/snackbar_utils.dart';
import 'rating_stars.dart';

class ProductCard extends ConsumerWidget {
  final ProductModel product;
  final VoidCallback? onTap;
  final double? width;

  const ProductCard({
    super.key,
    required this.product,
    this.onTap,
    this.width,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final imageUrl = ImageUtils.resolveUrl(product.primaryImageUrl);

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        width: width,
        decoration: BoxDecoration(
          color: isDark ? AppColors.cardDark : AppColors.cardLight,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isDark ? AppColors.borderDark : AppColors.borderLight,
            width: 1,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: isDark ? 0.25 : 0.04),
              blurRadius: 10,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image Stack
            Stack(
              children: [
                ClipRRect(
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(15)),
                  child: AspectRatio(
                    aspectRatio: 1.15,
                    child: imageUrl.isNotEmpty
                        ? CachedNetworkImage(
                            imageUrl: imageUrl,
                            fit: BoxFit.cover,
                            memCacheWidth: 350,
                            memCacheHeight: 350,
                            maxWidthDiskCache: 600,
                            maxHeightDiskCache: 600,
                            fadeInDuration: const Duration(milliseconds: 200),
                            fadeOutDuration: const Duration(milliseconds: 100),
                            placeholder: (context, url) => Container(
                              color: isDark ? AppColors.surfaceDark : Colors.grey.shade100,
                              child: const Center(
                                child: SizedBox(
                                  width: 22,
                                  height: 22,
                                  child: CircularProgressIndicator(strokeWidth: 2),
                                ),
                              ),
                            ),
                            errorWidget: (context, url, error) => Container(
                              color: isDark ? AppColors.surfaceDark : Colors.grey.shade100,
                              child: Icon(
                                Icons.image_not_supported_outlined,
                                color: Colors.grey.shade400,
                                size: 32,
                              ),
                            ),
                          )
                        : Container(
                            color: isDark ? AppColors.surfaceDark : Colors.grey.shade100,
                            child: Icon(
                              Icons.shopping_bag_outlined,
                              color: Colors.grey.shade400,
                              size: 32,
                            ),
                          ),
                  ),
                ),

                // Discount Badge
                if (product.discount > 0)
                  Positioned(
                    top: 8,
                    left: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                      decoration: BoxDecoration(
                        gradient: AppColors.accentGradient,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        '${product.discount.toInt()}% OFF',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 9.5,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                  ),

                // Out of stock overlay
                if (product.stock <= 0)
                  Positioned.fill(
                    child: Container(
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.55),
                        borderRadius: const BorderRadius.vertical(top: Radius.circular(15)),
                      ),
                      child: const Center(
                        child: ContainerBadge(
                          text: 'Out of Stock',
                          color: AppColors.error,
                        ),
                      ),
                    ),
                  ),
              ],
            ),

            // Content
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        // Category / Tags
                        if (product.category?.name != null)
                          Text(
                            product.category!.name.toUpperCase(),
                            style: const TextStyle(
                              fontSize: 9.5,
                              letterSpacing: 0.4,
                              fontWeight: FontWeight.w700,
                              color: AppColors.primary,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        const SizedBox(height: 2),

                        // Title
                        Text(
                          product.name,
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                            height: 1.25,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 4),

                        // Rating
                        RatingStars(
                          rating: product.rating.average,
                          reviewCount: product.rating.count > 0 ? product.rating.count : null,
                          starSize: 12,
                          textStyle: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w600),
                        ),
                      ],
                    ),

                    // Price & Add to Cart row
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                CurrencyFormatter.formatCompact(product.effectivePrice),
                                style: TextStyle(
                                  fontSize: 14.5,
                                  fontWeight: FontWeight.w800,
                                  color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                                ),
                              ),
                              if (product.discount > 0)
                                Text(
                                  CurrencyFormatter.formatCompact(product.price),
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: isDark ? AppColors.textTertiaryDark : AppColors.textTertiaryLight,
                                    decoration: TextDecoration.lineThrough,
                                  ),
                                ),
                            ],
                          ),
                        ),

                        // Add to Cart Button
                        Material(
                          color: Colors.transparent,
                          child: InkWell(
                            onTap: product.stock > 0
                                ? () async {
                                    final success = await ref
                                        .read(cartProvider.notifier)
                                        .addItem(product.id, 1);
                                    if (success && context.mounted) {
                                      SnackbarUtils.showSuccess(
                                        context,
                                        'Added ${product.name} to cart',
                                      );
                                    }
                                  }
                                : null,
                            borderRadius: BorderRadius.circular(9),
                            child: Container(
                              padding: const EdgeInsets.all(7),
                              decoration: BoxDecoration(
                                color: product.stock > 0
                                    ? AppColors.primary
                                    : Colors.grey.shade400,
                                borderRadius: BorderRadius.circular(9),
                              ),
                              child: const Icon(
                                Icons.add_shopping_cart_rounded,
                                color: Colors.white,
                                size: 16,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class ContainerBadge extends StatelessWidget {
  final String text;
  final Color color;

  const ContainerBadge({
    super.key,
    required this.text,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        text,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 10,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}
