import request from 'supertest';
import app from '../../app';
import { userRepository } from '../../repositories/in-memory/user.repository.impl';

describe('Auth Endpoints Integration', () => {
  const credentials = {
    email: 'integration@example.com',
    password: 'password123',
    role: 'candidate',
  };

  test('should run registration, verification, login, refresh, and logout successfully', async () => {
    // 1. Register User
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send(credentials);

    expect(regRes.status).toBe(201);
    expect(regRes.body.success).toBe(true);
    expect(regRes.body.data.email).toBe(credentials.email);

    // Retrieve verification token from repository
    const dbUser = await userRepository.findByEmail(credentials.email);
    expect(dbUser).toBeDefined();
    const token = dbUser!.verificationToken;
    expect(token).toBeDefined();

    // 2. Verify Email
    const verifyRes = await request(app)
      .get('/api/v1/auth/verify-email')
      .query({ token });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.success).toBe(true);

    // 3. Login User (Fails with bad password)
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

    // 4. Refresh Token
    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', [refreshCookie]);

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.success).toBe(true);
    expect(refreshRes.body.data.accessToken).toBeDefined();

    const newCookies = refreshRes.headers['set-cookie'];
    expect(newCookies).toBeDefined();
    const newRefreshCookie = newCookies[0];

    // 5. Logout User
    const logoutRes = await request(app)
      .post('/api/v1/auth/logout')
      .set('Cookie', [newRefreshCookie]);

    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.success).toBe(true);
  });

  test('should handle re-registration and resend-verification for unverified users', async () => {
    const unverifiedCredentials = {
      email: 'unverified-user@example.com',
      password: 'Password123!',
      role: 'candidate',
    };

    // 1. Initial Register (unverified)
    const reg1 = await request(app).post('/api/v1/auth/register').send(unverifiedCredentials);
    expect(reg1.status).toBe(201);

    const user1 = await userRepository.findByEmail(unverifiedCredentials.email);
    expect(user1?.isVerified).toBe(false);
    const token1 = user1?.verificationToken;
    expect(token1).toBeDefined();

    // 2. Attempt login before verification (should fail with 400)
    const loginAttempt = await request(app).post('/api/v1/auth/login').send({
      email: unverifiedCredentials.email,
      password: unverifiedCredentials.password,
    });
    expect(loginAttempt.status).toBe(400);
    expect(loginAttempt.body.message).toContain('Please verify your email address');

    // 3. Re-register with same email while unverified (should issue fresh token and overwrite old token)
    const reg2 = await request(app).post('/api/v1/auth/register').send(unverifiedCredentials);
    expect(reg2.status).toBe(201);

    const user2 = await userRepository.findByEmail(unverifiedCredentials.email);
    const token2 = user2?.verificationToken;
    expect(token2).toBeDefined();
    expect(token2).not.toBe(token1); // Old token expired/replaced

    // 4. Resend verification email endpoint
    const resendRes = await request(app).post('/api/v1/auth/resend-verification').send({
      email: unverifiedCredentials.email,
    });
    expect(resendRes.status).toBe(200);

    const user3 = await userRepository.findByEmail(unverifiedCredentials.email);
    const token3 = user3?.verificationToken;
    expect(token3).toBeDefined();
    expect(token3).not.toBe(token2); // Replaced with new token

    // 5. Verify email with latest token
    const verifyRes = await request(app)
      .get('/api/v1/auth/verify-email')
      .query({ token: token3 });
    expect(verifyRes.status).toBe(200);

    // 6. Verify unverified re-register now fails with 409 Conflict since account is verified
    const reg3 = await request(app).post('/api/v1/auth/register').send(unverifiedCredentials);
    expect(reg3.status).toBe(409);
  });
});
