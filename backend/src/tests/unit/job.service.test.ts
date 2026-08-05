import { jobService } from '../../services/job.service';
import { jobRepository } from '../../repositories/in-memory/job.repository.impl';
import { userRepository } from '../../repositories/in-memory/user.repository.impl';
import { notificationRepository } from '../../repositories/in-memory/notification.repository.impl';

describe('JobService Auto-Expiration Logic', () => {
  let employerId: string;

  beforeEach(async () => {
    // Create Employer User in database
    const employerUser = await userRepository.create({
      email: 'employer.job.unit@example.com',
      passwordHash: 'dummyhash',
      role: 'employer',
    });
    employerId = employerUser.id;
  });

  test('should close active jobs past their deadlines and send warnings for soon-to-expire posts', async () => {
    // 1. Job 1: Deadline is in the past
    const expiredJob = await jobRepository.create({
      title: 'Expired Developer Role',
      description: 'Engineering description exceeding twenty characters',
      requirements: 'Requirements matching description exceeding ten characters',
      responsibilities: 'Daily tasks exceeding ten characters',
      skills: ['Go'],
      salaryRange: '$120k',
      jobType: 'full-time',
      location: 'New York',
      experienceLevel: 'Senior Level',
      applicationDeadline: new Date(Date.now() - 24 * 60 * 60 * 1000), // Expired yesterday
      employerId,
      status: 'active',
    });

    // 2. Job 2: Deadline is in the future but within 48 hours (e.g. expiring in 24 hours)
    const expiringSoonJob = await jobRepository.create({
      title: 'React Developer expiring soon',
      description: 'Engineering description exceeding twenty characters',
      requirements: 'Requirements matching description exceeding ten characters',
      responsibilities: 'Daily tasks exceeding ten characters',
      skills: ['React'],
      salaryRange: '$110k',
      jobType: 'remote',
      location: 'Remote',
      experienceLevel: 'Mid Level',
      applicationDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // Expires tomorrow
      employerId,
      status: 'active',
    });

    // 3. Job 3: Deadline is far in the future
    const safeJob = await jobRepository.create({
      title: 'Mid-level Engineer Position',
      description: 'Engineering description exceeding twenty characters',
      requirements: 'Requirements matching description exceeding ten characters',
      responsibilities: 'Daily tasks exceeding ten characters',
      skills: ['TypeScript'],
      salaryRange: '$130k',
      jobType: 'contract',
      location: 'SF',
      experienceLevel: 'Mid Level',
      applicationDeadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // Expires in 10 days
      employerId,
      status: 'active',
    });

    // Run expiration logic
    const closedCount = await jobService.expirePastDeadlineJobs();
    expect(closedCount).toBe(1);

    // Verify Job 1 is now closed
    const updatedExpiredJob = await jobRepository.findById(expiredJob.id);
    expect(updatedExpiredJob!.status).toBe('closed');

    // Verify Job 2 is still active
    const updatedExpiringSoonJob = await jobRepository.findById(expiringSoonJob.id);
    expect(updatedExpiringSoonJob!.status).toBe('active');

    // Verify Job 3 is still active
    const updatedSafeJob = await jobRepository.findById(safeJob.id);
    expect(updatedSafeJob!.status).toBe('active');

    // Verify expiring soon warning notification was created for employer
    const notifications = await notificationRepository.findByUser(employerId);
    const hasExpiringWarning = notifications.some(
      (n) => n.type === 'job_expiring' && n.message.includes(expiringSoonJob.id)
    );
    expect(hasExpiringWarning).toBe(true);

    // Verify duplicate warnings are not sent on a second run
    const preCount = notifications.length;
    await jobService.expirePastDeadlineJobs();
    
    const postNotifications = await notificationRepository.findByUser(employerId);
    expect(postNotifications.length).toBe(preCount); // No new notification added
  });
});
