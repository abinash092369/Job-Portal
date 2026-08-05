import { Request } from 'express';
import { Types } from 'mongoose';

export type UserRole = 'employer' | 'candidate' | 'admin';
export type JobType = 'full-time' | 'part-time' | 'contract' | 'remote';
export type JobStatus = 'draft' | 'active' | 'closed';
export type ApplicationStatus = 'applied' | 'reviewed' | 'shortlisted' | 'interview' | 'rejected' | 'hired';
export type NotificationType = 'application_received' | 'status_changed' | 'job_expiring';

export interface ApiResponse<T = any> {
  success: boolean;
  data: T | null;
  message?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
  isSuspended?: boolean;
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
