import Redis from 'ioredis';

let redisClient = null;
const memoryCache = new Map();

if (process.env.REDIS_URL) {
  try {
    redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
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
        // Fallback
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
        // Fallback
      }
    }
    memoryCache.set(key, {
      value,
      expires: Date.now() + ttlSeconds * 1000,
    });
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

export default redisClient;
