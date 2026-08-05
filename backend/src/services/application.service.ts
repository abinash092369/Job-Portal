import { applicationRepository } from '../repositories/in-memory/application.repository.impl';
import { jobService } from './job.service';
import { profileRepository } from '../repositories/in-memory/profile.repository.impl';
import { userRepository } from '../repositories/in-memory/user.repository.impl';
import { Application, ApplicationStatus, ScreeningAnswer } from '../types/application';
import { NotFoundError, BadRequestError, ConflictError, ForbiddenError } from '../utils/errors';
import { notificationService } from './notification.service';

class ApplicationService {
  async applyToJob(
    candidateId: string,
    jobId: string,
    coverLetter: string,
    screeningAnswers?: ScreeningAnswer[],
    uploadedResumeUrl?: string
  ): Promise<Application> {
    // 1. Verify Job exists and is active
    const job = await jobService.getJobById(jobId);
    if (job.status !== 'active') {
      throw new BadRequestError('This job posting is not active and cannot accept applications');
    }

    // 2. Prevent duplicate applications
    const existing = await applicationRepository.findByCandidateAndJob(candidateId, jobId);
    if (existing) {
      throw new ConflictError('You have already applied to this job posting');
    }

    // 3. Resolve resume url
    const candidateProfile = await profileRepository.getCandidateProfile(candidateId);
    let resumeUrl = uploadedResumeUrl;
    if (!resumeUrl && candidateProfile && candidateProfile.resumeUrl) {
      resumeUrl = candidateProfile.resumeUrl;
    }

    if (!resumeUrl) {
      throw new BadRequestError('Resume is required to apply. Please upload one or add it to your profile first.');
    }

    // 4. Validate screening answers if screening questions were set
    if (job.screeningQuestions && job.screeningQuestions.length > 0) {
      if (!screeningAnswers || screeningAnswers.length < job.screeningQuestions.length) {
        throw new BadRequestError('Please answer all the screening questions configured for this job posting');
      }
    }

    // 5. Create application record
    const application = await applicationRepository.create({
      jobId,
      candidateId,
      resumeUrl,
      coverLetter,
      screeningAnswers: screeningAnswers || [],
      status: 'applied',
      notes: [],
    });

    // 6. Trigger in-app notification to the Employer
    const candidateName = candidateProfile && candidateProfile.name ? candidateProfile.name : 'A candidate';
    notificationService.createNotification(
      job.employerId,
      'application_received',
      'New Application Received',
      `${candidateName} has applied to your job posting "${job.title}".`
    ).catch((err) => {
      console.error('Failed to trigger application received in-app notification:', err);
    });

    return application;
  }

  async getJobApplications(
    jobId: string,
    employerId: string,
    statusFilter?: ApplicationStatus
  ): Promise<Application[]> {
    // Verify job belongs to this employer
    const job = await jobService.getJobById(jobId);
    if (job.employerId !== employerId) {
      throw new ForbiddenError('You do not have permission to view applicants for this job posting');
    }

    const apps = await applicationRepository.findByJobId(jobId);
    if (statusFilter) {
      return apps.filter((a) => a.status === statusFilter);
    }
    return apps;
  }

  async updateStatus(id: string, employerId: string, status: ApplicationStatus): Promise<Application> {
    const app = await applicationRepository.findById(id);
    if (!app) {
      throw new NotFoundError('Application not found');
    }

    const job = await jobService.getJobById(app.jobId);
    if (job.employerId !== employerId) {
      throw new ForbiddenError('You do not have permission to modify this application');
    }

    const updatedApp = await applicationRepository.update(id, { status });
    if (!updatedApp) {
      throw new NotFoundError('Application not found');
    }

    // Trigger in-app notification to Candidate
    notificationService.createNotification(
      app.candidateId,
      'status_changed',
      'Application Status Updated',
      `Your application status for "${job.title}" has been updated to "${status}".`
    ).catch((err) => {
      console.error('Failed to trigger status changed in-app notification:', err);
    });

    return updatedApp;
  }

  async addPrivateNote(id: string, employerId: string, note: string): Promise<Application> {
    const app = await applicationRepository.findById(id);
    if (!app) {
      throw new NotFoundError('Application not found');
    }

    const job = await jobService.getJobById(app.jobId);
    if (job.employerId !== employerId) {
      throw new ForbiddenError('You do not have permission to add notes to this application');
    }

    const currentNotes = app.notes || [];
    const updatedApp = await applicationRepository.update(id, {
      notes: [...currentNotes, note],
    });
    
    if (!updatedApp) {
      throw new NotFoundError('Application not found');
    }

    return updatedApp;
  }
}

export const applicationService = new ApplicationService();
