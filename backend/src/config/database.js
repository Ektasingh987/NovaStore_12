'use strict';

const dns = require('dns');
// Set public DNS servers to resolve MongoDB SRV records reliably across all Windows networks
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch {
  // Ignore in case DNS server assignment is restricted
}

const mongoose = require('mongoose');
const env = require('./env');
const logger = require('./logger');

let isConnected = false;

/**
 * Connect to MongoDB using the URI from env config.
 * Idempotent — safely callable multiple times.
 */
async function connectDB() {
  if (isConnected) {
    logger.debug('[DB] Already connected — skipping reconnect.');
    return;
  }

  mongoose.set('strictQuery', true);

  mongoose.connection.on('connected', () => {
    isConnected = true;
    logger.info('[DB] MongoDB connected', { host: mongoose.connection.host });
  });

  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    logger.warn('[DB] MongoDB disconnected.');
  });

  mongoose.connection.on('error', (err) => {
    logger.error('[DB] MongoDB connection error', { error: err.message });
  });

  mongoose.connection.on('reconnected', () => {
    isConnected = true;
    logger.info('[DB] MongoDB reconnected.');
  });

  await mongoose.connect(env.MONGO_URI, {
    // Modern Mongoose ≥7 — connection options are mostly handled internally
    serverSelectionTimeoutMS: 10_000,
    socketTimeoutMS: 45_000,
  });
}

/**
 * Gracefully close the MongoDB connection.
 * Call this in process shutdown handlers.
 */
async function disconnectDB() {
  if (!isConnected) return;
  await mongoose.connection.close();
  isConnected = false;
  logger.info('[DB] MongoDB connection closed gracefully.');
}

module.exports = { connectDB, disconnectDB };
