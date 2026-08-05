import { http, HttpResponse } from 'msw';

export const handlers = [
  // Login handler
  http.post('*/api/v1/auth/login', () => {
    return HttpResponse.json({
      success: true,
      data: {
        user: {
          id: 'mock-candidate-id-123',
          email: 'candidate@example.com',
          role: 'candidate',
          provider: 'GOOGLE',
        },
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      },
    });
  }),

  // Candidate dashboard details
  http.get('*/api/v1/dashboard/candidate', () => {
    return HttpResponse.json({
      success: true,
      data: {
        profileCompleteness: 85,
        appliedJobs: [
          {
            id: 'app-1',
            jobId: 'job-1',
            jobTitle: 'Frontend Engineer',
            companyName: 'TechCorp',
            status: 'applied',
            appliedAt: new Date().toISOString(),
          },
        ],
        savedJobs: [
          {
            id: 'job-2',
            title: 'React Dev',
            companyName: 'StartupX',
            location: 'Remote',
            jobType: 'full-time',
            salaryRange: '$90k - $110k',
            skills: ['React', 'CSS'],
          },
        ],
      },
    });
  }),

  // Get saved jobs list
  http.get('*/api/v1/jobs/saved', () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          id: 'job-2',
          title: 'React Dev',
          companyName: 'StartupX',
          location: 'Remote',
          jobType: 'full-time',
          salaryRange: '$90k - $110k',
          skills: ['React', 'CSS'],
        },
      ],
    });
  }),

  // Get job details (active)
  http.get('*/api/v1/jobs/:id', ({ params }) => {
    return HttpResponse.json({
      success: true,
      data: {
        id: params.id,
        title: 'Frontend Engineer',
        description: 'Build premium interfaces using React and Tailwind CSS.',
        requirements: '3+ years of React experience',
        responsibilities: 'Build UI components',
        skills: ['React', 'Tailwind', 'TS'],
        salaryRange: '$120k - $140k',
        jobType: 'full-time',
        location: 'San Francisco, CA',
        experienceLevel: 'Mid Level',
        status: 'active',
        companyName: 'TechCorp',
        companyVerified: true,
        logoUrl: 'https://logo.com/techcorp.png',
        employerId: 'emp-123',
        views: 42,
        screeningQuestions: ['Do you know React?', 'Do you have 3 years experience?'],
      },
    });
  }),

  // Apply to job
  http.post('*/api/v1/jobs/:id/apply', ({ params }) => {
    return HttpResponse.json({
      success: true,
      data: {
        id: 'new-application-id',
        jobId: params.id,
        candidateId: 'mock-candidate-id-123',
        status: 'applied',
        createdAt: new Date().toISOString(),
      },
    });
  }),
];
