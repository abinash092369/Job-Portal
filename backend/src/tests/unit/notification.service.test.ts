import { notificationService } from '../../services/notification.service';
import { notificationRepository } from '../../repositories/in-memory/notification.repository.impl';
import { userRepository } from '../../repositories/in-memory/user.repository.impl';
import { NotFoundError, ForbiddenError } from '../../utils/errors';

describe('NotificationService', () => {
  let userId: string;
  let otherUserId: string;

  beforeEach(async () => {
    const user = await userRepository.create({
      email: 'notif-user@example.com',
      passwordHash: 'dummy',
      role: 'candidate',
    });
    userId = user.id;

    const otherUser = await userRepository.create({
      email: 'other-notif@example.com',
      passwordHash: 'dummy',
      role: 'candidate',
    });
    otherUserId = otherUser.id;
  });

  test('should create, list, and manage notifications', async () => {
    // 1. Create two notifications
    const n1 = await notificationService.createNotification(
      userId,
      'application_received',
      'Alert 1',
      'Details 1'
    );
    // Artificially delay second notification creation slightly to test sorting
    await new Promise((resolve) => setTimeout(resolve, 50));
    
    const n2 = await notificationService.createNotification(
      userId,
      'status_changed',
      'Alert 2',
      'Details 2'
    );

    // 2. Fetch and check sorting (newest first, i.e. n2 then n1)
    const list = await notificationService.getUserNotifications(userId);
    expect(list.length).toBe(2);
    expect(list[0].id).toBe(n2.id);
    expect(list[1].id).toBe(n1.id);
    expect(list[0].isRead).toBe(false);

    // 3. Mark notification 1 as read (succeeds)
    const updated = await notificationService.markAsRead(n1.id, userId);
    expect(updated.isRead).toBe(true);

    // 4. Mark notification 1 as read from different user (fails with ForbiddenError)
    await expect(
      notificationService.markAsRead(n1.id, otherUserId)
    ).rejects.toThrow(ForbiddenError);

    // 5. Mark all as read
    await notificationService.markAllAsRead(userId);
    const postList = await notificationService.getUserNotifications(userId);
    expect(postList.every((n) => n.isRead)).toBe(true);
  });

  test('should throw NotFoundError for non-existent notification', async () => {
    await expect(
      notificationService.markAsRead('65c2a1b2d3e4f5a6b7c8d9e0', userId)
    ).rejects.toThrow(NotFoundError);
  });
});
