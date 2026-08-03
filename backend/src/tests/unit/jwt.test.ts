import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } from '../../utils/jwt';
import { TokenPayload } from '../../types/auth';

describe('JWT Utilities', () => {
  const mockPayload: TokenPayload = {
    userId: 'user123',
    email: 'test@example.com',
    role: 'candidate',
  };

  test('should sign and verify access token correctly', () => {
    const token = signAccessToken(mockPayload);
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');

    const decoded = verifyAccessToken(token);
    expect(decoded.userId).toBe(mockPayload.userId);
    expect(decoded.email).toBe(mockPayload.email);
    expect(decoded.role).toBe(mockPayload.role);
  });

  test('should sign and verify refresh token correctly', () => {
    const token = signRefreshToken(mockPayload);
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');

    const decoded = verifyRefreshToken(token);
    expect(decoded.userId).toBe(mockPayload.userId);
    expect(decoded.email).toBe(mockPayload.email);
    expect(decoded.role).toBe(mockPayload.role);
  });

  test('should throw error when verifying an invalid token', () => {
    expect(() => verifyAccessToken('invalid-token')).toThrow();
    expect(() => verifyRefreshToken('invalid-token')).toThrow();
  });
});
