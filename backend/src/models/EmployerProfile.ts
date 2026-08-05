import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IEmployerProfile extends Document {
  userId: Types.ObjectId;
  companyName: string;
  logoUrl?: string;
  description?: string;
  website?: string;
  industry?: string;
  companySize?: string;
  isVerified: boolean;
}

const EmployerProfileSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    companyName: {
      type: String,
      required: true,
      default: '',
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
    },
  },
  {
    timestamps: true,
  }
);

export const EmployerProfile = mongoose.model<IEmployerProfile>(
  'EmployerProfile',
  EmployerProfileSchema
);
