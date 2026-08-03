import request from 'supertest';
import app from '../../app';
import { authService } from '../../services/auth.service';
import { userRepository } from '../../repositories/in-memory/user.repository.impl';
import { jobRepository } from '../../repositories/in-memory/job.repository.impl';
import { profileRepository } from '../../repositories/in-memory/profile.repository.impl';
import bcrypt from 'bcrypt';

describe('Admin Controller Integration', () => {
  let adminToken: string;
  let candidateUser: any;
  let employerUser: any;
  let jobPost: any;

  beforeEach(async () => {
    // 1. Create and verify admin user
    const adminUser = await userRepository.create({
      email: 'admin.integration@example.com',
      passwordHash: await bcrypt.hash('adminpass123', 12),
      role: 'admin',
      isVerified: true,
    });

    const adminLogin = await authService.login('admin.integration@example.com', 'adminpass123');
    adminToken = adminLogin.accessToken;

    // 2. Create sample candidate
    candidateUser = await userRepository.create({
      email: 'cand.admin-test@example.com',
      passwordHash: 'dummyhash',
      role: 'candidate',
      isVerified: true,
    });

    // 3. Create sample employer
    employerUser = await userRepository.create({
      email: 'emp.admin-test@example.com',
      passwordHash: 'dummyhash',
      role: 'employer',
      isVerified: true,
    });

    // 4. Create sample job
    jobPost = await jobRepository.create({
      employerId: employerUser.id,
      title: 'Admin Moderated Developer',
      description: 'Need a developer. Must exceed twenty characters description.',
      requirements: 'Requires matching description exceeding ten characters.',
      responsibilities: 'Daily tasks exceeding ten characters.',
      skills: ['JS'],
      salaryRange: '$50k - $70k',
      jobType: 'full-time',
      location: 'Remote',
      experienceLevel: 'Entry Level',
      applicationDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      status: 'active',
    });
  });

  test('GET /api/v1/admin/users should retrieve list of users', async () => {
    const res = await request(app)
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(3);
    const userEmails = res.body.data.map((u: any) => u.email);
    expect(userEmails).toContain('cand.admin-test@example.com');
  });

  test('PATCH /api/v1/admin/users/:id/suspend should toggle user suspension', async () => {
    // Suspend user
    const suspendRes = await request(app)
      .patch(`/api/v1/admin/users/${candidateUser.id}/suspend`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isSuspended: true });

    expect(suspendRes.status).toBe(200);
    expect(suspendRes.body.success).toBe(true);
    expect(suspendRes.body.data.isSuspended).toBe(true);

    // Unsuspend user
    const unsuspendRes = await request(app)
      .patch(`/api/v1/admin/users/${candidateUser.id}/suspend`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isSuspended: false });

    expect(unsuspendRes.status).toBe(200);
    expect(unsuspendRes.body.success).toBe(true);
    expect(unsuspendRes.body.data.isSuspended).toBe(false);
  });

  test('PATCH /api/v1/admin/employers/:id/verify should update employer profile verification status', async () => {
    const verifyRes = await request(app)
      .patch(`/api/v1/admin/employers/${employerUser.id}/verify`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isVerified: true });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.success).toBe(true);

    const updatedProfile = await profileRepository.getEmployerProfile(employerUser.id);
    expect(updatedProfile!.isVerified).toBe(true);
  });

  test('PATCH /api/v1/admin/jobs/:id/status should moderate job status', async () => {
    const statusRes = await request(app)
      .patch(`/api/v1/admin/jobs/${jobPost.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'closed' });

    expect(statusRes.status).toBe(200);
    expect(statusRes.body.success).toBe(true);
    expect(statusRes.body.data.status).toBe('closed');
  });

  test('GET /api/v1/admin/stats should return aggregate platform statistics', async () => {
    const statsRes = await request(app)
      .get('/api/v1/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(statsRes.status).toBe(200);
    expect(statsRes.body.success).toBe(true);
    expect(statsRes.body.data.totalUsers).toBeDefined();
    expect(statsRes.body.data.totalJobs).toBeDefined();
  });

  test('DELETE /api/v1/admin/jobs/:id should perform administrative job deletion', async () => {
    const deleteRes = await request(app)
      .delete(`/api/v1/admin/jobs/${jobPost.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.success).toBe(true);

    // Verify it is gone
    const verifyDelete = await jobRepository.findById(jobPost.id);
    expect(verifyDelete).toBeNull();
  });
});
