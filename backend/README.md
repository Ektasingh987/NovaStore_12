# E-Commerce Backend API

A production-ready REST API backend for a full-stack e-commerce application built with **Node.js**, **Express**, and **MongoDB (Mongoose)**.

---

## Auth Quick-Start

```bash
# Register
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane","email":"jane@example.com","password":"Test@1234"}'

# Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jane@example.com","password":"Test@1234"}'

# Get profile (use accessToken from above)
curl http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer <accessToken>"

# Refresh tokens (pass refreshToken in body for mobile, or it reads from cookie)
curl -X POST http://localhost:5000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<rawRefreshToken>"}'

# Logout (current device)
curl -X POST http://localhost:5000/api/v1/auth/logout \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<rawRefreshToken>"}'
```


---

## Tech Stack

| Layer | Library |
|---|---|
| Framework | Express 4 |
| Database | MongoDB + Mongoose 8 |
| Auth | JWT (jsonwebtoken) + bcrypt |
| File Uploads | Multer |
| Security | Helmet, CORS, express-rate-limit |
| Logging | Winston + Morgan |
| Validation | Joi |
| Config | dotenv |

---

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js        # MongoDB connection (connect / disconnect)
│   │   ├── env.js             # Validated environment variables
│   │   └── logger.js          # Winston structured logger (redacts secrets)
│   ├── controllers/           # Route handler functions (Phase 2+)
│   ├── middlewares/
│   │   ├── auth.middleware.js      # protect / restrictTo / optionalAuth
│   │   ├── error.middleware.js     # Global error handler
│   │   ├── notFound.middleware.js  # 404 catch-all
│   │   ├── upload.middleware.js    # Multer file upload handlers
│   │   └── validation.middleware.js# Joi request validation
│   ├── models/
│   │   ├── User.js            # email (unique), password (hashed), role
│   │   ├── Product.js         # slug (unique), text index, compound indexes
│   │   ├── Category.js        # slug (unique)
│   │   ├── Cart.js            # userId (unique), items[]
│   │   ├── Order.js           # compound indexes, status history
│   │   └── RefreshToken.js    # TTL index, tokenHash (never raw JWT)
│   ├── routes/                # Express routers (Phase 2+)
│   ├── services/              # Business logic (Phase 2+)
│   ├── repositories/          # DB query abstractions (Phase 2+)
│   ├── validators/            # Joi schemas (Phase 2+)
│   ├── utils/
│   │   ├── AppError.js        # Operational error class + factory helpers
│   │   ├── asyncHandler.js    # Async route wrapper (no try/catch boilerplate)
│   │   └── response.js        # sendSuccess / sendCreated / paginationMeta
│   ├── app.js                 # Express app setup
│   └── server.js              # HTTP server + graceful shutdown
├── uploads/
│   ├── products/
│   ├── categories/
│   └── users/
├── scripts/
│   └── seed.js                # DB seed script (dev only)
├── logs/                      # Auto-generated log files (gitignored)
├── .env.example
├── package.json
└── README.md
```

---

## Getting Started

### 1. Install dependencies

```bash
cd backend
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and fill in:
- `MONGO_URI` — your MongoDB connection string
- `JWT_ACCESS_SECRET` — generate with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- `JWT_REFRESH_SECRET` — generate another strong secret

### 3. Seed the database (optional)

```bash
npm run seed           # Seed with sample data
npm run seed:clear     # Clear collections then seed
npm run seed:drop      # Drop DB then seed (destructive)
```

Default seeded credentials:
| Role | Email | Password |
|---|---|---|
| Admin | admin@shop.dev | Admin@1234 |
| Customer | john@example.com | Customer@1234 |

### 4. Start the development server

```bash
npm run dev
```

The API will be available at `http://localhost:5000`.

---

## API Conventions

### Response Shape

All responses follow a consistent envelope:

```json
// Success
{
  "success": true,
  "message": "...",
  "data": { ... },
  "meta": { "total": 100, "page": 1, "limit": 20, "totalPages": 5 }
}

// Error
{
  "success": false,
  "message": "Human-readable message",
  "errorCode": "MACHINE_READABLE_CODE",
  "details": [ { "field": "email", "message": "Email is required" } ]
}
```

### Error Codes

| Code | Status | Description |
|---|---|---|
| `BAD_REQUEST` | 400 | Malformed request |
| `UNAUTHORIZED` | 401 | Missing / invalid token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Duplicate (e.g. email) |
| `VALIDATION_ERROR` | 422 | Input validation failed |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## Database Models

