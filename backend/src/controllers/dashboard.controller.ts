import { Request, Response, NextFunction } from 'express';
import { dashboardService } from '../services/dashboard.service';
import { formatResponse } from '../utils/response';
import { UnauthorizedError } from '../utils/errors';

export async function getEmployerDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    const dashboard = await dashboardService.getEmployerDashboard(req.user.id);
    res.status(200).json(formatResponse(true, dashboard, 'Employer dashboard retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

export async function getCandidateDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    const dashboard = await dashboardService.getCandidateDashboard(req.user.id);
    res.status(200).json(formatResponse(true, dashboard, 'Candidate dashboard retrieved successfully'));
  } catch (error) {
    next(error);
  }
}
