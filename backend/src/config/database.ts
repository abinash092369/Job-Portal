import mongoose from 'mongoose';
import { config } from './index';
import { logger } from './logger';

export const connectDatabase = async (retries = 5, delayMs = 3000): Promise<void> => {
  const options = {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  };

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const conn = await mongoose.connect(config.mongodbUri, options);
      logger.info(`MongoDB Connected: ${conn.connection.host}`);

      mongoose.connection.on('error', (err) => {
        logger.error(`MongoDB Connection Error: ${err.message}`);
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB Disconnected. Attempting to reconnect...');
      });

      return;
    } catch (error) {
      logger.error(
        `MongoDB Connection Attempt ${attempt}/${retries} failed: ${(error as Error).message}`
      );
      if (attempt < retries) {
        logger.info(`Retrying MongoDB connection in ${delayMs / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      } else {
        logger.error('Could not connect to MongoDB after max retries. Exiting.');
        process.exit(1);
      }
    }
  }
};
