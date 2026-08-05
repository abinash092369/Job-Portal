import { z } from 'zod';

export const updateStatusSchema = z.object({
  body: z.object({
    status: z.enum(['applied', 'reviewed', 'shortlisted', 'interview', 'rejected', 'hired']),
  }),
});

export const addNoteSchema = z.object({
  body: z.object({
    note: z.string().min(1, 'Note text is required'),
  }),
});
