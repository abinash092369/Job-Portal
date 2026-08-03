import request from 'supertest';
import app from '../../app';
import { authService } from '../../services/auth.service';

describe('Job CRUD and Ownership Integration', () => {
  let employerAToken: string;
  let employerBToken: string;
  let jobPayload: any;
  let createdJobId: string;

  beforeAll(async () => {
    // 1. Create Verified Employer A
    const empA = await authService.register({
      email: 'empa-jobs@example.com',
      passwordPlain: 'password123',
      role: 'employer',
    });
    await authService.verifyEmail(empA.verificationToken!);
    const loginA = await authService.login('empa-jobs@example.com', 'password123');
    employerAToken = loginA.accessToken;

    // 2. Create Verified Employer B
    const empB = await authService.register({
      email: 'empb-jobs@example.com',
      passwordPlain: 'password123',
      role: 'employer',
    });
    await authService.verifyEmail(empB.verificationToken!);
    const loginB = await authService.login('empb-jobs@example.com', 'password123');
    employerBToken = loginB.accessToken;

    jobPayload = {
      title: 'Devops Engineer',
      description: 'System engineer description exceeding twenty characters',
      requirements: 'Requires matching description exceeding ten characters',
      responsibilities: 'Daily tasks exceeding ten characters',
      skills: ['AWS', 'Docker'],
      salaryRange: '$120k - $140k',
      jobType: 'full-time',
      location: 'New York, NY',
      experienceLevel: 'Senior Level',
      applicationDeadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    };
  });

  test('should successfully CRUD job post with ownership constraints', async () => {
    // 1. Employer A creates a job post (default draft status)
    const createRes = await request(app)
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${employerAToken}`)
      .send(jobPayload);

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    expect(createRes.body.data.title).toBe(jobPayload.title);
    expect(createRes.body.data.status).toBe('draft');
    createdJobId = createRes.body.data.id;

    // Verify getting employer's own list of jobs works
    const myJobsRes = await request(app)
      .get('/api/v1/jobs/my-jobs')
      .set('Authorization', `Bearer ${employerAToken}`);
    expect(myJobsRes.status).toBe(200);
    expect(myJobsRes.body.data.length).toBeGreaterThan(0);

    // 2. Employer B attempts to update Employer A's job post (should fail with 403)
    const badUpdateRes = await request(app)
      .put(`/api/v1/jobs/${createdJobId}`)
      .set('Authorization', `Bearer ${employerBToken}`)
      .send({ title: 'Hacked Title' });

    expect(badUpdateRes.status).toBe(403);

    // 3. Employer A updates their own job post (succeeds)
    const updateRes = await request(app)
      .put(`/api/v1/jobs/${createdJobId}`)
      .set('Authorization', `Bearer ${employerAToken}`)
      .send({ title: 'Senior DevOps Architect' });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.title).toBe('Senior DevOps Architect');

    // 4. Employer A publishes their job post
    const publishRes = await request(app)
      .patch(`/api/v1/jobs/${createdJobId}/publish`)
      .set('Authorization', `Bearer ${employerAToken}`);

    expect(publishRes.status).toBe(200);
    expect(publishRes.body.data.status).toBe('active');

    // Employer A unpublishes their job post (back to draft)
    const unpublishRes = await request(app)
      .patch(`/api/v1/jobs/${createdJobId}/unpublish`)
      .set('Authorization', `Bearer ${employerAToken}`);
    expect(unpublishRes.status).toBe(200);
    expect(unpublishRes.body.data.status).toBe('draft');

    // Republish to search it
    await request(app)
      .patch(`/api/v1/jobs/${createdJobId}/publish`)
      .set('Authorization', `Bearer ${employerAToken}`);

    // 5. Public search displays the active job
    const searchRes = await request(app)
      .get('/api/v1/jobs')
      .query({ search: 'DevOps' });

    expect(searchRes.status).toBe(200);
    expect(searchRes.body.data.jobs.length).toBeGreaterThan(0);

    // 6. Employer B attempts to delete Employer A's job post (fails with 403)
    const badDeleteRes = await request(app)
      .delete(`/api/v1/jobs/${createdJobId}`)
      .set('Authorization', `Bearer ${employerBToken}`);

    expect(badDeleteRes.status).toBe(403);

    // 7. Employer A deletes their own job post (succeeds)
    const deleteRes = await request(app)
      .delete(`/api/v1/jobs/${createdJobId}`)
      .set('Authorization', `Bearer ${employerAToken}`);

    expect(deleteRes.status).toBe(200);
  });
});
