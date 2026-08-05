import { authService } from '../../services/auth.service';
import { userRepository } from '../../repositories/in-memory/user.repository.impl';
import { ConflictError, UnauthorizedError } from '../../utils/errors';
import bcrypt from 'bcrypt';

describe('AuthService', () => {
  const registerInput = {
    email: 'newuser@example.com',
    passwordPlain: 'supersecretpassword',
    role: 'candidate' as const,
  };

  test('should register user with hashed password and allow instant login', async () => {
    const user = await authService.register(registerInput);
    expect(user).toBeDefined();
    expect(user.email).toBe(registerInput.email);

    // Verify password hashing
    const dbUser = await userRepository.findByEmail(registerInput.email);
    expect(dbUser).toBeDefined();
    expect(dbUser!.passwordHash).not.toBe(registerInput.passwordPlain);
    
    const isMatch = await bcrypt.compare(registerInput.passwordPlain, dbUser!.passwordHash);
    expect(isMatch).toBe(true);

    // Instant login should succeed
    const loginResult = await authService.login(registerInput.email, registerInput.passwordPlain);
    expect(loginResult.accessToken).toBeDefined();
    expect(loginResult.user.email).toBe(registerInput.email);
  });

  test('should throw ConflictError if registering an existing email', async () => {
    await authService.register({
      email: 'duplicate@example.com',
      passwordPlain: 'password',
      role: 'candidate',
    });

    await expect(
      authService.register({
        email: 'duplicate@example.com',
        passwordPlain: 'newpassword',
        role: 'employer',
      })
    ).rejects.toThrow(ConflictError);
  });

  test('should fail login with non-existent user or invalid password', async () => {
    await expect(
      authService.login('nonexistent@example.com', 'password')
    ).rejects.toThrow(UnauthorizedError);

    // Register user
    await authService.register({
      email: 'loginfail@example.com',
      passwordPlain: 'correctpassword',
      role: 'candidate',
    });

    // Wrong password
    await expect(
      authService.login('loginfail@example.com', 'wrongpassword')
    ).rejects.toThrow(UnauthorizedError);
  });

  test('should perform refresh token rotation', async () => {
    await authService.register({
      email: 'refresh@example.com',
      passwordPlain: 'password123',
      role: 'candidate',
    });
    const { refreshToken } = await authService.login('refresh@example.com', 'password123');

    // Wait 1.05 seconds so that the JWT issued-at (iat) timestamp changes
    await new Promise((resolve) => setTimeout(resolve, 1050));

    const rotated = await authService.refresh(refreshToken);
    expect(rotated.accessToken).toBeDefined();
    expect(rotated.refreshToken).not.toBe(refreshToken);

    // Old token should be deleted and fail if reused
    await expect(authService.refresh(refreshToken)).rejects.toThrow(UnauthorizedError);
  });
});
