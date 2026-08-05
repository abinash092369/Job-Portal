import { Response } from 'express';
import { NotificationService } from '../services/notificationService';
import { sendSuccess, sendError } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthenticatedRequest } from '../types';

const notificationService = new NotificationService();

export const getNotifications = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return sendError(res, 'Unauthenticated', 401);
  const notifications = await notificationService.getUserNotifications(req.user.id);
  return sendSuccess(res, notifications);
});

export const markAsRead = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return sendError(res, 'Unauthenticated', 401);
  const { id } = req.params;
  const notification = await notificationService.markAsRead(id, req.user.id);
  return sendSuccess(res, notification, 'Notification marked as read');
});

export const markAllAsRead = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return sendError(res, 'Unauthenticated', 401);
  const result = await notificationService.markAllAsRead(req.user.id);
  return sendSuccess(res, result, 'All notifications marked as read');
});
