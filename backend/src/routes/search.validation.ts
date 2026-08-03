import { z } from 'zod';

const skillsSchema = z.preprocess((val) => {
  if (typeof val === 'string') {
    return val.split(',').map((s) => s.trim()).filter(Boolean);
  }
  if (Array.isArray(val)) {
    return val.map((s) => String(s).trim()).filter(Boolean);
  }
  return undefined;
}, z.array(z.string()).optional());

const remoteSchema = z.preprocess((val) => {
  if (val === 'true' || val === '1') return true;
  if (val === 'false' || val === '0') return false;
  return undefined;
}, z.boolean().optional());

export const jobSearchQuerySchema = {
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    location: z.string().optional(),
    jobType: z.string().optional(),
    salaryMin: z.coerce.number().min(0).optional(),
    experienceLevel: z.string().optional(),
    skills: skillsSchema,
    remote: remoteSchema,
    search: z.string().optional(),
    sortBy: z.enum(['newest', 'salary-high', 'salary-low', 'relevance'] as const).default('newest'),
    employerId: z.string().optional(),
  }).strict(),
};
