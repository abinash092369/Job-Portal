import { z } from 'zod';

export const suspendUserSchema = z.object({
  body: z.object({
    isSuspended: z.boolean(),
  }),
});

export const verifyEmployerSchema = z.object({
  body: z.object({
    isVerified: z.boolean(),
  }),
});

export const updateJobStatusSchema = z.object({
  body: z.object({
    status: z.enum(['draft', 'active', 'closed']),
  }),
});
