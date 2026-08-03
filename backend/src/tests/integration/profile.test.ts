import request from 'supertest';
import app from '../../app';
import { authService } from '../../services/auth.service';

describe('Profile Controller Integration', () => {
  let candidateToken: string;
  let employerToken: string;
  let employerId: string;

  beforeEach(async () => {
    // 1. Candidate Setup
    const cand = await authService.register({
      email: 'cand.profile-test@example.com',
      passwordPlain: 'password123',
      role: 'candidate',
    });
    await authService.verifyEmail(cand.verificationToken!);
    const candLogin = await authService.login('cand.profile-test@example.com', 'password123');
    candidateToken = candLogin.accessToken;

    // 2. Employer Setup
    const emp = await authService.register({
      email: 'emp.profile-test@example.com',
      passwordPlain: 'password123',
      role: 'employer',
    });
    employerId = emp.id;
    await authService.verifyEmail(emp.verificationToken!);
    const empLogin = await authService.login('emp.profile-test@example.com', 'password123');
    employerToken = empLogin.accessToken;
  });

  test('GET /api/v1/profile should return profile according to authenticated user role', async () => {
    // Candidate
    const resCand = await request(app)
      .get('/api/v1/profile')
      .set('Authorization', `Bearer ${candidateToken}`);

    expect(resCand.status).toBe(200);
    expect(resCand.body.success).toBe(true);
    expect(resCand.body.data.name).toBeDefined();

    // Employer
    const resEmp = await request(app)
      .get('/api/v1/profile')
      .set('Authorization', `Bearer ${employerToken}`);

    expect(resEmp.status).toBe(200);
    expect(resEmp.body.success).toBe(true);
    expect(resEmp.body.data.companyName).toBeDefined();
  });

  test('PUT /api/v1/profile should update profile fields according to role', async () => {
    // Update Candidate
    const updateCandRes = await request(app)
      .put('/api/v1/profile')
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({
        name: 'Jane Candidate',
        skills: ['Node.js', 'React'],
        headline: 'Skilled fullstack engineer',
      });

    expect(updateCandRes.status).toBe(200);
    expect(updateCandRes.body.success).toBe(true);
    expect(updateCandRes.body.data.name).toBe('Jane Candidate');
    expect(updateCandRes.body.data.skills).toContain('Node.js');

    // Update Employer
    const updateEmpRes = await request(app)
      .put('/api/v1/profile')
      .set('Authorization', `Bearer ${employerToken}`)
      .send({
        companyName: 'Acme Software',
        companySize: '51-200 employees',
        industry: 'IT Services',
        description: 'Building tools for developer convenience.',
      });

    expect(updateEmpRes.status).toBe(200);
    expect(updateEmpRes.body.success).toBe(true);
    expect(updateEmpRes.body.data.companyName).toBe('Acme Software');
    expect(updateEmpRes.body.data.companySize).toBe('51-200 employees');
  });

  test('GET /api/v1/profile/employer/:userId should return public employer profile details', async () => {
    // Perform GET to trigger initialization of employer profile first
    await request(app)
      .get('/api/v1/profile')
      .set('Authorization', `Bearer ${employerToken}`);

    // Update first to ensure we have values
    await request(app)
      .put('/api/v1/profile')
      .set('Authorization', `Bearer ${employerToken}`)
      .send({
        companyName: 'Acme Software',
        industry: 'IT Services',
      });

    const res = await request(app)
      .get(`/api/v1/profile/employer/${employerId}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.companyName).toBe('Acme Software');
    expect(res.body.data.industry).toBe('IT Services');
  });

  test('GET /api/v1/profile/employer/:userId should fail with 400 for non-existent employer profile', async () => {
    const res = await request(app)
      .get('/api/v1/profile/employer/000000000000000000000000');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/v1/profile/resume should handle candidate resume upload and validation', async () => {
    // 1. Trigger profile initialization
    await request(app)
      .get('/api/v1/profile')
      .set('Authorization', `Bearer ${candidateToken}`);

    // 2. Upload without file should throw 400
    const failRes = await request(app)
      .post('/api/v1/profile/resume')
      .set('Authorization', `Bearer ${candidateToken}`);

    expect(failRes.status).toBe(400);

    // 3. Upload with file should succeed
    const successRes = await request(app)
      .post('/api/v1/profile/resume')
      .set('Authorization', `Bearer ${candidateToken}`)
      .attach('resume', Buffer.from('mock pdf content'), 'resume.pdf');

    expect(successRes.status).toBe(200);
    expect(successRes.body.success).toBe(true);
    expect(successRes.body.data.resumeUrl).toContain('/uploads/resumes/');
  });

  test('POST /api/v1/profile/photo should handle candidate profile photo upload and validation', async () => {
    await request(app)
      .get('/api/v1/profile')
      .set('Authorization', `Bearer ${candidateToken}`);

    const failRes = await request(app)
      .post('/api/v1/profile/photo')
      .set('Authorization', `Bearer ${candidateToken}`);

    expect(failRes.status).toBe(400);

    const successRes = await request(app)
      .post('/api/v1/profile/photo')
      .set('Authorization', `Bearer ${candidateToken}`)
      .attach('photo', Buffer.from('mock photo content'), 'photo.png');

    expect(successRes.status).toBe(200);
    expect(successRes.body.success).toBe(true);
    expect(successRes.body.data.profilePhotoUrl).toContain('/uploads/photos/');
  });

  test('POST /api/v1/profile/logo should handle employer company logo upload and validation', async () => {
    await request(app)
      .get('/api/v1/profile')
      .set('Authorization', `Bearer ${employerToken}`);

    const failRes = await request(app)
      .post('/api/v1/profile/logo')
      .set('Authorization', `Bearer ${employerToken}`);

    expect(failRes.status).toBe(400);

    const successRes = await request(app)
      .post('/api/v1/profile/logo')
      .set('Authorization', `Bearer ${employerToken}`)
      .attach('logo', Buffer.from('mock logo content'), 'logo.png');

    expect(successRes.status).toBe(200);
    expect(successRes.body.success).toBe(true);
    expect(successRes.body.data.logoUrl).toContain('/uploads/logos/');
  });
});
