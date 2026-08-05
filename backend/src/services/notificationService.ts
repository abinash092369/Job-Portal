import { NotificationRepository } from '../repositories/notificationRepository';
import { NotificationType } from '../types';

export class NotificationService {
  private notificationRepo: NotificationRepository;

  constructor() {
    this.notificationRepo = new NotificationRepository();
  }

  async getUserNotifications(userId: string) {
    const rawNotifications = await this.notificationRepo.getUserNotifications(userId);
    return rawNotifications.map((n) => ({
      id: n._id.toString(),
      userId: n.userId.toString(),
      type: n.type,
      title: n.title,
      message: n.message,
      isRead: n.isRead,
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
    }));
  }

  async markAsRead(id: string, userId: string) {
    const updated = await this.notificationRepo.markAsRead(id, userId);
    if (!updated) {
      throw new Error('Notification not found');
    }
    return {
      id: updated._id.toString(),
      userId: updated.userId.toString(),
      type: updated.type,
      title: updated.title,
      message: updated.message,
      isRead: updated.isRead,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  async markAllAsRead(userId: string) {
    const count = await this.notificationRepo.markAllAsRead(userId);
    return { updatedCount: count };
  }

  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string
  ) {
    return this.notificationRepo.createNotification({
      userId: userId as any,
      type,
      title,
      message,
      isRead: false,
    });
  }
}
