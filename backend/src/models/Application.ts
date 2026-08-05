import mongoose, { Schema, Document, Types } from 'mongoose';
import { ApplicationStatus, ScreeningAnswer } from '../types';

export interface StatusHistoryItem {
  status: ApplicationStatus;
  changedAt: Date;
  changedBy?: Types.ObjectId;
}

export interface IApplication extends Document {
  jobId: Types.ObjectId;
  candidateId: Types.ObjectId;
  resumeUrl: string;
  coverLetter: string;
  screeningAnswers: ScreeningAnswer[];
  status: ApplicationStatus;
  statusHistory: StatusHistoryItem[];
  notes: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ScreeningAnswerSchema = new Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
  },
  { _id: false }
);

const StatusHistorySchema = new Schema(
  {
    status: { type: String, required: true },
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: false }
);

const ApplicationSchema: Schema = new Schema(
  {
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    candidateId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    resumeUrl: {
      type: String,
      required: true,
    },
    coverLetter: {
      type: String,
      required: true,
      default: '',
    },
    screeningAnswers: {
      type: [ScreeningAnswerSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ['applied', 'reviewed', 'shortlisted', 'interview', 'rejected', 'hired'],
      default: 'applied',
    },
    statusHistory: {
      type: [StatusHistorySchema],
      default: [],
    },
    notes: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate applications for the same job by the same candidate
ApplicationSchema.index({ jobId: 1, candidateId: 1 }, { unique: true });

export const Application = mongoose.model<IApplication>(
  'Application',
  ApplicationSchema
);
