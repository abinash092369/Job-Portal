import mongoose, { Schema, Document } from 'mongoose';
import { ApplicationStatus } from '../types/application';

export interface IStatusHistoryEntry {
  status: ApplicationStatus;
  changedAt: Date;
}

export interface IScreeningAnswerEntry {
  question: string;
  answer: string;
}

export interface IApplicationDocument extends Document {
  jobId: mongoose.Types.ObjectId;
  candidateId: mongoose.Types.ObjectId;
  resumeUrl: string;
  coverLetter: string;
  screeningAnswers: IScreeningAnswerEntry[];
  status: ApplicationStatus;
  notes: string[];
  statusHistory: IStatusHistoryEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const StatusHistorySchema = new Schema<IStatusHistoryEntry>(
  {
    status: {
      type: String,
      enum: ['applied', 'reviewed', 'shortlisted', 'interview', 'rejected', 'hired'],
      required: true,
    },
    changedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  { _id: false }
);

const ScreeningAnswerSchema = new Schema<IScreeningAnswerEntry>(
  {
    question: {
      type: String,
      required: true,
    },
    answer: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const ApplicationSchema = new Schema<IApplicationDocument>(
  {
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
      index: true,
    },
    candidateId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    resumeUrl: {
      type: String,
      required: true,
    },
    coverLetter: {
      type: String,
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
      required: true,
    },
    notes: {
      type: [String],
      default: [],
    },
    statusHistory: {
      type: [StatusHistorySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index on Application(jobId, candidateId) to block duplicates
ApplicationSchema.index({ jobId: 1, candidateId: 1 }, { unique: true });

export const ApplicationModel = mongoose.model<IApplicationDocument>(
  'Application',
  ApplicationSchema
);
