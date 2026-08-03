import { Job } from './job';

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
    createdAt: Date;
  }[];
}

export interface CandidateDashboard {
  appliedJobs: {
    id: string;
    jobId: string;
    jobTitle: string;
    companyName: string;
    status: string;
    appliedAt: Date;
  }[];
  savedJobs: Job[];
  profileCompleteness: number;
}
