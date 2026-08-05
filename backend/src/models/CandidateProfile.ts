import mongoose, { Schema, Document, Types } from 'mongoose';
import { ExperienceItem, EducationItem } from '../types';

export interface ICandidateProfile extends Document {
  userId: Types.ObjectId;
  name: string;
  headline?: string;
  skills: string[];
  experience: ExperienceItem[];
  education: EducationItem[];
  resumeUrl?: string;
  profilePhotoUrl?: string;
  location?: string;
  phone?: string;
}

const ExperienceSchema = new Schema(
  {
    company: { type: String, required: true },
    role: { type: String, required: true },
    duration: { type: String, required: true },
    description: { type: String },
  },
  { _id: false }
);

const EducationSchema = new Schema(
  {
    school: { type: String, required: true },
    degree: { type: String, required: true },
    fieldOfStudy: { type: String, required: true },
    year: { type: Number, required: true },
  },
  { _id: false }
);

const CandidateProfileSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      default: '',
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
      type: [ExperienceSchema],
      default: [],
    },
    education: {
      type: [EducationSchema],
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

export const CandidateProfile = mongoose.model<ICandidateProfile>(
  'CandidateProfile',
  CandidateProfileSchema
);
