import { z } from 'zod';

export const eventDateSchema = z.object({
  id: z.cuid(),
  startDateTime: z.date(),
  endDateTime: z.date().optional().nullable(),
  isAllDay: z.boolean().default(false),
  reccurenceType: z.enum(['NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'], {
    error: () => ({ message: 'Type de récurrence invalide' }),
  }).default('NONE'),
  reccurenceEnd: z.date().optional().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type EventDate = z.infer<typeof eventDateSchema>;