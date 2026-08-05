import { z } from 'zod';

export const createJobSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().min(1, 'Description is required'),
    responsibilities: z.string().optional().default(''),
    requirements: z.string().optional().default(''),
    skills: z.array(z.string()).optional().default([]),
    salaryRange: z.string().optional().default('$80,000 - $100,000'),
    jobType: z.enum(['full-time', 'part-time', 'contract', 'remote']),
    location: z.string().min(1, 'Location is required'),
    experienceLevel: z.string().optional().default('Entry Level'),
    applicationDeadline: z.string().optional().default(''),
    status: z.enum(['draft', 'active', 'closed']).optional().default('active'),
    screeningQuestions: z.array(z.string()).optional().default([]),
  }),
});

export const updateJobSchema = z.object({
  body: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    responsibilities: z.string().optional(),
    requirements: z.string().optional(),
    skills: z.array(z.string()).optional(),
    salaryRange: z.string().optional(),
    jobType: z.enum(['full-time', 'part-time', 'contract', 'remote']).optional(),
    location: z.string().optional(),
    experienceLevel: z.string().optional(),
    applicationDeadline: z.string().optional(),
    status: z.enum(['draft', 'active', 'closed']).optional(),
    screeningQuestions: z.array(z.string()).optional(),
  }),
});
