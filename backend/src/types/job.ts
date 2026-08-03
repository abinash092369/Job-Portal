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
  applicationDeadline: Date;
  status: JobStatus;
  views: number;
  screeningQuestions?: string[];
  createdAt: Date;
  updatedAt: Date;
  companyName?: string;
  logoUrl?: string;
  companyVerified?: boolean;
}

export interface JobSearchParams {
  page?: number;
  limit?: number;
  location?: string;
  jobType?: string;
  salaryMin?: number;
  experienceLevel?: string;
  skills?: string[];
  remote?: boolean;
  search?: string;
  sortBy?: 'newest' | 'salary-high' | 'salary-low' | 'relevance';
  employerId?: string;
}
