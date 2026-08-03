import { userRepository } from '../repositories/in-memory/user.repository.impl';
import { jobRepository } from '../repositories/in-memory/job.repository.impl';
import { applicationRepository } from '../repositories/in-memory/application.repository.impl';
import { profileRepository } from '../repositories/in-memory/profile.repository.impl';
import { User } from '../types/auth';
import { Job, JobStatus } from '../types/job';
import { NotFoundError } from '../utils/errors';

class AdminService {
  async getUsers(): Promise<Omit<User, 'passwordHash'>[]> {
    const users = await userRepository.findAll();
    return users.map(({ passwordHash, ...u }) => u);
  }

  async setSuspension(userId: string, isSuspended: boolean): Promise<Omit<User, 'passwordHash'>> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const updated = await userRepository.update(userId, { isSuspended });
    if (!updated) {
      throw new NotFoundError('User not found');
    }

    const { passwordHash, ...safeUser } = updated;
    return safeUser;
  }

  async setEmployerVerification(employerId: string, isVerified: boolean): Promise<void> {
    const profile = await profileRepository.getEmployerProfile(employerId);
    if (!profile) {
      throw new NotFoundError('Employer profile not found');
    }

    await profileRepository.updateEmployerProfile(employerId, { isVerified });
  }

  async setJobStatus(jobId: string, status: JobStatus): Promise<Job> {
    const job = await jobRepository.findById(jobId);
    if (!job) {
      throw new NotFoundError('Job posting not found');
    }

    const updated = await jobRepository.update(jobId, { status });
    if (!updated) {
      throw new NotFoundError('Job posting not found');
    }

    return updated;
  }

  async deleteJob(jobId: string): Promise<boolean> {
    const job = await jobRepository.findById(jobId);
    if (!job) {
      throw new NotFoundError('Job posting not found');
    }

    return jobRepository.delete(jobId);
  }

  async getJobs(): Promise<Job[]> {
    return jobRepository.findAll();
  }

  async getPlatformStats() {
    const users = await userRepository.findAll();
    const jobs = await jobRepository.findAll();
    const applications = await applicationRepository.findAll();

    const totalUsers = users.length;
    const totalJobs = jobs.length;
    const totalApplications = applications.length;

    const breakdownByRole = {
      employer: users.filter((u) => u.role === 'employer').length,
      candidate: users.filter((u) => u.role === 'candidate').length,
      admin: users.filter((u) => u.role === 'admin').length,
    };

    return {
      totalUsers,
      totalJobs,
      totalApplications,
      breakdownByRole,
    };
  }
}

export const adminService = new AdminService();
