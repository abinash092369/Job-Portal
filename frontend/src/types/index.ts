export type UserRole = 'employer' | 'candidate' | 'admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
  isSuspended?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CandidateProfile {
  name: string;
  headline?: string;
  skills: string[];
  experience: {
    company: string;
    role: string;
    duration: string;
    description?: string;
  }[];
  education: {
    school: string;
    degree: string;
    fieldOfStudy: string;
    year: number;
  }[];
  resumeUrl?: string;
  profilePhotoUrl?: string;
  location?: string;
  phone?: string;
}

export interface EmployerProfile {
  companyName: string;
  logoUrl?: string;
  description?: string;
  website?: string;
  industry?: string;
  companySize?: string;
  isVerified: boolean;
}

export type JobStatus = 'draft' | 'active' | 'closed';

export type JobType = 'full-time' | 'part-time' | 'contract' | 'remote';

export interface Job {
  id: string;
  employerId: string;
  title: string;
  description: string;
  responsibilities: string;
  requirements: string;
  skills: string[];
  salaryRange: string;
  jobType: JobType;
  location: string;
  experienceLevel: string;
  applicationDeadline: string;
  status: JobStatus;
  views: number;
  screeningQuestions?: string[];
  createdAt: string;
  updatedAt: string;
  companyName?: string;
  logoUrl?: string;
  companyVerified?: boolean;
}

export type ApplicationStatus = 'applied' | 'reviewed' | 'shortlisted' | 'interview' | 'rejected' | 'hired';

export interface ScreeningAnswer {
  question: string;
  answer: string;
}

export interface Application {
  id: string;
  jobId: string;
  candidateId: string;
  resumeUrl: string;
  coverLetter: string;
  screeningAnswers?: ScreeningAnswer[];
  status: ApplicationStatus;
  notes: string[];
  createdAt: string;
  updatedAt: string;
  candidateName?: string;
  candidateEmail?: string;
  candidateSkills?: string[];
  candidatePhotoUrl?: string;
}

export type NotificationType = 'application_received' | 'status_changed' | 'job_expiring';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmployerDashboard {
  activeJobsCount: number;
  totalApplicants: number;
  applicantsPerJob: {
    jobId: string;
    jobTitle: string;
    applicantCount: number;
  }[];
  recentActivity: {
    id: string;
    jobId: string;
    jobTitle: string;
    candidateName: string;
    status: string;
    createdAt: string;
  }[];
}

export interface CandidateDashboard {
  appliedJobs: {
    id: string;
    jobId: string;
    jobTitle: string;
    companyName: string;
    status: string;
    appliedAt: string;
  }[];
  savedJobs: Job[];
  profileCompleteness: number;
}
