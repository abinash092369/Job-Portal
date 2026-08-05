import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { sendSuccess, sendError } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthenticatedRequest } from '../types';
import { getCookieOptions } from '../config';

const authService = new AuthService();

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, role } = req.body;
  const user = await authService.register(email, password, role);
  return sendSuccess(res, user, 'Registration successful. Verification email sent.', 201);
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const token = req.query.token as string;
  if (!token) {
    return sendError(res, 'Verification token is required', 400);
  }
  await authService.verifyEmail(token);
  return sendSuccess(res, null, 'Email verified successfully.');
});

export const resendVerification = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  await authService.resendVerification(email);
  return sendSuccess(res, null, 'Verification email resent.');
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const { user, accessToken, refreshToken } = await authService.login(email, password);

  // Set refreshToken in httpOnly cookie using synchronized cookie options
  const cookieOptions = getCookieOptions();
  res.cookie('refreshToken', refreshToken, cookieOptions);

  // Do NOT include refreshToken in JSON response body per specification
  return sendSuccess(res, { user, accessToken }, 'Login successful.');
});

export const logout = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.id) {
    await authService.logout(req.user.id);
  }
  const cookieOptions = getCookieOptions();
  res.clearCookie('refreshToken', cookieOptions);
  return sendSuccess(res, null, 'Logout successful.');
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) {
    return sendError(res, 'Refresh token cookie is missing', 401);
  }

  const { accessToken, refreshToken: newRefreshToken } = await authService.refreshToken(refreshToken);

  // Rotate refresh cookie using synchronized cookie options
  const cookieOptions = getCookieOptions();
  res.cookie('refreshToken', newRefreshToken, cookieOptions);

  return sendSuccess(res, { accessToken }, 'Access token refreshed successfully.');
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  await authService.forgotPassword(email);
  return sendSuccess(res, null, 'If an account exists with that email, a password reset link has been sent.');
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, password } = req.body;
  await authService.resetPassword(token, password);
  return sendSuccess(res, null, 'Password reset successful. You can now login with your new password.');
});

export const me = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user?.id) {
    return sendError(res, 'Unauthenticated', 401);
  }
  const user = await authService.getMe(req.user.id);
  return sendSuccess(res, user);
});
