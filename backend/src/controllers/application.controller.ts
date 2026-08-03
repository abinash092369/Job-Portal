import { Request, Response, NextFunction } from 'express';
import { applicationService } from '../services/application.service';
import { formatResponse } from '../utils/response';
import { UnauthorizedError } from '../utils/errors';

export async function applyToJob(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const candidateId = req.user.id;
    const jobId = req.params.jobId as string;
    const { coverLetter, screeningAnswers } = req.body;
    
    // Check if a new resume was uploaded via multer
    const uploadedResumeUrl = req.file 
      ? (req.file.filename.startsWith('http://') || req.file.filename.startsWith('https://')
          ? req.file.filename
          : `/uploads/resumes/${req.file.filename}`)
      : undefined;


    const application = await applicationService.applyToJob(
      candidateId,
      jobId,
      coverLetter,
      screeningAnswers,
      uploadedResumeUrl
    );

    res.status(201).json(formatResponse(true, application, 'Application submitted successfully'));
  } catch (error) {
    next(error);
  }
}

export async function getJobApplications(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const jobId = req.params.jobId as string;
    const statusFilter = req.query.status as any;

    const applications = await applicationService.getJobApplications(
      jobId,
      req.user.id,
      statusFilter
    );

    res.status(200).json(formatResponse(true, applications, 'Applications retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

export async function updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const id = req.params.id as string;
    const { status } = req.body;

    const updatedApplication = await applicationService.updateStatus(
      id,
      req.user.id,
      status
    );

    res.status(200).json(formatResponse(true, updatedApplication, 'Application status updated successfully'));
  } catch (error) {
    next(error);
  }
}

export async function addPrivateNote(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const id = req.params.id as string;
    const { note } = req.body;

    const updatedApplication = await applicationService.addPrivateNote(
      id,
      req.user.id,
      note
    );

    res.status(200).json(formatResponse(true, updatedApplication, 'Private note added successfully'));
  } catch (error) {
    next(error);
  }
}
