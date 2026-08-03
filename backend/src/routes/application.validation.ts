import { z } from 'zod';

const screeningAnswersSchema = z.preprocess((val) => {
  if (typeof val === 'string') {
    try {
      return JSON.parse(val);
    } catch {
      return undefined;
    }
  }
  return val;
}, z.array(
  z.object({
    question: z.string().min(1, 'Question is required'),
    answer: z.string().min(1, 'Answer is required'),
  })
).optional());

export const applyToJobSchema = {
  body: z.object({
    coverLetter: z.string().min(1, 'Cover letter is required'),
    screeningAnswers: screeningAnswersSchema,
  }).strict(),
};

export const updateApplicationStatusSchema = {
  body: z.object({
    status: z.enum([
      'applied',
      'reviewed',
      'shortlisted',
      'interview',
      'rejected',
      'hired',
    ] as const, {
      message: 'Status must be one of: applied, reviewed, shortlisted, interview, rejected, hired',
    }),
  }).strict(),
};

export const addPrivateNoteSchema = {
  body: z.object({
    note: z.string().min(1, 'Note text must not be empty'),
  }).strict(),
};
