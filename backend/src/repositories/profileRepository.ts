import { CandidateProfile, ICandidateProfile } from '../models/CandidateProfile';
import { EmployerProfile, IEmployerProfile } from '../models/EmployerProfile';

export class ProfileRepository {
  // Candidate Profile methods
  async findCandidateByUserId(userId: string): Promise<ICandidateProfile | null> {
    return CandidateProfile.findOne({ userId });
  }

  async createCandidateProfile(data: Partial<ICandidateProfile>): Promise<ICandidateProfile> {
    const profile = new CandidateProfile(data);
    return profile.save();
  }

  async updateCandidateProfile(
    userId: string,
    data: Partial<ICandidateProfile>
  ): Promise<ICandidateProfile | null> {
    return CandidateProfile.findOneAndUpdate({ userId }, data, {
      new: true,
      upsert: true,
    });
  }

  // Employer Profile methods
  async findEmployerByUserId(userId: string): Promise<IEmployerProfile | null> {
    return EmployerProfile.findOne({ userId });
  }

  async createEmployerProfile(data: Partial<IEmployerProfile>): Promise<IEmployerProfile> {
    const profile = new EmployerProfile(data);
    return profile.save();
  }

  async updateEmployerProfile(
    userId: string,
    data: Partial<IEmployerProfile>
  ): Promise<IEmployerProfile | null> {
    return EmployerProfile.findOneAndUpdate({ userId }, data, {
      new: true,
      upsert: true,
    });
  }
}