| Model | Key Indexes |
|---|---|
| `User` | `email` (unique), `googleId` (sparse), `role` |
| `Product` | `slug` (unique), `category`, `isFeatured`, `createdAt`, full-text on `name`+`description` |
| `Category` | `slug` (unique), `name` |
| `Cart` | `userId` (unique) |
| `Order` | `userId`, `status`, `createdAt`, `{userId, createdAt}`, `{status, createdAt}` |
| `RefreshToken` | `userId`, `expiresAt` (TTL auto-delete) |

---

---

## Security Notes

- Passwords are **never** stored in plain text — bcrypt with 12 salt rounds
- `tokenHash` in `RefreshToken` is a SHA-256 hash of the raw JWT — raw tokens are never persisted
- The logger **redacts** passwords, tokens, and secrets from all log output
- Stack traces are **never** sent to clients in production
- Rate limiting: 200 req/15 min globally; 10/15 min on login; 10/hr on register; 30/15 min on refresh

---

## Authentication

### Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/v1/auth/register` | Public | Create account — returns access + refresh tokens |
| `POST` | `/api/v1/auth/login` | Public | Authenticate — returns access + refresh tokens |
| `POST` | `/api/v1/auth/refresh` | Public | Rotate refresh token — returns new token pair |
| `POST` | `/api/v1/auth/logout` | 🔐 Bearer | Revoke current session |
| `POST` | `/api/v1/auth/logout-all` | 🔐 Bearer | Revoke ALL sessions for this user |
| `GET`  | `/api/v1/auth/me` | 🔐 Bearer | Return authenticated user profile |
| `POST` | `/api/v1/auth/google` | Public | Google Sign-In — verify ID token, create/find user |

### Token Flow

```
Register / Login
  → new tokenFamily (UUID) + new tokenId (UUID) created
  → accessToken  (15m, signed with JWT_ACCESS_SECRET)
  → refreshToken (30d, signed with JWT_REFRESH_SECRET)
  → { tokenHash, tokenFamily, tokenId } stored in DB (never the raw token)
  → refreshToken returned in:
      • httpOnly cookie (web browser clients)
      • response body  (mobile clients — see below)

Refresh (POST /auth/refresh)
  → verify JWT signature
  → load user, check isActive
  → look up DB by { tokenFamily, tokenId }
      • NOT FOUND → 401
      • FOUND, revokedAt set → REUSE ATTACK: revoke entire family → 401
      • FOUND, active → revoke old, issue new pair (same family, new tokenId)

Logout
  → revoke single token document in DB
  → clear cookie

Logout-all
  → updateMany: set revokedAt on ALL user tokens
```

### Reuse / Compromise Detection

If an **already-rotated** refresh token is replayed (e.g. stolen + replayed by attacker):

1. DB lookup finds the token document with `revokedAt` already set
2. Server logs `[Security] TOKEN REUSE DETECTED` (with `tokenFamily` + `userId`, **never** the token value)
3. **Every token in that family is immediately revoked** — all devices logged out
4. Client receives `401 TOKEN_REUSE_DETECTED` with a security message

### Mobile Client Storage (Flutter)

