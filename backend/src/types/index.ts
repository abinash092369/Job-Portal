import { Request } from 'express';
import { Types } from 'mongoose';

export type UserRole = 'employer' | 'candidate' | 'admin';
export type JobType = 'full-time' | 'part-time' | 'contract' | 'remote';
export type JobStatus = 'draft' | 'active' | 'closed';
export type ApplicationStatus = 'applied' | 'reviewed' | 'shortlisted' | 'interview' | 'rejected' | 'hired';
export type NotificationType = 'application_received' | 'status_changed' | 'job_expiring';

export type AuthProvider = 'PASSWORD' | 'GOOGLE' | 'PHONE';

export interface ApiResponse<T = any> {
  success: boolean;
  data: T | null;
  message?: string;
}

export interface AuthUser {
  id: string;
  firebaseUid?: string;
  name?: string;
  email?: string;
  phone?: string;
  googleId?: string;
  avatar?: string;
  role: UserRole;
  provider: AuthProvider;
  isSuspended?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export interface ExperienceItem {
  company: string;
  role: string;
  duration: string;
  description?: string;
}

export interface EducationItem {
  school: string;
  degree: string;
  fieldOfStudy: string;
  year: number;
}

export interface ScreeningAnswer {
  question: string;
  answer: string;
}
