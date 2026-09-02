import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../constants/app_colors.dart';
import '../../navigation/routes.dart';
import '../../providers/auth_provider.dart';
import '../../providers/categories_provider.dart';
import '../../providers/products_provider.dart';
import '../../widgets/cart_badge.dart';
import '../../widgets/category_chip.dart';
import '../../widgets/empty_view.dart';
import '../../widgets/error_view.dart';
import '../../widgets/loading_indicator.dart';
import '../../widgets/product_card.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen>
    with TickerProviderStateMixin {
  final _searchController = TextEditingController();
  final _pageController = PageController();
  final _currentBannerNotifier = ValueNotifier<int>(0);
  final _hasSearchText = ValueNotifier<bool>(false);
  Timer? _bannerTimer;

  // Banner data
  final List<_BannerData> _banners = const [
    _BannerData(
      tag: 'LIMITED OFFER',
      title: 'Up to 50% Off\non Top Brands',
      subtitle: 'Shop the best deals now',
      gradient: LinearGradient(
        colors: [Color(0xFF4F46E5), Color(0xFF7C3AED), Color(0xFFC026D3)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ),
      icon: Icons.local_mall_rounded,
    ),
    _BannerData(
      tag: 'NEW ARRIVALS',
      title: 'Fresh Styles\nJust Dropped',
      subtitle: 'Discover the latest trends',
      gradient: LinearGradient(
        colors: [Color(0xFF0F766E), Color(0xFF0891B2)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ),
      icon: Icons.bolt_rounded,
    ),
    _BannerData(
      tag: 'FLASH SALE',
      title: 'Today Only\nIncredible Prices',
      subtitle: 'Grab it before it\'s gone',
      gradient: LinearGradient(
        colors: [Color(0xFFBE123C), Color(0xFFEC4899)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ),
      icon: Icons.local_fire_department_rounded,
    ),
  ];

  @override
  void initState() {
    super.initState();

    _searchController.addListener(() {
      final hasText = _searchController.text.isNotEmpty;
      if (_hasSearchText.value != hasText) {
        _hasSearchText.value = hasText;
      }
    });

    // Auto-scroll banner smoothly without rebuilding HomeScreen
    _bannerTimer = Timer.periodic(const Duration(seconds: 4), (_) {
      if (!mounted) return;
      final next = (_currentBannerNotifier.value + 1) % _banners.length;
      _pageController.animateToPage(
        next,
        duration: const Duration(milliseconds: 500),
        curve: Curves.easeInOut,
      );
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    _pageController.dispose();
    _currentBannerNotifier.dispose();
    _hasSearchText.dispose();
    _bannerTimer?.cancel();
    super.dispose();
  }

  Future<void> _handleRefresh() async {
    ref.invalidate(featuredProductsProvider);
    ref.invalidate(latestProductsProvider);
    await ref.read(categoriesProvider.notifier).fetchCategories();
  }

  void _onSearchSubmitted(String query) {
    if (query.trim().isNotEmpty) {
      ref.read(productsProvider.notifier).setSearch(query.trim());
      context.push(AppRoutes.products);
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final categoriesState = ref.watch(categoriesProvider);
    final featuredAsync = ref.watch(featuredProductsProvider);
    final latestAsync = ref.watch(latestProductsProvider);

    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor:
          isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
      body: RefreshIndicator(
        onRefresh: _handleRefresh,
        color: AppColors.primary,
        child: CustomScrollView(
          slivers: [
            // ─── Fixed Header & Search Bar (SliverAppBar) ───────────────
            SliverAppBar(
              pinned: true,
              floating: false,
              toolbarHeight: 72,
              backgroundColor:
                  isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
              elevation: 0,
              scrolledUnderElevation: 2,
              automaticallyImplyLeading: false,
              titleSpacing: 0,
              title: _buildHeader(authState, isDark),
              bottom: PreferredSize(
                preferredSize: const Size.fromHeight(66),
                child: Container(
                  color: isDark
                      ? AppColors.backgroundDark
                      : AppColors.backgroundLight,
                  padding: const EdgeInsets.fromLTRB(20, 2, 20, 12),
                  child: _buildSearchBar(isDark),
                ),
              ),
            ),

            // ─── Banner Carousel ─────────────────────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Column(
                  children: [
                    SizedBox(
                      height: 180,
                      child: PageView.builder(
                        controller: _pageController,
                        itemCount: _banners.length,
                        onPageChanged: (i) => _currentBannerNotifier.value = i,
                        itemBuilder: (context, index) {
                          final banner = _banners[index];
                          return _buildBannerCard(banner, isDark);
                        },
                      ),
                    ),
                    const SizedBox(height: 10),
                    // Dot indicators isolated with ValueListenableBuilder
                    ValueListenableBuilder<int>(
                      valueListenable: _currentBannerNotifier,
                      builder: (context, currentIndex, _) {
                        return Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: List.generate(_banners.length, (i) {
                            final isActive = i == currentIndex;
                            return AnimatedContainer(
                              duration: const Duration(milliseconds: 300),
                              margin: const EdgeInsets.symmetric(horizontal: 4),
                              width: isActive ? 20 : 6,
                              height: 6,
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(3),
                                color: isActive
                                    ? AppColors.primary
                                    : (isDark
                                        ? AppColors.borderDark
                                        : AppColors.borderLight),
                              ),
                            );
                          }),
                        );
                      },
                    ),
                  ],
                ),
              ),
            ),

            // ─── Quick Stats Row ──────────────────────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
                child: Row(
                  children: [
                    _buildStatCard(
                      icon: Icons.local_shipping_outlined,
                      label: 'Free Delivery',
                      sub: 'Orders over ₹500',
                      color: AppColors.success,
                      isDark: isDark,
                    ),
                    const SizedBox(width: 12),
                    _buildStatCard(
                      icon: Icons.verified_outlined,
                      label: '100% Genuine',
                      sub: 'All products verified',
                      color: AppColors.primary,
                      isDark: isDark,
                    ),
                    const SizedBox(width: 12),
                    _buildStatCard(
                      icon: Icons.replay_outlined,
                      label: 'Easy Return',
                      sub: '7 day policy',
                      color: AppColors.warning,
                      isDark: isDark,
                    ),
                  ],
                ),
              ),
            ),

            // ─── Categories Section ───────────────────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 24, 20, 12),
                child: _sectionHeader(
                  title: 'Categories',
                  icon: Icons.grid_view_rounded,
                  iconColor: AppColors.accent,
                  onSeeAll: () => context.push(AppRoutes.products),
                  isDark: isDark,
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: SizedBox(
                height: 44,
                child: categoriesState.isLoading
                    ? const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 20),
                        child: CategoryChipsSkeleton(),
                      )
                    : categoriesState.error != null
                        ? Center(
                            child: TextButton.icon(
                              onPressed: () => ref
                                  .read(categoriesProvider.notifier)
                                  .fetchCategories(),
                              icon: const Icon(Icons.refresh, size: 16),
                              label: const Text('Retry Categories'),
                            ),
                          )
                        : ListView.builder(
                            scrollDirection: Axis.horizontal,
                            padding:
                                const EdgeInsets.symmetric(horizontal: 20),
                            itemCount:
                                categoriesState.categories.length + 1,
                            itemBuilder: (context, index) {
                              if (index == 0) {
                                return Padding(
                                  padding: const EdgeInsets.only(right: 10),
                                  child: ActionChip(
                                    label: const Text('All Products'),
                                    onPressed: () {
                                      ref
                                          .read(productsProvider.notifier)
                                          .setCategory(null);
                                      context.push(AppRoutes.products);
                                    },
                                    backgroundColor: isDark
                                        ? AppColors.surfaceDark
                                        : AppColors.surfaceLight,
                                    side: BorderSide(
                                      color: isDark
                                          ? AppColors.borderDark
                                          : AppColors.borderLight,
                                    ),
                                  ),
                                );
                              }
                              final cat =
                                  categoriesState.categories[index - 1];
                              return CategoryChip(
                                category: cat,
                                isSelected: false,
                                onTap: () {
                                  ref
                                      .read(productsProvider.notifier)
                                      .setCategory(cat.id);
                                  context.push(AppRoutes.products);
                                },
                              );
                            },
                          ),
              ),
            ),

            // ─── Featured Products ────────────────────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 28, 20, 12),
                child: _sectionHeader(
                  title: 'Featured Products',
                  icon: Icons.local_fire_department_rounded,
                  iconColor: AppColors.secondary,
                  onSeeAll: () => context.push(AppRoutes.products),
                  isDark: isDark,
                ),
              ),
            ),
            featuredAsync.when(
              data: (products) {
                if (products.isEmpty) {
                  return const SliverToBoxAdapter(
                    child: Padding(
                      padding: EdgeInsets.all(20),
                      child: EmptyView(
                        title: 'No featured products',
                        message:
                            'Check back soon for curated featured items.',
                      ),
                    ),
                  );
                }
                return SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  sliver: SliverGrid(
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      childAspectRatio: 0.58,
                      crossAxisSpacing: 14,
                      mainAxisSpacing: 14,
                    ),
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        final product = products[index];
                        return ProductCard(
                          product: product,
                          onTap: () => context.push(
                              AppRoutes.productDetailsPath(product.id)),
                        );
                      },
                      childCount: products.length,
                    ),
                  ),
                );
              },
              loading: () => const SliverPadding(
                padding: EdgeInsets.symmetric(horizontal: 20),
                sliver: SliverToBoxAdapter(
                  child: ProductGridSkeleton(count: 4),
                ),
              ),
              error: (err, _) => SliverToBoxAdapter(
                child: ErrorView(
                  message: 'Could not load featured products',
                  onRetry: () => ref.invalidate(featuredProductsProvider),
                ),
              ),
            ),

            // ─── Latest Arrivals ──────────────────────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 30, 20, 12),
                child: _sectionHeader(
                  title: 'Latest Arrivals',
                  icon: Icons.flash_on_rounded,
                  iconColor: AppColors.primary,
                  onSeeAll: () => context.push(AppRoutes.products),
                  isDark: isDark,
                ),
              ),
            ),
            latestAsync.when(
              data: (products) {
                if (products.isEmpty) {
                  return const SliverToBoxAdapter(
                    child: Padding(
                      padding: EdgeInsets.all(20),
                      child: EmptyView(
                        title: 'No products found',
                        message: 'New products will be added soon.',
                      ),
                    ),
                  );
                }
                return SliverPadding(
                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 40),
                  sliver: SliverGrid(
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      childAspectRatio: 0.58,
                      crossAxisSpacing: 14,
                      mainAxisSpacing: 14,
                    ),
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        final product = products[index];
                        return ProductCard(
                          product: product,
                          onTap: () => context.push(
                              AppRoutes.productDetailsPath(product.id)),
                        );
                      },
                      childCount: products.length,
                    ),
                  ),
                );
              },
              loading: () => const SliverPadding(
                padding: EdgeInsets.fromLTRB(20, 0, 20, 40),
                sliver: SliverToBoxAdapter(
                  child: ProductGridSkeleton(count: 4),
                ),
              ),
              error: (err, _) => SliverToBoxAdapter(
                child: ErrorView(
                  message: 'Could not load latest products',
                  onRetry: () => ref.invalidate(latestProductsProvider),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ─── Header Widget ─────────────────────────────────────────────────────────
  Widget _buildHeader(AuthState authState, bool isDark) {
    return Container(
      color: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // Greeting
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  authState.isAuthenticated &&
                          (authState.user?.name.isNotEmpty ?? false)
                      ? 'Hello, ${authState.user!.name.split(" ").first} 👋'
                      : 'Welcome back ✨',
                  style: TextStyle(
                    fontSize: 13,
                    color: isDark
                        ? AppColors.textSecondaryDark
                        : AppColors.textSecondaryLight,
                    fontWeight: FontWeight.w500,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Text(
                  'Find Best Deals',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    color: isDark
                        ? AppColors.textPrimaryDark
                        : AppColors.textPrimaryLight,
                    letterSpacing: -0.3,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          // Actions
          // Cart Action
          CartBadgeIcon(
            onTap: () => context.push(AppRoutes.cart),
            color: isDark
                ? AppColors.textPrimaryDark
                : AppColors.textPrimaryLight,
          ),
        ],
      ),
    );
  }

  // ─── Search Bar (Rounded Corners & Elevated) ──────────────────────────────
  Widget _buildSearchBar(bool isDark) {
    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : Colors.white,
        borderRadius: BorderRadius.circular(30),
        border: Border.all(
          color: isDark ? AppColors.borderDark : AppColors.borderLight,
          width: 1.2,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.25 : 0.06),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(30),
        child: TextField(
          controller: _searchController,
          textInputAction: TextInputAction.search,
          onSubmitted: _onSearchSubmitted,
          textAlignVertical: TextAlignVertical.center,
          style: TextStyle(
            fontSize: 14,
            color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
          ),
          decoration: InputDecoration(
            isDense: true,
            hintText: 'Search products, brands, gadgets...',
            hintStyle: TextStyle(
              fontSize: 14,
              color: isDark
                  ? AppColors.textTertiaryDark
                  : AppColors.textTertiaryLight,
            ),
            prefixIcon: const Padding(
              padding: EdgeInsets.only(left: 14, right: 10),
              child: Icon(
                Icons.search_rounded,
                color: AppColors.primary,
                size: 22,
              ),
            ),
            prefixIconConstraints: const BoxConstraints(minWidth: 46, minHeight: 46),
            suffixIcon: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                ValueListenableBuilder<bool>(
                  valueListenable: _hasSearchText,
                  builder: (context, hasText, _) {
                    if (!hasText) return const SizedBox.shrink();
                    return IconButton(
                      icon: const Icon(Icons.close_rounded, size: 18),
                      splashRadius: 18,
                      onPressed: () {
                        _searchController.clear();
                      },
                    );
                  },
                ),
                Container(
                  margin: const EdgeInsets.only(right: 8),
                  width: 34,
                  height: 34,
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.12),
                    shape: BoxShape.circle,
                  ),
                  child: IconButton(
                    icon: const Icon(
                      Icons.tune_rounded,
                      size: 17,
                      color: AppColors.primary,
                    ),
                    splashRadius: 18,
                    padding: EdgeInsets.zero,
                    tooltip: 'All Filters',
                    onPressed: () => context.push(AppRoutes.products),
                  ),
                ),
              ],
            ),
            border: InputBorder.none,
            enabledBorder: InputBorder.none,
            focusedBorder: InputBorder.none,
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          ),
        ),
      ),
    );
  }

  // ─── Banner Card ───────────────────────────────────────────────────────────
  Widget _buildBannerCard(_BannerData banner, bool isDark) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
      decoration: BoxDecoration(
        gradient: banner.gradient,
        borderRadius: BorderRadius.circular(22),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.2),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Stack(
        children: [
          // Background pattern
          Positioned(
            right: -20,
            top: -20,
            child: Icon(
              banner.icon,
              size: 160,
              color: Colors.white.withValues(alpha: 0.08),
            ),
          ),
          Positioned(
            right: 24,
            bottom: 20,
            child: Icon(
              banner.icon,
              size: 64,
              color: Colors.white.withValues(alpha: 0.22),
            ),
          ),
          // Content
          Padding(
            padding: const EdgeInsets.fromLTRB(18, 14, 18, 14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.22),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    banner.tag,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 9,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 1,
                    ),
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  banner.title,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 17,
                    fontWeight: FontWeight.w800,
                    height: 1.2,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  banner.subtitle,
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.8),
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 10),
                ElevatedButton(
                  onPressed: () => context.push(AppRoutes.products),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: AppColors.primary,
                    padding: const EdgeInsets.symmetric(
                        horizontal: 14, vertical: 7),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    textStyle: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                    ),
                    elevation: 0,
                    minimumSize: Size.zero,
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                  child: const Text('Shop Now →'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ─── Stat Card ─────────────────────────────────────────────────────────────
  Widget _buildStatCard({
    required IconData icon,
    required String label,
    required String sub,
    required Color color,
    required bool isDark,
  }) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 10),
        decoration: BoxDecoration(
          color: isDark ? AppColors.surfaceDark : Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isDark ? AppColors.borderDark : AppColors.borderLight,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: isDark ? 0.15 : 0.04),
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
              child: Icon(icon, color: color, size: 18),
            ),
            const SizedBox(height: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: isDark
                    ? AppColors.textPrimaryDark
                    : AppColors.textPrimaryLight,
              ),
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            Text(
              sub,
              style: TextStyle(
                fontSize: 9.5,
                color: isDark
                    ? AppColors.textTertiaryDark
                    : AppColors.textTertiaryLight,
              ),
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  // ─── Section Header ────────────────────────────────────────────────────────
  Widget _sectionHeader({
    required String title,
    required IconData icon,
    required Color iconColor,
    required VoidCallback onSeeAll,
    required bool isDark,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: iconColor.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, color: iconColor, size: 18),
            ),
            const SizedBox(width: 10),
            Text(
              title,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: isDark
                    ? AppColors.textPrimaryDark
                    : AppColors.textPrimaryLight,
                letterSpacing: -0.2,
              ),
            ),
          ],
        ),
        GestureDetector(
          onTap: onSeeAll,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Text(
              'See All',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: AppColors.primary,
              ),
            ),
          ),
        ),
      ],
    );
  }
}

// ─── Banner Data Model ─────────────────────────────────────────────────────
class _BannerData {
  final String tag;
  final String title;
  final String subtitle;
  final LinearGradient gradient;
  final IconData icon;

  const _BannerData({
    required this.tag,
    required this.title,
    required this.subtitle,
    required this.gradient,
    required this.icon,
  });
}

