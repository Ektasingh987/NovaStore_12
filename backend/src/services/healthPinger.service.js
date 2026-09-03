'use strict';

const http = require('http');
const https = require('https');
const env = require('../config/env');
const logger = require('../config/logger');

let intervalId = null;
let isPinging = false;
let stats = {
  totalPings: 0,
  successfulPings: 0,
  failedPings: 0,
  lastPingAt: null,
  lastStatus: null,
  lastDurationMs: null,
};

/**
 * Resolve target URL for health check
 * Priority: RENDER_EXTERNAL_URL (Render.com) -> PUBLIC_API_URL -> localhost
 */
function getTargetHealthUrl() {
  const baseUrl = (
    process.env.RENDER_EXTERNAL_URL ||
    env.RENDER_EXTERNAL_URL ||
    env.PUBLIC_API_URL ||
    `http://localhost:${env.PORT}`
  ).replace(/\/+$/, '');

  return `${baseUrl}/health`;
}

/**
 * Execute a single health check ping
 */
function performHealthPing() {
  if (isPinging) return; // Skip if previous ping is still running
  isPinging = true;

  const targetUrl = getTargetHealthUrl();
  const startTime = Date.now();
  const isHttps = targetUrl.startsWith('https://');
  const client = isHttps ? https : http;

  try {
    const req = client.get(
      targetUrl,
      {
        timeout: 5000,
        headers: {
          'User-Agent': 'HealthPinger/1.0 (AutoKeepAlive)',
          Accept: 'application/json',
        },
      },
      (res) => {
        // Consume response data to free up memory
        res.resume();

        const duration = Date.now() - startTime;
        stats.totalPings += 1;
        stats.lastPingAt = new Date().toISOString();
        stats.lastStatus = res.statusCode;
        stats.lastDurationMs = duration;

        if (res.statusCode >= 200 && res.statusCode < 400) {
          stats.successfulPings += 1;
          logger.debug(
            `[HealthPinger] Health check OK (${res.statusCode}) to ${targetUrl} in ${duration}ms (Total: ${stats.totalPings})`,
          );
        } else {
          stats.failedPings += 1;
          logger.warn(
            `[HealthPinger] Health check received status ${res.statusCode} from ${targetUrl}`,
          );
        }
        isPinging = false;
      },
    );

    req.on('timeout', () => {
      req.destroy(new Error('Health check request timed out after 5s'));
    });

    req.on('error', (err) => {
      stats.totalPings += 1;
      stats.failedPings += 1;
      stats.lastPingAt = new Date().toISOString();
      stats.lastStatus = 'ERROR';
      logger.debug(`[HealthPinger] Ping error for ${targetUrl}: ${err.message}`);
      isPinging = false;
    });
  } catch (error) {
    stats.totalPings += 1;
    stats.failedPings += 1;
    stats.lastPingAt = new Date().toISOString();
    logger.debug(`[HealthPinger] Unexpected error during ping: ${error.message}`);
    isPinging = false;
  }
}

/**
 * Start recurring automatic health ping every N milliseconds (default 2 min / 120,000ms)
 */
function startHealthPinger(intervalMs = env.HEALTH_PING_INTERVAL_MS || 120000) {
  if (intervalId) {
    logger.warn('[HealthPinger] Health pinger is already active.');
    return;
  }

  if (!env.AUTO_HEALTH_PING_ENABLED) {
    logger.info('[HealthPinger] Auto health pinger is disabled in configuration.');
    return;
  }

  const targetUrl = getTargetHealthUrl();
  const intervalDisplay = intervalMs >= 60000 ? `${intervalMs / 60000} min` : `${intervalMs / 1000}s`;
  logger.info(
    `[HealthPinger] Starting automatic health check pinger every ${intervalMs}ms (${intervalDisplay}) targeting: ${targetUrl}`,
  );

  // Run initial ping after 1 second of boot
  setTimeout(performHealthPing, 1000);

  // Set recurring interval
  intervalId = setInterval(performHealthPing, intervalMs);
  if (intervalId.unref) {
    intervalId.unref(); // Don't prevent process shutdown
  }
}

/**
 * Stop automatic health pinger
 */
function stopHealthPinger() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    logger.info('[HealthPinger] Health pinger stopped.');
  }
}

/**
 * Get current pinger statistics
 */
function getHealthPingerStats() {
  return {
    isActive: Boolean(intervalId),
    intervalMs: env.HEALTH_PING_INTERVAL_MS || 120000,
    targetUrl: getTargetHealthUrl(),
    ...stats,
  };
}

module.exports = {
  startHealthPinger,
  stopHealthPinger,
  getHealthPingerStats,
};
