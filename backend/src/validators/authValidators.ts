import { z } from 'zod';

export const firebaseAuthSchema = z.object({
  body: z.object({
    idToken: z.string().min(1, 'Firebase ID Token is required'),
    role: z.enum(['employer', 'candidate']).optional(),
    name: z.string().optional(),
    email: z.string().email().optional(),
  }),
});

