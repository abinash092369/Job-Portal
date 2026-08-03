import { describe, test, expect } from 'vitest';
import { loginSchema, registerSchema, jobSchema } from '../../utils/validationSchemas';

describe('Validation Schemas Unit Tests', () => {
  describe('loginSchema', () => {
    test('passes with valid inputs', () => {
      const valid = { email: 'test@example.com', password: 'password123' };
      const parsed = loginSchema.safeParse(valid);
      expect(parsed.success).toBe(true);
    });

    test('fails with invalid email format', () => {
      const invalid = { email: 'notanemail', password: 'password123' };
      const parsed = loginSchema.safeParse(invalid);
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.issues[0].message).toContain('Please enter a valid email address');
      }
    });

    test('fails with password too short', () => {
      const invalid = { email: 'test@example.com', password: '123' };
      const parsed = loginSchema.safeParse(invalid);
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.issues[0].message).toContain('Password must be at least 6 characters');
      }
    });
  });

  describe('registerSchema', () => {
    test('passes with valid inputs', () => {
      const valid = {
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        role: 'candidate',
      };
      const parsed = registerSchema.safeParse(valid);
      expect(parsed.success).toBe(true);
    });

    test('fails when passwords do not match', () => {
      const invalid = {
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'differentpassword',
        role: 'candidate',
      };
      const parsed = registerSchema.safeParse(invalid);
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.issues[0].message).toContain('Passwords do not match');
      }
    });

    test('fails with invalid role option', () => {
      const invalid = {
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        role: 'admin', // admin is not allowed in candidate | employer enum
      };
      const parsed = registerSchema.safeParse(invalid as any);
      expect(parsed.success).toBe(false);
    });
  });

  describe('jobSchema', () => {
    test('passes with valid job inputs', () => {
      const valid = {
        title: 'Senior Developer',
        description: 'This is a description exceeding twenty characters for developer role.',
        requirements: 'Requires ten plus characters requirements.',
        responsibilities: 'Daily tasks exceeding ten characters.',
        skills: ['React', 'TypeScript'],
        salaryRange: '$100k - $120k',
        jobType: 'remote',
        location: 'Remote',
        experienceLevel: 'Senior Level',
        applicationDeadline: '2026-12-31',
      };
      const parsed = jobSchema.safeParse(valid);
      expect(parsed.success).toBe(true);
    });

    test('fails with description too short', () => {
      const invalid = {
        title: 'Senior Developer',
        description: 'Short desc', // must be >= 20 characters
        requirements: 'Requires ten plus characters requirements.',
        responsibilities: 'Daily tasks exceeding ten characters.',
        skills: ['React'],
        salaryRange: '$100k - $120k',
        jobType: 'remote',
        location: 'Remote',
        experienceLevel: 'Senior Level',
        applicationDeadline: '2026-12-31',
      };
      const parsed = jobSchema.safeParse(invalid);
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.issues[0].message).toContain('Description must be at least 20 characters');
      }
    });
  });
});
