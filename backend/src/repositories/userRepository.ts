import { User, IUser } from '../models/User';

export class UserRepository {
  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email: email.toLowerCase(), deletedAt: null });
  }

  async findById(id: string): Promise<IUser | null> {
    return User.findOne({ _id: id, deletedAt: null });
  }

  async findByVerificationToken(token: string): Promise<IUser | null> {
    return User.findOne({ verificationToken: token, deletedAt: null });
  }

  async findByResetPasswordToken(token: string): Promise<IUser | null> {
    return User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
      deletedAt: null,
    });
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
