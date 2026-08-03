import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { formatResponse } from '../utils/response';
import { getRefreshTokenFromCookie } from '../utils/cookies';
import { BadRequestError } from '../utils/errors';
import { env } from '../config/env';

const COOKIE_NAME = 'refreshToken';

const getCookieOptions = () => ({
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password, role } = req.body;
    const user = await authService.register({ email, passwordPlain: password, role });
    res.status(201).json(
      formatResponse(true, user, 'Registration successful. Please check your email to verify your account.')
    );
  } catch (error) {
    next(error);
  }
}

export async function verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = (req.query.token as string) || req.body.token;
    if (!token) {
      throw new BadRequestError('Verification token is required');
    }
    await authService.verifyEmail(token);
    res.status(200).json(
      formatResponse(true, null, 'Email verification successful. You can now log in.')
    );
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;
    const { user, accessToken, refreshToken } = await authService.login(email, password);

    res.cookie(COOKIE_NAME, refreshToken, getCookieOptions());
    res.status(200).json(
      formatResponse(true, { user, accessToken }, 'Login successful')
    );
  } catch (error) {
    next(error);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = getRefreshTokenFromCookie(req);
    if (!token) {
      throw new BadRequestError('Refresh token is missing');
    }

    const { accessToken, refreshToken: newRefreshToken } = await authService.refresh(token);

    res.cookie(COOKIE_NAME, newRefreshToken, getCookieOptions());
    res.status(200).json(
      formatResponse(true, { accessToken }, 'Token refreshed successfully')
    );
  } catch (error) {
    next(error);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = getRefreshTokenFromCookie(req);
    if (token) {
      await authService.logout(token);
    }

    const clearOptions = {
      ...getCookieOptions(),
      maxAge: 0,
    };
    res.clearCookie(COOKIE_NAME, clearOptions);
    res.status(200).json(
      formatResponse(true, null, 'Logout successful')
    );
  } catch (error) {
    next(error);
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email } = req.body;
    await authService.forgotPassword(email);
    res.status(200).json(
      formatResponse(true, null, 'If the email matches an account, a password reset link has been sent.')
    );
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { token, password } = req.body;
    await authService.resetPassword(token, password);
    res.status(200).json(
      formatResponse(true, null, 'Password has been reset successfully. You can now log in.')
    );
  } catch (error) {
    next(error);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.status(200).json(
      formatResponse(true, req.user, 'Current user profile retrieved successfully')
    );
  } catch (error) {
    next(error);
  }
}
