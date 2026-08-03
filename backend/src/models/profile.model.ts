import mongoose, { Schema, Document } from 'mongoose';

// Candidate Profile Schema
export interface ICandidateProfileDocument extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  headline?: string;
  skills: string[];
  experience: any[];
  education: any[];
  resumeUrl?: string;
  profilePhotoUrl?: string;
  location?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CandidateProfileSchema = new Schema<ICandidateProfileDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    headline: {
      type: String,
      default: '',
    },
    skills: {
      type: [String],
      default: [],
    },
    experience: {
      type: [Schema.Types.Mixed],
      default: [],
    } as any,
    education: {
      type: [Schema.Types.Mixed],
      default: [],
    } as any,
    resumeUrl: {
      type: String,
      default: '',
    },
    profilePhotoUrl: {
      type: String,
      default: '',
    },
    location: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const CandidateProfileModel = mongoose.model<ICandidateProfileDocument>(
  'CandidateProfile',
  CandidateProfileSchema
);

// Employer Profile Schema
export interface IEmployerProfileDocument extends Document {
  userId: mongoose.Types.ObjectId;
  companyName: string;
  logoUrl?: string;
  description?: string;
  website?: string;
  industry?: string;
  companySize?: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EmployerProfileSchema = new Schema<IEmployerProfileDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    logoUrl: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    website: {
      type: String,
      default: '',
    },
    industry: {
      type: String,
      default: '',
    },
    companySize: {
      type: String,
      default: '',
    },
    isVerified: {
      type: Boolean,
      default: false,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const EmployerProfileModel = mongoose.model<IEmployerProfileDocument>(
  'EmployerProfile',
  EmployerProfileSchema
);
