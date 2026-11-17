import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import redisClient from '../config/redis.js';

/**
 * Creates a Redis-backed store for distributed rate limiting across server restarts.
 * Falls back safely to in-memory store if Redis is unavailable.
 */
function createStore(prefix) {
  if (redisClient && process.env.REDIS_URL) {
    try {
      return new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
        prefix: `rl:${prefix}:`,
      });
    } catch (e) {
      console.warn(`[RateLimiter] Using in-memory store for ${prefix}: ${e.message}`);
    }
  }
  return undefined;
}

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 login attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  passOnStoreError: true,
  store: createStore('auth'),
  message: {
    success: false,
    message: 'Too many login attempts from this IP. Please try again after 15 minutes.',
  },
});

export const registrationLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 30, // Limit registration submissions to 30 per 10 mins
  standardHeaders: true,
  legacyHeaders: false,
  passOnStoreError: true,
  store: createStore('reg'),
  message: {
    success: false,
    message: 'Too many registration requests. Please wait a few minutes before trying again.',
  },
});

export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200, // 200 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  passOnStoreError: true,
  store: createStore('api'),
});
