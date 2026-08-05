import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAuthStore } from './context/authStore';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ToastContainer } from './components/ToastContainer';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Home } from './pages/Home';
import { JobListings } from './pages/JobListings';
import { JobDetail } from './pages/JobDetail';
import { CompanyProfile } from './pages/CompanyProfile';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { ResetPassword } from './pages/auth/ResetPassword';
import { CandidateDashboardPage } from './pages/candidate/CandidateDashboard';
import { CandidateProfilePage } from './pages/candidate/CandidateProfile';
import { MyApplications } from './pages/candidate/MyApplications';
import { SavedJobs } from './pages/candidate/SavedJobs';
import { EmployerDashboardPage } from './pages/employer/EmployerDashboard';
import { PostJobWizard } from './pages/employer/PostJobWizard';
import { ManageJobs } from './pages/employer/ManageJobs';
import { ApplicantTracking } from './pages/employer/ApplicantTracking';
import { EmployerProfilePage } from './pages/employer/EmployerProfile';
import { NotFound } from './pages/NotFound';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { UserManagement } from './pages/admin/UserManagement';
import { JobModeration } from './pages/admin/JobModeration';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Prevent redundant requests on window focus
      retry: 1, // Retry failed requests once before failing
    },
  },
});

function AppContent() {
  const { checkAuth, isLoading } = useAuthStore();

  // Run session check once on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4 animate-pulse">
          <div className="h-8 bg-slate-200 rounded-lg w-2/3 mx-auto"></div>
          <div className="h-4 bg-slate-200 rounded-lg w-1/2 mx-auto"></div>
          <div className="h-32 bg-slate-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/jobs" element={<JobListings />} />
          <Route path="/jobs/:id" element={<JobDetail />} />
          <Route path="/company/:id" element={<CompanyProfile />} />

          {/* Guest-Only Auth Routes */}
          <Route
            path="/login"
            element={
              <ProtectedRoute guestOnly>
                <Login />
              </ProtectedRoute>
            }
          />
          <Route
            path="/register"
            element={
              <ProtectedRoute guestOnly>
                <Register />
              </ProtectedRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <ProtectedRoute guestOnly>
                <ForgotPassword />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reset-password"
            element={
              <ProtectedRoute guestOnly>
                <ResetPassword />
              </ProtectedRoute>
            }
          />

          {/* Candidate-Only Routes */}
          <Route
            path="/candidate/dashboard"
            element={
              <ProtectedRoute allowedRoles={['candidate']}>
                <CandidateDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/candidate/profile"
            element={
              <ProtectedRoute allowedRoles={['candidate']}>
                <CandidateProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/candidate/applications"
            element={
              <ProtectedRoute allowedRoles={['candidate']}>
                <MyApplications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/candidate/saved"
            element={
              <ProtectedRoute allowedRoles={['candidate']}>
                <SavedJobs />
              </ProtectedRoute>
            }
          />

          {/* Employer-Only Routes */}
          <Route
            path="/employer/dashboard"
            element={
              <ProtectedRoute allowedRoles={['employer']}>
                <EmployerDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employer/jobs"
            element={
              <ProtectedRoute allowedRoles={['employer']}>
                <ManageJobs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employer/jobs/new"
            element={
              <ProtectedRoute allowedRoles={['employer']}>
                <PostJobWizard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employer/jobs/edit/:id"
            element={
              <ProtectedRoute allowedRoles={['employer']}>
                <PostJobWizard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employer/jobs/:id/applications"
            element={
              <ProtectedRoute allowedRoles={['employer']}>
                <ApplicantTracking />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employer/profile"
            element={
              <ProtectedRoute allowedRoles={['employer']}>
                <EmployerProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Admin-Only Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <UserManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/jobs"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <JobModeration />
              </ProtectedRoute>
            }
          />

          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
