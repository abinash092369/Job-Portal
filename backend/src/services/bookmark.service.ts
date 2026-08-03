import { bookmarkRepository } from '../repositories/in-memory/bookmark.repository.impl';
import { jobService } from './job.service';
import { Job } from '../types/job';
import { NotFoundError } from '../utils/errors';

class BookmarkService {
  async saveJob(candidateId: string, jobId: string): Promise<boolean> {
    // Verify job exists
    await jobService.getJobById(jobId);
    
    return bookmarkRepository.save(candidateId, jobId);
  }

  async unsaveJob(candidateId: string, jobId: string): Promise<boolean> {
    return bookmarkRepository.unsave(candidateId, jobId);
  }

  async getSavedJobs(candidateId: string): Promise<Job[]> {
    const jobIds = await bookmarkRepository.findByCandidate(candidateId);
    const jobs: Job[] = [];
    
    for (const id of jobIds) {
      try {
        const job = await jobService.getJobById(id);
        // Only return active jobs in list
        if (job.status === 'active') {
          jobs.push(job);
        }
      } catch (error) {
        // Job might have been deleted, ignore
      }
    }
    
    return jobs;
  }
}

export const bookmarkService = new BookmarkService();
