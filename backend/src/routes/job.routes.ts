import { Router } from 'express';
import { authGuard } from '../middlewares/auth.middleware';
import { roleGuard } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validator';
import { createJobSchema, updateJobSchema } from './job.validation';
import { jobSearchQuerySchema } from './search.validation';
import { applyToJobSchema } from './application.validation';
import { jobSearchRateLimiter } from '../middlewares/rateLimiter';
import { uploadMiddleware } from '../config/upload';
import * as jobController from '../controllers/job.controller';
import * as applicationController from '../controllers/application.controller';
import * as bookmarkController from '../controllers/bookmark.controller';

const router = Router();

// Public Routes
router.get('/', jobSearchRateLimiter, validate(jobSearchQuerySchema), jobController.getActiveJobs);

// Protected Routes (Employer / Admin / Candidate check where required)
router.get('/my-jobs', authGuard, roleGuard('employer'), jobController.getMyJobs);
router.get('/saved', authGuard, roleGuard('candidate'), bookmarkController.getSavedJobs);

// Parameterized public view must go after static routes
router.get('/:id', jobSearchRateLimiter, jobController.getJobById);

// Employer CRUD operations
router.post('/', authGuard, roleGuard('employer'), validate(createJobSchema), jobController.createJob);
router.put('/:id', authGuard, roleGuard('employer'), validate(updateJobSchema), jobController.updateJob);
router.delete('/:id', authGuard, roleGuard('employer'), jobController.deleteJob);

// Publish/Unpublish status controls
router.patch('/:id/publish', authGuard, roleGuard('employer'), jobController.publishJob);
router.patch('/:id/unpublish', authGuard, roleGuard('employer'), jobController.unpublishJob);

// Expire past deadline check trigger (restricted to employer/admin)
router.post('/expire-check', authGuard, roleGuard('employer', 'admin'), jobController.runAutoExpire);

// Job Applications routes
router.post('/:jobId/apply', authGuard, roleGuard('candidate'), uploadMiddleware('resume'), validate(applyToJobSchema), applicationController.applyToJob);
router.get('/:jobId/applications', authGuard, roleGuard('employer'), applicationController.getJobApplications);

// Saved Jobs/Bookmarks routes
router.post('/:jobId/save', authGuard, roleGuard('candidate'), bookmarkController.saveJob);
router.post('/:jobId/unsave', authGuard, roleGuard('candidate'), bookmarkController.unsaveJob);

export default router;
