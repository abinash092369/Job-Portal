import { BookmarkRepository } from '../bookmark.repository';
import { BookmarkModel } from '../../models/bookmark.model';
import mongoose from 'mongoose';

export class MongooseBookmarkRepository implements BookmarkRepository {
  async save(candidateId: string, jobId: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(candidateId) || !mongoose.Types.ObjectId.isValid(jobId)) {
      return false;
    }

    try {
      // Check first to save write operations
      const exists = await BookmarkModel.findOne({ candidateId, jobId });
      if (exists) return false;

      const bookmark = new BookmarkModel({ candidateId, jobId });
      await bookmark.save();
      return true;
    } catch (error: any) {
      if (error.code === 11000) {
        return false; // Handle duplicate key race conditions gracefully
      }
      throw error;
    }
  }

  async unsave(candidateId: string, jobId: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(candidateId) || !mongoose.Types.ObjectId.isValid(jobId)) {
      return false;
    }

    const result = await BookmarkModel.deleteOne({ candidateId, jobId });
    return (result.deletedCount || 0) > 0;
  }

  async isSaved(candidateId: string, jobId: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(candidateId) || !mongoose.Types.ObjectId.isValid(jobId)) {
      return false;
    }

    const count = await BookmarkModel.countDocuments({ candidateId, jobId });
    return count > 0;
  }

  async findByCandidate(candidateId: string): Promise<string[]> {
    if (!mongoose.Types.ObjectId.isValid(candidateId)) return [];
    
    const bookmarks = await BookmarkModel.find({ candidateId }).sort({ createdAt: -1 });
    return bookmarks.map((b) => b.jobId.toString());
  }
}

export const bookmarkRepository = new MongooseBookmarkRepository();
