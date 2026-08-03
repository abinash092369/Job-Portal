import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z
  .object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Please confirm your password'),
    role: z.enum(['candidate', 'employer'], {
      message: 'Please select a role',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const jobSchema = z.object({
  title: z.string().min(1, 'Job title is required'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  responsibilities: z.string().min(10, 'Responsibilities are required'),
  requirements: z.string().min(10, 'Requirements are required'),
  skills: z.array(z.string()).min(1, 'Please add at least one skill tag'),
  salaryRange: z.string().min(1, 'Salary range is required (e.g. $80k - $120k)'),
  jobType: z.enum(['full-time', 'part-time', 'contract', 'remote'] as const),
  location: z.string().min(1, 'Location is required (e.g. Remote, San Francisco, CA)'),
  experienceLevel: z.string().min(1, 'Experience level is required (e.g. Senior Level)'),
  applicationDeadline: z.string().min(1, 'Application deadline is required'),
  screeningQuestions: z.array(z.string()).optional(),
});
