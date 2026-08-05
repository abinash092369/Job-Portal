import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app';
import { User } from '../models/User';

describe('Authentication System Integration Tests (Firebase Auth)', () => {
  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jobportal_test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
    await User.deleteMany({ $or: [{ email: 'mockuser@example.com' }, { firebaseUid: 'firebase_mock_uid_123' }] });
  });

  afterAll(async () => {
    await User.deleteMany({ $or: [{ email: 'mockuser@example.com' }, { firebaseUid: 'firebase_mock_uid_123' }] });
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/auth/firebase', () => {
    it('should create new user and return JWT tokens when valid mock Firebase ID token is provided', async () => {
      const res = await request(app)
        .post('/api/v1/auth/firebase')
        .send({
          idToken: 'valid_mock_firebase_id_token',
          role: 'candidate',
          name: 'Firebase Test User',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('mockuser@example.com');
      expect(res.body.data.user.firebaseUid).toBe('firebase_mock_uid_123');
      expect(res.body.data.accessToken).toBeDefined();

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toContain('refreshToken');
    });

    it('should authenticate existing user with Firebase ID token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/firebase')
        .send({
          idToken: 'valid_mock_firebase_id_token',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.firebaseUid).toBe('firebase_mock_uid_123');
    });
  });
});
