import app from './app';
import mongoose from 'mongoose';
import { config } from './config';
import { connectDatabase } from './config/database';
import { logger } from './config/logger';

const startServer = async () => {
  // Connect to MongoDB
  await connectDatabase();

  const server = app.listen(config.port, () => {
    logger.info(`Server listening on port ${config.port} in ${config.nodeEnv} mode`);
    logger.info(`API Docs available at ${config.backendPublicUrl}/docs or ${config.backendPublicUrl}/api/v1/docs`);
  });

  const gracefulShutdown = async (signal: string) => {
    logger.info(`${signal} signal received. Closing HTTP server...`);
    server.close(async () => {
      logger.info('HTTP server closed.');
      try {
        await mongoose.connection.close(false);
        logger.info('MongoDB connection closed cleanly.');
        process.exit(0);
      } catch (err) {
        logger.error(`Error closing MongoDB connection: ${(err as Error).message}`);
        process.exit(1);
      }
    });
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  process.on('unhandledRejection', (reason: Error) => {
    logger.error(`Unhandled Rejection: ${reason.message}`);
    server.close(() => process.exit(1));
  });
};

startServer();
