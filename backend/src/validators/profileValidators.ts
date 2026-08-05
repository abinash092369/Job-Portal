import { z } from 'zod';

export const updateCandidateProfileSchema = z.object({
  name: z.string().optional(),
  headline: z.string().optional(),
  skills: z.array(z.string()).optional(),
  experience: z
    .array(
      z.object({
        company: z.string(),
        role: z.string(),
        duration: z.string(),
        description: z.string().optional(),
      })
    )
    .optional(),
  education: z
    .array(
      z.object({
        school: z.string(),
        degree: z.string(),
        fieldOfStudy: z.string(),
        year: z.number(),
      })
    )
    .optional(),
  resumeUrl: z.string().optional(),
  profilePhotoUrl: z.string().optional(),
  location: z.string().optional(),
  phone: z.string().optional(),
});

export const updateEmployerProfileSchema = z.object({
  companyName: z.string().optional(),
  logoUrl: z.string().optional(),
  description: z.string().optional(),
  website: z.string().optional(),
  industry: z.string().optional(),
  companySize: z.string().optional(),
});

export const updateProfileSchema = z.object({
  body: z.union([updateCandidateProfileSchema, updateEmployerProfileSchema]),
});
