import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { Login } from '../../pages/auth/Login';
import { useAuthStore } from '../../context/authStore';
import { useToastStore } from '../../context/toastStore';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';

// Mock firebase/auth module for frontend integration tests
vi.mock('firebase/auth', () => {
  return {
    signInWithEmailAndPassword: vi.fn().mockResolvedValue({
      user: { getIdToken: () => Promise.resolve('mock-firebase-id-token') },
    }),
    createUserWithEmailAndPassword: vi.fn().mockResolvedValue({
      user: { getIdToken: () => Promise.resolve('mock-firebase-id-token') },
    }),
    signInWithPopup: vi.fn().mockResolvedValue({
      user: {
        displayName: 'Google Test User',
        getIdToken: () => Promise.resolve('mock-firebase-id-token'),
      },
    }),
    RecaptchaVerifier: vi.fn().mockImplementation(() => ({})),
    signInWithPhoneNumber: vi.fn().mockResolvedValue({
      confirm: vi.fn().mockResolvedValue({
        user: { getIdToken: () => Promise.resolve('mock-firebase-id-token') },
      }),
    }),
    updateProfile: vi.fn().mockResolvedValue(undefined),
  };
});

describe('Login Page Integration (Firebase Auth)', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, accessToken: null, isLoading: false });
    useToastStore.setState({ toasts: [] });
  });

  test('handles Email Login submission', async () => {
    server.use(
      http.post('*/api/v1/auth/firebase', () => {
        return HttpResponse.json({
          success: true,
          data: {
            user: {
              id: 'mock-user-123',
              email: 'test@example.com',
              role: 'candidate',
              provider: 'PASSWORD',
            },
            accessToken: 'mock-access-token',
          },
        });
      })
    );

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/candidate/dashboard" element={<div>Candidate Dashboard Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    const emailInput = screen.getByLabelText(/Email Address/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const submitButton = screen.getByRole('button', { name: /Log In with Password/i });

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.click(submitButton);

    expect(await screen.findByText('Candidate Dashboard Page')).toBeInTheDocument();

    const state = useAuthStore.getState();
    expect(state.user).not.toBeNull();
    expect(state.user?.provider).toBe('PASSWORD');
  });

  test('handles Google Sign-In button click', async () => {
    server.use(
      http.post('*/api/v1/auth/firebase', () => {
        return HttpResponse.json({
          success: true,
          data: {
            user: {
              id: 'mock-google-user',
              email: 'google@example.com',
              role: 'candidate',
              provider: 'GOOGLE',
            },
            accessToken: 'mock-access-token',
          },
        });
      })
    );

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/candidate/dashboard" element={<div>Candidate Dashboard Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    const googleTab = screen.getByRole('button', { name: /^Google$/i });
    await userEvent.click(googleTab);

    const googleButton = screen.getByRole('button', { name: /Continue with Google/i });
    await userEvent.click(googleButton);

    expect(await screen.findByText('Candidate Dashboard Page')).toBeInTheDocument();
  });
});
