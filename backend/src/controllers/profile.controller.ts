import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { profileRepository } from '../repositories/in-memory/profile.repository.impl';
import { formatResponse } from '../utils/response';
import { BadRequestError, UnauthorizedError, ForbiddenError } from '../utils/errors';
import { logger } from '../utils/logger';

function deleteOldFile(fileUrl?: string) {
  if (!fileUrl) return;
  // If the file path is a relative path starting with /uploads
  if (fileUrl.startsWith('/uploads/')) {
    const diskPath = fileUrl.substring(1); // Remove leading '/'
    const absolutePath = path.resolve(diskPath);
    if (fs.existsSync(absolutePath)) {
      fs.unlink(absolutePath, (err) => {
        if (err) {
          logger.error(`Failed to delete old file at ${absolutePath}: ${err.stack || err.message}`);
        } else {
          logger.info(`Successfully deleted old file at ${absolutePath}`);
        }
      });
    }
  }
}

export async function getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const { id: userId, role } = req.user;

    if (role === 'candidate') {
      const profile = await profileRepository.getCandidateProfile(userId);
      res.status(200).json(formatResponse(true, profile, 'Candidate profile retrieved successfully'));
    } else if (role === 'employer') {
      const profile = await profileRepository.getEmployerProfile(userId);
      res.status(200).json(formatResponse(true, profile, 'Employer profile retrieved successfully'));
    } else {
      throw new ForbiddenError('User role does not have a profile');
    }
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const { id: userId, role } = req.user;

    if (role === 'candidate') {
      const updatedProfile = await profileRepository.updateCandidateProfile(userId, req.body);
      res.status(200).json(formatResponse(true, updatedProfile, 'Candidate profile updated successfully'));
    } else if (role === 'employer') {
      // Prevent updating verified badge via public endpoint
      const { isVerified, ...updates } = req.body;
      const updatedProfile = await profileRepository.updateEmployerProfile(userId, updates);
      res.status(200).json(formatResponse(true, updatedProfile, 'Employer profile updated successfully'));
    } else {
      throw new ForbiddenError('User role does not have a profile to update');
    }
  } catch (error) {
    next(error);
  }
}

export async function uploadResume(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    if (!req.file) {
      throw new BadRequestError('No resume file provided');
    }

    const userId = req.user.id;
    const profile = await profileRepository.getCandidateProfile(userId);
    if (!profile) {
      // Clean up uploaded file since profile wasn't found (unlikely to happen)
      fs.unlink(req.file.path, () => {});
      throw new BadRequestError('Candidate profile not found');
    }

    // Delete old resume file
    deleteOldFile(profile.resumeUrl);

    // Save URL path (use directly if Cloudinary URL)
    const relativeUrl = req.file.filename.startsWith('http://') || req.file.filename.startsWith('https://')
      ? req.file.filename
      : `/uploads/resumes/${req.file.filename}`;
    const updatedProfile = await profileRepository.updateCandidateProfile(userId, {
      resumeUrl: relativeUrl,
    });

    res.status(200).json(formatResponse(true, updatedProfile, 'Resume uploaded successfully'));
  } catch (error) {
    next(error);
  }
}

export async function uploadPhoto(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    if (!req.file) {
      throw new BadRequestError('No photo file provided');
    }

    const userId = req.user.id;
    const profile = await profileRepository.getCandidateProfile(userId);
    if (!profile) {
      fs.unlink(req.file.path, () => {});
      throw new BadRequestError('Candidate profile not found');
    }

    // Delete old profile photo
    deleteOldFile(profile.profilePhotoUrl);

    const relativeUrl = req.file.filename.startsWith('http://') || req.file.filename.startsWith('https://')
      ? req.file.filename
      : `/uploads/photos/${req.file.filename}`;
    const updatedProfile = await profileRepository.updateCandidateProfile(userId, {
      profilePhotoUrl: relativeUrl,
    });

    res.status(200).json(formatResponse(true, updatedProfile, 'Profile photo uploaded successfully'));
  } catch (error) {
    next(error);
  }
}

export async function uploadLogo(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    if (!req.file) {
      throw new BadRequestError('No logo file provided');
    }

    const userId = req.user.id;
    const profile = await profileRepository.getEmployerProfile(userId);
    if (!profile) {
      fs.unlink(req.file.path, () => {});
      throw new BadRequestError('Employer profile not found');
    }

    // Delete old logo file
    deleteOldFile(profile.logoUrl);

    const relativeUrl = req.file.filename.startsWith('http://') || req.file.filename.startsWith('https://')
      ? req.file.filename
      : `/uploads/logos/${req.file.filename}`;
    const updatedProfile = await profileRepository.updateEmployerProfile(userId, {
      logoUrl: relativeUrl,
    });


    res.status(200).json(formatResponse(true, updatedProfile, 'Company logo uploaded successfully'));
  } catch (error) {
    next(error);
  }
}

export async function getPublicEmployerProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.params.userId as string;
    const profile = await profileRepository.getEmployerProfile(userId);
    if (!profile) {
      throw new BadRequestError('Employer profile not found');
    }
    res.status(200).json(formatResponse(true, profile, 'Employer profile retrieved successfully'));
  } catch (error) {
    next(error);
  }
}
