import { Application } from '../models/Application';
import { JobRepository } from '../repositories/jobRepository';
import { UserRepository } from '../repositories/userRepository';
import { ProfileRepository } from '../repositories/profileRepository';
import { NotificationService } from './notificationService';
import { sendStatusChangeEmail } from '../utils/email';
import { ApplicationStatus } from '../types';
import { Types } from 'mongoose';

export class ApplicationService {
  private jobRepo: JobRepository;
  private userRepo: UserRepository;
  private profileRepo: ProfileRepository;
  private notificationService: NotificationService;

  constructor() {
    this.jobRepo = new JobRepository();
    this.userRepo = new UserRepository();
    this.profileRepo = new ProfileRepository();
    this.notificationService = new NotificationService();
  }

  async updateStatus(appId: string, employerId: string, status: ApplicationStatus) {
    if (!Types.ObjectId.isValid(appId)) {
      throw new Error('Invalid Application ID');
    }

    const application = await Application.findById(appId);
    if (!application) {
      throw new Error('Application not found');
    }

    // Verify ownership
    const job = await this.jobRepo.findById(application.jobId.toString());
    if (!job) {
      throw new Error('Associated job not found');
    }

    if (job.employerId.toString() !== employerId) {
      throw new Error('Unauthorized: You do not own this job listing');
    }

    // Update status and push into statusHistory array
    application.status = status;
    application.statusHistory.push({
      status,
      changedAt: new Date(),
      changedBy: new Types.ObjectId(employerId),
    });

    await application.save();

    // Create Notification for candidate & send real email
    const candidateId = application.candidateId.toString();
    const candidateUser = await this.userRepo.findById(candidateId);
    const candidateProfile = await this.profileRepo.findCandidateByUserId(candidateId);

    const candidateName = candidateProfile ? candidateProfile.name : 'Candidate';

    await this.notificationService.createNotification(
      candidateId,
      'status_changed',
      'Application Status Updated',
      `Your application for "${job.title}" has been updated to "${status}".`
    );

    if (candidateUser && candidateUser.email) {
      await sendStatusChangeEmail(
        candidateUser.email,
        candidateName,
        job.title,
        status
      );
    }

    return {
      id: application._id.toString(),
      jobId: application.jobId.toString(),
      candidateId: application.candidateId.toString(),
      status: application.status,
      statusHistory: application.statusHistory,
      notes: application.notes,
      updatedAt: application.updatedAt,
    };
  }

  async addNote(appId: string, employerId: string, note: string) {
    if (!Types.ObjectId.isValid(appId)) {
      throw new Error('Invalid Application ID');
    }

    const application = await Application.findById(appId);
    if (!application) {
      throw new Error('Application not found');
    }

    // Verify ownership
    const job = await this.jobRepo.findById(application.jobId.toString());
    if (!job || job.employerId.toString() !== employerId) {
      throw new Error('Unauthorized: You do not own this job listing');
    }

    application.notes.push(note);
    await application.save();

    return {
      id: application._id.toString(),
      notes: application.notes,
      updatedAt: application.updatedAt,
    };
  }
}
