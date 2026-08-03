import { Notification } from '../../types/notification';
import { NotificationRepository } from '../notification.repository';
import { NotificationModel, INotificationDocument } from '../../models/notification.model';
import mongoose from 'mongoose';

function mapNotification(doc: INotificationDocument): Notification {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    type: doc.type,
    title: doc.title,
    message: doc.message,
    isRead: doc.isRead,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export class MongooseNotificationRepository implements NotificationRepository {
  async findById(id: string): Promise<Notification | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const notif = await NotificationModel.findById(id);
    return notif ? mapNotification(notif) : null;
  }

  async findByUser(userId: string): Promise<Notification[]> {
    if (!mongoose.Types.ObjectId.isValid(userId)) return [];
    const notifs = await NotificationModel.find({ userId }).sort({ createdAt: -1 });
    return notifs.map(mapNotification);
  }

  async create(
    notificationData: Omit<Notification, 'id' | 'isRead' | 'createdAt' | 'updatedAt'>
  ): Promise<Notification> {
    const notif = new NotificationModel({
      ...notificationData,
      isRead: false,
    });
    await notif.save();
    return mapNotification(notif);
  }

  async markAsRead(id: string): Promise<Notification | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const notif = await NotificationModel.findByIdAndUpdate(
      id,
      { $set: { isRead: true } },
      { new: true }
    );
    return notif ? mapNotification(notif) : null;
  }

  async markAllAsRead(userId: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(userId)) return;
    await NotificationModel.updateMany(
      { userId, isRead: false },
      { $set: { isRead: true } }
    );
  }
}

export const notificationRepository = new MongooseNotificationRepository();
