import { Router } from 'express';
import { authGuard } from '../middlewares/auth.middleware';
import { roleGuard } from '../middlewares/role.middleware';
import * as dashboardController from '../controllers/dashboard.controller';

const router = Router();

router.use(authGuard);

router.get('/employer', roleGuard('employer'), dashboardController.getEmployerDashboard);
router.get('/candidate', roleGuard('candidate'), dashboardController.getCandidateDashboard);

export default router;
