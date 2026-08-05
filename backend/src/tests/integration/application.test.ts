import request from 'supertest';
import app from '../../app';
import { authService } from '../../services/auth.service';
import { profileRepository } from '../../repositories/in-memory/profile.repository.impl';

describe('Job Application Flow Integration', () => {
  let employerToken: string;
  let candidateToken: string;
  let candidateId: string;
  let jobId: string;
  let applicationId: string;

  beforeAll(async () => {
    // 1. Setup Employer
    await authService.register({
      email: 'employer-app@example.com',
      passwordPlain: 'password123',
      role: 'employer',
    });
    const empLogin = await authService.login('employer-app@example.com', 'password123');
    employerToken = empLogin.accessToken;

    // Create & Publish a Job Posting
    const jobRes = await request(app)
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${employerToken}`)
      .send({
        title: 'Backend Engineer',
        description: 'Engineering description exceeding twenty characters',
        requirements: 'Requires matching description exceeding ten characters',
        responsibilities: 'Daily tasks exceeding ten characters',
        skills: ['Node.js', 'MongoDB'],
        salaryRange: '$90k - $110k',
        jobType: 'remote',
        location: 'Remote',
        experienceLevel: 'Mid Level',
        applicationDeadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      });
    jobId = jobRes.body.data.id;
    await request(app)
      .patch(`/api/v1/jobs/${jobId}/publish`)
      .set('Authorization', `Bearer ${employerToken}`);

    // 2. Setup Candidate
    const cand = await authService.register({
      email: 'candidate-app@example.com',
      passwordPlain: 'password123',
      role: 'candidate',
    });
    const candLogin = await authService.login('candidate-app@example.com', 'password123');
    candidateToken = candLogin.accessToken;
    candidateId = cand.id;

    // Update candidate profile with name and resume
    await profileRepository.updateCandidateProfile(candidateId, {
      name: 'Jane Doe',
      skills: ['Node.js'],
      experience: [],
      education: [],
      resumeUrl: '/uploads/my_resume.pdf',
    });
  });

  test('should execute full application flow and reject duplicate submissions', async () => {
    // 1. Candidate applies to the job
    const applyRes = await request(app)
      .post(`/api/v1/jobs/${jobId}/apply`)
      .set('Authorization', `Bearer ${candidateToken}`)
      .field('coverLetter', 'I am excited to build backend APIs with you.')
      .field('screeningAnswers', JSON.stringify([]));

    expect(applyRes.status).toBe(201);
    expect(applyRes.body.success).toBe(true);
    expect(applyRes.body.data.status).toBe('applied');
    applicationId = applyRes.body.data.id;

    // 2. Candidate attempts duplicate application (fails with 409)
    const duplicateRes = await request(app)
      .post(`/api/v1/jobs/${jobId}/apply`)
      .set('Authorization', `Bearer ${candidateToken}`)
      .field('coverLetter', 'Send again')
      .field('screeningAnswers', JSON.stringify([]));

    expect(duplicateRes.status).toBe(409);

    // 3. Employer retrieves applicants for the job post
    const viewAppsRes = await request(app)
      .get(`/api/v1/jobs/${jobId}/applications`)
      .set('Authorization', `Bearer ${employerToken}`);

    expect(viewAppsRes.status).toBe(200);
    expect(viewAppsRes.body.data.length).toBe(1);
    expect(viewAppsRes.body.data[0].id).toBe(applicationId);

    // 4. Employer updates application status to shortlisted
    const statusUpdateRes = await request(app)
      .patch(`/api/v1/applications/${applicationId}/status`)
      .set('Authorization', `Bearer ${employerToken}`)
      .send({ status: 'shortlisted' });

    expect(statusUpdateRes.status).toBe(200);
    expect(statusUpdateRes.body.data.status).toBe('shortlisted');

    // Employer adds a private note
    const noteRes = await request(app)
      .post(`/api/v1/applications/${applicationId}/notes`)
      .set('Authorization', `Bearer ${employerToken}`)
      .send({ note: 'Strong candidate, scheduled screening phone call.' });

    expect(noteRes.status).toBe(200);
    expect(noteRes.body.success).toBe(true);
    expect(noteRes.body.data.notes.length).toBeGreaterThan(0);
    expect(noteRes.body.data.notes[0]).toBe('Strong candidate, scheduled screening phone call.');

    // 5. Candidate retrieves notifications and verifies status change alert is present
    const notifRes = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${candidateToken}`);

    expect(notifRes.status).toBe(200);
    const notifications = notifRes.body.data;
    expect(notifications.length).toBeGreaterThan(0);
    
    const hasStatusAlert = notifications.some(
      (n: any) => n.type === 'status_changed' && n.title === 'Application Status Updated'
    );
    expect(hasStatusAlert).toBe(true);
  });
});
