import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, test, expect, beforeEach } from 'vitest';
import { JobDetail } from '../../pages/JobDetail';
import { useAuthStore } from '../../context/authStore';
import { useToastStore } from '../../context/toastStore';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';

describe('Job Application Flow Integration', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    // Mock authenticated candidate user
    useAuthStore.setState({
      user: {
        id: 'mock-candidate-id-123',
        email: 'candidate@example.com',
        role: 'candidate',
        provider: 'GOOGLE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      accessToken: 'mock-access-token',
    });


    useToastStore.setState({ toasts: [] });
  });

  test('successfully opens modal, fills screening questions, and submits application', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/jobs/job-999']}>
          <Routes>
            <Route path="/jobs/:id" element={<JobDetail />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    // 1. Wait for job details query to load and check title
    expect(await screen.findByText('Frontend Engineer')).toBeInTheDocument();
    expect(screen.getAllByText('TechCorp').length).toBeGreaterThan(0);

    // 2. Click Apply Now button to trigger modal opening
    const applyButton = screen.getByRole('button', { name: /Apply Now/i });
    await userEvent.click(applyButton);

    // 3. Verify apply modal content and headers
    expect(await screen.findByText('Apply to TechCorp')).toBeInTheDocument();
    expect(screen.getByText(/Position: Frontend Engineer/i)).toBeInTheDocument();

    // 4. Input cover letter details
    const coverLetterTextarea = screen.getByPlaceholderText(/Introduce yourself and explain why you're a good fit/i);
    await userEvent.type(coverLetterTextarea, 'Hello, I am a software dev.');

    // 5. Fill out dynamic screening questions
    const screeningInputs = screen.getAllByPlaceholderText('Type your answer here...');
    await userEvent.type(screeningInputs[0], 'Yes, absolutely.');
    await userEvent.type(screeningInputs[1], 'Yes, 4 years.');

    // 6. Submit form
    const submitButton = screen.getByRole('button', { name: /Submit Application/i });
    await userEvent.click(submitButton);

    // 7. Verify success toast trigger or modal closure
    await waitFor(() => {
      const toasts = useToastStore.getState().toasts;
      expect(toasts.some(t => t.message.includes('successfully') || t.message.includes('submitted'))).toBe(true);
    });
  });

  test('shows "Already Applied" disabled button when job has already been applied to', async () => {
    // Override MSW handler for candidate dashboard to mock that this job is already applied to
    server.use(
      http.get('*/api/v1/dashboard/candidate', () => {
        return HttpResponse.json({
          success: true,
          data: {
            profileCompleteness: 85,
            appliedJobs: [
              {
                id: 'app-999',
                jobId: 'job-999',
                jobTitle: 'Frontend Engineer',
                companyName: 'TechCorp',
                status: 'applied',
                appliedAt: new Date().toISOString(),
              },
            ],
            savedJobs: [],
          },
        });
      })
    );

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/jobs/job-999']}>
          <Routes>
            <Route path="/jobs/:id" element={<JobDetail />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Wait for page to load
    expect(await screen.findByText('Frontend Engineer')).toBeInTheDocument();

    // The Apply Now button should be replaced by a disabled "Already Applied" button
    const alreadyAppliedButton = await screen.findByRole('button', { name: /Already Applied/i });
    expect(alreadyAppliedButton).toBeInTheDocument();
    expect(alreadyAppliedButton).toBeDisabled();
    expect(screen.queryByRole('button', { name: /Apply Now/i })).not.toBeInTheDocument();
  });
});
