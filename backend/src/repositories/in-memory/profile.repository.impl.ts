import { CandidateProfile, EmployerProfile } from '../../types/profile';
import { ProfileRepository } from '../profile.repository';
import { UserModel } from '../../models/user.model';
import { 
  CandidateProfileModel, 
  EmployerProfileModel,
  ICandidateProfileDocument,
  IEmployerProfileDocument
} from '../../models/profile.model';
import mongoose from 'mongoose';


function mapCandidateProfile(doc: ICandidateProfileDocument): CandidateProfile {
  return {
    name: doc.name,
    headline: doc.headline,
    skills: doc.skills || [],
    experience: doc.experience || [],
    education: doc.education || [],
    resumeUrl: doc.resumeUrl,
    profilePhotoUrl: doc.profilePhotoUrl,
    location: doc.location,
    phone: doc.phone,
  };
}

function mapEmployerProfile(doc: IEmployerProfileDocument): EmployerProfile {
  return {
    companyName: doc.companyName,
    logoUrl: doc.logoUrl,
    description: doc.description,
    website: doc.website,
    industry: doc.industry,
    companySize: doc.companySize,
    isVerified: doc.isVerified,
  };
}

export class MongooseProfileRepository implements ProfileRepository {
  async getCandidateProfile(userId: string): Promise<CandidateProfile | null> {
    if (!mongoose.Types.ObjectId.isValid(userId)) return null;

    // Check if the user is active (not soft-deleted)
    const user = await UserModel.findOne({ _id: userId, deletedAt: null });
    if (!user) return null;

    let profileDoc = await CandidateProfileModel.findOne({ userId });
    if (!profileDoc) {
      // Initialize with default candidate profile on first access
      profileDoc = new CandidateProfileModel({
        userId,
        name: user.email.split('@')[0],
        headline: '',
        skills: [],
        experience: [],
        education: [],
        resumeUrl: '',
        profilePhotoUrl: '',
        location: '',
        phone: '',
      });
      await profileDoc.save();
    }

    return mapCandidateProfile(profileDoc);
  }

  async getEmployerProfile(userId: string): Promise<EmployerProfile | null> {
    if (!mongoose.Types.ObjectId.isValid(userId)) return null;

    // Check if the user is active (not soft-deleted)
    const user = await UserModel.findOne({ _id: userId, deletedAt: null });
    if (!user) return null;

    let profileDoc = await EmployerProfileModel.findOne({ userId });
    if (!profileDoc) {
      // Initialize with default employer profile on first access
      profileDoc = new EmployerProfileModel({
        userId,
        companyName: user.email.split('@')[0] + ' Corp',
        logoUrl: '',
        description: '',
        website: '',
        industry: '',
        companySize: '',
        isVerified: false,
      });
      await profileDoc.save();
    }

    return mapEmployerProfile(profileDoc);
  }

  async updateCandidateProfile(
    userId: string,
    updates: Partial<CandidateProfile>
  ): Promise<CandidateProfile> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error(`Invalid User ID: ${userId}`);
    }

    // Check if user is active
    const user = await UserModel.findOne({ _id: userId, deletedAt: null });
    if (!user) {
      throw new Error(`Active User candidate profile for ID ${userId} not found`);
    }

    // Ensure we are working with an existing profile
    await this.getCandidateProfile(userId);

    // Clean Cloudinary URLs if wrapped
    const cleanedUpdates = { ...updates };


    const profileDoc = await CandidateProfileModel.findOneAndUpdate(
      { userId },
      { $set: cleanedUpdates },
      { new: true }
    );

    if (!profileDoc) {
      throw new Error(`Failed to update candidate profile for ID ${userId}`);
    }

    return mapCandidateProfile(profileDoc);
  }

  async updateEmployerProfile(
    userId: string,
    updates: Partial<EmployerProfile>
  ): Promise<EmployerProfile> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error(`Invalid User ID: ${userId}`);
    }

    // Check if user is active
    const user = await UserModel.findOne({ _id: userId, deletedAt: null });
    if (!user) {
      throw new Error(`Active User employer profile for ID ${userId} not found`);
    }

    // Ensure we are working with an existing profile
    await this.getEmployerProfile(userId);

    // Clean Cloudinary URLs if wrapped
    const cleanedUpdates = { ...updates };


    const profileDoc = await EmployerProfileModel.findOneAndUpdate(
      { userId },
      { $set: cleanedUpdates },
      { new: true }
    );

    if (!profileDoc) {
      throw new Error(`Failed to update employer profile for ID ${userId}`);
    }

    return mapEmployerProfile(profileDoc);
  }
}

export const profileRepository = new MongooseProfileRepository();
