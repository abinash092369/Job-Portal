import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
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
      if (existing.isVerified) {
        throw new ConflictError('Email is already registered');
      }
      
      // If user exists but is unverified, re-hash password and issue a fresh verification token & expiry
      const hashedPassword = await bcrypt.hash(registerInput.passwordPlain, this.saltRounds);
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      const updatedUser = await userRepository.update(existing.id, {
        passwordHash: hashedPassword,
        role: registerInput.role,
        verificationToken,
        verificationTokenExpires,
      });

      if (!updatedUser) {
        throw new BadRequestError('Failed to update unverified user profile');
      }

      // Dispatch verification email - fails registration & rolls back if email delivery fails
      try {
        await emailService.sendVerificationEmail(updatedUser.email, verificationToken);
      } catch (err: any) {
        throw new Error(`Failed to send verification email: ${err.message || err}`);
      }

      const { passwordHash, ...userResponse } = updatedUser;
      return userResponse;
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

    // Dispatch verification email - rolls back newly created user if email delivery fails
    try {
      await emailService.sendVerificationEmail(newUser.email, verificationToken);
    } catch (err: any) {
      await userRepository.hardDelete(newUser.id);
      throw new Error(`Failed to send verification email. User registration was rolled back: ${err.message || err}`);
    }

    const { passwordHash, ...userResponse } = newUser;
    return userResponse;
  }

  async resendVerificationEmail(email: string): Promise<void> {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      // Prevent user enumeration by silently returning
      return;
    }

    if (user.isVerified) {
      throw new BadRequestError('Email address is already verified');
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await userRepository.update(user.id, {
      verificationToken,
      verificationTokenExpires,
    });

    await emailService.sendVerificationEmail(user.email, verificationToken);
  }

  async verifyEmail(token: string): Promise<string> {
    if (!token) {
      throw new BadRequestError('Verification token is required');
    }
    const cleanToken = token.trim();
    const user = await userRepository.findByVerificationToken(cleanToken);

    if (user) {
      if (!user.isVerified) {
        await userRepository.update(user.id, {
          isVerified: true,
          verificationToken: undefined,
          verificationTokenExpires: undefined,
        });
        return 'Email verified successfully! You can now log in.';
      }
      return 'Email already verified';
    }

    throw new BadRequestError('Invalid or expired email verification token');
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
