# NovaStore Flutter Mobile App 🛍️

A customer-facing cross-platform e-commerce application built with Flutter, Riverpod, GoRouter, and Dio, fully integrated with the Node.js / Express / MongoDB backend.

---

## 🏛️ Architecture & Project Structure

The project follows a clean, layered feature-and-domain architecture inside `lib/`:

```
mobile/lib/
├── api/
│   ├── api_client.dart          # Centralized Dio HTTP client & error transformer
│   ├── auth_interceptor.dart    # Token attachment, 401 refresh queue & token rotation
│   ├── auth_api.dart            # Login, Register, Google OAuth, Refresh, Logout
│   ├── product_api.dart         # Paginated & filtered product querying, product details
│   ├── category_api.dart        # Category listings
│   ├── cart_api.dart            # Full cart sync (add, remove, update qty, clear)
│   ├── order_api.dart           # Place order (POST /api/orders), paginated order history
│   └── user_api.dart            # User profile retrieval & updates
├── constants/
│   ├── app_colors.dart          # Modern gradient and color design system
│   ├── app_constants.dart       # API endpoints, storage keys, configuration
│   └── app_theme.dart           # Light & Dark Material 3 theme configurations (Outfit font)
├── models/
│   ├── api_response.dart        # Envelope parser, pagination metadata, custom exceptions
│   ├── user_model.dart          # User schema & admin checks
│   ├── product_model.dart       # Product, images, ratings, discount & sale price logic
│   ├── category_model.dart      # Category model
│   ├── cart_model.dart          # Cart items, live calculation of subtotal, discount, delivery
│   └── order_model.dart         # Order schema, delivery address, timeline status history
├── navigation/
│   ├── app_router.dart          # GoRouter with StatefulShellRoute and auth route guards
│   └── routes.dart              # Type-safe route paths
├── providers/
│   ├── core_providers.dart      # Storage and API instances
│   ├── auth_provider.dart       # authProvider (Riverpod state notifier with loading/error/user)
│   ├── products_provider.dart   # productsProvider, featuredProductsProvider, latestProductsProvider
│   ├── categories_provider.dart # categoriesProvider
│   ├── cart_provider.dart       # cartProvider (synced with backend mutations)
│   ├── orders_provider.dart     # ordersProvider (order history & checkout creation)
│   ├── user_provider.dart       # userProvider (profile edit & sync)
│   └── theme_provider.dart      # themeProvider (Light / Dark mode toggle & persistence)
├── screens/
│   ├── auth/
│   │   ├── login_screen.dart        # Email & password login + Google sign-in
│   │   ├── register_screen.dart     # User registration with password strength checks
│   │   └── google_login_screen.dart # Google OAuth ID token verification
│   ├── home/
│   │   └── home_screen.dart         # Header, search, categories, featured & latest feeds
│   ├── products/
│   │   ├── product_listing_screen.dart  # Search, category filter, price slider, sorting, infinite scroll
│   │   └── product_details_screen.dart  # Image gallery, quantity selector, add to cart & buy now
│   ├── cart/
│   │   └── cart_screen.dart         # Interactive cart with real-time price calculations
│   ├── checkout/
│   │   ├── checkout_screen.dart     # Multi-step checkout form (COD, UPI, Card)
│   │   └── order_confirmation_screen.dart # Order confirmation with reference ID
│   ├── orders/
│   │   ├── order_history_screen.dart    # Paginated orders with status filtering
│   │   └── order_details_screen.dart    # Detailed order breakdown & status tracking
│   ├── profile/
│   │   └── profile_screen.dart      # Profile view/edit, sessions & theme controls
│   └── main_navigation_shell.dart   # Bottom navigation bar with live cart badge
├── services/
│   └── storage_service.dart     # Secure storage for refresh token, SharedPreferences for cache
├── utils/
│   ├── currency_formatter.dart  # Indian Rupee (₹) formatting
│   ├── date_formatter.dart      # Human-readable date and time formatting
│   ├── snackbar_utils.dart      # Floating feedback alerts
│   └── validators.dart          # Form input validation matching backend schemas
├── widgets/
│   ├── cart_badge.dart          # Dynamic badge for cart item count
│   ├── category_chip.dart       # Smooth category pill
│   ├── custom_button.dart       # Gradient & outlined action buttons
│   ├── custom_text_field.dart   # Form input with visibility toggles
│   ├── empty_view.dart          # Empty state illustrations
│   ├── error_view.dart          # Error & network retry widgets
│   ├── loading_indicator.dart   # Shimmer skeleton loaders
│   ├── product_card.dart        # E-commerce card with discounts and ratings
│   ├── quantity_selector.dart   # Stepper capped at inventory stock
│   └── rating_stars.dart        # Star rating bar
└── main.dart                    # App bootstrap & ProviderScope
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Flutter SDK (>= 3.19.0)
- Dart SDK (>= 3.3.0)
- Running backend server on `http://localhost:5000` (or `http://10.0.2.2:5000` for Android Emulator)

### 2. Install Dependencies
```bash
cd mobile
flutter pub get
```

### 3. Run the App
```bash
# Run on Chrome / Web
flutter run -d chrome

# Run on Windows Desktop
flutter run -d windows

# Run on Android Emulator (automatically targets 10.0.2.2:5000)
flutter run -d emulator-id
```

### 4. Custom API Base URL
To target a custom backend IP or remote server:
```bash
flutter run --dart-define=API_BASE_URL=http://your-backend-ip:5000
```
