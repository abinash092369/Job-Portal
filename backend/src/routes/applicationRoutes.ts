import { Router } from 'express';
import * as applicationController from '../controllers/applicationController';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { updateStatusSchema, addNoteSchema } from '../validators/applicationValidators';

const router = Router();

router.patch(
  '/:appId/status',
  authenticate,
  authorize('employer'),
  validate(updateStatusSchema),
  applicationController.updateStatus
);

router.post(
  '/:appId/notes',
  authenticate,
  authorize('employer'),
  validate(addNoteSchema),
  applicationController.addNote
);

export default router;
