import { Router } from 'express';
import * as authController from '../controllers/authController';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { loginLimiter } from '../middlewares/rateLimiter';
import { firebaseAuthSchema } from '../validators/authValidators';

const router = Router();

/**
 * @openapi
 * /api/v1/auth/firebase:
 *   post:
 *     summary: Authenticate via Firebase ID Token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [idToken]
 *             properties:
 *               idToken:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [candidate, employer]
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Firebase authentication successful
 */
router.post('/firebase', loginLimiter, validate(firebaseAuthSchema), authController.firebaseAuth);

/**
 * @openapi
 * /api/v1/auth/logout:
 *   post:
 *     summary: Logout user and clear session cookie
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @openapi
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Refresh access token using HttpOnly refresh cookie
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Access token refreshed successfully
 */
router.post('/refresh', authController.refresh);

/**
 * @openapi
 * /api/v1/auth/me:
 *   get:
 *     summary: Get currently authenticated user details
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Authenticated user details
 */
router.get('/me', authenticate, authController.me);

export default router;
