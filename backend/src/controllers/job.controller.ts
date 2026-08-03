import { Request, Response, NextFunction } from 'express';
import { jobService } from '../services/job.service';
import { formatResponse } from '../utils/response';
import { UnauthorizedError } from '../utils/errors';

export async function getActiveJobs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await jobService.searchActiveJobs(req.query as any);
    res.status(200).json(formatResponse(true, result, 'Active job postings retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

export async function getMyJobs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    const jobs = await jobService.getJobsByEmployer(req.user.id);
    res.status(200).json(formatResponse(true, jobs, 'Your job postings retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

export async function getJobById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const job = await jobService.getJobById(req.params.id as string, true);
    res.status(200).json(formatResponse(true, job, 'Job posting retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

export async function createJob(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    const newJob = await jobService.createJob(req.user.id, req.body);
    res.status(201).json(formatResponse(true, newJob, 'Job posting created successfully'));
  } catch (error) {
    next(error);
  }
}

export async function updateJob(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    const updatedJob = await jobService.updateJob(req.params.id as string, req.user.id, req.body);
    res.status(200).json(formatResponse(true, updatedJob, 'Job posting updated successfully'));
  } catch (error) {
    next(error);
  }
}

export async function deleteJob(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    await jobService.deleteJob(req.params.id as string, req.user.id);
    res.status(200).json(formatResponse(true, null, 'Job posting deleted successfully'));
  } catch (error) {
    next(error);
  }
}

export async function publishJob(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    const publishedJob = await jobService.publishJob(req.params.id as string, req.user.id);
    res.status(200).json(formatResponse(true, publishedJob, 'Job posting published successfully'));
  } catch (error) {
    next(error);
  }
}

export async function unpublishJob(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    const draftJob = await jobService.unpublishJob(req.params.id as string, req.user.id);
    res.status(200).json(formatResponse(true, draftJob, 'Job posting unpublished successfully'));
  } catch (error) {
    next(error);
  }
}

export async function runAutoExpire(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const count = await jobService.expirePastDeadlineJobs();
    res.status(200).json(formatResponse(true, { expiredCount: count }, 'Job auto-expiration check completed'));
  } catch (error) {
    next(error);
  }
}
