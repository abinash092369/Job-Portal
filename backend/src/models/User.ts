import mongoose, { Schema, Document } from 'mongoose';
import { UserRole, AuthProvider } from '../types';

export interface IUser extends Document {
  firebaseUid?: string;
  name?: string;
  email?: string;
  phone?: string;
  googleId?: string;
  avatar?: string;
  role: UserRole;
  provider: AuthProvider;
  refreshTokenHash?: string | null;
  isSuspended: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    firebaseUid: {
      type: String,
      default: null,
    },
    name: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: null,
    },
    phone: {
      type: String,
      trim: true,
      default: null,
    },
    googleId: {
      type: String,
      default: null,
    },
    avatar: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['employer', 'candidate', 'admin'],
      default: 'candidate',
      required: true,
    },
    provider: {
      type: String,
      enum: ['PASSWORD', 'GOOGLE', 'PHONE'],
      required: true,
    },
    refreshTokenHash: {
      type: String,
      default: null,
    },
    isSuspended: {
      type: Boolean,
      default: false,
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

// Partial unique indexes for non-null email, phone, firebaseUid, and googleId excluding soft-deleted users
UserSchema.index(
  { firebaseUid: 1 },
  {
    unique: true,
    partialFilterExpression: { firebaseUid: { $type: 'string' }, deletedAt: null },
  }
);

UserSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: { email: { $type: 'string' }, deletedAt: null },
  }
);

UserSchema.index(
  { phone: 1 },
  {
    unique: true,
    partialFilterExpression: { phone: { $type: 'string' }, deletedAt: null },
  }
);

UserSchema.index(
  { googleId: 1 },
  {
    unique: true,
    partialFilterExpression: { googleId: { $type: 'string' }, deletedAt: null },
  }
);

export const User = mongoose.model<IUser>('User', UserSchema);
