'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const path = require('path');

const env = require('./config/env');
const logger = require('./config/logger');
const notFoundMiddleware = require('./middlewares/notFound.middleware');
const errorMiddleware = require('./middlewares/error.middleware');

const app = express();

// ─── Security headers ─────────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow serving uploaded files
  }),
);

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = [env.CLIENT_URL, env.ADMIN_URL, 'http://localhost:5173', 'http://localhost:3000', 'http://localhost:4000'].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, curl)
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        env.isDevelopment ||
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
      ) {
        return callback(null, true);
      }
      return callback(new Error(`CORS: Origin "${origin}" is not allowed`));
    },
    credentials: true, // Required for httpOnly cookie auth
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// ─── Cookie parsing ───────────────────────────────────────────────────────────────
app.use(cookieParser()); // Required for reading httpOnly refresh token cookies

// ─── Request parsing ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ─── HTTP request logging (Morgan → Winston) ──────────────────────────────────
const morganStream = {
  write: (message) => logger.http(message.trim()),
};

app.use(
  morgan(env.isProduction ? 'combined' : 'dev', {
    stream: morganStream,
    skip: (req) => req.url === '/health', // Don't log health checks
  }),
);

// ─── Global rate limiter (anti-brute-force) ───────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
    errorCode: 'RATE_LIMIT_EXCEEDED',
    details: null,
  },
  skip: (req) => req.ip === '::1' || req.ip === '127.0.0.1', // Skip in dev
});

app.use('/api', globalLimiter);

// ─── Static file serving for uploads ─────────────────────────────────────────
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// ─── Welcome / Root Route ─────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'E-Commerce API Server is running',
    version: '1.0.0',
    healthCheck: '/health',
    endpoints: {
      auth: '/api/v1/auth',
      products: '/api/v1/products',
      categories: '/api/v1/categories',
      cart: '/api/v1/cart',
      orders: '/api/v1/orders',
      admin: '/api/v1/admin',
      users: '/api/v1/users',
    },
  });
});

// ─── Health check ─────────────────────────────────────────────────────────────
const { getHealthPingerStats } = require('./services/healthPinger.service');

app.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Server is healthy',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
    autoPinger: getHealthPingerStats(),
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────────
const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const categoryRoutes = require('./routes/category.routes');
const cartRoutes = require('./routes/cart.routes');
const orderRoutes = require('./routes/order.routes');
const adminRoutes = require('./routes/admin.routes');
const userRoutes = require('./routes/user.routes');

// Support /api/v1/...
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/users', userRoutes);

// Also mount directly under /api/... for straightforward endpoint paths
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);

// ─── 404 handler (must come after all routes) ─────────────────────────────────
app.use(notFoundMiddleware);

// ─── Global error handler (must be last) ──────────────────────────────────────
app.use(errorMiddleware);

module.exports = app;
