import { Bookmark, IBookmark } from '../models/Bookmark';
import { JobRepository } from './jobRepository';
import { Types } from 'mongoose';

export class BookmarkRepository {
  private jobRepository: JobRepository;

  constructor() {
    this.jobRepository = new JobRepository();
  }

  async saveJob(candidateId: string, jobId: string): Promise<IBookmark> {
    const bookmark = new Bookmark({
      candidateId: new Types.ObjectId(candidateId),
      jobId: new Types.ObjectId(jobId),
    });
    return bookmark.save();
  }

  async unsaveJob(candidateId: string, jobId: string): Promise<boolean> {
    const res = await Bookmark.deleteOne({
      candidateId: new Types.ObjectId(candidateId),
      jobId: new Types.ObjectId(jobId),
    });
    return res.deletedCount > 0;
  }

  async isBookmarked(candidateId: string, jobId: string): Promise<boolean> {
    const count = await Bookmark.countDocuments({
      candidateId: new Types.ObjectId(candidateId),
      jobId: new Types.ObjectId(jobId),
    });
    return count > 0;
  }

  async getSavedJobsForCandidate(candidateId: string): Promise<any[]> {
    const bookmarks = await Bookmark.find({
      candidateId: new Types.ObjectId(candidateId),
    })
      .populate('jobId')
      .lean();

    const rawJobs = bookmarks
      .map((b: any) => b.jobId)
      .filter((job: any) => job != null);

    return this.jobRepository.flattenCompanyDetails(rawJobs);
  }
}
