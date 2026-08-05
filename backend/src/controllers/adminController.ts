import { Response } from 'express';
import { AdminService } from '../services/adminService';
import { sendSuccess, sendError } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthenticatedRequest } from '../types';

const adminService = new AdminService();

export const getAllUsers = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
  const users = await adminService.getAllUsers();
  return sendSuccess(res, users);
});

export const suspendUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { isSuspended } = req.body;
  const user = await adminService.suspendUser(id, isSuspended);
  return sendSuccess(res, user, `User suspension status set to ${isSuspended}`);
});

export const verifyEmployer = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { isVerified } = req.body;
  const profile = await adminService.verifyEmployer(id, isVerified);
  return sendSuccess(res, profile, `Employer verification status set to ${isVerified}`);
});

export const getAllJobs = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
  const jobs = await adminService.getAllJobs();
  return sendSuccess(res, jobs);
});

export const updateJobStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const job = await adminService.updateJobStatus(id, status);
  return sendSuccess(res, job, 'Job status updated successfully');
});

export const deleteJob = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  await adminService.deleteJob(id);
  return sendSuccess(res, null, 'Job deleted successfully by admin');
});

export const getAdminStats = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
  const stats = await adminService.getAdminStats();
  return sendSuccess(res, stats);
});
