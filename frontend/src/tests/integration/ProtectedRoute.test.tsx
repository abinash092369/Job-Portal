import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, test, expect, beforeEach } from 'vitest';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { useAuthStore } from '../../context/authStore';

describe('ProtectedRoute Component Integration', () => {
  beforeEach(() => {
    // Reset Zustand store state before each test run
    useAuthStore.setState({
      user: null,
      accessToken: null,
      isLoading: false,
    });
  });

  test('renders loading skeleton when isLoading is true', () => {
    useAuthStore.setState({ isLoading: true });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <div>Protected Page</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    // Should not render child and should show loading elements
    expect(screen.queryByText('Protected Page')).not.toBeInTheDocument();
    // ProtectedRoute has a loading state animate-pulse div
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  test('redirects unauthenticated users to /login', () => {
    useAuthStore.setState({ user: null, accessToken: null });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <div>Protected Page</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    // Should not render child and should show loading elements
    expect(screen.queryByText('Protected Page')).not.toBeInTheDocument();
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  test('allows access to authenticated users with correct role', () => {
    useAuthStore.setState({
      user: {
        id: '1',
        email: 'candidate@test.com',
        role: 'candidate',
        isVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      accessToken: 'token',
    });

    render(
      <MemoryRouter initialEntries={['/candidate/dashboard']}>
        <Routes>
          <Route
            path="/candidate/dashboard"
            element={
              <ProtectedRoute allowedRoles={['candidate']}>
                <div>Candidate Dashboard</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Candidate Dashboard')).toBeInTheDocument();
  });

  test('redirects unauthorized role to their respective dashboard', () => {
    // Employer attempting to access Candidate page should be redirected to employer dashboard
    useAuthStore.setState({
      user: {
        id: '2',
        email: 'employer@test.com',
        role: 'employer',
        isVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      accessToken: 'token',
    });

    render(
      <MemoryRouter initialEntries={['/candidate/dashboard']}>
        <Routes>
          <Route
            path="/candidate/dashboard"
            element={
              <ProtectedRoute allowedRoles={['candidate']}>
                <div>Candidate Dashboard</div>
              </ProtectedRoute>
            }
          />
          <Route path="/employer/dashboard" element={<div>Employer Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByText('Candidate Dashboard')).not.toBeInTheDocument();
    expect(screen.getByText('Employer Dashboard')).toBeInTheDocument();
  });

  test('redirects authenticated users away from guestOnly pages (e.g. login)', () => {
    useAuthStore.setState({
      user: {
        id: '1',
        email: 'candidate@test.com',
        role: 'candidate',
        isVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      accessToken: 'token',
    });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route
            path="/login"
            element={
              <ProtectedRoute guestOnly>
                <div>Login Form</div>
              </ProtectedRoute>
            }
          />
          <Route path="/candidate/dashboard" element={<div>Candidate Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByText('Login Form')).not.toBeInTheDocument();
    expect(screen.getByText('Candidate Dashboard')).toBeInTheDocument();
  });
});

