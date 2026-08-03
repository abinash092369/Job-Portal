import { z } from 'zod';

const experienceEntrySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  company: z.string().min(1, 'Company is required'),
  location: z.string().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().nullable().optional(),
  description: z.string().optional(),
});

const educationEntrySchema = z.object({
  institution: z.string().min(1, 'Institution is required'),
  degree: z.string().min(1, 'Degree is required'),
  fieldOfStudy: z.string().min(1, 'Field of study is required'),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().nullable().optional(),
  description: z.string().optional(),
});

export const updateCandidateProfileSchema = {
  body: z.object({
    name: z.string().min(1, 'Name cannot be empty').optional(),
    headline: z.string().optional(),
    skills: z.array(z.string()).optional(),
    experience: z.array(experienceEntrySchema).optional(),
    education: z.array(educationEntrySchema).optional(),
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
