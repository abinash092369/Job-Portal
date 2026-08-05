import request from 'supertest';
import app from '../../app';
import { authService } from '../../services/auth.service';

describe('RBAC Authorization Rejections', () => {
  let candidateToken: string;
  let employerToken: string;

  beforeAll(async () => {
    // 1. Create Candidate
    await authService.register({
      email: 'cand-rbac@example.com',
      passwordPlain: 'password123',
      role: 'candidate',
    });
    const candLogin = await authService.login('cand-rbac@example.com', 'password123');
    candidateToken = candLogin.accessToken;

    // 2. Create Employer
    await authService.register({
      email: 'emp-rbac@example.com',
      passwordPlain: 'password123',
      role: 'employer',
    });
    const empLogin = await authService.login('emp-rbac@example.com', 'password123');
    employerToken = empLogin.accessToken;
  });

  test('should reject Candidate hitting an Employer-only dashboard route', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/employer')
      .set('Authorization', `Bearer ${candidateToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('You do not have permission to access this resource');
  });

  test('should reject Employer hitting a Candidate-only dashboard route', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/candidate')
      .set('Authorization', `Bearer ${employerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('You do not have permission to access this resource');
  });

  test('should reject unauthenticated request to protected dashboard route', async () => {
    const res = await request(app).get('/api/v1/dashboard/candidate');
    expect(res.status).toBe(401);
  });
});
