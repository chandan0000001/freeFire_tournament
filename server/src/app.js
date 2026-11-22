import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';

const app = express();

// Security Headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS configuration (allow local dev + production frontend)
const clientUrls = (process.env.CLIENT_URL || '')
  .split(',')
  .map((s) => s.trim().replace(/\/+$/, ''))
  .filter(Boolean);

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://rittournament.vercel.app',
  ...clientUrls,
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or Postman)
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        process.env.NODE_ENV !== 'production'
      ) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  })
);

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads directory (for screenshot evidence)
app.use('/uploads', express.static(path.resolve('uploads')));

// Root Welcome & Ping Route (prevents 404 when visiting primary backend URL)
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Rahul Esports Arena API Server is LIVE and healthy',
    version: '2.0.0',
    endpoints: {
      health: '/api/health',
      tournaments: '/api/tournaments',
      leaderboard: '/api/leaderboards',
      wallet: '/api/wallet/:email',
      settings: '/api/settings/public',
    },
    clientOrigin: process.env.CLIENT_URL || 'https://rittournament.vercel.app',
    timestamp: new Date().toISOString(),
  });
});

app.head('/', (req, res) => {
  res.status(200).end();
});

// Health Check Route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Rahul Esports Arena API',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Auto-fallback: if client requests /tournaments or /settings/public without /api, seamlessly route to /api/...
app.use((req, res, next) => {
  if (
    !req.path.startsWith('/api') &&
    !req.path.startsWith('/uploads') &&
    req.path !== '/'
  ) {
    req.url = `/api${req.url}`;
  }
  next();
});

// Mount Main API Routes
app.use('/api', apiLimiter, routes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Centralized Error Handler
app.use(errorHandler);

export default app;
