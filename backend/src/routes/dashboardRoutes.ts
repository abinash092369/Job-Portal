import { Router } from 'express';
import * as dashboardController from '../controllers/dashboardController';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.get('/employer', authenticate, authorize('employer'), dashboardController.getEmployerDashboard);
router.get('/candidate', authenticate, authorize('candidate'), dashboardController.getCandidateDashboard);

export default router;
