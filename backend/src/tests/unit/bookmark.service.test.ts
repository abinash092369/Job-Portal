import { bookmarkService } from '../../services/bookmark.service';
import { jobService } from '../../services/job.service';
import { userRepository } from '../../repositories/in-memory/user.repository.impl';
import { jobRepository } from '../../repositories/in-memory/job.repository.impl';
import { bookmarkRepository } from '../../repositories/in-memory/bookmark.repository.impl';
import { NotFoundError } from '../../utils/errors';

describe('BookmarkService', () => {
  let candidateId: string;
  let employerId: string;
  let mockJobId: string;

  beforeEach(async () => {
    // Setup users
    const candidate = await userRepository.create({
      email: 'cand-bookmark-test@example.com',
      passwordHash: 'dummy',
      role: 'candidate',
    });
    candidateId = candidate.id;

    const employer = await userRepository.create({
      email: 'emp-bookmark-test@example.com',
      passwordHash: 'dummy',
      role: 'employer',
    });
    employerId = employer.id;

    // Create job
    const job = await jobRepository.create({
      title: 'Bookmark Test Job',
      description: 'Job description exceeding twenty characters',
      requirements: 'Requirements matching description exceeding ten characters',
      responsibilities: 'Daily tasks exceeding ten characters',
      skills: ['JS'],
      salaryRange: '$80k',
      jobType: 'full-time',
      location: 'SF',
      experienceLevel: 'Mid Level',
      applicationDeadline: new Date(Date.now() + 10000000),
      employerId,
      status: 'active',
    });
    mockJobId = job.id;
  });

  test('should successfully save and unsave jobs', async () => {
    // Save job
    const saved = await bookmarkService.saveJob(candidateId, mockJobId);
    expect(saved).toBe(true);

    // List saved jobs
    let list = await bookmarkService.getSavedJobs(candidateId);
    expect(list.length).toBe(1);
    expect(list[0].id).toBe(mockJobId);

    // Unsave job
    const unsaved = await bookmarkService.unsaveJob(candidateId, mockJobId);
    expect(unsaved).toBe(true);

    // List saved jobs again
    list = await bookmarkService.getSavedJobs(candidateId);
    expect(list.length).toBe(0);
  });

  test('should fail saving a non-existent job posting', async () => {
    await expect(
      bookmarkService.saveJob(candidateId, '65c2a1b2d3e4f5a6b7c8d9e0')
    ).rejects.toThrow(NotFoundError);
  });
});
