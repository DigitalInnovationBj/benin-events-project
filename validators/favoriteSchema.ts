import { z } from 'zod';

export const favoriteSchema = z.object({
  id: z.cuid(),
  userId: z.string(),
  eventId: z.cuid(),
  createdAt: z.date(),
});

export type Favorite = z.infer<typeof favoriteSchema>;