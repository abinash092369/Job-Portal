import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { sendSuccess, sendError } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthenticatedRequest } from '../types';
import { getCookieOptions, getClearCookieOptions } from '../config';

const authService = new AuthService();

export const firebaseAuth = asyncHandler(async (req: Request, res: Response) => {
  const { idToken, role, name, email } = req.body;
  const { user, accessToken, refreshToken } = await authService.firebaseAuth(idToken, role, name, email);

  const cookieOptions = getCookieOptions();
  res.cookie('refreshToken', refreshToken, cookieOptions);

  return sendSuccess(res, { user, accessToken }, 'Firebase authentication successful.');
});

export const logout = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.id) {
    await authService.logout(req.user.id);
  }
  const cookieOptions = getClearCookieOptions();
  res.clearCookie('refreshToken', cookieOptions);
  return sendSuccess(res, null, 'Logout successful.');
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) {
    return sendError(res, 'Refresh token cookie is missing', 401);
  }

  const { accessToken, refreshToken: newRefreshToken } = await authService.refreshToken(refreshToken);

  const cookieOptions = getCookieOptions();
  res.cookie('refreshToken', newRefreshToken, cookieOptions);

  return sendSuccess(res, { accessToken }, 'Access token refreshed successfully.');
});

export const me = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user?.id) {
    return sendError(res, 'Unauthenticated', 401);
  }
  const user = await authService.getMe(req.user.id);
  return sendSuccess(res, user);
});
