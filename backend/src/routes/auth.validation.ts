import { z } from 'zod';

export const registerSchema = {
  body: z.object({
    email: z.string().email('Please provide a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    role: z.enum(['employer', 'candidate'] as any, {
       message: 'Role must be either employer or candidate',
    }),
  }),
};

export const loginSchema = {
  body: z.object({
    email: z.string().email('Please provide a valid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
};
