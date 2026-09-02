'use strict';

const { createLogger, format, transports } = require('winston');
const path = require('path');

// ─── Sensitive field redaction ────────────────────────────────────────────────
const SENSITIVE_KEYS = new Set([
  'password',
  'passwordHash',
  'token',
  'accessToken',
  'refreshToken',
  'tokenHash',
  'secret',
  'jwt',
  'authorization',
  'cookie',
  'googleClientSecret',
]);

/**
 * Recursively redact sensitive keys from an object.
 * @param {unknown} obj
 * @returns {unknown}
 */
function redact(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(redact);

  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => {
      const lower = k.toLowerCase();
      if (SENSITIVE_KEYS.has(lower) || SENSITIVE_KEYS.has(k)) {
        return [k, '[REDACTED]'];
      }
      return [k, redact(v)];
    }),
  );
}

// ─── Custom format: redact + pretty-print metadata ────────────────────────────
const redactFormat = format((info) => {
  if (info.meta) info.meta = redact(info.meta);
  if (info.body) info.body = redact(info.body);
  return info;
});

// ─── Log level from env (loaded lazily to avoid circular deps) ───────────────
const LOG_LEVEL = process.env.LOG_LEVEL || 'debug';
const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';

const logsDir = path.resolve(__dirname, '../../logs');

// ─── Winston logger ───────────────────────────────────────────────────────────
const logger = createLogger({
  level: LOG_LEVEL,
  format: format.combine(
    redactFormat(),
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: !isProduction }),
  ),
  transports: [
    // Console transport — coloured in dev, JSON in prod
    new transports.Console({
      format: isProduction
        ? format.json()
        : format.combine(format.colorize(), format.printf(({ timestamp, level, message, ...meta }) => {
            const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
            return `${timestamp} [${level}]: ${message}${metaStr}`;
          })),
    }),

    // Error log file (errors only)
    new transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: format.json(),
      maxsize: 10 * 1024 * 1024, // 10 MB
      maxFiles: 5,
    }),

    // Combined log file (all levels)
    new transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: format.json(),
      maxsize: 20 * 1024 * 1024, // 20 MB
      maxFiles: 10,
    }),
  ],
  // Uncaught exceptions / rejections
  exceptionHandlers: [
    new transports.File({ filename: path.join(logsDir, 'exceptions.log') }),
  ],
  rejectionHandlers: [
    new transports.File({ filename: path.join(logsDir, 'rejections.log') }),
  ],
  exitOnError: false,
});

module.exports = logger;
