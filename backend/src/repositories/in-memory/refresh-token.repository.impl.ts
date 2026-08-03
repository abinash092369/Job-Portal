import { RefreshToken } from '../../types/auth';
import { RefreshTokenRepository } from '../refresh-token.repository';
import { RefreshTokenModel, IRefreshTokenDocument } from '../../models/refresh-token.model';
import mongoose from 'mongoose';

function mapRefreshToken(doc: IRefreshTokenDocument): RefreshToken {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    token: doc.token,
    expiresAt: doc.expiresAt,
    createdAt: doc.createdAt,
  };
}

export class MongooseRefreshTokenRepository implements RefreshTokenRepository {
  async findByToken(token: string): Promise<RefreshToken | null> {
    const found = await RefreshTokenModel.findOne({
      token,
      expiresAt: { $gt: new Date() },
    });
    return found ? mapRefreshToken(found) : null;
  }

  async create(tokenData: Omit<RefreshToken, 'id' | 'createdAt'>): Promise<RefreshToken> {
    const doc = new RefreshTokenModel(tokenData);
    await doc.save();
    return mapRefreshToken(doc);
  }

  async delete(token: string): Promise<boolean> {
    const result = await RefreshTokenModel.deleteOne({ token });
    return (result.deletedCount || 0) > 0;
  }

  async deleteByUserId(userId: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(userId)) return;
    await RefreshTokenModel.deleteMany({ userId });
  }

  async deleteExpired(): Promise<number> {
    const result = await RefreshTokenModel.deleteMany({ expiresAt: { $lte: new Date() } });
    return result.deletedCount || 0;
  }
}

export const refreshTokenRepository = new MongooseRefreshTokenRepository();
