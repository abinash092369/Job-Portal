import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { userRepository } from '../repositories/in-memory/user.repository.impl';
import { refreshTokenRepository } from '../repositories/in-memory/refresh-token.repository.impl';
import { emailService } from './email.service';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { BadRequestError, ConflictError, UnauthorizedError } from '../utils/errors';
import { User, TokenPayload } from '../types/auth';

class AuthService {
  private saltRounds = 12;

  async register(registerInput: { email: string; passwordPlain: string; role: 'employer' | 'candidate' }): Promise<Omit<User, 'passwordHash'>> {
    const existing = await userRepository.findByEmail(registerInput.email);
    if (existing) {
      throw new ConflictError('Email is already registered');
    }

    const hashedPassword = await bcrypt.hash(registerInput.passwordPlain, this.saltRounds);
    
    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const newUser = await userRepository.create({
      email: registerInput.email,
      passwordHash: hashedPassword,
      role: registerInput.role,
      isVerified: false,
      verificationToken,
      verificationTokenExpires,
    });

    // Send verification email asynchronously so registration doesn't wait
    emailService.sendVerificationEmail(newUser.email, verificationToken).catch((err) => {
      // Log failure but do not crash registration
      console.error(`Failed to send verification email to ${newUser.email}:`, err);
    });

    const { passwordHash, ...userResponse } = newUser;
    return userResponse;
  }

  async verifyEmail(token: string): Promise<void> {
    const user = await userRepository.findByVerificationToken(token);
    if (!user) {
      throw new BadRequestError('Invalid or expired email verification token');
    }

    await userRepository.update(user.id, {
      isVerified: true,
      verificationToken: undefined,
      verificationTokenExpires: undefined,
    });
  }

  async login(email: string, passwordPlain: string): Promise<{ user: Omit<User, 'passwordHash'>; accessToken: string; refreshToken: string }> {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(passwordPlain, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.isVerified) {
      throw new BadRequestError('Please verify your email address before logging in');
    }

    if (user.isSuspended) {
      throw new UnauthorizedError('Your account has been suspended by the administrator');
    }

    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = signAccessToken(payload);
    const refreshTokenString = signRefreshToken(payload);

    // Save refresh token
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await refreshTokenRepository.create({
      userId: user.id,
      token: refreshTokenString,
      expiresAt,
    });

    const { passwordHash, ...userResponse } = user;
    return {
      user: userResponse,
      accessToken,
      refreshToken: refreshTokenString,
    };
  }

  async refresh(token: string): Promise<{ accessToken: string; refreshToken: string }> {
    const savedToken = await refreshTokenRepository.findByToken(token);
    if (!savedToken) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    if (savedToken.expiresAt < new Date()) {
      await refreshTokenRepository.delete(token);
      throw new UnauthorizedError('Expired refresh token');
    }

    let decoded: TokenPayload;
    try {
      decoded = verifyRefreshToken(token);
    } catch (err) {
      await refreshTokenRepository.delete(token);
      throw new UnauthorizedError('Invalid refresh token signature');
    }

    const user = await userRepository.findById(decoded.userId);
    if (!user) {
      await refreshTokenRepository.delete(token);
      throw new UnauthorizedError('User not found');
    }

    // Refresh Token Rotation: delete old token, generate new tokens
    await refreshTokenRepository.delete(token);

    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = signAccessToken(payload);
    const newRefreshToken = signRefreshToken(payload);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await refreshTokenRepository.create({
      userId: user.id,
      token: newRefreshToken,
      expiresAt,
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(token: string): Promise<void> {
    await refreshTokenRepository.delete(token);
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      // Silent success for security: prevent user/email enumeration
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await userRepository.update(user.id, {
      passwordResetToken: resetToken,
      passwordResetExpires: resetTokenExpires,
    });

    // Send reset email asynchronously
    emailService.sendPasswordResetEmail(user.email, resetToken).catch((err) => {
      console.error(`Failed to send password reset email to ${user.email}:`, err);
    });
  }

  async resetPassword(token: string, passwordPlain: string): Promise<void> {
    const user = await userRepository.findByResetToken(token);
    if (!user) {
      throw new BadRequestError('Invalid or expired password reset token');
    }

    const hashedPassword = await bcrypt.hash(passwordPlain, this.saltRounds);

    await userRepository.update(user.id, {
      passwordHash: hashedPassword,
      passwordResetToken: undefined,
      passwordResetExpires: undefined,
    });
  }
}

export const authService = new AuthService();
