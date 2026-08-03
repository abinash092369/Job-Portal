import { Request, Response, NextFunction } from 'express';
import { notificationService } from '../services/notification.service';
import { formatResponse } from '../utils/response';
import { UnauthorizedError } from '../utils/errors';

export async function getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    const notifications = await notificationService.getUserNotifications(req.user.id);
    res.status(200).json(formatResponse(true, notifications, 'Notifications retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

export async function markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    const updated = await notificationService.markAsRead(req.params.id as string, req.user.id);
    res.status(200).json(formatResponse(true, updated, 'Notification marked as read successfully'));
  } catch (error) {
    next(error);
  }
}

export async function markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    await notificationService.markAllAsRead(req.user.id);
    res.status(200).json(formatResponse(true, null, 'All notifications marked as read successfully'));
  } catch (error) {
    next(error);
  }
}
