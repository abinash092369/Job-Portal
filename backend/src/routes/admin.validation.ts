import { z } from 'zod';

export const suspendUserSchema = {
  body: z.object({
    isSuspended: z.boolean({
      message: 'isSuspended must be a boolean',
    }),
  }).strict(),
};

export const verifyEmployerSchema = {
  body: z.object({
    isVerified: z.boolean({
      message: 'isVerified must be a boolean',
    }),
  }).strict(),
};

export const moderateJobSchema = {
  body: z.object({
    status: z.enum(['draft', 'active', 'closed'] as const, {
      message: 'Status must be one of: draft, active, closed',
    }),
  }).strict(),
};
