import { ProfileRepository } from '../repositories/profileRepository';
import { UserRole } from '../types';

export class ProfileService {
  private profileRepo: ProfileRepository;

  constructor() {
    this.profileRepo = new ProfileRepository();
  }

  async getProfile(userId: string, role: UserRole) {
    if (role === 'candidate') {
      let profile = await this.profileRepo.findCandidateByUserId(userId);
      if (!profile) {
        profile = await this.profileRepo.createCandidateProfile({
          userId: userId as any,
          name: '',
          skills: [],
          experience: [],
          education: [],
        });
      }
      return profile;
    } else if (role === 'employer') {
      let profile = await this.profileRepo.findEmployerByUserId(userId);
      if (!profile) {
        profile = await this.profileRepo.createEmployerProfile({
          userId: userId as any,
          companyName: '',
          isVerified: false,
        });
      }
      return profile;
    } else {
      throw new Error(`Profile not applicable for role '${role}'`);
    }
  }

  async updateProfile(userId: string, role: UserRole, updateData: any) {
    if (role === 'candidate') {
      const updated = await this.profileRepo.updateCandidateProfile(userId, updateData);
      return updated;
    } else if (role === 'employer') {
      const updated = await this.profileRepo.updateEmployerProfile(userId, updateData);
      return updated;
    } else {
      throw new Error(`Cannot update profile for role '${role}'`);
    }
  }

  async getPublicEmployerProfile(userId: string) {
    const profile = await this.profileRepo.findEmployerByUserId(userId);
    if (!profile) {
      throw new Error('Employer profile not found');
    }
    return profile;
  }
}
