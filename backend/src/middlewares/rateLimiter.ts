import rateLimit from 'express-rate-limit';
import { formatResponse } from '../utils/response';

// Global rate limiter applied to all endpoints
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: formatResponse(false, null, 'Too many requests from this IP, please try again after 15 minutes', null),
  statusCode: 429,
});

// Stricter rate limiter for sensitive authentication endpoints (e.g., login, forgot password)
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: formatResponse(false, null, 'Too many login or sensitive auth attempts, please try again after 15 minutes', null),
  statusCode: 429,
});

// Specific rate limiter for public search and listing routes
export const jobSearchRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: formatResponse(false, null, 'Too many search requests from this IP, please try again after 1 minute', null),
  statusCode: 429,
});
