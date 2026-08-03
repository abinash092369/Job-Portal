import { jobRepository } from '../repositories/in-memory/job.repository.impl';
import { Job, JobStatus, JobType, JobSearchParams } from '../types/job';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { logger } from '../utils/logger';
import { notificationService } from './notification.service';
import { notificationRepository } from '../repositories/in-memory/notification.repository.impl';

class JobService {
  async getJobById(id: string, incrementView = false): Promise<Job> {
    const job = incrementView
      ? await jobRepository.incrementViews(id)
      : await jobRepository.findById(id);

    if (!job) {
      throw new NotFoundError('Job posting not found');
    }
    return job;
  }

  async searchActiveJobs(params: JobSearchParams): Promise<{ jobs: Job[]; total: number }> {
    return jobRepository.searchActiveJobs(params);
  }

  async getActiveJobs(): Promise<Job[]> {
    return jobRepository.findAllActive();
  }

  async getJobsByEmployer(employerId: string): Promise<Job[]> {
    return jobRepository.findByEmployerId(employerId);
  }

  async createJob(
    employerId: string,
    jobData: Omit<Job, 'id' | 'employerId' | 'createdAt' | 'updatedAt'>
  ): Promise<Job> {
    return jobRepository.create({
      ...jobData,
      employerId,
    });
  }

  async updateJob(
    id: string,
    employerId: string,
    updates: Partial<Omit<Job, 'id' | 'employerId' | 'createdAt' | 'updatedAt'>>
  ): Promise<Job> {
    const job = await jobRepository.findById(id);
    if (!job) {
      throw new NotFoundError('Job posting not found');
    }

    if (job.employerId !== employerId) {
      throw new ForbiddenError('You do not have permission to modify this job posting');
    }

    const updatedJob = await jobRepository.update(id, updates);
    if (!updatedJob) {
      throw new NotFoundError('Job posting not found');
    }

    return updatedJob;
  }

  async deleteJob(id: string, employerId: string): Promise<void> {
    const job = await jobRepository.findById(id);
    if (!job) {
      throw new NotFoundError('Job posting not found');
    }

    if (job.employerId !== employerId) {
      throw new ForbiddenError('You do not have permission to delete this job posting');
    }

    await jobRepository.delete(id);
  }

  async publishJob(id: string, employerId: string): Promise<Job> {
    return this.updateJob(id, employerId, { status: 'active' });
  }

  async unpublishJob(id: string, employerId: string): Promise<Job> {
    return this.updateJob(id, employerId, { status: 'draft' });
  }

  /**
   * Scans all active jobs and closes those whose application deadline has passed.
   * Returns the count of jobs that were closed.
   */
  async expirePastDeadlineJobs(): Promise<number> {
    logger.info('Running job auto-expiration check...');
    const now = new Date();
    const activeJobs = await jobRepository.findAllActive();
    let expiredCount = 0;

    for (const job of activeJobs) {
      const deadline = new Date(job.applicationDeadline);
      if (deadline < now) {
        await jobRepository.update(job.id, { status: 'closed' });
        expiredCount++;
        logger.info(`Expired Job ID: ${job.id} (Deadline: ${deadline.toISOString()} was in the past)`);
      } else {
        // Check if expiring soon (within 48 hours)
        const diffMs = deadline.getTime() - now.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        if (diffHours > 0 && diffHours <= 48) {
          try {
            const userNotifications = await notificationRepository.findByUser(job.employerId);
            const alreadyNotified = userNotifications.some(
              (n) => n.type === 'job_expiring' && n.message.includes(job.id)
            );
            if (!alreadyNotified) {
              await notificationService.createNotification(
                job.employerId,
                'job_expiring',
                'Job Posting Expiring Soon',
                `Your job posting "${job.title}" (ID: ${job.id}) is expiring on ${deadline.toLocaleString()}.`
              );
              logger.info(`Triggered expiring soon notification for Job ID: ${job.id}`);
            }
          } catch (err: any) {
            logger.error(`Failed to trigger job expiring soon notification for job ${job.id}: ${err.stack || err}`);
          }
        }
      }
    }

    logger.info(`Job auto-expiration run completed. Closed ${expiredCount} expired jobs.`);
    return expiredCount;
  }
}

export const jobService = new JobService();
