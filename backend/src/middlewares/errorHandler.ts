import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { formatResponse } from '../utils/response';
import { logger } from '../utils/logger';
import { env } from '../config/env';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // If headers have already been sent, delegate to the default Express handler
  if (res.headersSent) {
    return next(err);
  }

  // Log error with stack trace
  logger.error(
    `${err.message || 'Unknown Error'} - ${req.method} ${req.originalUrl} - IP: ${req.ip}\nStack: ${err.stack}`
  );

  // Operational, trusted error: send structured response to client
  if (err instanceof AppError) {
    res.status(err.statusCode).json(
      formatResponse(false, null, err.message, err.details)
    );
    return;
  }

  // Handle direct Zod errors (in case validator or code throws ZodError directly)
  if (err.name === 'ZodError' || (err.errors && err.name === 'ZodError')) {
    res.status(400).json(
      formatResponse(false, null, 'Validation Error', err.errors)
    );
    return;
  }

  // Non-operational, system, or unknown error: do not leak details in production
  const statusCode = err.statusCode || 500;
  const message = env.NODE_ENV === 'production'
    ? 'Something went wrong on our end'
    : err.message || 'Internal Server Error';

  const errorDetails = env.NODE_ENV === 'production'
    ? null
    : { stack: err.stack, raw: err };

  res.status(statusCode).json(
    formatResponse(false, null, message, errorDetails)
  );
}
