import 'dotenv/config';

import app from './app.js';
import { connectDB } from './config/db.js';
import './config/redis.js'; // Initialize Redis/cache

const PORT = process.env.PORT || 5000;

// Connect to Database and start server
const startServer = async () => {
  try {
    await connectDB();
    const server = app.listen(PORT, () => {
      console.log(`[RIT Esports Arena] Server running on port ${PORT} (${process.env.NODE_ENV || 'development'} mode)`);
      console.log(`[API Base URL] http://localhost:${PORT}/api`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received. Shutting down gracefully...');
      server.close(() => {
        console.log('Process terminated.');
      });
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
