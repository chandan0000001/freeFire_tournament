import { cache } from '../config/redis.js';
export const dataSync = (req, res, next) => {
  cache.scope(() => {
    res.set('Cache-Control', 'no-store');
    const json = res.json.bind(res);
    res.json = async body => {
      if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && !/^\/(?:api\/)?auth\//.test(req.originalUrl) && res.statusCode < 400 && body?.success !== false) {
        const revision = await cache.bumpRevision();
        res.set('X-Data-Revision', revision);
      }
      return json(body);
    };
    next();
  }).catch(next);
};
