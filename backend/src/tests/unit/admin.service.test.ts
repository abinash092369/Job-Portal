import { adminService } from '../../services/admin.service';
import { userRepository } from '../../repositories/in-memory/user.repository.impl';
import { jobRepository } from '../../repositories/in-memory/job.repository.impl';
import { profileRepository } from '../../repositories/in-memory/profile.repository.impl';
import { NotFoundError } from '../../utils/errors';

describe('AdminService', () => {
  let mockUserId: string;
  let mockEmployerId: string;
  let mockJobId: string;

  beforeEach(async () => {
    // Setup users
    const candidate = await userRepository.create({
      email: 'cand-admin-test@example.com',
      passwordHash: 'dummy',
      role: 'candidate',
    });
    mockUserId = candidate.id;

    const employer = await userRepository.create({
      email: 'emp-admin-test@example.com',
      passwordHash: 'dummy',
      role: 'employer',
    });
    mockEmployerId = employer.id;

    // Setup employer profile
    await profileRepository.updateEmployerProfile(mockEmployerId, {
      companyName: 'ACME Test',
      companySize: '1-10 employees',
      industry: 'Software',
      description: 'Test description',
    });

    // Setup job
    const job = await jobRepository.create({
      title: 'Admin Test Job',
      description: 'Job description exceeding twenty characters',
      requirements: 'Requirements matching description exceeding ten characters',
      responsibilities: 'Daily tasks exceeding ten characters',
      skills: ['JS'],
      salaryRange: '$80k',
      jobType: 'full-time',
      location: 'SF',
      experienceLevel: 'Mid Level',
      applicationDeadline: new Date(Date.now() + 10000000),
      employerId: mockEmployerId,
      status: 'active',
    });
    mockJobId = job.id;
  });

  test('should return all registered users without password hashes', async () => {
    const users = await adminService.getUsers();
    expect(users.length).toBeGreaterThanOrEqual(2);
    expect((users[0] as any).passwordHash).toBeUndefined();
  });

  test('should suspend and unsuspend a user account', async () => {
    const updated = await adminService.setSuspension(mockUserId, true);
    expect(updated.isSuspended).toBe(true);

    const updated2 = await adminService.setSuspension(mockUserId, false);
    expect(updated2.isSuspended).toBe(false);

    await expect(
      adminService.setSuspension('65c2a1b2d3e4f5a6b7c8d9e0', true)
    ).rejects.toThrow(NotFoundError);
  });

  test('should verify employer profile status', async () => {
    await adminService.setEmployerVerification(mockEmployerId, true);
    const profile = await profileRepository.getEmployerProfile(mockEmployerId);
    expect(profile!.isVerified).toBe(true);

    await expect(
      adminService.setEmployerVerification('65c2a1b2d3e4f5a6b7c8d9e0', true)
    ).rejects.toThrow(NotFoundError);
  });

  test('should update job posting status', async () => {
    const job = await adminService.setJobStatus(mockJobId, 'closed');
    expect(job.status).toBe('closed');

    await expect(
      adminService.setJobStatus('65c2a1b2d3e4f5a6b7c8d9e0', 'active')
    ).rejects.toThrow(NotFoundError);
  });

  test('should administrative delete job posting', async () => {
    const success = await adminService.deleteJob(mockJobId);
    expect(success).toBe(true);

    await expect(
      adminService.deleteJob('65c2a1b2d3e4f5a6b7c8d9e0')
    ).rejects.toThrow(NotFoundError);
  });

  test('should return aggregate platform stats', async () => {
    const stats = await adminService.getPlatformStats();
    expect(stats.totalUsers).toBeGreaterThanOrEqual(2);
    expect(stats.totalJobs).toBeGreaterThanOrEqual(1);
    expect(stats.totalApplications).toBe(0);
    expect(stats.breakdownByRole.candidate).toBeGreaterThanOrEqual(1);
    expect(stats.breakdownByRole.employer).toBeGreaterThanOrEqual(1);
  });
});
