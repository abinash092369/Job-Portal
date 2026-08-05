import request from 'supertest';
import app from '../../app';

describe('Auth Endpoints Integration', () => {
  const credentials = {
    email: 'integration@example.com',
    password: 'password123',
    role: 'candidate',
  };

  test('should run registration, instant login, refresh, and logout successfully', async () => {
    // 1. Register User
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send(credentials);

    expect(regRes.status).toBe(201);
    expect(regRes.body.success).toBe(true);
    expect(regRes.body.data.email).toBe(credentials.email);

    // 2. Login User (Fails with bad password)
    const badLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: credentials.email, password: 'wrongpassword' });
    expect(badLoginRes.status).toBe(401);

    // Login User (Succeeds)
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: credentials.email, password: credentials.password });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.data.accessToken).toBeDefined();

    // Extract cookie
    const cookies = loginRes.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const refreshCookie = cookies[0];
    expect(refreshCookie).toContain('refreshToken=');

    // 3. Refresh Token
    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', [refreshCookie]);

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.success).toBe(true);
    expect(refreshRes.body.data.accessToken).toBeDefined();

    const newCookies = refreshRes.headers['set-cookie'];
    expect(newCookies).toBeDefined();
    const newRefreshCookie = newCookies[0];

    // 4. Logout User
    const logoutRes = await request(app)
      .post('/api/v1/auth/logout')
      .set('Cookie', [newRefreshCookie]);

    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.success).toBe(true);
  });

  test('should reject duplicate registration with 409 Conflict', async () => {
    const dupCredentials = {
      email: 'dup-test@example.com',
      password: 'Password123!',
      role: 'candidate',
    };

    const reg1 = await request(app).post('/api/v1/auth/register').send(dupCredentials);
    expect(reg1.status).toBe(201);

    const reg2 = await request(app).post('/api/v1/auth/register').send(dupCredentials);
    expect(reg2.status).toBe(409);
  });
});
