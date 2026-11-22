import { cache } from '../config/redis.js';

// Coalesce simultaneous anonymous reads; revision-scoped keys prevent stale writes
// from a request that began before an administrator committed a change.
export const publicCache = (handler, group, ttl = 30) => async (req, res, next) => {
  try {
    const payload = await cache.remember(`${group}:http:${req.originalUrl}`, ttl, async () => {
      let body;
      let status = 200;
      const reply = { status(code) { status = code; return reply; }, json(value) { body = value; return reply; } };
      await handler(req, reply, error => { throw error; });
      if (status !== 200 || body?.success === false) {
        const error = new Error('Uncacheable response'); error.response = { status, body }; throw error;
      }
      return body;
    });
    res.json(payload);
  } catch (error) {
    if (error.response) return res.status(error.response.status).json(error.response.body);
    next(error);
  }
};
