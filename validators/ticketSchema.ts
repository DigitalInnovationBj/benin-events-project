import { z } from 'zod';

export const ticketSchema = z.object({
  id: z.cuid(),
  eventId: z.cuid(),
  eventDateId: z.cuid(),
  userId: z.string(),
  qrcode: z.string().min(1, 'Le QR code est requis'),
  code: z.string().min(1, 'Le code est requis'),
  purchaseDate: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Ticket = z.infer<typeof ticketSchema>;