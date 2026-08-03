import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger';

const RETRY_INTERVAL_MS = 5000;
const MAX_RETRIES = 5;

/**
 * PRODUCTION-READY MONGOOSE CONNECTION SETUP
 * 
 * Connection Options:
 * - maxPoolSize: Default is 100 in Mongoose/MongoDB driver. We explicitly set it.
 *   For a long-running server, a pool size of 10-50 is typical depending on load.
 *   NOTE FOR SERVERLESS DEPLOYMENTS (e.g., AWS Lambda, Vercel Functions):
 *   - In serverless environments, each invocation runs in a short-lived, isolated container.
 *   - The driver cannot reuse the pool across distinct concurrent invocations.
 *   - Therefore, maxPoolSize should be set very low (e.g., 1 or 2) to avoid exhausting database connections.
 *   - Also, we must check if an active connection already exists before calling `mongoose.connect`.
 */
const mongooseOptions: mongoose.ConnectOptions = {
  maxPoolSize: env.NODE_ENV === 'production' ? 50 : 10,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
};

export async function connectDatabase(): Promise<void> {
  let attempt = 1;
  const dbUri = env.MONGODB_URI;

  while (attempt <= MAX_RETRIES) {
    try {
      logger.info(`Connecting to MongoDB... (Attempt ${attempt}/${MAX_RETRIES})`);
      
      // If we are in a serverless environment, prevent re-connecting if already connected
      if (mongoose.connection.readyState === 1) {
        logger.info('Using existing MongoDB connection');
        return;
      }

      await mongoose.connect(dbUri, mongooseOptions);
      logger.info('📡 Successfully connected to MongoDB');
      return;
    } catch (error: any) {
      logger.error(`❌ Failed to connect to MongoDB on attempt ${attempt}: ${error.message}`);
      attempt++;
      if (attempt <= MAX_RETRIES) {
        logger.info(`Retrying database connection in ${RETRY_INTERVAL_MS / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL_MS));
      }
    }
  }

  logger.error('❌ Max retries reached. Could not connect to MongoDB. Exiting...');
  process.exit(1);
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    logger.info('Closing MongoDB connection...');
    await mongoose.disconnect();
    logger.info('🔌 MongoDB connection closed gracefully');
  }
}

// Listen for process signals to gracefully shut down connection (only for long-running servers)
if (process.env.NODE_ENV !== 'test') {
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);
    await disconnectDatabase();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}
