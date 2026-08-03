import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { JobCard } from '../../components/JobCard';

import type { Job } from '../../types';

const mockJob: Job = {
  id: 'job-123',
  employerId: 'emp-456',
  title: 'Senior React Engineer',
  description: 'Awesome role with modern stack.',
  responsibilities: 'Build features',
  requirements: 'React expert',
  skills: ['React', 'TypeScript', 'Tailwind'],
  salaryRange: '$120k - $140k',
  jobType: 'full-time',
  location: 'Remote',
  experienceLevel: 'Senior Level',
  applicationDeadline: new Date(Date.now() + 100000).toISOString(),
  status: 'active',
  views: 12,
  companyName: 'Acme Corp',
  companyVerified: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('JobCard Component', () => {
  test('renders job title, company name, salary range, and type', () => {
    render(
      <BrowserRouter>
        <JobCard job={mockJob} />
      </BrowserRouter>
    );

    expect(screen.getByText('Senior React Engineer')).toBeInTheDocument();
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('$120k - $140k')).toBeInTheDocument();
    expect(screen.getByText('full-time')).toBeInTheDocument();
    expect(screen.getByTestId('verified-badge')).toBeInTheDocument();
  });

  test('does not render verified badge if employer is not verified', () => {
    const unverifiedJob = { ...mockJob, companyVerified: false };
    render(
      <BrowserRouter>
        <JobCard job={unverifiedJob} />
      </BrowserRouter>
    );

    expect(screen.queryByTestId('verified-badge')).not.toBeInTheDocument();
  });
});
