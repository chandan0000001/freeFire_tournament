import mongoose from 'mongoose';

export const connectDB = async (retryCount = 0) => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[Database Error] MongoDB connection failed: ${error.message}`);
    if (retryCount < 5) {
      console.log(`[Database] Retrying MongoDB connection in 3s (attempt ${retryCount + 1}/5)...`);
      setTimeout(() => connectDB(retryCount + 1), 3000);
    } else if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};
