import { User } from '../models/User';
import { Job } from '../models/Job';
import { Application } from '../models/Application';
import { EmployerProfile } from '../models/EmployerProfile';
import { JobRepository } from '../repositories/jobRepository';
import { JobStatus } from '../types';
import { Types } from 'mongoose';

export class AdminService {
  private jobRepo: JobRepository;

  constructor() {
    this.jobRepo = new JobRepository();
  }

  async getAllUsers() {
    const users = await User.find({ deletedAt: null })
      .select('email role isVerified isSuspended createdAt updatedAt')
      .sort({ createdAt: -1 })
      .lean();

    return users.map((u) => ({
      id: u._id.toString(),
      email: u.email,
      role: u.role,
      isVerified: u.isVerified,
      isSuspended: u.isSuspended,
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
    }));
  }

  async suspendUser(userId: string, isSuspended: boolean) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid User ID');
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { isSuspended },
      { new: true }
    );
    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      isSuspended: user.isSuspended,
    };
  }

  async verifyEmployer(employerUserId: string, isVerified: boolean) {
    if (!Types.ObjectId.isValid(employerUserId)) {
      throw new Error('Invalid User ID');
    }

    const profile = await EmployerProfile.findOneAndUpdate(
      { userId: new Types.ObjectId(employerUserId) },
      { isVerified },
      { new: true, upsert: true }
    );

    return profile;
  }

  async getAllJobs() {
    const rawJobs = await Job.find().sort({ createdAt: -1 }).lean();
    return this.jobRepo.flattenCompanyDetails(rawJobs);
  }

  async updateJobStatus(jobId: string, status: JobStatus) {
    if (!Types.ObjectId.isValid(jobId)) {
      throw new Error('Invalid Job ID');
    }

    const job = await Job.findByIdAndUpdate(jobId, { status }, { new: true });
    if (!job) {
      throw new Error('Job not found');
    }

    const flattened = await this.jobRepo.flattenCompanyDetails([job.toObject()]);
    return flattened[0];
  }

  async deleteJob(jobId: string) {
    if (!Types.ObjectId.isValid(jobId)) {
      throw new Error('Invalid Job ID');
    }

    const success = await this.jobRepo.deleteAndCascade(jobId);
    if (!success) {
      throw new Error('Job not found or already deleted');
    }
    return true;
  }

  async getAdminStats() {
    const [
      totalUsers,
      totalCandidates,
      totalEmployers,
      totalJobs,
      totalActiveJobs,
      totalDraftJobs,
      totalClosedJobs,
      totalApplications,
    ] = await Promise.all([
      User.countDocuments({ deletedAt: null }),
      User.countDocuments({ role: 'candidate', deletedAt: null }),
      User.countDocuments({ role: 'employer', deletedAt: null }),
      Job.countDocuments(),
      Job.countDocuments({ status: 'active' }),
      Job.countDocuments({ status: 'draft' }),
      Job.countDocuments({ status: 'closed' }),
      Application.countDocuments(),
    ]);

    return {
      totalUsers,
      totalCandidates,
      totalEmployers,
      totalJobs,
      totalActiveJobs,
      totalDraftJobs,
      totalClosedJobs,
      totalApplications,
    };
  }
}
