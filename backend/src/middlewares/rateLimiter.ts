import rateLimit from 'express-rate-limit';

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false, xForwardedForHeader: false },
  skip: (req) => req.method === 'OPTIONS', // Skip CORS preflight checks
  message: {
    success: false,
    data: null,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
});

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 login attempts per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false, xForwardedForHeader: false },
  skip: (req) => req.method === 'OPTIONS',
  message: {
    success: false,
    data: null,
    message: 'Too many login attempts. Please try again after 15 minutes',
  },
});
