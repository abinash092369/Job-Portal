import request from 'supertest';
import app from '../../app';
import { authService } from '../../services/auth.service';

describe('Dashboard Controller Integration', () => {
  let candidateToken: string;
  let employerToken: string;

  beforeEach(async () => {
    // 1. Candidate Setup
    const cand = await authService.register({
      email: 'cand.dash-test@example.com',
      passwordPlain: 'password123',
      role: 'candidate',
    });
    await authService.verifyEmail(cand.verificationToken!);
    const candLogin = await authService.login('cand.dash-test@example.com', 'password123');
    candidateToken = candLogin.accessToken;

    // 2. Employer Setup
    const emp = await authService.register({
      email: 'emp.dash-test@example.com',
      passwordPlain: 'password123',
      role: 'employer',
    });
    await authService.verifyEmail(emp.verificationToken!);
    const empLogin = await authService.login('emp.dash-test@example.com', 'password123');
    employerToken = empLogin.accessToken;
  });

  test('GET /api/v1/dashboard/candidate should retrieve stats for candidate', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/candidate')
      .set('Authorization', `Bearer ${candidateToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.profileCompleteness).toBeDefined();
    expect(res.body.data.appliedJobs).toBeDefined();
    expect(res.body.data.savedJobs).toBeDefined();
  });

  test('GET /api/v1/dashboard/employer should retrieve stats for employer', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/employer')
      .set('Authorization', `Bearer ${employerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.activeJobsCount).toBeDefined();
    expect(res.body.data.totalApplicants).toBeDefined();
    expect(res.body.data.applicantsPerJob).toBeDefined();
    expect(res.body.data.recentActivity).toBeDefined();
  });
});
