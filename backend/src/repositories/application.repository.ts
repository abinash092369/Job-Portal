import { Application } from '../types/application';

export interface ApplicationRepository {
  findById(id: string): Promise<Application | null>;
  findByJobId(jobId: string): Promise<Application[]>;
  findByCandidateAndJob(candidateId: string, jobId: string): Promise<Application | null>;
  findByCandidate(candidateId: string): Promise<Application[]>;
  create(applicationData: Omit<Application, 'id' | 'createdAt' | 'updatedAt'>): Promise<Application>;
  update(id: string, updates: Partial<Omit<Application, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Application | null>;
  findAll(): Promise<Application[]>;
}
