import { Router } from 'express';
import * as adminController from '../controllers/adminController';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import {
  suspendUserSchema,
  verifyEmployerSchema,
  updateJobStatusSchema,
} from '../validators/adminValidators';

const router = Router();

// Protect all admin endpoints
router.use(authenticate, authorize('admin'));

router.get('/users', adminController.getAllUsers);
router.patch('/users/:id/suspend', validate(suspendUserSchema), adminController.suspendUser);
router.patch('/employers/:id/verify', validate(verifyEmployerSchema), adminController.verifyEmployer);

router.get('/jobs', adminController.getAllJobs);
router.patch('/jobs/:id/status', validate(updateJobStatusSchema), adminController.updateJobStatus);
router.delete('/jobs/:id', adminController.deleteJob);

router.get('/stats', adminController.getAdminStats);

export default router;
