import { z } from 'zod';

const jobTypeEnum = z.enum(['full-time', 'part-time', 'contract', 'remote'] as const, {
  message: 'Job type must be one of: full-time, part-time, contract, remote',
});

const jobStatusEnum = z.enum(['draft', 'active', 'closed'] as const, {
  message: 'Status must be one of: draft, active, closed',
});

export const createJobSchema = {
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().min(1, 'Description is required'),
    responsibilities: z.string().min(1, 'Responsibilities are required'),
    requirements: z.string().min(1, 'Requirements are required'),
    skills: z.array(z.string().min(1)).min(1, 'At least one skill is required'),
    salaryRange: z.string().min(1, 'Salary range is required'),
    jobType: jobTypeEnum,
    location: z.string().min(1, 'Location is required'),
    experienceLevel: z.string().min(1, 'Experience level is required'),
    applicationDeadline: z.coerce.date(),
    status: jobStatusEnum.default('draft'),
  }).strict(),
};

export const updateJobSchema = {
  body: z.object({
    title: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    responsibilities: z.string().min(1).optional(),
    requirements: z.string().min(1).optional(),
    skills: z.array(z.string().min(1)).optional(),
    salaryRange: z.string().min(1).optional(),
    jobType: jobTypeEnum.optional(),
    location: z.string().min(1).optional(),
    experienceLevel: z.string().min(1).optional(),
    applicationDeadline: z.coerce.date().optional(),
    status: jobStatusEnum.optional(),
  }).strict(),
};
