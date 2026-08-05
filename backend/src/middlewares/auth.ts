import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, UserRole } from '../types';
import { verifyAccessToken } from '../utils/jwt';
import { sendError } from '../utils/response';
import { User } from '../models/User';

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 'Authentication required. Please provide a valid Bearer token.', 401);
    return;
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyAccessToken(token);

  if (!payload) {
    sendError(res, 'Invalid or expired access token.', 401);
    return;
  }

  // Double check if user exists and is not suspended/deleted
  const dbUser = await User.findById(payload.id);
  if (!dbUser || dbUser.deletedAt) {
    sendError(res, 'User account not found or deactivated.', 401);
    return;
  }

  if (dbUser.isSuspended) {
    sendError(res, 'Your account has been suspended.', 403);
    return;
  }

  req.user = {
    id: dbUser._id.toString(),
    name: dbUser.name || '',
    email: dbUser.email || undefined,
    phone: dbUser.phone || undefined,
    googleId: dbUser.googleId || undefined,
    avatar: dbUser.avatar || '',
    role: dbUser.role,
    provider: dbUser.provider,
    isSuspended: dbUser.isSuspended,
  };

  next();
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required.', 401);
      return;
    }

    if (!roles.includes(req.user.role)) {
      sendError(res, `Forbidden. Role '${req.user.role}' is not authorized to access this resource.`, 403);
      return;
    }

    next();
  };
};
