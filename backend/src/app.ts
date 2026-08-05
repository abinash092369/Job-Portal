import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import path from 'path';
import { config } from './config';
import { logger } from './config/logger';
import { globalLimiter } from './middlewares/rateLimiter';
import { errorHandler } from './middlewares/errorHandler';
import routes from './routes';

const app = express();

// Enable trust proxy for Railway / reverse proxy setup (MUST be set before rate limiting or other middleware)
app.set('trust proxy', 1);

// Security headers
app.use(helmet());

logger.info(`Configured CORS Allowed FRONTEND_URL: ${config.frontendUrl}`);

const allowedOrigins = [
  config.frontendUrl,
  'https://job-portal-abinash.netlify.app',
  'http://localhost:5173',
  'http://localhost:3000',
].map((url) => url.replace(/\/+$/, ''));

// CORS configuration supporting cross-domain httpOnly cookies
app.use(
  cors({
    origin: (requestOrigin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, Postman, server-to-server)
      if (!requestOrigin) {
        return callback(null, true);
      }

      const normalizedOrigin = requestOrigin.replace(/\/+$/, '');
      if (allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      logger.warn(`CORS blocked request from origin: ${requestOrigin}`);
      return callback(new Error(`CORS policy error: Origin '${requestOrigin}' not allowed.`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Compression & Parsers
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Rate Limiter
app.use(globalLimiter);

// Serve static uploaded files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Mount routes at both /api/v1 and root level for full compatibility
app.use('/api/v1', routes);
app.use('/', routes);

// Centralized error handler
app.use(errorHandler);

export default app;
