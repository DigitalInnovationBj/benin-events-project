import { z } from 'zod';

export const feedbackSchema = z.object({
  id: z.cuid(),
  name: z.string().min(1, 'Le nom est requis'),
  eventId: z.cuid(),
  userId: z.string().optional().nullable(),
  email: z.string().email('Email invalide'),
  rating: z.number().int().min(1, 'La note doit être au moins 1').max(5, 'La note ne peut pas dépasser 5'),
  comment: z.string().min(1, 'Le commentaire est requis'),
  createdAt: z.date(),
});

export type Feedback = z.infer<typeof feedbackSchema>;