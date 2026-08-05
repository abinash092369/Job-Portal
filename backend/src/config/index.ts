import dotenv from 'dotenv';
dotenv.config();

const rawFrontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').trim();
// Normalize trailing slashes away
const normalizedFrontendUrl = rawFrontendUrl.replace(/\/+$/, '');

const nodeEnv = process.env.NODE_ENV || 'development';

// Startup assertion check: throw loud error if running in production with localhost FRONTEND_URL
if (nodeEnv === 'production' && normalizedFrontendUrl.includes('localhost')) {
  throw new Error(
    '[CRITICAL CONFIG ERROR] NODE_ENV is set to "production" but FRONTEND_URL is set to a localhost URL. You must set FRONTEND_URL to your deployed frontend domain (e.g. https://job-portal-abinash.netlify.app) on Railway.'
  );
}

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv,
  mongodbUri:
    process.env.MONGODB_URI ||
    'mongodb+srv://infoabhionchain_db_user:gudu123@jobportal.1amtnjs.mongodb.net/?appName=jobportal',
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || 'super_secret_access_key_12345!',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_key_67890!',
  jwtAccessExpiration: process.env.JWT_ACCESS_EXPIRY || '15m',
  jwtRefreshExpiration: process.env.JWT_REFRESH_EXPIRY || '7d',
  frontendUrl: normalizedFrontendUrl,
  backendPublicUrl: (process.env.BACKEND_PUBLIC_URL || 'http://localhost:5000').replace(/\/+$/, ''),
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'Job Portal <noreply@jobportal.com>',
  },
};

export const getCookieOptions = () => {
  const isProduction = config.nodeEnv === 'production';
  return {
    httpOnly: true,
    secure: isProduction, // MUST be true in production for cross-site cookies
    sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax', // MUST be 'none' in production for Netlify -> Railway cross-domain requests
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };
};
