import { Router } from 'express';
import * as profileController from '../controllers/profileController';
import { authenticate } from '../middlewares/auth';
import { upload } from '../middlewares/upload';
import { validate } from '../middlewares/validate';
import { updateProfileSchema } from '../validators/profileValidators';

const router = Router();

router.get('/', authenticate, profileController.getProfile);
router.put('/', authenticate, validate(updateProfileSchema), profileController.updateProfile);
router.post('/photo', authenticate, upload.single('photo'), profileController.uploadPhoto);
router.post('/resume', authenticate, upload.single('resume'), profileController.uploadResume);
router.post('/logo', authenticate, upload.single('logo'), profileController.uploadLogo);
router.get('/employer/:userId', profileController.getPublicEmployerProfile);

export default router;
