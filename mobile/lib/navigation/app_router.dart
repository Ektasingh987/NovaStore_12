import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../screens/auth/google_login_screen.dart';
import '../screens/auth/login_screen.dart';
import '../screens/auth/register_screen.dart';
import '../screens/cart/cart_screen.dart';
import '../screens/checkout/checkout_screen.dart';
import '../screens/checkout/order_confirmation_screen.dart';
import '../screens/home/home_screen.dart';
import '../screens/main_navigation_shell.dart';
import '../screens/orders/order_details_screen.dart';
import '../screens/orders/order_history_screen.dart';
import '../screens/products/product_details_screen.dart';
import '../screens/products/product_listing_screen.dart';
import '../screens/profile/profile_screen.dart';
import '../screens/splash/splash_screen.dart';
import 'routes.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();
final _homeNavigatorKey = GlobalKey<NavigatorState>(debugLabel: 'homeNav');
final _productsNavigatorKey = GlobalKey<NavigatorState>(debugLabel: 'productsNav');
final _cartNavigatorKey = GlobalKey<NavigatorState>(debugLabel: 'cartNav');
final _ordersNavigatorKey = GlobalKey<NavigatorState>(debugLabel: 'ordersNav');
final _profileNavigatorKey = GlobalKey<NavigatorState>(debugLabel: 'profileNav');

class RouterNotifier extends ChangeNotifier {
  final Ref _ref;

  RouterNotifier(this._ref) {
    _ref.listen<AuthState>(
      authProvider,
      (_, _) => notifyListeners(),
    );
  }
}

final routerNotifierProvider = Provider<RouterNotifier>((ref) {
  return RouterNotifier(ref);
});

final goRouterProvider = Provider<GoRouter>((ref) {
  final notifier = ref.watch(routerNotifierProvider);

  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: AppRoutes.splash,
    refreshListenable: notifier,
    redirect: (context, state) {
      final authState = ref.read(authProvider);
      final location = state.matchedLocation;

      // Until auth completes reading storage, remain on splash
      if (!authState.isInitialized) {
        return location == AppRoutes.splash ? null : AppRoutes.splash;
      }

      final isAuthenticated = authState.isAuthenticated;
      final isAuthRoute = location == AppRoutes.login ||
          location == AppRoutes.register ||
          location == AppRoutes.googleLogin;

      // Coming from splash after initialization completes
      if (location == AppRoutes.splash) {
        return isAuthenticated ? AppRoutes.home : AppRoutes.login;
      }

      // If user is authenticated and tries to visit auth pages, redirect to home
      if (isAuthenticated && isAuthRoute) {
        return AppRoutes.home;
      }

      // If user is NOT authenticated, redirect to login for all non-auth routes
      if (!isAuthenticated && !isAuthRoute) {
        return '${AppRoutes.login}?redirect=${Uri.encodeComponent(location)}';
      }

      return null;
    },
    routes: [
      // Stateful Bottom Navigation Shell
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) {
          return MainNavigationShell(navigationShell: navigationShell);
        },
        branches: [
          // Branch 0: Home
          StatefulShellBranch(
            navigatorKey: _homeNavigatorKey,
            routes: [
              GoRoute(
                path: AppRoutes.home,
                builder: (context, state) => const HomeScreen(),
              ),
            ],
          ),

          // Branch 1: Products
          StatefulShellBranch(
            navigatorKey: _productsNavigatorKey,
            routes: [
              GoRoute(
                path: AppRoutes.products,
                builder: (context, state) => const ProductListingScreen(),
              ),
            ],
          ),

          // Branch 2: Cart
          StatefulShellBranch(
            navigatorKey: _cartNavigatorKey,
            routes: [
              GoRoute(
                path: AppRoutes.cart,
                builder: (context, state) => const CartScreen(),
              ),
            ],
          ),

          // Branch 3: Orders
          StatefulShellBranch(
            navigatorKey: _ordersNavigatorKey,
            routes: [
              GoRoute(
                path: AppRoutes.orders,
                builder: (context, state) => const OrderHistoryScreen(),
              ),
            ],
          ),

          // Branch 4: Profile
          StatefulShellBranch(
            navigatorKey: _profileNavigatorKey,
            routes: [
              GoRoute(
                path: AppRoutes.profile,
                builder: (context, state) => const ProfileScreen(),
              ),
            ],
          ),
        ],
      ),

      // Splash Route
      GoRoute(
        path: AppRoutes.splash,
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const SplashScreen(),
      ),

      // Auth Routes
      GoRoute(
        path: AppRoutes.login,
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) {
          final redirect = state.uri.queryParameters['redirect'];
          return LoginScreen(redirectPath: redirect);
        },
      ),
      GoRoute(
        path: AppRoutes.register,
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const RegisterScreen(),
      ),
      GoRoute(
        path: AppRoutes.googleLogin,
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const GoogleLoginScreen(),
      ),

      // Product Details Route
      GoRoute(
        path: AppRoutes.productDetails,
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) {
          final id = state.pathParameters['id'] ?? '';
          return ProductDetailsScreen(productId: id);
        },
      ),

      // Checkout & Order Confirmation Routes
      GoRoute(
        path: AppRoutes.checkout,
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const CheckoutScreen(),
      ),
      GoRoute(
        path: AppRoutes.orderConfirmation,
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) {
          final id = state.pathParameters['id'] ?? '';
          return OrderConfirmationScreen(orderId: id);
        },
      ),

      // Order Details Route
      GoRoute(
        path: AppRoutes.orderDetails,
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) {
          final id = state.pathParameters['id'] ?? '';
          return OrderDetailsScreen(orderId: id);
        },
      ),
    ],
  );
});
