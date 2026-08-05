import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AuthUser } from '../types';

export const generateAccessToken = (user: AuthUser): string => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
    },
    config.jwtAccessSecret,
    { expiresIn: '15m' }
  );
};

export const generateRefreshToken = (user: AuthUser): string => {
  return jwt.sign(
    {
      id: user.id,
    },
    config.jwtRefreshSecret,
    { expiresIn: '7d' }
  );
};

export const verifyAccessToken = (token: string): AuthUser | null => {
  try {
    const decoded = jwt.verify(token, config.jwtAccessSecret) as AuthUser;
    return decoded;
  } catch (error) {
    return null;
  }
};

export const verifyRefreshToken = (token: string): { id: string } | null => {
  try {
    const decoded = jwt.verify(token, config.jwtRefreshSecret) as { id: string };
    return decoded;
  } catch (error) {
    return null;
  }
};
