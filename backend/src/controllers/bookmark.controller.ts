import { Request, Response, NextFunction } from 'express';
import { bookmarkService } from '../services/bookmark.service';
import { formatResponse } from '../utils/response';
import { UnauthorizedError } from '../utils/errors';

export async function saveJob(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    const success = await bookmarkService.saveJob(req.user.id, req.params.jobId as string);
    const message = success ? 'Job posting saved successfully' : 'Job posting was already saved';
    res.status(200).json(formatResponse(true, { saved: true }, message));
  } catch (error) {
    next(error);
  }
}

export async function unsaveJob(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    const success = await bookmarkService.unsaveJob(req.user.id, req.params.jobId as string);
    const message = success ? 'Job posting unsaved successfully' : 'Job posting was not saved';
    res.status(200).json(formatResponse(true, { saved: false }, message));
  } catch (error) {
    next(error);
  }
}

export async function getSavedJobs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    const savedJobs = await bookmarkService.getSavedJobs(req.user.id);
    res.status(200).json(formatResponse(true, savedJobs, 'Saved job postings retrieved successfully'));
  } catch (error) {
    next(error);
  }
}
