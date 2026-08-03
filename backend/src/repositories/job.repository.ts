import { Job, JobSearchParams } from '../types/job';

export interface JobRepository {
  findById(id: string): Promise<Job | null>;
  findByEmployerId(employerId: string): Promise<Job[]>;
  findAllActive(): Promise<Job[]>;
  searchActiveJobs(params: JobSearchParams): Promise<{ jobs: Job[]; total: number }>;
  incrementViews(id: string): Promise<Job | null>;
  create(jobData: Omit<Job, 'id' | 'views' | 'createdAt' | 'updatedAt'>): Promise<Job>;
  update(id: string, updates: Partial<Omit<Job, 'id' | 'views' | 'createdAt' | 'updatedAt'>>): Promise<Job | null>;
  delete(id: string): Promise<boolean>;
  findAll(): Promise<Job[]>;
}
