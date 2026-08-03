import { notificationRepository } from '../repositories/in-memory/notification.repository.impl';
import { Notification, NotificationType } from '../types/notification';
import { NotFoundError, ForbiddenError } from '../utils/errors';

class NotificationService {
  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string
  ): Promise<Notification> {
    return notificationRepository.create({
      userId,
      type,
      title,
      message,
    });
  }

  async getUserNotifications(userId: string): Promise<Notification[]> {
    const notifications = await notificationRepository.findByUser(userId);
    // Sort by newest first
    return notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await notificationRepository.findById(id);
    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenError('You do not have permission to modify this notification');
    }

    const updated = await notificationRepository.markAsRead(id);
    if (!updated) {
      throw new NotFoundError('Notification not found');
    }

    return updated;
  }

  async markAllAsRead(userId: string): Promise<void> {
    await notificationRepository.markAllAsRead(userId);
  }
}

export const notificationService = new NotificationService();
