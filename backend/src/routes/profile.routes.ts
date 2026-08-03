import { Router, Request, Response, NextFunction } from 'express';
import { authGuard } from '../middlewares/auth.middleware';
import { roleGuard } from '../middlewares/role.middleware';
import { uploadMiddleware } from '../config/upload';
import { validate } from '../middlewares/validator';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { updateCandidateProfileSchema, updateEmployerProfileSchema } from './profile.validation';
import * as profileController from '../controllers/profile.controller';

const router = Router();

// Dynamic validator middleware depending on user's role
function validateProfileUpdate(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    return next(new UnauthorizedError('Authentication required'));
  }

  if (req.user.role === 'candidate') {
    validate(updateCandidateProfileSchema)(req, res, next);
  } else if (req.user.role === 'employer') {
    validate(updateEmployerProfileSchema)(req, res, next);
  } else {
    next(new ForbiddenError('User role does not support profile updates'));
  }
}

// Public routes
router.get('/employer/:userId', profileController.getPublicEmployerProfile);

// All profile endpoints are protected
router.use(authGuard);

router.get('/', profileController.getProfile);
router.put('/', validateProfileUpdate, profileController.updateProfile);

// Candidate upload endpoints
router.post('/resume', roleGuard('candidate'), uploadMiddleware('resume'), profileController.uploadResume);
router.post('/photo', roleGuard('candidate'), uploadMiddleware('photo'), profileController.uploadPhoto);

// Employer upload endpoints
router.post('/logo', roleGuard('employer'), uploadMiddleware('logo'), profileController.uploadLogo);

export default router;
