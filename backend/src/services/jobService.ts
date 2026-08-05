import { JobRepository, JobFilterParams } from '../repositories/jobRepository';
import { BookmarkRepository } from '../repositories/bookmarkRepository';
import { ApplicationRepository } from '../repositories/applicationRepository';
import { ProfileRepository } from '../repositories/profileRepository';
import { NotificationService } from './notificationService';

export class JobService {
  private jobRepo: JobRepository;
  private bookmarkRepo: BookmarkRepository;
  private appRepo: ApplicationRepository;
  private profileRepo: ProfileRepository;
  private notificationService: NotificationService;

  constructor() {
    this.jobRepo = new JobRepository();
    this.bookmarkRepo = new BookmarkRepository();
    this.appRepo = new ApplicationRepository();
    this.profileRepo = new ProfileRepository();
    this.notificationService = new NotificationService();
  }

  async getJobs(params: JobFilterParams) {
    return this.jobRepo.findJobs(params);
  }

  async getMyJobs(employerId: string) {
    return this.jobRepo.findByEmployerId(employerId);
  }

  async getSavedJobs(candidateId: string) {
    return this.bookmarkRepo.getSavedJobsForCandidate(candidateId);
  }

  async getJobById(id: string) {
    // Increment view count
    const job = await this.jobRepo.incrementViews(id);
    if (!job) {
      throw new Error('Job not found');
    }
    const flattened = await this.jobRepo.flattenCompanyDetails([job.toObject()]);
    return flattened[0];
  }

  async createJob(employerId: string, jobData: any) {
    const job = await this.jobRepo.create({
      ...jobData,
      employerId: employerId as any,
    });
    const flattened = await this.jobRepo.flattenCompanyDetails([job.toObject()]);
    return flattened[0];
  }

  async updateJob(id: string, employerId: string, updateData: any) {
    const job = await this.jobRepo.findById(id);
    if (!job) {
      throw new Error('Job not found');
    }
    if (job.employerId.toString() !== employerId) {
      throw new Error('Unauthorized: You do not own this job listing');
    }

    const updated = await this.jobRepo.update(id, updateData);
    if (!updated) throw new Error('Failed to update job');
    const flattened = await this.jobRepo.flattenCompanyDetails([updated.toObject()]);
    return flattened[0];
  }

  async deleteJob(id: string, employerId: string) {
    const job = await this.jobRepo.findById(id);
    if (!job) {
      throw new Error('Job not found');
    }
    if (job.employerId.toString() !== employerId) {
      throw new Error('Unauthorized: You do not own this job listing');
    }

    const success = await this.jobRepo.deleteAndCascade(id);
    if (!success) {
      throw new Error('Failed to delete job listing');
    }
    return true;
  }

  async publishJob(id: string, employerId: string) {
    return this.updateJob(id, employerId, { status: 'active' });
  }

  async unpublishJob(id: string, employerId: string) {
    return this.updateJob(id, employerId, { status: 'draft' });
  }

  async saveJob(candidateId: string, jobId: string) {
    const job = await this.jobRepo.findById(jobId);
    if (!job) {
      throw new Error('Job not found');
    }

    const isAlreadyBookmarked = await this.bookmarkRepo.isBookmarked(candidateId, jobId);
    if (isAlreadyBookmarked) {
      throw new Error('Job is already saved');
    }

    return this.bookmarkRepo.saveJob(candidateId, jobId);
  }

  async unsaveJob(candidateId: string, jobId: string) {
    const success = await this.bookmarkRepo.unsaveJob(candidateId, jobId);
    if (!success) {
      throw new Error('Job was not saved or already unsaved');
    }
    return true;
  }

  async applyJob(
    candidateId: string,
    jobId: string,
    coverLetter: string,
    resumeFileUrl?: string,
    screeningAnswersRaw?: string
  ) {
    const job = await this.jobRepo.findById(jobId);
    if (!job) {
      throw new Error('Job not found');
    }

    if (job.status !== 'active') {
      throw new Error('This job listing is not accepting applications');
    }

    // Check if candidate already applied
    const existingApp = await this.appRepo.findByJobAndCandidate(jobId, candidateId);
    if (existingApp) {
      throw new Error('You have already applied for this job');
    }

    // Resolve resumeUrl: use uploaded file URL or candidate profile resumeUrl fallback
    let resumeUrl = resumeFileUrl;
    if (!resumeUrl) {
      const profile = await this.profileRepo.findCandidateByUserId(candidateId);
      if (profile && profile.resumeUrl) {
        resumeUrl = profile.resumeUrl;
      }
    }

    if (!resumeUrl) {
      throw new Error('Resume is required. Please upload a resume or add one to your profile.');
    }

    // Parse screening answers if stringified JSON
    let screeningAnswers: any[] = [];
    if (screeningAnswersRaw) {
      try {
        screeningAnswers = typeof screeningAnswersRaw === 'string'
          ? JSON.parse(screeningAnswersRaw)
          : screeningAnswersRaw;
      } catch (err) {
        screeningAnswers = [];
      }
    }

    const application = await this.appRepo.create({
      jobId: jobId as any,
      candidateId: candidateId as any,
      coverLetter: coverLetter || '',
      resumeUrl,
      screeningAnswers,
      status: 'applied',
      notes: [],
    });

    // Create Notification for employer
    try {
      const candidateProfile = await this.profileRepo.findCandidateByUserId(candidateId);
      const candidateName = candidateProfile ? candidateProfile.name : 'A candidate';
      await this.notificationService.createNotification(
        job.employerId.toString(),
        'application_received',
        'New Application Received',
        `${candidateName} has applied for "${job.title}".`
      );
    } catch (err) {
      // Don't fail application if notification creation fails
    }

    return {
      id: application._id.toString(),
      jobId: application.jobId.toString(),
      candidateId: application.candidateId.toString(),
      status: application.status,
      resumeUrl: application.resumeUrl,
      coverLetter: application.coverLetter,
      createdAt: application.createdAt,
    };
  }

  async getJobApplications(jobId: string, employerId: string) {
    const job = await this.jobRepo.findById(jobId);
    if (!job) {
      throw new Error('Job not found');
    }
    if (job.employerId.toString() !== employerId) {
      throw new Error('Unauthorized: You do not own this job listing');
    }

    return this.appRepo.getApplicationsForJob(jobId);
  }
}
