import app from './app';
import { env } from './config/env';
import { logger } from './utils/logger';
import { connectDatabase } from './config/database';

async function startServer() {
  // 1. Establish Database Connection
  await connectDatabase();

  // 2. Start Listening
  const server = app.listen(env.PORT, () => {
    logger.info(`🚀 Server running in [${env.NODE_ENV}] mode on port [${env.PORT}]`);
    logger.info(`📖 Swagger UI API Docs available at http://localhost:${env.PORT}/docs`);
  });

  // Graceful error termination procedures
  process.on('unhandledRejection', (err: Error) => {
    logger.error(`Unhandled Promise Rejection: ${err.stack || err.message}`);
    logger.error('Shutting down server...');
    server.close(() => {
      process.exit(1);
    });
  });

  process.on('uncaughtException', (err: Error) => {
    logger.error(`Uncaught Exception: ${err.stack || err.message}`);
    logger.error('Shutting down server...');
    server.close(() => {
      process.exit(1);
    });
  });
}

startServer();
