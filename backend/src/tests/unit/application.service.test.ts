import { applicationService } from '../../services/application.service';
import { jobService } from '../../services/job.service';
import { profileRepository } from '../../repositories/in-memory/profile.repository.impl';
import { userRepository } from '../../repositories/in-memory/user.repository.impl';
import { ConflictError, BadRequestError } from '../../utils/errors';

describe('ApplicationService', () => {
  let mockJobId: string;
  let candidateId: string;
  let employerId: string;

  beforeEach(async () => {
    // 1. Create Employer User
    const employerUser = await userRepository.create({
      email: 'employer.app.unit@example.com',
      passwordHash: 'dummyhash',
      role: 'employer',
      isVerified: true,
    });
    employerId = employerUser.id;

    // 2. Create Candidate User
    const candidateUser = await userRepository.create({
      email: 'candidate.app.unit@example.com',
      passwordHash: 'dummyhash',
      role: 'candidate',
      isVerified: true,
    });
    candidateId = candidateUser.id;

    // Setup mock employer profile
    await profileRepository.updateEmployerProfile(employerId, {
      companyName: 'ACME Corp',
      companySize: '1-10 employees',
      industry: 'Software',
      description: 'About ACME',
    });

    // Create active job posting
    const job = await jobService.createJob(employerId, {
      title: 'Software Engineer',
      description: 'Engineering description exceeding twenty characters',
      requirements: 'Requirements matching description exceeding ten characters',
      responsibilities: 'Daily tasks exceeding ten characters',
      skills: ['TypeScript', 'React'],
      salaryRange: '$100k - $120k',
      jobType: 'remote',
      location: 'Anywhere',
      experienceLevel: 'Mid Level',
      applicationDeadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      screeningQuestions: ['Do you have 3 years of JS experience?'],
      status: 'active',
      views: 0,
    });
    mockJobId = job.id;

    // Create candidate profile without a pre-saved resume to check upload fallbacks
    await profileRepository.updateCandidateProfile(candidateId, {
      name: 'John Doe',
      skills: ['JS'],
      experience: [],
      education: [],
      resumeUrl: undefined,
    });
  });

  test('should successfully apply to job when candidate inputs are valid', async () => {
    const app = await applicationService.applyToJob(
      candidateId,
      mockJobId,
      'I am highly interested.',
      [{ question: 'Do you have 3 years of JS experience?', answer: 'Yes' }],
      'https://cloudinary.com/myresume.pdf'
    );

    expect(app).toBeDefined();
    expect(app.jobId).toBe(mockJobId);
    expect(app.candidateId).toBe(candidateId);
    expect(app.resumeUrl).toBe('https://cloudinary.com/myresume.pdf');
    expect(app.status).toBe('applied');
  });

  test('should reject application if user has already applied', async () => {
    await applicationService.applyToJob(
      candidateId,
      mockJobId,
      'First application',
      [{ question: 'Do you have 3 years of JS experience?', answer: 'Yes' }],
      'https://cloudinary.com/myresume.pdf'
    );

    // Apply again
    await expect(
      applicationService.applyToJob(
        candidateId,
        mockJobId,
        'Duplicate application',
        [{ question: 'Do you have 3 years of JS experience?', answer: 'Yes' }],
        'https://cloudinary.com/myresume.pdf'
      )
    ).rejects.toThrow(ConflictError);
  });

  test('should reject application if candidate profile resume is missing and no upload is provided', async () => {
    await expect(
      applicationService.applyToJob(
        candidateId,
        mockJobId,
        'Application without resume',
        [{ question: 'Do you have 3 years of JS experience?', answer: 'Yes' }]
      )
    ).rejects.toThrow(BadRequestError);
  });

  test('should reject application if screening questions are unanswered', async () => {
    await expect(
      applicationService.applyToJob(
        candidateId,
        mockJobId,
        'Missing answers',
        [] // Empty screening answers
      )
    ).rejects.toThrow(BadRequestError);
  });
});
