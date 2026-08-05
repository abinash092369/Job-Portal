import { Response } from 'express';
import { ProfileService } from '../services/profileService';
import { sendSuccess, sendError } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthenticatedRequest } from '../types';
import { processUploadedFile } from '../middlewares/upload';

const profileService = new ProfileService();

export const getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return sendError(res, 'Unauthenticated', 401);
  const profile = await profileService.getProfile(req.user.id, req.user.role);
  return sendSuccess(res, profile);
});

export const updateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return sendError(res, 'Unauthenticated', 401);
  const updated = await profileService.updateProfile(req.user.id, req.user.role, req.body);
  return sendSuccess(res, updated, 'Profile updated successfully');
});

export const uploadPhoto = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.file) {
    return sendError(res, 'No photo file uploaded', 400);
  }
  const absoluteUrl = await processUploadedFile(req.file, 'profile_photos');

  if (req.user) {
    await profileService.updateProfile(req.user.id, req.user.role, { profilePhotoUrl: absoluteUrl });
  }

  return sendSuccess(res, { profilePhotoUrl: absoluteUrl }, 'Photo uploaded successfully');
});

export const uploadResume = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.file) {
    return sendError(res, 'No resume file uploaded', 400);
  }
  const absoluteUrl = await processUploadedFile(req.file, 'resumes');

  if (req.user && req.user.role === 'candidate') {
    await profileService.updateProfile(req.user.id, req.user.role, { resumeUrl: absoluteUrl });
  }

  return sendSuccess(res, { resumeUrl: absoluteUrl }, 'Resume uploaded successfully');
});

export const uploadLogo = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.file) {
    return sendError(res, 'No logo file uploaded', 400);
  }
  const absoluteUrl = await processUploadedFile(req.file, 'company_logos');

  if (req.user && req.user.role === 'employer') {
    await profileService.updateProfile(req.user.id, req.user.role, { logoUrl: absoluteUrl });
  }

  return sendSuccess(res, { logoUrl: absoluteUrl }, 'Logo uploaded successfully');
});

export const getPublicEmployerProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { userId } = req.params;
  if (!userId) return sendError(res, 'User ID is required', 400);

  const profile = await profileService.getPublicEmployerProfile(userId);
  return sendSuccess(res, profile);
});
