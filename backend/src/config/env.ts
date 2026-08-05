import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env file
dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  JWT_ACCESS_SECRET: z.string().min(8, 'Access token secret must be at least 8 characters'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(8, 'Refresh token secret must be at least 8 characters'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  RESEND_API_KEY: z.string().optional().default(''),
  RESEND_FROM: z.string().optional().default('Job Portal <onboarding@resend.dev>'),
  FRONTEND_URL: z.string().url('FRONTEND_URL must be a valid URL').optional(),
  MONGODB_URI: z.string().refine(val => val.startsWith('mongodb://') || val.startsWith('mongodb+srv://'), {
    message: 'Invalid MongoDB connection URI',
  }).default('mongodb://localhost:27017/jobportal'),
  CLOUDINARY_CLOUD_NAME: z.string().optional().default(''),
  CLOUDINARY_API_KEY: z.string().optional().default(''),
  CLOUDINARY_API_SECRET: z.string().optional().default(''),
}).superRefine((data, ctx) => {
  const isProd = data.NODE_ENV === 'production' || process.env.NODE_ENV === 'production';
  if (isProd) {
    if (!data.FRONTEND_URL) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['FRONTEND_URL'],
        message: 'FATAL: FRONTEND_URL environment variable is REQUIRED in production environment',
      });
    } else if (data.FRONTEND_URL.includes('localhost') || data.FRONTEND_URL.includes('127.0.0.1')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['FRONTEND_URL'],
        message: `FATAL: FRONTEND_URL cannot contain localhost or 127.0.0.1 in production! Received: ${data.FRONTEND_URL}`,
      });
    }

    if (!data.RESEND_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['RESEND_API_KEY'],
        message: 'FATAL: RESEND_API_KEY environment variable is REQUIRED in production environment',
      });
    }
  }
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ FATAL STARTUP FAILURE: Invalid environment variables configuration:');
  console.error(JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

const rawFrontendUrl = parsed.data.FRONTEND_URL || (parsed.data.NODE_ENV === 'production' ? '' : 'http://localhost:5173');

if (parsed.data.NODE_ENV === 'production' && (!rawFrontendUrl || rawFrontendUrl.includes('localhost'))) {
  console.error('❌ FATAL STARTUP FAILURE: Production FRONTEND_URL is missing or contains localhost.');
  process.exit(1);
}

export const env = {
  ...parsed.data,
  FRONTEND_URL: rawFrontendUrl.replace(/\/$/, ''),
};

export type Env = z.infer<typeof envSchema>;
