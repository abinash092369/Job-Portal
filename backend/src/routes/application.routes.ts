import { Router } from 'express';
import { authGuard } from '../middlewares/auth.middleware';
import { roleGuard } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validator';
import { updateApplicationStatusSchema, addPrivateNoteSchema } from './application.validation';
import * as applicationController from '../controllers/application.controller';

const router = Router();

// ID-specific routes are employer-only
router.use(authGuard);
router.use(roleGuard('employer'));

router.patch('/:id/status', validate(updateApplicationStatusSchema), applicationController.updateStatus);
router.post('/:id/notes', validate(addPrivateNoteSchema), applicationController.addPrivateNote);

export default router;
