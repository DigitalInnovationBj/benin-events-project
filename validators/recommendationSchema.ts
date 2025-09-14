import { z } from 'zod';

export const recommendationSchema = z.object({
  id: z.cuid(),
  name: z.string().min(1, 'Le nom est requis'),
  email: z.email('Email invalide'),
  eventId: z.cuid(),
  score: z.number().min(0, 'Le score doit être positif'),
  message: z.string().optional().nullable(),
  createdAt: z.date(),
});

export type Recommendation = z.infer<typeof recommendationSchema>;