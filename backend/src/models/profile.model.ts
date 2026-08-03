import mongoose, { Schema, Document } from 'mongoose';

export interface IExperienceEntry {
  title: string;
  company: string;
  location?: string;
  startDate: Date;
  endDate?: Date | null;
  description?: string;
}

export interface IEducationEntry {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: Date;
  endDate?: Date | null;
  description?: string;
}

// Candidate Profile Schema
export interface ICandidateProfileDocument extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  headline?: string;
  skills: string[];
  experience: IExperienceEntry[];
  education: IEducationEntry[];
  resumeUrl?: string;
  profilePhotoUrl?: string;
  location?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExperienceEntrySchema = new Schema<IExperienceEntry>(
  {
    title: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    location: { type: String, default: '' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, default: null },
    description: { type: String, default: '' },
  },
  { _id: false }
);

const EducationEntrySchema = new Schema<IEducationEntry>(
  {
    institution: { type: String, required: true, trim: true },
    degree: { type: String, required: true, trim: true },
    fieldOfStudy: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, default: null },
    description: { type: String, default: '' },
  },
  { _id: false }
);

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
      type: [ExperienceEntrySchema],
      default: [],
    },
    education: {
      type: [EducationEntrySchema],
      default: [],
    },
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
