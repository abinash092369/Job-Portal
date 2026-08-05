import { Response } from 'express';
import { JobService } from '../services/jobService';
import { sendSuccess, sendError } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthenticatedRequest } from '../types';
import { processUploadedFile } from '../middlewares/upload';

const jobService = new JobService();

export const getJobs = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const {
    search,
    location,
    jobType,
    experienceLevel,
    remote,
    skills,
    salaryMin,
    employerId,
    page,
    limit,
    sortBy,
  } = req.query;

  const result = await jobService.getJobs({
    search: search as string,
    location: location as string,
    jobType: jobType as string | string[],
    experienceLevel: experienceLevel as string,
    remote: remote !== undefined ? String(remote) === 'true' : undefined,
    skills: skills as string,
    salaryMin: salaryMin as string,
    employerId: employerId as string,
    page: page ? parseInt(page as string, 10) : 1,
    limit: limit ? parseInt(limit as string, 10) : 9,
    sortBy: sortBy as string,
  });

  return sendSuccess(res, result);
});

export const getMyJobs = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return sendError(res, 'Unauthenticated', 401);
  const jobs = await jobService.getMyJobs(req.user.id);
  return sendSuccess(res, jobs);
});

export const getSavedJobs = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return sendError(res, 'Unauthenticated', 401);
  const savedJobs = await jobService.getSavedJobs(req.user.id);
  // Returns bare array of Job objects per specification
  return sendSuccess(res, savedJobs);
});

export const getJobById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const job = await jobService.getJobById(id);
  return sendSuccess(res, job);
});

export const createJob = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return sendError(res, 'Unauthenticated', 401);
  const job = await jobService.createJob(req.user.id, req.body);
  return sendSuccess(res, job, 'Job created successfully', 201);
});

export const updateJob = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return sendError(res, 'Unauthenticated', 401);
  const { id } = req.params;
  const job = await jobService.updateJob(id, req.user.id, req.body);
  return sendSuccess(res, job, 'Job updated successfully');
});

export const deleteJob = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return sendError(res, 'Unauthenticated', 401);
  const { id } = req.params;
  await jobService.deleteJob(id, req.user.id);
  return sendSuccess(res, null, 'Job deleted successfully');
});

export const publishJob = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return sendError(res, 'Unauthenticated', 401);
  const { id } = req.params;
  const job = await jobService.publishJob(id, req.user.id);
  return sendSuccess(res, job, 'Job published successfully');
});

export const unpublishJob = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return sendError(res, 'Unauthenticated', 401);
  const { id } = req.params;
  const job = await jobService.unpublishJob(id, req.user.id);
  return sendSuccess(res, job, 'Job unpublished successfully');
});

export const saveJob = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return sendError(res, 'Unauthenticated', 401);
  const { id } = req.params;
  await jobService.saveJob(req.user.id, id);
  return sendSuccess(res, null, 'Job saved successfully');
});

export const unsaveJob = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return sendError(res, 'Unauthenticated', 401);
  const { id } = req.params;
  await jobService.unsaveJob(req.user.id, id);
  return sendSuccess(res, null, 'Job unsaved successfully');
});

export const applyJob = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return sendError(res, 'Unauthenticated', 401);
  const { id } = req.params;
  const { coverLetter, screeningAnswers } = req.body;

  let uploadedResumeUrl: string | undefined;
  if (req.file) {
    uploadedResumeUrl = await processUploadedFile(req.file, 'resumes');
  }

  const application = await jobService.applyJob(
    req.user.id,
    id,
    coverLetter,
    uploadedResumeUrl,
    screeningAnswers
  );

  return sendSuccess(res, application, 'Application submitted successfully', 201);
});

export const getJobApplications = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return sendError(res, 'Unauthenticated', 401);
  const { jobId } = req.params;
  const applications = await jobService.getJobApplications(jobId, req.user.id);
  return sendSuccess(res, applications);
});
