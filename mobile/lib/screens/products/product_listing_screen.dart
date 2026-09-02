import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../constants/app_colors.dart';
import '../../navigation/routes.dart';
import '../../providers/categories_provider.dart';
import '../../providers/products_provider.dart';
import '../../widgets/cart_badge.dart';
import '../../widgets/empty_view.dart';
import '../../widgets/error_view.dart';
import '../../widgets/loading_indicator.dart';
import '../../widgets/product_card.dart';

class ProductListingScreen extends ConsumerStatefulWidget {
  const ProductListingScreen({super.key});

  @override
  ConsumerState<ProductListingScreen> createState() => _ProductListingScreenState();
}

class _ProductListingScreenState extends ConsumerState<ProductListingScreen> {
  final _scrollController = ScrollController();
  final _searchController = TextEditingController();
  Timer? _debounceTimer;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final currentSearch = ref.read(productsProvider).filter.search;
      if (currentSearch != null) {
        _searchController.text = currentSearch;
      }
    });
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _searchController.dispose();
    _debounceTimer?.cancel();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent - 300) {
      ref.read(productsProvider.notifier).loadMore();
    }
  }

  void _onSearchChanged(String query) {
    _debounceTimer?.cancel();
    _debounceTimer = Timer(const Duration(milliseconds: 350), () {
      final trimmed = query.trim();
      ref.read(productsProvider.notifier).setSearch(trimmed.isEmpty ? null : trimmed);
    });
    setState(() {});
  }

  void _showFilterBottomSheet(BuildContext context) {
    final productsState = ref.read(productsProvider);
    final categoriesState = ref.read(categoriesProvider);

    String? selectedCategory = productsState.filter.category;
    String? selectedSort = productsState.filter.sort;
    RangeValues priceRange = RangeValues(
      productsState.filter.minPrice ?? 0,
      productsState.filter.maxPrice ?? 10000,
    );

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (modalContext) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            final isDark = Theme.of(context).brightness == Brightness.dark;

            return Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: isDark ? AppColors.surfaceDark : Colors.white,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Filter & Sort',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w700,
                          color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                        ),
                      ),
                      TextButton(
                        onPressed: () {
                          ref.read(productsProvider.notifier).resetFilters();
                          Navigator.pop(context);
                        },
                        child: const Text('Reset All'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Sort Options
                  Text(
                    'Sort By',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      _sortChip('Newest', 'newest', selectedSort, (val) {
                        setModalState(() => selectedSort = val);
                      }),
                      _sortChip('Price: Low to High', 'price_asc', selectedSort, (val) {
                        setModalState(() => selectedSort = val);
                      }),
                      _sortChip('Price: High to Low', 'price_desc', selectedSort, (val) {
                        setModalState(() => selectedSort = val);
                      }),
                      _sortChip('Top Rated', 'rating', selectedSort, (val) {
                        setModalState(() => selectedSort = val);
                      }),
                    ],
                  ),
                  const SizedBox(height: 20),

                  // Category Filter
                  Text(
                    'Category',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                    ),
                  ),
                  const SizedBox(height: 8),
                  SizedBox(
                    height: 40,
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      itemCount: categoriesState.categories.length + 1,
                      itemBuilder: (context, index) {
                        if (index == 0) {
                          final isAllSelected = selectedCategory == null;
                          return Padding(
                            padding: const EdgeInsets.only(right: 8),
                            child: ChoiceChip(
                              label: const Text('All'),
                              selected: isAllSelected,
                              onSelected: (_) => setModalState(() => selectedCategory = null),
                            ),
                          );
                        }
                        final cat = categoriesState.categories[index - 1];
                        final isCatSelected = selectedCategory == cat.id;
                        return Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: ChoiceChip(
                            label: Text(cat.name),
                            selected: isCatSelected,
                            onSelected: (_) => setModalState(() => selectedCategory = cat.id),
                          ),
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Price Range
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Price Range',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                        ),
                      ),
                      Text(
                        '₹${priceRange.start.toInt()} - ₹${priceRange.end.toInt()}',
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: AppColors.primary,
                        ),
                      ),
                    ],
                  ),
                  RangeSlider(
                    values: priceRange,
                    min: 0,
                    max: 10000,
                    divisions: 20,
                    activeColor: AppColors.primary,
                    labels: RangeLabels('₹${priceRange.start.toInt()}', '₹${priceRange.end.toInt()}'),
                    onChanged: (values) {
                      setModalState(() => priceRange = values);
                    },
                  ),
                  const SizedBox(height: 24),

                  // Apply button
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      onPressed: () {
                        ref.read(productsProvider.notifier).updateFilter(
                              productsState.filter.copyWith(
                                category: selectedCategory,
                                sort: selectedSort,
                                minPrice: priceRange.start > 0 ? priceRange.start : null,
                                maxPrice: priceRange.end < 10000 ? priceRange.end : null,
                                clearCategory: selectedCategory == null,
                                clearSort: selectedSort == null,
                              ),
                            );
                        Navigator.pop(context);
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      child: const Text('Apply Filters', style: TextStyle(fontWeight: FontWeight.w700)),
                    ),
                  ),
                  const SizedBox(height: 12),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _sortChip(
    String label,
    String value,
    String? current,
    ValueChanged<String?> onSelected,
  ) {
    final isSelected = current == value;
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (selected) => onSelected(selected ? value : null),
    );
  }

  @override
  Widget build(BuildContext context) {
    final productsState = ref.watch(productsProvider);
    final categoriesState = ref.watch(categoriesProvider);
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

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
        title: const Text('All Products'),
        actions: [
          CartBadgeIcon(
            onTap: () => context.push(AppRoutes.cart),
            color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.read(productsProvider.notifier).fetchProducts(isRefresh: true),
        color: AppColors.primary,
        child: CustomScrollView(
          controller: _scrollController,
          slivers: [
            // Search & Filter bar
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
                child: Row(
                  children: [
                    Expanded(
                      child: Container(
                        decoration: BoxDecoration(
                          color: isDark ? AppColors.surfaceDark : Colors.white,
                          borderRadius: BorderRadius.circular(30),
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
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(30),
                          child: TextField(
                            controller: _searchController,
                            textInputAction: TextInputAction.search,
                            onChanged: _onSearchChanged,
                            onSubmitted: (val) {
                              _debounceTimer?.cancel();
                              ref.read(productsProvider.notifier).setSearch(val.trim().isEmpty ? null : val.trim());
                            },
                            decoration: InputDecoration(
                              hintText: 'Search products...',
                              prefixIcon: const Icon(Icons.search_rounded, size: 20, color: AppColors.primary),
                              suffixIcon: _searchController.text.isNotEmpty
                                  ? IconButton(
                                      icon: const Icon(Icons.clear, size: 18),
                                      onPressed: () {
                                        _searchController.clear();
                                        _debounceTimer?.cancel();
                                        ref.read(productsProvider.notifier).setSearch(null);
                                        setState(() {});
                                      },
                                    )
                                  : null,
                              border: InputBorder.none,
                              enabledBorder: InputBorder.none,
                              focusedBorder: InputBorder.none,
                              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    InkWell(
                      onTap: () => _showFilterBottomSheet(context),
                      borderRadius: BorderRadius.circular(30),
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: productsState.filter.hasActiveFilters
                              ? AppColors.primary
                              : (isDark ? AppColors.surfaceDark : Colors.white),
                          borderRadius: BorderRadius.circular(30),
                          border: Border.all(
                            color: productsState.filter.hasActiveFilters
                                ? Colors.transparent
                                : (isDark ? AppColors.borderDark : AppColors.borderLight),
                          ),
                        ),
                        child: Icon(
                          Icons.tune_rounded,
                          color: productsState.filter.hasActiveFilters
                              ? Colors.white
                              : (isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight),
                          size: 22,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Horizontal Categories Quick Filter
            if (categoriesState.categories.isNotEmpty)
              SliverToBoxAdapter(
                child: SizedBox(
                  height: 42,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: categoriesState.categories.length + 1,
                    itemBuilder: (context, index) {
                      if (index == 0) {
                        final isAll = productsState.filter.category == null;
                        return Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: ChoiceChip(
                            label: const Text('All'),
                            selected: isAll,
                            onSelected: (_) => ref.read(productsProvider.notifier).setCategory(null),
                          ),
                        );
                      }
                      final cat = categoriesState.categories[index - 1];
                      final isSelected = productsState.filter.category == cat.id;
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: ChoiceChip(
                          label: Text(cat.name),
                          selected: isSelected,
                          onSelected: (_) => ref.read(productsProvider.notifier).setCategory(isSelected ? null : cat.id),
                        ),
                      );
                    },
                  ),
                ),
              ),

            const SliverToBoxAdapter(child: SizedBox(height: 12)),

            // Products Grid State
            if (productsState.isLoading)
              const SliverPadding(
                padding: EdgeInsets.symmetric(horizontal: 16),
                sliver: SliverToBoxAdapter(
                  child: ProductGridSkeleton(count: 6),
                ),
              )
            else if (productsState.error != null)
              SliverToBoxAdapter(
                child: ErrorView(
                  message: productsState.error,
                  onRetry: () => ref.read(productsProvider.notifier).fetchProducts(),
                ),
              )
            else if (productsState.products.isEmpty)
              SliverToBoxAdapter(
                child: EmptyView(
                  title: 'No products found',
                  message: 'Try adjusting your filters or searching for something else.',
                  buttonText: 'Reset Filters',
                  onButtonPressed: () {
                    _searchController.clear();
                    ref.read(productsProvider.notifier).resetFilters();
                  },
                ),
              )
            else ...[
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                sliver: SliverGrid(
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    childAspectRatio: 0.58,
                    crossAxisSpacing: 14,
                    mainAxisSpacing: 14,
                  ),
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final product = productsState.products[index];
                      return ProductCard(
                        product: product,
                        onTap: () => context.push(AppRoutes.productDetailsPath(product.id)),
                      );
                    },
                    childCount: productsState.products.length,
                  ),
                ),
              ),

              // Loading more indicator
              if (productsState.isLoadingMore)
                const SliverToBoxAdapter(
                  child: Padding(
                    padding: EdgeInsets.symmetric(vertical: 24),
                    child: Center(
                      child: SizedBox(
                        height: 28,
                        width: 28,
                        child: CircularProgressIndicator(strokeWidth: 2.5),
                      ),
                    ),
                  ),
                ),

              const SliverToBoxAdapter(child: SizedBox(height: 30)),
            ],
          ],
        ),
      ),
    );
  }
}
