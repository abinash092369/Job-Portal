import { Request, Response, NextFunction } from 'express';
import { adminService } from '../services/admin.service';
import { formatResponse } from '../utils/response';
import { UnauthorizedError } from '../utils/errors';

export async function getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    const users = await adminService.getUsers();
    res.status(200).json(formatResponse(true, users, 'Users retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

export async function suspendUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    const { isSuspended } = req.body;
    const updatedUser = await adminService.setSuspension(req.params.id as string, isSuspended);
    const action = isSuspended ? 'suspended' : 'unsuspended';
    res.status(200).json(formatResponse(true, updatedUser, `User successfully ${action}`));
  } catch (error) {
    next(error);
  }
}

export async function verifyEmployer(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    const { isVerified } = req.body;
    await adminService.setEmployerVerification(req.params.id as string, isVerified);
    const action = isVerified ? 'verified' : 'unverified';
    res.status(200).json(formatResponse(true, null, `Employer status successfully updated to ${action}`));
  } catch (error) {
    next(error);
  }
}

export async function moderateJob(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    const { status } = req.body;
    const updatedJob = await adminService.setJobStatus(req.params.id as string, status);
    res.status(200).json(formatResponse(true, updatedJob, 'Job posting status successfully moderated'));
  } catch (error) {
    next(error);
  }
}

export async function deleteJob(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    await adminService.deleteJob(req.params.id as string);
    res.status(200).json(formatResponse(true, null, 'Job posting successfully deleted by admin'));
  } catch (error) {
    next(error);
  }
}

export async function getJobs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    const jobs = await adminService.getJobs();
    res.status(200).json(formatResponse(true, jobs, 'Jobs retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

export async function getPlatformStats(req: Request, res: Response, next: NextFunction): Promise<void> {

  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    const stats = await adminService.getPlatformStats();
    res.status(200).json(formatResponse(true, stats, 'Platform statistics aggregated successfully'));
  } catch (error) {
    next(error);
  }
}
