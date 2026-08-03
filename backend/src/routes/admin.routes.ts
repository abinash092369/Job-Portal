import { Router } from 'express';
import { authGuard } from '../middlewares/auth.middleware';
import { roleGuard } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validator';
import * as adminController from '../controllers/admin.controller';
import { suspendUserSchema, verifyEmployerSchema, moderateJobSchema } from './admin.validation';

const router = Router();

// Apply global admin guard
router.use(authGuard, roleGuard('admin'));

// Users management
router.get('/users', adminController.getUsers);
router.patch('/users/:id/suspend', validate(suspendUserSchema), adminController.suspendUser);

// Employer verification
router.patch('/employers/:id/verify', validate(verifyEmployerSchema), adminController.verifyEmployer);

// Job moderation
router.get('/jobs', adminController.getJobs);
router.patch('/jobs/:id/status', validate(moderateJobSchema), adminController.moderateJob);
router.delete('/jobs/:id', adminController.deleteJob);

// Platform statistics
router.get('/stats', adminController.getPlatformStats);

export default router;
