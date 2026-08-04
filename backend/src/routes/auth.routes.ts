import { Router } from 'express';
import { validate } from '../middlewares/validator';
import { authGuard } from '../middlewares/auth.middleware';
import { roleGuard } from '../middlewares/role.middleware';
import { authRateLimiter } from '../middlewares/rateLimiter';
import * as authController from '../controllers/auth.controller';
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  resendVerificationSchema,
} from './auth.validation';

const router = Router();

router.post('/register', validate(registerSchema), authController.register);
router.get('/verify-email', validate(verifyEmailSchema), authController.verifyEmail);
router.post('/resend-verification', authRateLimiter, validate(resendVerificationSchema), authController.resendVerification);
router.post('/login', authRateLimiter, validate(loginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.post('/forgot-password', authRateLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

// Protected routes
router.get('/me', authGuard, authController.getMe);

// Role verification test routes
router.get('/candidate-only', authGuard, roleGuard('candidate'), (req, res) => {
  res.json({ success: true, message: 'Welcome Candidate! Access granted.' });
});

router.get('/employer-only', authGuard, roleGuard('employer'), (req, res) => {
  res.json({ success: true, message: 'Welcome Employer! Access granted.' });
});

router.get('/admin-only', authGuard, roleGuard('admin'), (req, res) => {
  res.json({ success: true, message: 'Welcome Admin! Access granted.' });
});

export default router;
