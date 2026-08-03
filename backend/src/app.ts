import path from 'path';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import { env } from './config/env';
import { logger } from './utils/logger';
import { errorHandler } from './middlewares/errorHandler';
import { globalRateLimiter } from './middlewares/rateLimiter';
import routes from './routes';
import swaggerRouter from './routes/swagger';

const app = express();

// 1. Security Headers (Helmet)
app.use(helmet());

// 2. CORS - Configured, non-wildcard
const allowedOrigins = [env.FRONTEND_URL];
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. Postman, curl, mobile apps)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin) || env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS settings'));
      }
    },
    credentials: true,
  })
);

// 3. Response Compression
app.use(compression());

// 4. Body Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 5. Morgan HTTP logger streaming through Winston logger
const morganMiddleware = morgan(
  ':remote-addr :method :url :status :res[content-length] B - :response-time ms',
  {
    stream: {
      write: (message) => logger.http(message.trim()),
    },
  }
);
app.use(morganMiddleware);

// 6. Global Rate Limiter
app.use(globalRateLimiter);

// 7. Serve Static Uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 8. API Routes Mapping
app.use('/api/v1', routes);

// 8. Swagger Documentation UI
app.use('/docs', swaggerRouter);

// 9. Root Redirect to Docs
app.get('/', (req, res) => {
  res.redirect('/docs');
});

// 10. Centralized Error Handler (must be the final registered middleware)
app.use(errorHandler);

export default app;
