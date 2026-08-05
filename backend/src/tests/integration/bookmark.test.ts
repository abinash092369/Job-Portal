import request from 'supertest';
import app from '../../app';
import { authService } from '../../services/auth.service';
import { jobRepository } from '../../repositories/in-memory/job.repository.impl';

describe('Job Bookmarks Controller Integration', () => {
  let candidateToken: string;
  let employerToken: string;
  let jobPostId: string;

  beforeEach(async () => {
    // 1. Candidate Setup
    await authService.register({
      email: 'cand.bookmark-test@example.com',
      passwordPlain: 'password123',
      role: 'candidate',
    });
    const candLogin = await authService.login('cand.bookmark-test@example.com', 'password123');
    candidateToken = candLogin.accessToken;

    // 2. Employer Setup
    const emp = await authService.register({
      email: 'emp.bookmark-test@example.com',
      passwordPlain: 'password123',
      role: 'employer',
    });
    const empLogin = await authService.login('emp.bookmark-test@example.com', 'password123');
    employerToken = empLogin.accessToken;

    // 3. Create job posting
    const job = await jobRepository.create({
      employerId: emp.id,
      title: 'Devops Architect',
      description: 'System architect description exceeding twenty characters',
      requirements: 'Requires matching description exceeding ten characters',
      responsibilities: 'Daily tasks exceeding ten characters',
      skills: ['AWS'],
      salaryRange: '$150k',
      jobType: 'full-time',
      location: 'Remote',
      experienceLevel: 'Lead Level',
      applicationDeadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      status: 'active',
    });
    jobPostId = job.id;
  });

  test('POST /api/v1/jobs/:jobId/save should bookmark a job and GET /api/v1/jobs/saved should return it', async () => {
    // Save job
    const saveRes = await request(app)
      .post(`/api/v1/jobs/${jobPostId}/save`)
      .set('Authorization', `Bearer ${candidateToken}`);

    expect(saveRes.status).toBe(200);
    expect(saveRes.body.success).toBe(true);
    expect(saveRes.body.message).toContain('saved successfully');

    // Get saved list
    const getRes = await request(app)
      .get('/api/v1/jobs/saved')
      .set('Authorization', `Bearer ${candidateToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.success).toBe(true);
    expect(getRes.body.data.length).toBe(1);
    expect(getRes.body.data[0].id).toBe(jobPostId);
  });

  test('POST /api/v1/jobs/:jobId/unsave should remove a bookmarked job', async () => {
    // Save first
    await request(app)
      .post(`/api/v1/jobs/${jobPostId}/save`)
      .set('Authorization', `Bearer ${candidateToken}`);

    const unsaveRes = await request(app)
      .post(`/api/v1/jobs/${jobPostId}/unsave`)
      .set('Authorization', `Bearer ${candidateToken}`);

    expect(unsaveRes.status).toBe(200);
    expect(unsaveRes.body.success).toBe(true);
    expect(unsaveRes.body.message).toContain('unsaved successfully');

    const getRes = await request(app)
      .get('/api/v1/jobs/saved')
      .set('Authorization', `Bearer ${candidateToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.length).toBe(0);
  });

  test('POST /api/v1/jobs/:jobId/save should fail with 403 for an Employer trying to save', async () => {
    const saveRes = await request(app)
      .post(`/api/v1/jobs/${jobPostId}/save`)
      .set('Authorization', `Bearer ${employerToken}`);

    expect(saveRes.status).toBe(403);
  });
});
