import crypto from 'crypto';
import { UserRepository } from '../repositories/userRepository';
import { ProfileRepository } from '../repositories/profileRepository';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { verifyFirebaseToken } from '../config/firebase-admin';
import { UserRole, AuthUser, AuthProvider } from '../types';

export class AuthService {
  private userRepo: UserRepository;
  private profileRepo: ProfileRepository;

  constructor() {
    this.userRepo = new UserRepository();
    this.profileRepo = new ProfileRepository();
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private formatUserResponse(user: any): AuthUser {
    return {
      id: user._id.toString(),
      firebaseUid: user.firebaseUid || undefined,
      name: user.name || '',
      email: user.email || undefined,
      phone: user.phone || undefined,
      googleId: user.googleId || undefined,
      avatar: user.avatar || '',
      role: user.role,
      provider: user.provider,
      isSuspended: user.isSuspended,
      createdAt: user.createdAt?.toISOString?.() || user.createdAt,
      updatedAt: user.updatedAt?.toISOString?.() || user.updatedAt,
    };
  }

  async firebaseAuth(
    idToken: string,
    requestedRole?: UserRole,
    requestedName?: string,
    requestedEmail?: string
  ) {
    const decodedToken = await verifyFirebaseToken(idToken, requestedEmail);
    const { uid, email, phoneNumber, displayName, photoURL, provider: rawProvider } = decodedToken;

    // Determine clean AuthProvider enum
    let provider: AuthProvider = 'PASSWORD';
    if (rawProvider?.includes('google')) {
      provider = 'GOOGLE';
    } else if (rawProvider?.includes('phone') || phoneNumber) {
      provider = 'PHONE';
    }

    // 1. Search for user by firebaseUid
    let user = await this.userRepo.findByFirebaseUid(uid);

    // 2. Fallback search by email
    if (!user && email) {
      user = await this.userRepo.findByEmail(email);
    }

    // 3. Fallback search by phone
    if (!user && phoneNumber) {
      user = await this.userRepo.findByPhone(phoneNumber);
    }

    if (user) {
      if (user.isSuspended) {
        throw new Error('Account suspended. Please contact support.');
      }

      // Link firebaseUid / avatar / name if missing
      const updates: any = {};
      if (!user.firebaseUid) updates.firebaseUid = uid;
      if (!user.avatar && photoURL) updates.avatar = photoURL;
      if (!user.name && (displayName || requestedName)) {
        updates.name = displayName || requestedName;
      }

      if (Object.keys(updates).length > 0) {
        user = (await this.userRepo.updateUser(user._id.toString(), updates)) || user;
      }
    } else {
      // Create new MongoDB user account automatically
      const role: UserRole = requestedRole === 'employer' ? 'employer' : 'candidate';
      const name =
        displayName ||
        requestedName ||
        (email ? email.split('@')[0] : phoneNumber ? `User ${phoneNumber.slice(-4)}` : 'User');

      user = await this.userRepo.createUser({
        firebaseUid: uid,
        name,
        email: email || undefined,
        phone: phoneNumber || undefined,
        avatar: photoURL || '',
        role,
        provider,
        isSuspended: false,
      });

      // Create initial candidate or employer profile
      if (role === 'candidate') {
        await this.profileRepo.createCandidateProfile({
          userId: user._id,
          name,
          skills: [],
          experience: [],
          education: [],
        });
      } else if (role === 'employer') {
        await this.profileRepo.createEmployerProfile({
          userId: user._id,
          companyName: name + ' Company',
          isVerified: false,
        });
      }
    }

    const formattedUser = this.formatUserResponse(user);
    const accessToken = generateAccessToken(formattedUser);
    const refreshToken = generateRefreshToken(formattedUser);

    const refreshTokenHash = this.hashToken(refreshToken);
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

    const incomingHash = this.hashToken(token);
    if (user.refreshTokenHash !== incomingHash) {
      throw new Error('Invalid refresh token');
    }

    const formattedUser = this.formatUserResponse(user);
    const newAccessToken = generateAccessToken(formattedUser);
    const newRefreshToken = generateRefreshToken(formattedUser);

    const newRefreshTokenHash = this.hashToken(newRefreshToken);
    await this.userRepo.updateUser(user._id.toString(), { refreshTokenHash: newRefreshTokenHash });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async getMe(userId: string) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return this.formatUserResponse(user);
  }
}
