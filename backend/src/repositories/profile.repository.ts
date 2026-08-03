import { CandidateProfile, EmployerProfile } from '../types/profile';

export interface ProfileRepository {
  getCandidateProfile(userId: string): Promise<CandidateProfile | null>;
  getEmployerProfile(userId: string): Promise<EmployerProfile | null>;
  updateCandidateProfile(userId: string, updates: Partial<CandidateProfile>): Promise<CandidateProfile>;
  updateEmployerProfile(userId: string, updates: Partial<EmployerProfile>): Promise<EmployerProfile>;
}
