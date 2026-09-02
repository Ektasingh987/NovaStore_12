class AppRoutes {
  static const String home = '/';
  static const String products = '/products';
  static const String productDetails = '/products/:id';
  static const String cart = '/cart';
  static const String checkout = '/checkout';
  static const String orderConfirmation = '/order-confirmation/:id';
  static const String orders = '/orders';
  static const String orderDetails = '/orders/:id';
  static const String profile = '/profile';
  static const String login = '/login';
  static const String register = '/register';
  static const String googleLogin = '/google-login';

  // Helper builders
  static String productDetailsPath(String id) => '/products/$id';
  static String orderDetailsPath(String id) => '/orders/$id';
  static String orderConfirmationPath(String id) => '/order-confirmation/$id';
}
