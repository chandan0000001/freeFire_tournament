import Redis from 'ioredis';

let redisClient = null;
const memoryCache = new Map();

if (process.env.REDIS_URL) {
  try {
    redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableOfflineQueue: true,
      connectTimeout: 5000,
      lazyConnect: true,
      retryStrategy(times) {
        if (times > 3) {
          console.warn('[Redis] Max reconnect attempts reached. Switching to in-memory fallback.');
          return null;
        }
        return Math.min(times * 500, 2000);
      },
    });

    redisClient.on('connect', () => {
      console.log('[Redis] Connected successfully to Redis Cloud');
    });

    redisClient.on('error', (err) => {
      console.warn(`[Redis Notice] Redis connection issue (${err.message}). Using in-memory fallback.`);
    });

    // Attempt initial connection asynchronously
    redisClient.connect().catch((err) => {
      console.warn(`[Redis Notice] Initial connect failed (${err.message}). In-memory cache active.`);
    });
  } catch (err) {
    console.warn(`[Redis Notice] Failed to initialize Redis client: ${err.message}. Using in-memory fallback.`);
  }
} else {
  console.log('[Redis] No REDIS_URL provided. Operating with in-memory caching.');
}

/**
 * Universal Cache Helper (Redis with In-Memory Fallback)
 */
export const cache = {
  async get(key) {
    if (redisClient && redisClient.status === 'ready') {
      try {
        const val = await redisClient.get(key);
        return val ? JSON.parse(val) : null;
      } catch (e) {
        // Fallback to memory
      }
    }
    const item = memoryCache.get(key);
    if (!item) return null;
    if (item.expires && item.expires < Date.now()) {
      memoryCache.delete(key);
      return null;
    }
    return item.value;
  },

  async set(key, value, ttlSeconds = 60) {
    const serialized = JSON.stringify(value);
    if (redisClient && redisClient.status === 'ready') {
      try {
        await redisClient.set(key, serialized, 'EX', ttlSeconds);
        return;
      } catch (e) {
        // Fallback to memory
      }
    }
    memoryCache.set(key, {
      value,
      expires: Date.now() + ttlSeconds * 1000,
    });
  },

  async incr(key, ttlSeconds = 60) {
    if (redisClient && redisClient.status === 'ready') {
      try {
        const multi = redisClient.multi();
        multi.incr(key);
        multi.expire(key, ttlSeconds);
        const results = await multi.exec();
        return results?.[0]?.[1] || 1;
      } catch (e) {
        // Fallback
      }
    }
    const current = memoryCache.get(key);
    const count = current ? (current.value || 0) + 1 : 1;
    memoryCache.set(key, {
      value: count,
      expires: current?.expires || (Date.now() + ttlSeconds * 1000),
    });
    return count;
  },

  async del(key) {
    if (redisClient && redisClient.status === 'ready') {
      try {
        await redisClient.del(key);
      } catch (e) {}
    }
    memoryCache.delete(key);
  },

  async delPattern(pattern) {
    if (redisClient && redisClient.status === 'ready') {
      try {
        const stream = redisClient.scanStream({ match: pattern, count: 100 });
        stream.on('data', async (keys) => {
          if (keys && keys.length > 0) {
            const pipeline = redisClient.pipeline();
            keys.forEach((k) => pipeline.del(k));
            await pipeline.exec();
          }
        });
      } catch (e) {
        console.warn(`[Redis Notice] delPattern error for ${pattern}:`, e.message);
      }
    }
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    for (const k of memoryCache.keys()) {
      if (regex.test(k)) {
        memoryCache.delete(k);
      }
    }
  },

  async flush() {
    if (redisClient && redisClient.status === 'ready') {
      try {
        await redisClient.flushdb();
      } catch (e) {}
    }
    memoryCache.clear();
  },
};

/**
 * High-performance Redis helpers for Auth, Wallet, and Password Reset
 */
export const redisAuth = {
  // Store user profile cache (TTL: 1 hour)
  async cacheUser(user, ttl = 3600) {
    if (!user?._id && !user?.id) return;
    const uid = user._id || user.id;
    await cache.set(`user:${uid}`, user, ttl);
  },

  async getCachedUser(userId) {
    return cache.get(`user:${userId}`);
  },

  async invalidateUser(userId) {
    await cache.del(`user:${userId}`);
  },

  // Store password reset token with 15-minute expiration (900 seconds)
  async storeResetToken(token, data, ttlSeconds = 900) {
    await cache.set(`pwd_reset:${token}`, data, ttlSeconds);
  },

  async getResetToken(token) {
    return cache.get(`pwd_reset:${token}`);
  },

  async clearResetToken(token) {
    await cache.del(`pwd_reset:${token}`);
  },

  // Wallet caching (TTL: 5 minutes, invalidated immediately on coin update)
  async cacheWallet(key, wallet, ttl = 300) {
    await cache.set(`wallet:${key}`, wallet, ttl);
  },

  async getCachedWallet(key) {
    return cache.get(`wallet:${key}`);
  },

  async invalidateWallet(keys = []) {
    for (const k of keys) {
      if (k) await cache.del(`wallet:${k}`);
    }
  },

  // Rate Limiting via Redis (e.g., max 5 login attempts per 15 minutes)
  async rateLimit(key, maxAttempts = 5, windowSeconds = 900) {
    const attempts = await cache.incr(`ratelimit:${key}`, windowSeconds);
    return {
      allowed: attempts <= maxAttempts,
      current: attempts,
      max: maxAttempts,
    };
  },
};

export { redisClient };
export default redisClient;
