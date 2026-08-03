import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, test, expect, beforeEach } from 'vitest';
import { Login } from '../../pages/auth/Login';
import { useAuthStore } from '../../context/authStore';
import { useToastStore } from '../../context/toastStore';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';

describe('Login Page Integration', () => {
  beforeEach(() => {
    // Clear store state before each test run
    useAuthStore.setState({ user: null, accessToken: null, isLoading: false });
    useToastStore.setState({ toasts: [] });
  });

  test('shows validation errors for invalid inputs', async () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const submitButton = screen.getByRole('button', { name: /Sign in/i });


    // Submit form with empty inputs
    await userEvent.click(submitButton);

    expect(await screen.findByText(/Please enter a valid email address/i)).toBeInTheDocument();
    expect(await screen.findByText(/Password must be at least 6 characters/i)).toBeInTheDocument();
  });

  test('submits successfully and redirects to candidate dashboard', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/candidate/dashboard" element={<div>Candidate Dashboard Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    const emailInput = screen.getByLabelText(/Email address/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const submitButton = screen.getByRole('button', { name: /Sign in/i });

    await userEvent.type(emailInput, 'candidate@example.com');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.click(submitButton);

    // Assert that the page redirected to candidate dashboard on success
    expect(await screen.findByText('Candidate Dashboard Page')).toBeInTheDocument();

    // Verify Zustand authentication state is updated
    const state = useAuthStore.getState();
    expect(state.user).not.toBeNull();
    expect(state.user?.email).toBe('candidate@example.com');
    expect(state.user?.role).toBe('candidate');
    expect(state.accessToken).toBe('mock-access-token');
  });

  test('shows error toast on API failure', async () => {
    // Override API handler to return a 401 error
    server.use(
      http.post('*/api/v1/auth/login', () => {
        return HttpResponse.json(
          { success: false, message: 'Invalid email or password' },
          { status: 400 }
        );
      })
    );

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );

    const emailInput = screen.getByLabelText(/Email address/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const submitButton = screen.getByRole('button', { name: /Sign in/i });

    await userEvent.type(emailInput, 'candidate@example.com');
    await userEvent.type(passwordInput, 'wrongpassword');
    await userEvent.click(submitButton);

    // Verify that the error toast is correctly pushed to toast store state
    await waitFor(() => {
      const toasts = useToastStore.getState().toasts;
      expect(toasts.some(t => t.message.includes('Invalid email or password') && t.type === 'error')).toBe(true);
    });
  });
});
