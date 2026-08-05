import { User } from '../../types/auth';
import { UserRepository } from '../user.repository';
import { 
  UserModel, 
  EmailVerificationTokenModel, 
  PasswordResetTokenModel, 
  IUserDocument 
} from '../../models/user.model';
import mongoose from 'mongoose';

/**
 * Maps a Mongoose User document and its associated tokens to the clean User domain object.
 */
async function mapUser(doc: IUserDocument): Promise<User> {
  const userObj: User = {
    id: doc._id.toString(),
    email: doc.email,
    passwordHash: doc.passwordHash,
    role: doc.role,
    isVerified: doc.isVerified,
    isSuspended: doc.isSuspended,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };

  // Find any active tokens to merge back
  const [emailToken, resetToken] = await Promise.all([
    EmailVerificationTokenModel.findOne({ userId: doc._id, expiresAt: { $gt: new Date() } }),
    PasswordResetTokenModel.findOne({ userId: doc._id, expiresAt: { $gt: new Date() } }),
  ]);

  if (emailToken) {
    userObj.verificationToken = emailToken.token;
    userObj.verificationTokenExpires = emailToken.expiresAt;
  }
  if (resetToken) {
    userObj.passwordResetToken = resetToken.token;
    userObj.passwordResetExpires = resetToken.expiresAt;
  }

  return userObj;
}

export class MongooseUserRepository implements UserRepository {
  async findById(id: string): Promise<User | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    
    // Only return user if they are not soft-deleted
    const user = await UserModel.findOne({ _id: id, deletedAt: null });
    return user ? mapUser(user) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await UserModel.findOne({ email: email.toLowerCase(), deletedAt: null });
    return user ? mapUser(user) : null;
  }

  async findByVerificationToken(token: string): Promise<User | null> {
    const tokenDoc = await EmailVerificationTokenModel.findOne({
      token,
      expiresAt: { $gt: new Date() },
    });
    if (!tokenDoc) return null;

    const user = await UserModel.findOne({ _id: tokenDoc.userId, deletedAt: null });
    return user ? mapUser(user) : null;
  }

  async findByResetToken(token: string): Promise<User | null> {
    const tokenDoc = await PasswordResetTokenModel.findOne({
      token,
      expiresAt: { $gt: new Date() },
    });
    if (!tokenDoc) return null;

    const user = await UserModel.findOne({ _id: tokenDoc.userId, deletedAt: null });
    return user ? mapUser(user) : null;
  }

  async create(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const {
      verificationToken,
      verificationTokenExpires,
      passwordResetToken,
      passwordResetExpires,
      ...coreUserData
    } = userData;

    // Create the core user document
    const user = new UserModel({
      ...coreUserData,
      deletedAt: null,
    });
    await user.save();

    // If verification token is provided, store in separate collection
    if (verificationToken && verificationTokenExpires) {
      await EmailVerificationTokenModel.create({
        userId: user._id,
        token: verificationToken,
        expiresAt: verificationTokenExpires,
      });
    }

    // If password reset token is provided, store in separate collection
    if (passwordResetToken && passwordResetExpires) {
      await PasswordResetTokenModel.create({
        userId: user._id,
        token: passwordResetToken,
        expiresAt: passwordResetExpires,
      });
    }

    return mapUser(user);
  }

  async update(
    id: string,
    updates: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<User | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;

    const {
      verificationToken,
      verificationTokenExpires,
      passwordResetToken,
      passwordResetExpires,
      ...coreUpdates
    } = updates;

    // Perform verification token update
    if (verificationToken !== undefined || verificationTokenExpires !== undefined) {
      if (!verificationToken || !verificationTokenExpires) {
        // Clear/delete the token
        await EmailVerificationTokenModel.deleteMany({ userId: id });
      } else {
        // Update/upsert the token
        await EmailVerificationTokenModel.findOneAndUpdate(
          { userId: id },
          { token: verificationToken, expiresAt: verificationTokenExpires },
          { upsert: true, new: true }
        );
      }
    }

    // Perform password reset token update
    if (passwordResetToken !== undefined || passwordResetExpires !== undefined) {
      if (!passwordResetToken || !passwordResetExpires) {
        // Clear/delete the token
        await PasswordResetTokenModel.deleteMany({ userId: id });
      } else {
        // Update/upsert the token
        await PasswordResetTokenModel.findOneAndUpdate(
          { userId: id },
          { token: passwordResetToken, expiresAt: passwordResetExpires },
          { upsert: true, new: true }
        );
      }
    }

    // Update core fields on user document
    const user = await UserModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: coreUpdates },
      { new: true }
    );

    return user ? mapUser(user) : null;
  }

  async findAll(): Promise<User[]> {
    // Only return users who are not soft-deleted
    const users = await UserModel.find({ deletedAt: null });
    return Promise.all(users.map(mapUser));
  }

  async hardDelete(id: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(id)) return false;
    await EmailVerificationTokenModel.deleteMany({ userId: id });
    await PasswordResetTokenModel.deleteMany({ userId: id });
    const res = await UserModel.deleteOne({ _id: id });
    return res.deletedCount > 0;
  }
}

export const userRepository = new MongooseUserRepository();
