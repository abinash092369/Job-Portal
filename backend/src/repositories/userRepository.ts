import { User, IUser } from '../models/User';

export class UserRepository {
  async findByFirebaseUid(firebaseUid: string): Promise<IUser | null> {
    return User.findOne({ firebaseUid, deletedAt: null });
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email: email.toLowerCase(), deletedAt: null });
  }

  async findById(id: string): Promise<IUser | null> {
    return User.findOne({ _id: id, deletedAt: null });
  }

  async findByGoogleId(googleId: string): Promise<IUser | null> {
    return User.findOne({ googleId, deletedAt: null });
  }

  async findByPhone(phone: string): Promise<IUser | null> {
    return User.findOne({ phone, deletedAt: null });
  }

  async createUser(data: Partial<IUser>): Promise<IUser> {
    const user = new User(data);
    return user.save();
  }

  async updateUser(id: string, data: Partial<IUser>): Promise<IUser | null> {
    return User.findOneAndUpdate({ _id: id, deletedAt: null }, data, { new: true });
  }

  async softDeleteUser(id: string): Promise<IUser | null> {
    return User.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { deletedAt: new Date() },
      { new: true }
    );
  }
}
