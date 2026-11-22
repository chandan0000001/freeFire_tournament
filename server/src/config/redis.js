import Redis from 'ioredis';
import { AsyncLocalStorage } from 'node:async_hooks';

const prefix = process.env.REDIS_KEY_PREFIX || 'thff:';
const memory = new Map();
const pending = new Map();
const requestContext = new AsyncLocalStorage();
const maxEntries = Number(process.env.CACHE_MAX_ENTRIES) || 1000;
let fallbackRevision = `local-${Date.now()}`;
let redisClient = null;
const metrics = { hits: 0, misses: 0, errors: 0, coalesced: 0 };

if (process.env.REDIS_URL) {
  redisClient = new Redis(process.env.REDIS_URL, {
    lazyConnect: true, enableOfflineQueue: false, maxRetriesPerRequest: 1,
    connectTimeout: 3000, commandTimeout: 1000,
    retryStrategy: attempt => Math.min(attempt * 500, 10000),
  });
  redisClient.on('error', () => { metrics.errors += 1; });
  redisClient.on('ready', () => {
    // Discard pre-outage data, including writes made while operating on memory.
    memory.clear();
    redisClient.incr(`${prefix}revision`).catch(() => {});
  });
  redisClient.connect().catch(() => {});
}
const clone = value => value == null ? value : JSON.parse(JSON.stringify(value));
const readMemory = key => {
  const item = memory.get(key);
  if (!item) return null;
  if (item.expires <= Date.now()) { memory.delete(key); return null; }
  return item;
};
const putMemory = (key, value, expires) => {
  if (memory.size >= maxEntries && !memory.has(key)) memory.delete(memory.keys().next().value);
  memory.set(key, { value: clone(value), expires });
};
const dataKey = key => /^(tournaments?:|leaderboard:|winners:|results:|settings:|wallet:|dashboard:)/.test(key);
const physicalKey = key => `${prefix}${dataKey(key) ? `data:${requestContext.getStore()?.revision || fallbackRevision}:` : ''}${key}`;
const fixedWindowScript = `local count = redis.call('INCR', KEYS[1]); if count == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end; return {count, redis.call('PTTL', KEYS[1])}`;

export const cache = {
  metrics,
  async revision() {
    if (redisClient?.status === 'ready') {
      try { return String(await redisClient.get(`${prefix}revision`) || '0'); } catch { metrics.errors++; }
    }
    return fallbackRevision;
  },
  async bumpRevision() {
    fallbackRevision = `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    for (const key of memory.keys()) if (key.startsWith(`${prefix}data:`)) memory.delete(key);
    if (redisClient?.status === 'ready') {
      try { return String(await redisClient.incr(`${prefix}revision`)); } catch { metrics.errors++; }
    }
    return fallbackRevision;
  },
  async scope(work) { return requestContext.run({ revision: await cache.revision() }, work); },
  async get(key) {
    const actual = physicalKey(key);
    let value = null;
    if (redisClient?.status === 'ready') {
      try { const raw = await redisClient.get(actual); value = raw == null ? null : JSON.parse(raw); }
      catch { metrics.errors++; value = readMemory(actual)?.value ?? null; }
    } else value = readMemory(actual)?.value ?? null;
    metrics[value == null ? 'misses' : 'hits']++;
    return clone(value);
  },
  async set(key, value, ttlSeconds = 60) {
    const actual = physicalKey(key);
    const ttl = Math.max(1, Math.floor(ttlSeconds));
    if (redisClient?.status === 'ready') {
      try { await redisClient.set(actual, JSON.stringify(value), 'EX', ttl); memory.delete(actual); return; }
      catch { metrics.errors++; }
    }
    putMemory(actual, value, Date.now() + ttl * 1000);
  },
  async remember(key, ttl, load) {
    const cached = await cache.get(key);
    if (cached !== null) return cached;
    const actual = physicalKey(key);
    if (pending.has(actual)) { metrics.coalesced++; return clone(await pending.get(actual)); }
    const task = (async () => { const value = await load(); await cache.set(key, value, ttl); return value; })();
    pending.set(actual, task);
    try { return clone(await task); } finally { pending.delete(actual); }
  },
  async counter(key, windowMs) {
    const actual = `${prefix}${key}`;
    if (redisClient?.status === 'ready') {
      try {
        const [count, ttl] = await redisClient.eval(fixedWindowScript, 1, actual, windowMs);
        return { totalHits: Number(count), resetTime: new Date(Date.now() + Math.max(0, Number(ttl))) };
      } catch { metrics.errors++; }
    }
    const current = readMemory(actual);
    const count = (current?.value || 0) + 1;
    const expires = current?.expires || Date.now() + windowMs;
    putMemory(actual, count, expires);
    return { totalHits: count, resetTime: new Date(expires) };
  },
  async incr(key, ttlSeconds = 60) { return (await cache.counter(key, ttlSeconds * 1000)).totalHits; },
  async del(key) {
    const actual = physicalKey(key);
    memory.delete(actual);
    if (redisClient?.status === 'ready') { try { await redisClient.del(actual); } catch { metrics.errors++; } }
  },
  async delPattern(pattern) {
    const actual = physicalKey(pattern);
    const regex = new RegExp('^' + actual.split('*').map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$');
    for (const key of memory.keys()) if (regex.test(key)) memory.delete(key);
    if (redisClient?.status !== 'ready') return;
    try {
      let cursor = '0';
      do {
        const [next, keys] = await redisClient.scan(cursor, 'MATCH', actual, 'COUNT', 100);
        cursor = next;
        if (keys.length) await redisClient.unlink(...keys);
      } while (cursor !== '0');
    } catch { metrics.errors++; }
  },
  // Never flush a shared Redis database or erase login/reset state.
  async flush() { return cache.bumpRevision(); },
};

export const redisAuth = {
  async cacheUser(user, ttl = 60) {
    if (!user?._id && !user?.id) return;
    const { password, resetPasswordToken, resetPasswordExpires, ...safe } = user;
    await cache.set(`user:${user._id || user.id}`, safe, ttl);
  },
  getCachedUser: id => cache.get(`user:${id}`),
  invalidateUser: id => cache.del(`user:${id}`),
  storeResetToken: (token, data, ttl = 900) => cache.set(`pwd_reset:${token}`, data, ttl),
  getResetToken: token => cache.get(`pwd_reset:${token}`),
  clearResetToken: token => cache.del(`pwd_reset:${token}`),
  cacheWallet: (key, wallet, ttl = 60) => cache.set(`wallet:${key}`, wallet, ttl),
  getCachedWallet: key => cache.get(`wallet:${key}`),
  async invalidateWallet(keys = []) { for (const key of keys.filter(Boolean)) await cache.del(`wallet:${key}`); },
  async rateLimit(key, maxAttempts = 5, windowSeconds = 900) {
    const current = await cache.incr(`ratelimit:${key}`, windowSeconds);
    return { allowed: current <= maxAttempts, current, max: maxAttempts };
  },
};
export { redisClient };
export default redisClient;
