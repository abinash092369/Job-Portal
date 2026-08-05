import request from 'supertest';
import app from '../../app';
import { authService } from '../../services/auth.service';
import { notificationRepository } from '../../repositories/in-memory/notification.repository.impl';

describe('Notification Controller Integration', () => {
  let candidateToken: string;
  let candidateId: string;
  let notificationId: string;

  beforeEach(async () => {
    // 1. Candidate Setup
    const cand = await authService.register({
      email: 'cand.notif-test@example.com',
      passwordPlain: 'password123',
      role: 'candidate',
    });
    const candLogin = await authService.login('cand.notif-test@example.com', 'password123');
    candidateToken = candLogin.accessToken;
    candidateId = cand.id;

    // Create a sample notification
    const notif = await notificationRepository.create({
      userId: candidateId,
      title: 'New Integration Test',
      message: 'Integration test created for you.',
      type: 'status_changed',
    });
    notificationId = notif.id;
  });

  test('GET /api/v1/notifications should return list of notifications', async () => {
    const res = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${candidateToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].title).toBe('New Integration Test');
  });

  test('PATCH /api/v1/notifications/:id/read should mark a notification as read', async () => {
    const res = await request(app)
      .patch(`/api/v1/notifications/${notificationId}/read`)
      .set('Authorization', `Bearer ${candidateToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isRead).toBe(true);
  });

  test('PATCH /api/v1/notifications/read-all should mark all user notifications as read', async () => {
    // Create another unread notification first
    await notificationRepository.create({
      userId: candidateId,
      title: 'Second Test',
      message: 'Another notification.',
      type: 'status_changed',
    });

    const res = await request(app)
      .patch('/api/v1/notifications/read-all')
      .set('Authorization', `Bearer ${candidateToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify all are read
    const allNotifs = await notificationRepository.findByUser(candidateId);
    const unreadCount = allNotifs.filter((n: any) => !n.isRead).length;
    expect(unreadCount).toBe(0);
  });
});
