import { z } from "zod";

export const organizerValidation = z.object({
  organizerName: z.string().min(2, "Le nom doit contenir au moins 2 caractères."),
  organizerEmail: z
    .string()
    .email("L'email organisateur est invalide.")
    .optional()
    .or(z.literal("")),
  phoneNumber: z.string().min(8, "Le numéro de téléphone est invalide."),
  address: z.string().min(5, "L'adresse est trop courte."),
  description: z.string().optional(),
});

export type OrganizerFormData = z.infer<typeof organizerValidation>;
