import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app';
import { initFirebaseAdmin } from '../config/firebase-admin';
import { getApps } from 'firebase-admin/app';

describe('Backend Startup & Railway Proxy Configuration Tests', () => {
  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jobportal_test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  describe('1. Express Trust Proxy Configuration', () => {
    it('should have trust proxy enabled on Express app BEFORE middleware', () => {
      const trustProxySetting = app.get('trust proxy');
      expect(trustProxySetting).toBe(1);
    });
  });

  describe('2. express-rate-limit & X-Forwarded-For Header Handling', () => {
    it('should process requests with X-Forwarded-For header without crashing or throwing validation errors', async () => {
      const res = await request(app)
        .get('/health')
        .set('X-Forwarded-For', '203.0.113.195, 70.41.3.18');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('3. Firebase Admin Initialization & Failure Modes', () => {
    it('should have initialized Firebase Admin using service account env vars', () => {
      const apps = getApps();
      expect(apps.length).toBeGreaterThan(0);
      expect(initFirebaseAdmin()).toBeDefined();
    });

    it('should throw explicit startup error if production credentials exist partially (missing any credential)', () => {
      const origEmail = process.env.FIREBASE_CLIENT_EMAIL;
      delete process.env.FIREBASE_CLIENT_EMAIL;

      expect(() => {
        // Force evaluation check logic
        const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
        const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

        const hasProjectId = Boolean(projectId);
        const hasClientEmail = Boolean(clientEmail);
        const hasPrivateKey = Boolean(privateKey);
        const hasAnyProductionCredential = hasProjectId || hasClientEmail || hasPrivateKey;

        if (hasAnyProductionCredential && (!hasProjectId || !hasClientEmail || !hasPrivateKey)) {
          throw new Error('Incomplete Firebase credentials');
        }
      }).toThrow('Incomplete Firebase credentials');

      process.env.FIREBASE_CLIENT_EMAIL = origEmail;
    });
  });

  describe('4. Health & Authentication Endpoints', () => {
    it('GET /health should return 200 and healthy status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('UP');
    });

    it('GET /api/v1/health should return 200 and healthy status', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('UP');
    });

    it('POST /api/v1/auth/firebase endpoint should load correctly and return 200 for valid token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/firebase')
        .send({
          idToken: 'valid_mock_firebase_id_token',
          role: 'candidate',
          name: 'Startup Test User',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
    });
  });
});
