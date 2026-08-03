import { dashboardService } from '../../services/dashboard.service';
import { profileRepository } from '../../repositories/in-memory/profile.repository.impl';
import { userRepository } from '../../repositories/in-memory/user.repository.impl';

describe('DashboardService - Profile Completeness', () => {
  let candidateId: string;

  beforeEach(async () => {
    // 1. Create a candidate user in database
    const user = await userRepository.create({
      email: 'jane.completeness@example.com',
      passwordHash: 'dummyhash',
      role: 'candidate',
      isVerified: true,
    });
    candidateId = user.id;
  });

  test('should return 0% completeness if profile properties are empty', async () => {
    // Override default email split name with empty string to test 0% completeness
    await profileRepository.updateCandidateProfile(candidateId, {
      name: '',
      headline: '',
      skills: [],
      experience: [],
      education: [],
    });
    const dashboard = await dashboardService.getCandidateDashboard(candidateId);
    expect(dashboard.profileCompleteness).toBe(0);
  });

  test('should calculate correct completeness meter dynamically based on profile configurations', async () => {
    // 1. Partial Profile (Name and Headline) -> 15 + 15 = 30%
    await profileRepository.updateCandidateProfile(candidateId, {
      name: 'Jane Developer',
      headline: 'React Senior Architect',
      skills: [],
      experience: [],
      education: [],
    });

    let dashboard = await dashboardService.getCandidateDashboard(candidateId);
    expect(dashboard.profileCompleteness).toBe(30);

    // 2. Add Skills and Location -> +20 +5 = 55%
    await profileRepository.updateCandidateProfile(candidateId, {
      name: 'Jane Developer',
      headline: 'React Senior Architect',
      skills: ['TypeScript', 'Jest'],
      experience: [],
      education: [],
      location: 'New York, USA',
    });

    dashboard = await dashboardService.getCandidateDashboard(candidateId);
    expect(dashboard.profileCompleteness).toBe(55);

    // 3. Complete Profile -> 15 + 15 + 20 + 15 + 15 + 10 + 5 + 5 = 100%
    await profileRepository.updateCandidateProfile(candidateId, {
      name: 'Jane Developer',
      headline: 'React Senior Architect',
      skills: ['TypeScript', 'Jest'],
      experience: [{ company: 'Microsoft', role: 'Staff dev', duration: '2 yrs' }],
      education: [{ school: 'Stanford', degree: 'BS', fieldOfStudy: 'CS', year: 2024 }],
      resumeUrl: 'https://cloudinary.com/my_validated_resume.pdf',
      location: 'New York, USA',
      phone: '+1 555-987-6543',
    });

    dashboard = await dashboardService.getCandidateDashboard(candidateId);
    expect(dashboard.profileCompleteness).toBe(100);
  });
});
