import { Response } from 'express';
import { DashboardService } from '../services/dashboardService';
import { sendSuccess, sendError } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthenticatedRequest } from '../types';

const dashboardService = new DashboardService();

export const getEmployerDashboard = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return sendError(res, 'Unauthenticated', 401);
  const data = await dashboardService.getEmployerDashboard(req.user.id);
  return sendSuccess(res, data);
});

export const getCandidateDashboard = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return sendError(res, 'Unauthenticated', 401);
  const data = await dashboardService.getCandidateDashboard(req.user.id);
  return sendSuccess(res, data);
});
