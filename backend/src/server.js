'use strict';

const http = require('http');
const app = require('./app');
const env = require('./config/env');
require('./config/cloudinary');
const logger = require('./config/logger');
const { connectDB, disconnectDB } = require('./config/database');
const { startHealthPinger, stopHealthPinger } = require('./services/healthPinger.service');

const server = http.createServer(app);

// ─── Graceful shutdown ────────────────────────────────────────────────────────
const SHUTDOWN_TIMEOUT_MS = 10_000;

async function gracefulShutdown(signal) {
  logger.info(`[Server] ${signal} received — shutting down gracefully…`);

  // Stop background health check pinger
  stopHealthPinger();

  const forceExit = setTimeout(() => {
    logger.error('[Server] Forced shutdown after timeout.');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  forceExit.unref(); // Don't block event loop

  try {
    // Stop accepting new connections
    await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
    logger.info('[Server] HTTP server closed.');

    // Close DB connection
    await disconnectDB();

    logger.info('[Server] Shutdown complete.');
    process.exit(0);
  } catch (err) {
    logger.error('[Server] Error during shutdown', { error: err.message });
    process.exit(1);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ─── Unhandled errors ─────────────────────────────────────────────────────────
process.on('uncaughtException', (err) => {
  logger.error('[Server] Uncaught Exception — shutting down', { error: err.message, stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('[Server] Unhandled Promise Rejection — shutting down', {
    reason: reason instanceof Error ? reason.message : String(reason),
  });
  process.exit(1);
});

// ─── Boot ─────────────────────────────────────────────────────────────────────
(async () => {
  try {
    await connectDB();

    server.listen(env.PORT, () => {
      logger.info(`[Server] Running in ${env.NODE_ENV} mode`, {
        port: env.PORT,
        url: env.PUBLIC_API_URL,
      });

      // Start automatic 2-second health check pinger
      startHealthPinger(env.HEALTH_PING_INTERVAL_MS);
    });
  } catch (err) {
    logger.error('[Server] Failed to start', { error: err.message });
    process.exit(1);
  }
})();