> ⚠️ **Important**: On mobile apps, the refresh token is returned in the JSON response body (not a cookie). Store it securely using [`flutter_secure_storage`](https://pub.dev/packages/flutter_secure_storage) — **never** in `SharedPreferences` or plain local storage.

```dart
// Store after login/register/refresh
await storage.write(key: 'refreshToken', value: response['refreshToken']);

// Read when calling /refresh
final refreshToken = await storage.read(key: 'refreshToken');

// Delete on logout
await storage.delete(key: 'refreshToken');
```

Pass the stored token in the request body for all `/auth/refresh` and `/auth/logout` calls:
```json
{ "refreshToken": "<stored_raw_refresh_token>" }
```

### Using the Access Token

Include in every protected request:
```
Authorization: Bearer <accessToken>
```

Access tokens expire after **15 minutes**. Call `/auth/refresh` to get a new pair before or after expiry.

---

## All API Endpoints

### 🔐 Authentication (`/api/auth` / `/api/v1/auth`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/register` | Public | Register new customer account |
| `POST` | `/login` | Public | Login with email/password |
| `POST` | `/refresh` | Public | Rotate refresh token for a new access token |
| `POST` | `/google` | Public | Verify Google ID token & login/create user |
| `POST` | `/logout` | 🔐 Bearer | Logout current device session |
| `POST` | `/logout-all` | 🔐 Bearer | Revoke ALL device sessions |
| `GET`  | `/me` | 🔐 Bearer | Get authenticated user |

### 👤 Users (`/api/users` / `/api/v1/users`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET`   | `/me` | 🔐 Bearer | Get personal profile |
| `PATCH` | `/me` | 🔐 Bearer | Update name, phone, or upload avatar (multipart) |

### 🏷️ Categories (`/api/categories` / `/api/v1/categories`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET`    | `/` | Public | List active categories |
| `GET`    | `/:id` | Public | Single category details |
| `POST`   | `/` | 🔐 Admin | Create category (multipart with `image`) |
| `PATCH`  | `/:id` | 🔐 Admin | Update category (multipart) |
| `DELETE` | `/:id` | 🔐 Admin | Delete category (blocked if products exist) |

### 📦 Products (`/api/products` / `/api/v1/products`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET`    | `/?page=1&limit=10&search=&sort=` | Public | Filtered & paginated product catalog |
| `GET`    | `/:id` | Public | Single product details |
| `POST`   | `/` | 🔐 Admin | Create product (multipart, up to 5 `images`) |
| `PATCH`  | `/:id` | 🔐 Admin | Update product / replace images |
| `DELETE` | `/:id` | 🔐 Admin | Delete product and unlink image files |

### 🛒 Cart (`/api/cart` / `/api/v1/cart`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET`    | `/` | 🔐 Bearer | Get active cart with product details |
| `POST`   | `/items` | 🔐 Bearer | Add item `{ productId, quantity }` |
| `PATCH`  | `/items/:productId` | 🔐 Bearer | Update quantity `{ quantity }` |
| `DELETE` | `/items/:productId` | 🔐 Bearer | Remove item from cart |
| `DELETE` | `/` | 🔐 Bearer | Clear entire cart |

### 📋 Orders (`/api/orders` / `/api/v1/orders`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/` | 🔐 Bearer | Checkout & place order (atomic stock lock) |
| `GET`  | `/?page=1&limit=10` | 🔐 Bearer | Customer's paginated orders |
| `GET`  | `/:id` | 🔐 Bearer | Customer's single order details |

### 🛡️ Admin Management (`/api/admin` / `/api/v1/admin`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET`   | `/stats/overview` | 🔐 Admin | Dashboard overview metrics, total revenue, status breakdown (aggregation) |
| `GET`   | `/orders?page=1&limit=20&status=` | 🔐 Admin | Paginated admin orders list |
| `GET`   | `/orders/:id` | 🔐 Admin | Admin order details |
| `PATCH` | `/orders/:id/status` | 🔐 Admin | Update order status (restores stock if Cancelled) |
| `GET`   | `/users?page=1&limit=10&role=` | 🔐 Admin | Paginated admin users list |
| `GET`   | `/users/:id` | 🔐 Admin | Single user profile |
| `GET`   | `/users/:id/orders` | 🔐 Admin | All orders for specific user |
| `PATCH` | `/users/:id/status` | 🔐 Admin | Activate / deactivate user (revokes refresh tokens) |

---

## 🚀 Seeding the Database

Run the development seed script to populate sample admin, customers, categories, products, and orders:

```bash
npm run seed
```

This will output all test credentials directly to your terminal.

---

## 📮 Postman Collection

A complete Postman v2.1.0 collection is available at:
`postman/ecommerce.postman_collection.json`

### Features:
- Collection variables (`baseUrl`, `accessToken`, `adminAccessToken`, `refreshToken`, `productId`, `categoryId`, etc.)
- Automatic token capture scripts on Login & Register
- Full coverage for all customer and admin endpoints
- Documented error responses (401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 422 Validation Error)
- Pre-configured multipart file upload requests

---

## Implementation Status

- **Phase 1** ✅ Scaffold, models, config, error handling
- **Phase 2** ✅ Auth — register, login, refresh, logout, Google OAuth, token families, reuse detection
- **Phase 3** ✅ Categories & Products CRUD with image upload and query filters
- **Phase 4** ✅ Cart management with server-side pricing and stock validation
- **Phase 5** ✅ Orders checkout, atomic stock reservation, status transitions
- **Phase 6** ✅ User profile and admin user management with session revocation

