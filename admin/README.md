# ShopAdmin — React.js Administration Portal

A modern, responsive administration portal for the E-Commerce platform built with **React.js**, **Redux Toolkit**, **Axios** (with token rotation interceptor), and **Vanilla CSS Design System**.

---

## 🚀 Features

- **Authentication & Security**:
  - Admin login with client-side field validation and demo credential filler.
  - Axios 401 interceptor that automatically rotates tokens using `/api/auth/refresh`, queues concurrent requests, and redirects to `/login` if refresh fails or the session is revoked.
  - `ProtectedRoute` component preventing non-admin access.
- **Dashboard**:
  - Live revenue, orders, products, and registered customer metrics powered by MongoDB aggregation backend.
  - Interactive fulfillment status breakdown widgets (Pending, Confirmed, Shipped, Delivered, Cancelled).
  - Recent orders preview table with instant link to details.
- **Product Management**:
  - Filterable catalog by keyword search, category, in-stock availability, and sorting (price, date, rating).
  - Multi-file image upload with live local preview.
  - Create & edit forms with full parameter controls (price, discount, stock, tags, featured flag).
  - Delete with safety confirmation modal and automatic image file cleanup.
- **Category Management**:
  - Category list with banner images, slugs, and active status.
  - Create and edit modals with banner image upload.
  - Delete guard preventing deletion of categories referenced by active products.
- **Order Fulfillment**:
  - Status tab filtering (All, Pending, Confirmed, Shipped, Delivered, Cancelled).
  - Quick status changer directly in order table.
  - Deep order detail page with customer address, item-by-item price snapshots, delivery fee, and status audit timeline.
- **User Management**:
  - Searchable user accounts list with role and active status filters.
  - One-click account activation / deactivation (which immediately revokes all active refresh token sessions on the backend).
  - User detail view displaying complete history of all orders placed by that user.
- **UI & UX Quality**:
  - Loading skeletons and spinners on all data views.
  - Empty state placeholders with descriptive icons and action triggers.
  - Error states with one-click "Retry" handlers.
  - Confirmation modals before destructive operations.
  - Toast notifications via `react-hot-toast` for real-time feedback.

---

## 🛠️ Project Structure

```
admin/src/
├── api/
│   └── axiosClient.js        # Axios instance + JWT interceptor & refresh queue
├── components/
│   └── common/
│       ├── Badge.jsx          # Status pill badges
│       ├── ConfirmModal.jsx   # Confirmation modal
│       ├── EmptyState.jsx     # Empty state placeholder
│       ├── ErrorState.jsx     # Error state + retry button
│       ├── LoadingSkeleton.jsx# Shimmer skeletons
│       ├── LoadingSpinner.jsx # Spinner loader
│       ├── Modal.jsx          # Base modal dialog
│       ├── Pagination.jsx     # Pagination bar
│       └── StatCard.jsx       # Metric cards
├── constants/
│   └── index.js              # API URL, status colors, sort options
├── layouts/
│   ├── AdminLayout.jsx       # Shell layout + toaster
│   ├── Header.jsx            # Top navbar
│   └── Sidebar.jsx           # Responsive sidebar navigation
├── pages/
│   ├── CategoriesPage.jsx    # Category CRUD + image upload
│   ├── DashboardPage.jsx     # Aggregated stats & recent orders
│   ├── LoginPage.jsx         # Admin authentication
│   ├── NotFoundPage.jsx      # 404 page
│   ├── OrderDetailPage.jsx   # Order items, address, status updater
│   ├── OrdersListPage.jsx    # Orders table + quick status update
│   ├── ProductFormPage.jsx   # Product create/edit form
│   ├── ProductsListPage.jsx  # Products catalog table + filters
│   ├── UserDetailPage.jsx    # Customer profile & user order history
│   └── UsersListPage.jsx     # User accounts & deactivation toggle
├── routes/
│   ├── AppRoutes.jsx         # Route declarations
│   └── ProtectedRoute.jsx    # Auth & admin role guard
├── services/
│   ├── auth.service.js       # Auth API methods
│   ├── categories.service.js # Category API methods
│   ├── dashboard.service.js  # Stats API methods
│   ├── orders.service.js     # Orders API methods
│   ├── products.service.js   # Products API methods
│   └── users.service.js      # Users API methods
├── store/
│   ├── index.js              # Redux store config
│   └── slices/               # Redux Toolkit slices (auth, dashboard, products, categories, orders, users)
├── utils/
│   └── formatters.js         # Currency and date formatters
├── App.jsx                   # Root Provider + BrowserRouter
├── index.css                 # Vanilla CSS Design System
└── main.jsx                  # DOM mount
```

---

## 💻 Running the Admin App

1. Install dependencies:
   ```bash
   cd admin
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```
