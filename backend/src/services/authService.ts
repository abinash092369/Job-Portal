import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { UserRepository } from '../repositories/userRepository';
import { ProfileRepository } from '../repositories/profileRepository';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { sendVerificationEmail, sendResetPasswordEmail } from '../utils/email';
import { UserRole, AuthUser } from '../types';

export class AuthService {
  private userRepo: UserRepository;
  private profileRepo: ProfileRepository;

  constructor() {
    this.userRepo = new UserRepository();
    this.profileRepo = new ProfileRepository();
  }

  private formatUserResponse(user: any): AuthUser {
    return {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      isSuspended: user.isSuspended,
    };
  }

  async register(email: string, password: string, role: UserRole) {
    const existingUser = await this.userRepo.findByEmail(email);
    if (existingUser) {
      throw new Error('Email is already registered');
    }

    // Hash password with 12 rounds of bcrypt
    const passwordHash = await bcrypt.hash(password, 12);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const user = await this.userRepo.createUser({
      email,
      passwordHash,
      role,
      isVerified: false,
      isSuspended: false,
      verificationToken,
    });

    // Create initial empty profile based on user role
    if (role === 'candidate') {
      await this.profileRepo.createCandidateProfile({
        userId: user._id,
        name: email.split('@')[0],
        skills: [],
        experience: [],
        education: [],
      });
    } else if (role === 'employer') {
      await this.profileRepo.createEmployerProfile({
        userId: user._id,
        companyName: email.split('@')[0] + ' Company',
        isVerified: false,
      });
    }

    // Send verification email
    await sendVerificationEmail(email, verificationToken);

    return this.formatUserResponse(user);
  }

  async verifyEmail(token: string) {
    const user = await this.userRepo.findByVerificationToken(token);
    if (!user) {
      throw new Error('Invalid or expired email verification token');
    }

    await this.userRepo.updateUser(user._id.toString(), {
      isVerified: true,
      verificationToken: null,
    });

    return true;
  }

  async resendVerification(email: string) {
    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.isVerified) {
      throw new Error('Email is already verified');
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    await this.userRepo.updateUser(user._id.toString(), { verificationToken });

    await sendVerificationEmail(email, verificationToken);
    return true;
  }

  async login(email: string, password: string) {
    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (user.isSuspended) {
      throw new Error('Account suspended. Please contact support.');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    const formattedUser = this.formatUserResponse(user);
    const accessToken = generateAccessToken(formattedUser);
    const refreshToken = generateRefreshToken(formattedUser);

    // Hash refresh token before saving to database
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.userRepo.updateUser(user._id.toString(), { refreshTokenHash });

    return {
      user: formattedUser,
      accessToken,
      refreshToken,
    };
  }

  async logout(userId: string) {
    await this.userRepo.updateUser(userId, { refreshTokenHash: null });
    return true;
  }

  async refreshToken(token: string) {
    const payload = verifyRefreshToken(token);
    if (!payload) {
      throw new Error('Invalid or expired refresh token');
    }

    const user = await this.userRepo.findById(payload.id);
    if (!user || !user.refreshTokenHash || user.isSuspended) {
      throw new Error('Invalid refresh session');
    }

    const formattedUser = this.formatUserResponse(user);
    const newAccessToken = generateAccessToken(formattedUser);
    const newRefreshToken = generateRefreshToken(formattedUser);

    const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, 10);
    await this.userRepo.updateUser(user._id.toString(), { refreshTokenHash: newRefreshTokenHash });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async forgotPassword(email: string) {
    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      // Don't leak user existence
      return true;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    await this.userRepo.updateUser(user._id.toString(), {
      resetPasswordToken: resetToken,
      resetPasswordExpires: resetExpires,
    });

    await sendResetPasswordEmail(email, resetToken);
    return true;
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.userRepo.findByResetPasswordToken(token);
    if (!user) {
      throw new Error('Invalid or expired password reset token');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.userRepo.updateUser(user._id.toString(), {
      passwordHash,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    });

    return true;
  }

  async getMe(userId: string) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return this.formatUserResponse(user);
  }
}
