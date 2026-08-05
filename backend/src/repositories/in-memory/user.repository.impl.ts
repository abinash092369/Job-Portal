import { User } from '../../types/auth';
import { UserRepository } from '../user.repository';
import { 
  UserModel, 
  IUserDocument 
} from '../../models/user.model';
import mongoose from 'mongoose';

/**
 * Maps a Mongoose User document to the clean User domain object.
 */
function mapUser(doc: IUserDocument): User {
  return {
    id: doc._id.toString(),
    email: doc.email,
    passwordHash: doc.passwordHash,
    role: doc.role,
    isSuspended: doc.isSuspended,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
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

  async create(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    // Create the core user document
    const user = new UserModel({
      ...userData,
      deletedAt: null,
    });
    await user.save();
    return mapUser(user);
  }

  async update(
    id: string,
    updates: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<User | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;

    // Update core fields on user document
    const user = await UserModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: updates },
      { new: true }
    );

    return user ? mapUser(user) : null;
  }

  async findAll(): Promise<User[]> {
    // Only return users who are not soft-deleted
    const users = await UserModel.find({ deletedAt: null });
    return users.map(mapUser);
  }

  async hardDelete(id: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(id)) return false;
    const res = await UserModel.deleteOne({ _id: id });
    return res.deletedCount > 0;
  }
}

export const userRepository = new MongooseUserRepository();
