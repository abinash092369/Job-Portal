import mongoose, { Schema, Document } from 'mongoose';
import { JobStatus, JobType } from '../types/job';

export interface IJobDocument extends Document {
  employerId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  responsibilities: string;
  requirements: string;
  skills: string[];
  salaryRange: string;
  salaryMin: number;
  salaryMax: number;
  jobType: JobType;
  location: string;
  experienceLevel: string;
  applicationDeadline: Date;
  status: JobStatus;
  views: number;
  screeningQuestions: string[];
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema = new Schema<IJobDocument>(
  {
    employerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
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
    },
    requirements: {
      type: String,
      required: true,
    },
    skills: {
      type: [String],
      default: [],
      required: true,
    },
    salaryRange: {
      type: String,
      required: true,
    },
    salaryMin: {
      type: Number,
      default: 0,
      index: true,
    },
    salaryMax: {
      type: Number,
      default: 0,
      index: true,
    },
    jobType: {
      type: String,
      enum: ['full-time', 'part-time', 'contract', 'remote'],
      required: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    experienceLevel: {
      type: String,
      required: true,
    },
    applicationDeadline: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'closed'],
      default: 'draft',
      required: true,
    },
    views: {
      type: Number,
      default: 0,
      required: true,
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

// Compound index for filtered queries on status, location, and jobType
JobSchema.index({ status: 1, location: 1, jobType: 1 });

// Text index for search performance with field weights
JobSchema.index(
  {
    title: 'text',
    description: 'text',
    skills: 'text',
    responsibilities: 'text',
    requirements: 'text',
  },
  {
    weights: {
      title: 10,
      description: 3,
      skills: 2,
      responsibilities: 1,
      requirements: 1,
    },
    name: 'JobSearchTextIndex',
  }
);

export const JobModel = mongoose.model<IJobDocument>('Job', JobSchema);
