import { z } from 'zod';
import { ca } from 'zod/v4/locales';

export const eventSchema = z.object({
    id: z.cuid(),
    title: z.string().min(1, 'Le titre est requis'),
    slug: z.string().min(1, 'Le slug est requis'),
    description: z.string().min(1, 'La description est requise'),
    location: z.string().min(1, 'Le lieu est requis'),
    type: z.enum(['FREE', 'FREE_WITH_REGISTRATION', 'PAID'], {
        error: () => ({ message: 'Type d\'événement invalide' }),
    }),
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'], {
        error: () => ({ message: 'Statut d\'événement invalide' }),
    }),
    price: z.number().nonnegative().optional().nullable(),
    maxTickets: z.number().int().nonnegative().optional().nullable(),
    image: z.string().min(1, 'L\'image est requise'),
    organizerId: z.cuid('ID d\'organisateur invalide').nullable(),
    categoryId: z.string().min(1, 'ID de catégorie requis').nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export type Event = z.infer<typeof eventSchema>;