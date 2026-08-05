import { Router } from 'express';
import * as jobController from '../controllers/jobController';
import { authenticate, authorize } from '../middlewares/auth';
import { upload } from '../middlewares/upload';
import { validate } from '../middlewares/validate';
import { createJobSchema, updateJobSchema } from '../validators/jobValidators';

const router = Router();

// Public routes
router.get('/', jobController.getJobs);

// Auth required specific subpaths (must come before /:id parameter route)
router.get('/my-jobs', authenticate, authorize('employer'), jobController.getMyJobs);
router.get('/saved', authenticate, authorize('candidate'), jobController.getSavedJobs);

// Single Job Details
router.get('/:id', jobController.getJobById);

// Employer Job Management
router.post('/', authenticate, authorize('employer'), validate(createJobSchema), jobController.createJob);
router.put('/:id', authenticate, authorize('employer'), validate(updateJobSchema), jobController.updateJob);
router.delete('/:id', authenticate, authorize('employer'), jobController.deleteJob);
router.patch('/:id/publish', authenticate, authorize('employer'), jobController.publishJob);
router.patch('/:id/unpublish', authenticate, authorize('employer'), jobController.unpublishJob);

// Candidate Actions
router.post('/:id/save', authenticate, authorize('candidate'), jobController.saveJob);
router.post('/:id/unsave', authenticate, authorize('candidate'), jobController.unsaveJob);
router.post('/:id/apply', authenticate, authorize('candidate'), upload.single('resume'), jobController.applyJob);

// Employer Application Tracking
router.get('/:jobId/applications', authenticate, authorize('employer'), jobController.getJobApplications);

export default router;
