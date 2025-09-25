import { z } from 'zod';

export const marketingCampaignSchema = z.object({
  id: z.cuid(),
  name: z.string().min(1, 'Le nom est requis'),
  description: z.string().min(1, 'La description est requise'),
  eventId: z.cuid(),
  startDate: z.date(),
  endDate: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type MarketingCampaign = z.infer<typeof marketingCampaignSchema>;