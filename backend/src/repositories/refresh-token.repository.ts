import { RefreshToken } from '../types/auth';

export interface RefreshTokenRepository {
  findByToken(token: string): Promise<RefreshToken | null>;
  create(refreshToken: Omit<RefreshToken, 'id' | 'createdAt'>): Promise<RefreshToken>;
  delete(token: string): Promise<boolean>;
  deleteByUserId(userId: string): Promise<void>;
  deleteExpired(): Promise<number>;
}
