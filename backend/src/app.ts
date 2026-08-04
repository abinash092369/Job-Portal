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

// Trust reverse proxy (Railway / Cloudflare / Nginx) for secure cookies & X-Forwarded-Proto
app.set('trust proxy', 1);

// 1. Security Headers (Helmet) - allow cross-origin loading of static uploads (logos, photos, resumes)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// 2. CORS - Configured production and deployment origins
const allowedOrigins = [
  env.FRONTEND_URL.replace(/\/$/, ''),
  'https://job-portal-abinash.netlify.app',
  'https://job-portal-abinash-app.netlify.app',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. Postman, curl, mobile apps)
      if (!origin) return callback(null, true);
      
      const cleanOrigin = origin.replace(/\/$/, '');
      if (
        allowedOrigins.includes(cleanOrigin) ||
        cleanOrigin.endsWith('.netlify.app') ||
        cleanOrigin.includes('localhost') ||
        cleanOrigin.includes('127.0.0.1') ||
        env.NODE_ENV === 'development'
      ) {
        callback(null, true);
      } else {
        logger.error(`CORS Blocked: Origin [${origin}] is not in allowed origins [${allowedOrigins.join(', ')}]`);
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
