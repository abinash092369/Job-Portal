import { Response } from 'express';
import { ApplicationService } from '../services/applicationService';
import { sendSuccess, sendError } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthenticatedRequest } from '../types';

const applicationService = new ApplicationService();

export const updateStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return sendError(res, 'Unauthenticated', 401);
  const { appId } = req.params;
  const { status } = req.body;

  const result = await applicationService.updateStatus(appId, req.user.id, status);
  return sendSuccess(res, result, 'Application status updated successfully');
});

export const addNote = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return sendError(res, 'Unauthenticated', 401);
  const { appId } = req.params;
  const { note } = req.body;

  const result = await applicationService.addNote(appId, req.user.id, note);
  return sendSuccess(res, result, 'Note added successfully');
});
