import { Notification, INotification } from '../models/Notification';
import { Types } from 'mongoose';

export class NotificationRepository {
  async createNotification(data: Partial<INotification>): Promise<INotification> {
    const notification = new Notification(data);
    return notification.save();
  }

  async getUserNotifications(userId: string): Promise<INotification[]> {
    return Notification.find({ userId: new Types.ObjectId(userId) }).sort({
      createdAt: -1,
    });
  }

  async markAsRead(id: string, userId: string): Promise<INotification | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return Notification.findOneAndUpdate(
      { _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) },
      { isRead: true },
      { new: true }
    );
  }

  async markAllAsRead(userId: string): Promise<number> {
    const res = await Notification.updateMany(
      { userId: new Types.ObjectId(userId), isRead: false },
      { isRead: true }
    );
    return res.modifiedCount;
  }
}
