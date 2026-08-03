import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { TokenPayload } from '../types/auth';

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload as any, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRY,
  } as any);
}

export function signRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload as any, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRY,
  } as any);
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
}
