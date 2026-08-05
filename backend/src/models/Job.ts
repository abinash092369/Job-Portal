import mongoose, { Schema, Document, Types } from 'mongoose';
import { JobType, JobStatus } from '../types';

export interface IJob extends Document {
  employerId: Types.ObjectId;
  title: string;
  description: string;
  responsibilities: string;
  requirements: string;
  skills: string[];
  salaryRange: string;
  jobType: JobType;
  location: string;
  experienceLevel: string;
  applicationDeadline: string;
  status: JobStatus;
  views: number;
  screeningQuestions?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema: Schema = new Schema(
  {
    employerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    responsibilities: {
      type: String,
      required: true,
      default: '',
    },
    requirements: {
      type: String,
      required: true,
      default: '',
    },
    skills: {
      type: [String],
      default: [],
    },
    salaryRange: {
      type: String,
      required: true,
      default: '',
    },
    jobType: {
      type: String,
      enum: ['full-time', 'part-time', 'contract', 'remote'],
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    experienceLevel: {
      type: String,
      required: true,
      default: 'Entry Level',
    },
    applicationDeadline: {
      type: String,
      required: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'closed'],
      default: 'active',
    },
    views: {
      type: Number,
      default: 0,
    },
    screeningQuestions: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// MongoDB text index on Job(title, description, skills) with title weighted higher
JobSchema.index(
  { title: 'text', skills: 'text', description: 'text' },
  { weights: { title: 10, skills: 5, description: 1 }, name: 'JobTextIndex' }
);

// Compound indexes for fast searching & filtering
JobSchema.index({ status: 1, location: 1, jobType: 1 });
JobSchema.index({ employerId: 1, status: 1 });

export const Job = mongoose.model<IJob>('Job', JobSchema);
