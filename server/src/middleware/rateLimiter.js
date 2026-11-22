import rateLimit from 'express-rate-limit';
import { cache } from '../config/redis.js';
class AdaptiveStore {
  constructor(prefix) { this.prefix = prefix; this.localKeys = false; }
  init(options) { this.windowMs = options.windowMs; }
  increment(key) { return cache.counter(`rl:${this.prefix}:${key}`, this.windowMs); }
  async decrement() { /* Requests count for the entire fixed window. */ }
  resetKey(key) { return cache.del(`rl:${this.prefix}:${key}`); }
}
const limiter = (prefix, windowMs, max) => rateLimit({
  windowMs, max, standardHeaders: true, legacyHeaders: false,
  store: new AdaptiveStore(prefix),
  message: { success: false, message: 'Too many requests. Please try again after the rate-limit window resets.' },
});
export const authLimiter = limiter('auth', 15 * 60 * 1000, 20);
export const registrationLimiter = limiter('reg', 10 * 60 * 1000, 30);
export const apiLimiter = limiter('api', 60 * 1000, 200);
