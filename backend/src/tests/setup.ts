import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

// Mock Nodemailer globally to avoid network dependencies or dynamic Ethereal setup delays
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'mock-email-message-id-123' }),
  }),
  createTestAccount: jest.fn().mockResolvedValue({
    smtp: { host: 'smtp.ethereal.email', port: 587, secure: false },
    user: 'mockuser',
    pass: 'mockpass',
  }),
  getTestMessageUrl: jest.fn().mockReturnValue('https://ethereal.email/preview/mock-preview-url'),
}));

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  // Suppress log outputs during testing
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});

  // Set mock environment variables
  process.env.MONGODB_URI = 'mock-uri';
  process.env.JWT_ACCESS_SECRET = 'test_access_secret_12345678901234567890';
  process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_12345678901234567890';
  process.env.JWT_ACCESS_EXPIRY = '15m';
  process.env.JWT_REFRESH_EXPIRY = '7d';
  process.env.NODE_ENV = 'test';
  process.env.PORT = '5001';

  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  await mongoose.connect(mongoUri);
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});
