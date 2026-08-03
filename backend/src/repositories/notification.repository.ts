import { Notification } from '../types/notification';

export interface NotificationRepository {
  findById(id: string): Promise<Notification | null>;
  findByUser(userId: string): Promise<Notification[]>;
  create(notificationData: Omit<Notification, 'id' | 'isRead' | 'createdAt' | 'updatedAt'>): Promise<Notification>;
  markAsRead(id: string): Promise<Notification | null>;
  markAllAsRead(userId: string): Promise<void>;
}
