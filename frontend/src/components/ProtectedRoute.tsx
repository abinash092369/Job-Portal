import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../context/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('candidate' | 'employer' | 'admin')[];
  guestOnly?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  guestOnly = false,
}) => {
  const { user, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        {/* Full-screen premium loading skeleton state */}
        <div className="w-full max-w-md space-y-4 animate-pulse">
          <div className="h-10 bg-slate-200 rounded-lg w-2/3 mx-auto"></div>
          <div className="h-4 bg-slate-200 rounded-lg w-1/2 mx-auto"></div>
          <div className="h-40 bg-slate-200 rounded-xl"></div>
          <div className="h-10 bg-slate-200 rounded-lg w-full"></div>
        </div>
      </div>
    );
  }

  // Guest only routes (e.g., login, register)
  if (guestOnly && user) {
    if (user.role === 'employer') {
      return <Navigate to="/employer/dashboard" replace />;
    }
    if (user.role === 'candidate') {
      return <Navigate to="/candidate/dashboard" replace />;
    }
    if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  // Protected routes
  if (!guestOnly && !user) {
    // Redirect to login but save the current location they were trying to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role checks
  if (user && allowedRoles && !allowedRoles.includes(user.role)) {
    // Role unauthorized - redirect to home page or their correct dashboard
    if (user.role === 'employer') {
      return <Navigate to="/employer/dashboard" replace />;
    }
    if (user.role === 'candidate') {
      return <Navigate to="/candidate/dashboard" replace />;
    }
    if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }


  return <>{children}</>;
};
