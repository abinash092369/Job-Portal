import mongoose, { Schema, Document } from 'mongoose';
import { UserRole } from '../types/auth';

export interface IUserDocument extends Document {
  email: string;
  passwordHash: string;
  role: UserRole;
  isSuspended: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['candidate', 'employer', 'admin'],
      default: 'candidate',
      required: true,
    },
    isSuspended: {
      type: Boolean,
      default: false,
      required: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Unique index on email for active users only (soft delete support)
UserSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: { deletedAt: null },
  }
);

export const UserModel = mongoose.model<IUserDocument>('User', UserSchema);
