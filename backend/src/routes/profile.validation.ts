import { z } from 'zod';

export const updateCandidateProfileSchema = {
  body: z.object({
    name: z.string().min(1, 'Name cannot be empty').optional(),
    headline: z.string().optional(),
    skills: z.array(z.string()).optional(),
    experience: z.array(z.any()).optional(),
    education: z.array(z.any()).optional(),
    location: z.string().optional(),
    phone: z.string().optional(),
  }).strict(),
};

export const updateEmployerProfileSchema = {
  body: z.object({
    companyName: z.string().min(1, 'Company name cannot be empty').optional(),
    description: z.string().optional(),
    website: z.string().url('Please provide a valid website URL').optional().or(z.literal('')),
    industry: z.string().optional(),
    companySize: z.string().optional(),
  }).strict(),
};
